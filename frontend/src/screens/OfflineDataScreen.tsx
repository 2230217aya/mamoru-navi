import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons"; // アイコン表示用 (npm install expo-font @expo/vector-icons を実行済みの前提)
import { Alert } from "react-native"; // ★ Alertをインポートに追加
import { LocalDB } from "@/src/db/database"; // ★ LocalDBをインポートに追加
import Constants from "expo-constants"; // ★ 追加

// TODO: 後で円グラフライブラリもインストールして差し替えます
// import CircularProgress from 'react-native-circular-progress';

export default function OfflineDataScreen() {
  // TODO: これらのデータは本来APIから取得、またはローカルDBから読み込みます
  const mapData = {
    downloaded: true, // true: ダウンロード済み, false: 未ダウンロード
    progress: 1.0, // 0.0 ～ 1.0 の進捗度 (円グラフ用)
  };

  const shelterListData = {
    downloaded: true,
    progress: 1.0,
  };

  // 更新ボタンが押されたときの処理（ここではダミーでログ出力）
  const handleUpdate = (dataType: string) => {
    console.log(`${dataType}の更新処理を実行`);
    alert(
      `${dataType}の更新処理を実行しました（実際はAPI通信やデータ保存を行います）`,
    );
  };

  const [pendingCount, setPendingCount] = useState(0); // ★ 未送信データの件数
  const [isSyncing, setIsSyncing] = useState(false); // ★手動同期中のボタン無効化用

  // 画面を開いた時や定期的に未送信件数を更新
  useEffect(() => {
    const fetchCount = async () => {
      // 件数表示用なので制限なしで全件取得
      const items = await LocalDB.getPendingSyncs(1000);
      setPendingCount(items ? items.length : 0);
    };
    fetchCount();
    // 5秒ごとに画面の件数を自動更新する
    const interval = setInterval(fetchCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // ★ 手動同期ボタンの処理
  const handleManualSync = async () => {
    if (pendingCount === 0) return;

    setIsSyncing(true);
    let totalSynced = 0;

    const debuggerHost = Constants.expoConfig?.hostUri;
    const localIp = debuggerHost ? debuggerHost.split(":")[0] : "localhost";
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || `http://${localIp}:8000`;

    try {
      // 溜まっているデータがなくなるまで、5件ずつ送るループ
      while (true) {
        const pendingItems = await LocalDB.getPendingSyncs(5);
        if (!pendingItems || pendingItems.length === 0) break; // 全部送り終わった

        const result = await LocalDB.syncWithServer(baseUrl, pendingItems);

        if (result.success) {
          totalSynced += result.count;
          setPendingCount((prev) => Math.max(0, prev - result.count)); // 画面の数字を減らす
        } else {
          Alert.alert(
            "通信エラー",
            "同期中に通信が途絶えました。残りは後で送信します。",
          );
          break; // エラーが起きたらループを止める
        }
      }

      if (totalSynced > 0) {
        Alert.alert(
          "手動同期完了",
          `${totalSynced}件のデータをサーバーに送信しました！`,
        );
      }
    } catch (e) {
      Alert.alert("エラー", "同期処理に失敗しました");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>オフラインデータ管理</Text>

      <ScrollView style={styles.scrollView}>
        {/* 地図データセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>地図データ</Text>

          <View style={styles.dataItem}>
            <Text style={styles.label}>ダウンロード状況: </Text>
            <Text
              style={
                mapData.downloaded
                  ? styles.statusAvailable
                  : styles.statusUnavailable
              }
            >
              {mapData.downloaded ? "ダウンロード済み" : "未ダウンロード"}
            </Text>
            {/* TODO: 円グラフコンポーネントをここに差し替える */}
            <View style={styles.progressPlaceholder}>
              <FontAwesome
                name={mapData.downloaded ? "check-circle" : "times-circle"}
                size={24}
                color={mapData.downloaded ? "#10B981" : "#EF4444"}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.updateButton,
              !mapData.downloaded && styles.disabledButton,
            ]} // 未ダウンロード時はグレーアウト
            onPress={() => handleUpdate("地図データ")}
            disabled={mapData.downloaded} // ダウンロード済みならボタン無効化
          >
            <Text style={styles.updateButtonText}>
              {mapData.downloaded ? "更新済み" : "ダウンロード"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 避難所リストセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>避難所リスト</Text>

          <View style={styles.dataItem}>
            <Text style={styles.label}>ダウンロード状況: </Text>
            <Text
              style={
                shelterListData.downloaded
                  ? styles.statusAvailable
                  : styles.statusUnavailable
              }
            >
              {shelterListData.downloaded
                ? "ダウンロード済み"
                : "未ダウンロード"}
            </Text>
            {/* TODO: 円グラフコンポーネントをここに差し替える */}
            <View style={styles.progressPlaceholder}>
              <FontAwesome
                name={
                  shelterListData.downloaded ? "check-circle" : "times-circle"
                }
                size={24}
                color={shelterListData.downloaded ? "#10B981" : "#EF4444"}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.updateButton,
              !shelterListData.downloaded && styles.disabledButton,
            ]}
            onPress={() => handleUpdate("避難所リスト")}
            disabled={shelterListData.downloaded}
          >
            <Text style={styles.updateButtonText}>
              {shelterListData.downloaded ? "更新済み" : "ダウンロード"}
            </Text>
          </TouchableOpacity>

          {/* ★ ここから追加：同期実行ボタン ★ */}
          <TouchableOpacity
            style={[
              styles.downloadButton,
              {
                backgroundColor: pendingCount > 0 ? "#3b82f6" : "#D1D5DB",
                marginTop: 10,
              },
            ]}
            onPress={handleManualSync}
            disabled={pendingCount === 0} // 0件の時は押せないようにする
          >
            <Text
              style={[
                styles.downloadButtonText,
                { color: pendingCount > 0 ? "#fff" : "#6B7280" },
              ]}
            >
              未送信の受付データを同期する ({pendingCount}件)
            </Text>
          </TouchableOpacity>
        </View>

        {/* 他のオフラインデータ項目もここに追加 */}
      </ScrollView>
    </SafeAreaView>
  );
}

// frontend/src/screens/OfflineDataScreen.tsx の styles 部分を修正

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
    padding: 20,
    paddingTop: 60,
  },
  scrollView: {
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  dataItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: "#4B5563",
    marginRight: 8,
  },
  statusText: {
    // このスタイルは使わないので一旦コメントアウトしてもOK
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981", // Success Green
    marginRight: 8,
  },
  // ★★★ statusAvailable スタイルを追加 ★★★
  statusAvailable: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981", // Success Green
    marginRight: 8,
  },
  statusUnavailable: {
    // これはOK
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444", // Red
    marginRight: 8,
  },
  progressPlaceholder: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  updateButton: {
    backgroundColor: "#60A5FA",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: "#D1D5DB",
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
