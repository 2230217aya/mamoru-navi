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
      });

      if (!response.ok) {
        throw new Error("サーバーエラーが発生しました");
      }

      const result = await response.json();

      router.push({
        pathname: "/scan-result",
        params: { result: JSON.stringify(result) },
      });
    } catch (error) {
      Alert.alert("エラー", "QRコードの処理に失敗しました");
      setScanned(false);
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
