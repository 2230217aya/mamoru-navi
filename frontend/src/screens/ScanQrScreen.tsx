// app/scan-qr.tsx
import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

export default function ScanQRScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // 【重要】職員用アプリが保持している設定値 (本来は設定画面やDBから取得)
  const STAFF_CONFIG = {
    location_id: "123e4567-e89b-12d3-a456-426614174001", // 自分の施設ID
    scan_mode: "shelter", // "facility" または "shelter"
  };

  if (!permission) {
    // 権限読み込み中
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // 権限がない場合は許可を求めるボタンを表示
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", marginBottom: 10 }}>
          カメラへのアクセス権限が必要です
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>権限を許可する</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // QRコードを読み取った時の処理
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setScanned(true); // 二重読み込み防止

    try {
      // 1. APIにデータを送信
      const baseUrl =
        process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000"; // .envがなければlocalhostを使う
      const response = await fetch(`${baseUrl}/scan/qr-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_data: data,
          scan_mode: STAFF_CONFIG.scan_mode,
          location_id: STAFF_CONFIG.location_id,
        }),
      });

      if (!response.ok) {
        throw new Error("サーバーエラーが発生しました");
      }

      const result = await response.json();

      // 2. 結果画面にデータを渡して遷移する
      // JSONを文字列化して渡すか、グローバル状態管理を使いますが、ここでは簡単のためJSON文字列で渡します
      router.push({
        pathname: "../scan-result",
        params: { result: JSON.stringify(result) },
      });
    } catch (error) {
      Alert.alert("エラー", "QRコードの処理に失敗しました");
      setScanned(false); // 再試行可能にする
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
        {/* スキャン範囲を示す枠線（ガイド） */}
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
