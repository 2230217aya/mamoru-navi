// app/scan-qr.tsx
import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator, // ★追加：読み込み中のぐるぐる用
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { LocalDB } from "@/src/db/database"; // ★LocalDBをインポート
import * as Crypto from "expo-crypto"; // ★UUID生成のために追加 (npx expo install expo-crypto)
import Constants from "expo-constants";
import { getBaseUrl, API_HEADERS } from "@/src/utils/api"; // ★ APIのベースURLを取得するユーティリティ関数をインポート

export default function ScanQRScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const STAFF_CONFIG = {
    location_id: "11111111-1111-1111-1111-111111111111", // ★テスト用の避難所IDに変更
    scan_mode: "shelter",
  };

  if (!permission) {
    // ★ id-scan.tsx と同じセンター配置に変更
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FDE047" />
        <Text style={styles.loadingText}>準備中...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // ★ id-scan.tsx と同じスタイルに変更
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>カメラへのアクセス権限が必要です</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>権限を許可する</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);

    // ★ 1. タイムアウトを制御するためのコントローラーを作成
    const controller = new AbortController();
    // ★ 2. 3秒（3000ミリ秒）後に通信を強制キャンセルするタイマーをセット
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const baseUrl = getBaseUrl(); // 共通ユーティリティからベースURLを取得

      console.log(`📡 [Scan] 接続先: ${baseUrl}/scan/qr-code`);

      const response = await fetch(`${baseUrl}/scan/qr-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_data: data,
          scan_mode: STAFF_CONFIG.scan_mode,
          location_id: STAFF_CONFIG.location_id,
        }),
        signal: controller.signal,
      });

      // 通信が間に合ったらタイマーを解除
      clearTimeout(timeoutId);

      if (!response.ok) {
        // サーバーは生きていて、エラーを返してきた場合
        // （例：500 Internal Server Error, 404 Not Found など）
        const errorText = await response.text(); // エラーの詳細を取得
        console.error(`❌ サーバー側エラー: ${response.status} ${errorText}`);

        // 500番台は「サーバーのバグ」なので、オフラインモードにはせず
        // アラートを出して終了する（catchブロックのオフライン処理へ行かせない）
        Alert.alert(
          "サーバーエラー",
          `サーバー側で問題が発生しました (${response.status})`,
        );
        setScanned(false);
        return;
      }

      // 成功した場合
      const result = await response.json();
      router.push({
        pathname: "/scan-result",
        params: { result: JSON.stringify(result) },
      });
    } catch (error: any) {
      // エラーまたはタイムアウト時はタイマーを解除
      clearTimeout(timeoutId);
      // もし response.ok の手前で Alert.alert して return していれば、ここには来ないか、
      // タイムアウトや物理的な通信切断時のみここに来る。

      if (error.name === "AbortError") {
        console.log("通信タイムアウト: オフラインモードに切り替えます");
      } else {
        // fetch自体が失敗（TypeErrorなど）
        console.log("通信不能: オフラインモードに切り替えます", error);
      }

      // 以下、オフライン保存処理（既存のまま）
      console.log("Offline detected, saving to local DB...");

      try {
        // 2. 【重要】APIが失敗した（オフライン）ので、ローカルDBに保存する
        const checkinId = Crypto.randomUUID(); // ユニークなIDを生成
        const userId = data.replace("mamoru_navi_user:", "");
        const now = new Date().toISOString();

        // 1. users_cache から、この UUID の人を検索する
        const cachedUser = await LocalDB.getUserCache(userId);

        // checkinsテーブルに保存
        await LocalDB.saveCheckin({
          checkin_id: checkinId,
          user_id: userId,
          shelter_id: STAFF_CONFIG.location_id,
          checkin_time: now,
          method: "qr",
          sync_status: "pending",
          remarks: "",
        });

        // sync_queueテーブルに「後で送ってね」という伝票を追加
        await LocalDB.addToSyncQueue(
          checkinId,
          "CHECK_IN",
          JSON.stringify({
            user_id: userId,
            shelter_id: STAFF_CONFIG.location_id,
          }),
        );

        // 3. 結果画面に渡すデータを組み立てる
        const offlineResult = {
          status: "offline",
          message: "オフライン保存完了。端末内データを使用しました。",
          user_info: cachedUser
            ? {
                // ★ キャッシュがあれば、その人の名前や持病を入れる！
                user_id: cachedUser.user_id,
                name: cachedUser.name,
                gender: cachedUser.gender,
                blood_type: cachedUser.blood_type,
                medical_conditions: cachedUser.medical_conditions,
                phone_number: cachedUser.phone_number,
              }
            : {
                // もし事前にダウンロードしていない住民だった場合のみ、(取得不可)にする
                user_id: userId,
                name: "（未登録住民：名簿にありません）",
                blood_type: "不明",
                medical_conditions: "不明",
                phone_number: "不明",
              },
          action_result: {
            type: "shelter_checkin",
            success: true,
            detail: "ローカルDBで照合に成功しました。",
          },
        };

        router.push({
          pathname: "/scan-result",
          params: { result: JSON.stringify(offlineResult) },
        });
      } catch (dbError) {
        Alert.alert("致命的なエラー", "ローカルDBへの保存にも失敗しました");
        setScanned(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>QRコード受付</Text>

      <View style={styles.cameraContainer}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.focusedContainer}></View>
            <View style={styles.unfocusedContainer}></View>
          </View>
          <View style={styles.unfocusedContainer}></View>
        </View>
      </View>

      {scanned && (
        <TouchableOpacity
          style={styles.reScanButton}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.reScanText}>もう一度スキャンする</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    paddingTop: 50,
  },
  // ★ id-scan.tsx から移植したスタイル
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  // -----------------------------------
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 20 },
  cameraContainer: {
    width: "90%",
    height: "70%",
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "#fff",
  },
  button: { backgroundColor: "#FDE047", padding: 15, borderRadius: 10 },
  buttonText: { fontWeight: "bold" },
  reScanButton: {
    marginTop: 20,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
  },
  reScanText: { color: "#000", fontWeight: "bold" },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  unfocusedContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  middleContainer: { flexDirection: "row", height: 250 },
  focusedContainer: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#FDE047",
    backgroundColor: "transparent",
  },
});
