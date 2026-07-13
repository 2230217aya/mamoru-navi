// app/id-scan.tsx
import React, { useState, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { LocalDB } from "@/src/db/database";
import * as Crypto from "expo-crypto";
import Constants from "expo-constants";
import { getBaseUrl, API_HEADERS } from "@/src/utils/api"; // ★ APIのベースURLを取得するユーティリティ関数をインポート

export default function IDScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  // ★ 重要: カメラを操作するための「参照(ref)」を作成
  const cameraRef = useRef<CameraView>(null);

  // 職員用設定 (本来は設定画面やDBから取得)
  const STAFF_CONFIG = {
    location_id: "11111111-1111-1111-1111-111111111111",
    scan_mode: "shelter",
  };

  // 1. 権限読み込み中の表示
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FDE047" />
        <Text style={styles.loadingText}>カメラを準備中...</Text>
      </View>
    );
  }

  // 2. 権限がない場合の表示
  if (!permission.granted) {
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

  // 3. 写真撮影とAPI送信処理
  const takePicture = async (camera: any) => {
    if (isTakingPhoto) return;
    setIsTakingPhoto(true);

    try {
      // --- 1. 写真を撮影 (一度だけ行う) ---
      // 引数の camera を使用します
      const photo = await camera.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      if (!photo) throw new Error("写真の撮影に失敗しました");

      const baseUrl = getBaseUrl(); // 共通ユーティリティからベースURLを取得

      console.log(`📡 [Scan] 接続先: ${baseUrl}/scan/qr-code`);

      // --- 3. APIに送信 ---
      const response = await fetch(`${baseUrl}/scan/id-card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Bypass-Tunnel-Reminder": "true",
        },
        body: JSON.stringify({
          image_base64: photo.base64,
          scan_mode: STAFF_CONFIG.scan_mode,
          location_id: STAFF_CONFIG.location_id,
        }),
      });

      // --- 4. レスポンスチェック ---
      if (!response.ok) {
        throw new Error(`サーバーエラー: ${response.status}`);
      }

      const result = await response.json();

      // --- 5. 結果画面へ遷移 ---
      router.push({
        pathname: "/scan-result", // パスは /scan-result 等に合わせる
        params: { result: JSON.stringify(result) },
      });
    } catch (error) {
      // ここが「オフライン」または「サーバーエラー」時の処理
      console.log(
        "Offline detected or API error, saving ID scan to local DB...",
      );

      try {
        // IDスキャンの場合、本来はOCRで名前を出すが、オフライン時は「ID不明のまま保存」
        const checkinId = Crypto.randomUUID();
        const tempUserId = "unknown_id_" + Date.now();

        await LocalDB.saveCheckin({
          checkin_id: checkinId,
          user_id: tempUserId,
          shelter_id: STAFF_CONFIG.location_id,
          checkin_time: new Date().toISOString(),
          method: "id_card",
          sync_status: "pending",
          remarks: "身分証写真による受付（要確認）",
        });

        await LocalDB.addToSyncQueue(
          checkinId,
          "CHECK_IN",
          JSON.stringify({
            user_id: tempUserId,
            shelter_id: STAFF_CONFIG.location_id,
          }),
        );

        const offlineResult = {
          status: "offline",
          message: "身分証画像をオフライン保存しました。",
          user_info: {
            name: "（未特定ユーザー）",
            blood_type: "不明",
            medical_conditions: "不明",
            phone_number: "不明",
          },
          action_result: {
            type: "shelter_checkin",
            success: true,
            detail: "画像保存完了。後で照合してください。",
          },
        };

        router.push({
          pathname: "/scan-result",
          params: { result: JSON.stringify(offlineResult) },
        });
      } catch (dbError) {
        Alert.alert("エラー", "ローカル保存に失敗しました");
        setIsTakingPhoto(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>身分証明書スキャン</Text>

      <View style={styles.cameraContainer}>
        {/* ★ ref={cameraRef} を追加して、ボタンから操作できるようにする */}
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} />

        {/* ガイド枠（ここに合わせて撮ってくださいという指示） */}
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer} />
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.focusedContainer} />
            <View style={styles.unfocusedContainer} />
          </View>
          <View style={styles.unfocusedContainer} />
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.captureButton,
          isTakingPhoto && { backgroundColor: "#ccc" },
        ]}
        onPress={takePicture}
        disabled={isTakingPhoto}
      >
        {isTakingPhoto ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.captureText}>撮影して受付</Text>
        )}
      </TouchableOpacity>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: { color: "#fff", marginTop: 10 },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 20 },
  cameraContainer: {
    width: "90%",
    height: "60%",
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "#333", // カメラ起動前でも真っ黒にならないようグレーに
  },
  button: { backgroundColor: "#FDE047", padding: 15, borderRadius: 10 },
  buttonText: { fontWeight: "bold" },
  captureButton: {
    marginTop: 30,
    backgroundColor: "#FDE047",
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    alignItems: "center",
  },
  captureText: { fontSize: 18, fontWeight: "bold", color: "#000" },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  unfocusedContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  middleContainer: { flexDirection: "row", height: 200 },
  focusedContainer: {
    width: 200,
    height: 200,
    borderWidth: 3,
    borderColor: "#FDE047",
    backgroundColor: "transparent",
    borderRadius: 10,
  },
});
