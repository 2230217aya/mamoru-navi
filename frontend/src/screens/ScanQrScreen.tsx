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

export default function ScanQRScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const STAFF_CONFIG = {
    location_id: "123e4567-e89b-12d3-a456-426614174001",
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
      const baseUrl =
        process.env.EXPO_PUBLIC_API_URL ||
        "https://mamoru-navi-api-aya223.loca.lt";
      const response = await fetch(`${baseUrl}/scan/qr-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_data: data,
          scan_mode: STAFF_CONFIG.scan_mode,
          location_id: STAFF_CONFIG.location_id,
        }),
        signal: controller.signal, // ★ 3. fetchにキャンセルの合図を受け取る設定を追加
      });

      // 通信が間に合ったらタイマーを解除
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("サーバーエラーが発生しました");
      }

      const result = await response.json();

      router.push({
        pathname: "/scan-result",
        params: { result: JSON.stringify(result) },
      });
    } catch (error) {
      // エラーまたはタイムアウト時はタイマーを解除
      clearTimeout(timeoutId);
      // ★ タイムアウトでキャンセルされたかどうかのログ
      if ((error as Error).name === "AbortError") {
        console.log("通信タイムアウト: オフラインモードに切り替えます");
      } else {
        console.log("通信エラー: オフラインモードに切り替えます", error);
      }

      console.error("API通信エラーの詳細:", error);
      console.log("Offline detected, saving to local DB...");

      try {
        // 2. 【重要】APIが失敗した（オフライン）ので、ローカルDBに保存する
        const checkinId = Crypto.randomUUID(); // ユニークなIDを生成
        const userId = data.replace("mamoru_navi_user:", "");
        const now = new Date().toISOString();

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

        // 3. オフライン用の結果データを擬似的に作成して結果画面へ
        const offlineResult = {
          status: "offline", // ステータスを offline にする
          message:
            "オフラインのため、端末内に保存しました。通信復旧後に同期されます。",
          user_info: {
            user_id: userId,
            name: "（オフラインのため取得不可）",
            blood_type: "不明",
            medical_conditions: "不明",
            phone_number: "不明",
          },
          action_result: {
            type: "shelter_checkin",
            success: true,
            detail: "ローカル保存完了。通信復旧後に自動同期されます。",
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
