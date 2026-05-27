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

export default function IDScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  // ★ 重要: カメラを操作するための「参照(ref)」を作成
  const cameraRef = useRef<CameraView>(null);

  // 職員用設定 (本来は設定画面やDBから取得)
  const STAFF_CONFIG = {
    location_id: "123e4567-e89b-12d3-a456-426614174001",
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
  const takePicture = async () => {
    if (!cameraRef.current || isTakingPhoto) return;

    try {
      setIsTakingPhoto(true);

      // 1. 写真を撮影
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      if (!photo) throw new Error("写真の撮影に失敗しました");

      // 2. API接続先の決定
      // localhostではなく、PCのIPアドレスを指定してください
      const baseUrl =
        process.env.EXPO_PUBLIC_API_URL ||
        "https://mamoru-navi-api-aya223.loca.lt";

      // 3. APIに送信
      const response = await fetch(`${baseUrl}/scan/id-card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Bypass-Tunnel-Reminder": "true", // ローカル開発環境でトンネルサービスを使用している場合の回避策
        },
        body: JSON.stringify({
          image_base64: photo.base64,
          scan_mode: STAFF_CONFIG.scan_mode,
          location_id: STAFF_CONFIG.location_id,
        }),
      });

      // 4. レスポンスチェック
      if (!response.ok) {
        throw new Error(`サーバーエラー: ${response.status}`);
      }

      const result = await response.json();

      // 5. 結果画面へ遷移
      router.push({
        pathname: "/scan-result",
        params: { result: JSON.stringify(result) },
      });
    } catch (error: any) {
      console.error("Error during ID scan:", error);
      Alert.alert("エラー", error.message || "身分証の読み取りに失敗しました");
    } finally {
      // 成功しても失敗しても、最後に必ず「撮影中」フラグをオフにする
      setIsTakingPhoto(false);
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
