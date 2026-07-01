//frontend\src\screens\OfflineDataSection.tsx
import { Ionicons } from "@expo/vector-icons";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { LocalDB } from "@/src/db/database";
import Constants from "expo-constants";

import { convertGeoJsonToMapPoints } from "@/src/utils/mapUtils";
import { autoCacheTiles } from "@/src/utils/mapUtils";
import { calculateSafetyPercentage } from "@/src/utils/mapUtils";

import * as FileSystem from "expo-file-system/legacy";

// 修正箇所：database.ts または mapUtils.ts
// フォルダごと消去する関数
export async function clearAllTiles() {
  const tilesDir = `${FileSystem.documentDirectory}tiles/`;
  const info = await FileSystem.getInfoAsync(tilesDir);
  if (info.exists) {
    await FileSystem.deleteAsync(tilesDir);
    console.log("🗑️ 警告入りタイル画像を全て削除しました");
  }
}

export default function SafetyScreen() {
  // オフラインデータの充実度（安心度）
  const [safetyPercent, setSafetyPercent] = useState(0);
  // テスト用のダミーユーザーIDを使用（実際はログイン中のユーザーIDを使います）
  const testUserId = "11111111-1111-1111-1111-111111111111";

  // 安心度を最新に更新する関数
  const refreshSafetyMetrics = async () => {
    const percent = await calculateSafetyPercentage(testUserId);
    setSafetyPercent(percent);
  };

  // 初回表示時に計算
  useEffect(() => {
    refreshSafetyMetrics();
  }, []);

  // --- データダウンロード処理 ---
  const handleDownloadMyPlan = async () => {
    try {
      // URLの取得（USB/Hotspot両対応に寄せる）
      const debuggerHost = Constants.expoConfig?.hostUri;
      const localIp = debuggerHost ? debuggerHost.split(":")[0] : "localhost";

      // ★ 修正：USB接続なら localhost を、無線なら localIp を使う
      const baseUrl =
        localIp === "localhost" || localIp.includes("10.144")
          ? "http://localhost:8000"
          : `http://${localIp}:8000`;

      console.log(`📡 手動ダウンロード試行: ${baseUrl}`);

      // 重い処理なので、タイムアウトを長め(10秒)に取る
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${baseUrl}/map/my-plan/${testUserId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Bypass-Tunnel-Reminder": "true", // ★ これを追加するとあの画像が消えます
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (data.status === "success") {
        // 1. SQLite に保存
        await LocalDB.saveMyEvacuationPlan(data.plan);

        // 2. 避難ルートのタイルをキャッシュ (これが終わるまで待つ)
        if (data.plan.route_data) {
          const points = convertGeoJsonToMapPoints(data.plan.route_data);
          console.log("🛠️ タイルキャッシュ中...");
          await autoCacheTiles(points); // ★ これが完了すると is_cached=1 になる
        }

        // 3. 最新のスコアを再計算して表示
        await refreshSafetyMetrics();
        Alert.alert("完了", "地図とルートの準備が整いました！");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("エラー", "ダウンロードに失敗しました");
    }
  };

  // --- ローカルからの読み込みテスト処理 ---
  const handleLoadMyPlan = async () => {
    try {
      const testUserId = "11111111-1111-1111-1111-111111111111";
      const plan = await LocalDB.getMyEvacuationPlan(testUserId);

      if (plan && plan.route_data) {
        const coordinates = plan.route_data.coordinates;
        console.log(
          `✅ ルートデータ読込成功: 座標ポイント数 ${coordinates.length}件`,
        );

        Alert.alert(
          "ルート読込成功",
          `集合場所: ${plan.meeting_point_name}\nルートのポイント数: ${coordinates.length}件\nこれで圏外でも地図に線を引けます！`,
        );
      } else {
        Alert.alert("データなし", "保存された避難計画が見つかりません。");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("エラー", "読み込み中にエラーが発生しました");
    }
  };

  // 安心度に応じた表示内容を取得
  const getSafetyStatus = () => {
    if (safetyPercent >= 70) {
      return {
        text: "完璧です！",
        Chart: "安心",
        color: "#28c840",
        Contents: "通信が切れてもナビが使えます。",
      };
    }

    if (safetyPercent >= 40) {
      return {
        text: "注意!",
        Chart: "注意",
        color: "#f5a623",
        Contents:
          "最新のハザードマップが追加されました。今すぐダウンロードしてください。",
      };
    }

    return {
      text: "危険です",
      Chart: "危険",
      color: "#ff4d4f",
      Contents:
        "オフラインデータがありません。今すぐダウンロードしてください。",
    };
  };

  const safetyStatus = getSafetyStatus();

  // --- 追加：デバッグ用リセット ---
  const handleReset = async () => {
    await LocalDB.resetDatabaseForTest();
    await refreshSafetyMetrics(); // 0%に戻るはず
    await clearAllTiles(); // タイル画像も削除
    Alert.alert("クリア", "データを削除しました。0%からテストできます。");
  };

  const handleSetupTest = async () => {
    await LocalDB.setupTestStayStats();
    Alert.alert("デバッグ", "自宅と職場の滞在実績(10h)を注入しました。");
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header */}
      {/* メニュー画面へ戻るボタン */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push("../user_home")}
      >
        <Ionicons name="menu" size={28} color="#888" />
        <View style={styles.redDot} />
      </TouchableOpacity>

      {/* オフラインデータの安心度 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>現在の安心度</Text>

        <View style={styles.safetyContent}>
          {/* 安心度ステータス表示 */}
          <View style={styles.statusRow}>
            <View style={styles.topStatusRow}>
              <View
                style={[
                  styles.greenDot,
                  {
                    backgroundColor: safetyStatus.color,
                  },
                ]}
              />

              <Text
                style={[
                  styles.safeText,
                  {
                    color: safetyStatus.color,
                  },
                ]}
              >
                {safetyStatus.text}
              </Text>
            </View>

            <Text style={styles.subText}>{safetyStatus.Contents}</Text>
          </View>
          {/* 安心度ゲージ */}
          <AnimatedCircularProgress
            size={120}
            width={8}
            fill={safetyPercent}
            tintColor={safetyStatus.color}
            backgroundColor="#d9d9d9"
            rotation={0}
          >
            {() => (
              <View style={{ alignItems: "center" }}>
                <Text
                  style={[
                    styles.circleText,
                    {
                      color: safetyStatus.color,
                    },
                  ]}
                >
                  {safetyPercent}%
                </Text>
                <Text
                  style={[
                    styles.circleText,
                    {
                      fontSize: 16,
                      color: safetyStatus.color,
                    },
                  ]}
                >
                  {safetyStatus.Chart}
                </Text>
              </View>
            )}
          </AnimatedCircularProgress>
        </View>

        <View style={styles.breakdownContainer}>
          <View style={styles.breakdownItem}>
            <Ionicons
              name={
                safetyPercent >= 50 ? "checkmark-circle" : "ellipse-outline"
              }
              size={20}
              color={safetyPercent >= 50 ? "#28c840" : "#ccc"}
            />
            <Text style={styles.breakdownLabel}>個人避難計画・経路データ</Text>
            <Text style={styles.breakdownStatus}>
              {safetyPercent >= 50 ? "保存済み" : "未取得"}
            </Text>
          </View>

          <View style={styles.breakdownItem}>
            <Ionicons
              name={safetyPercent > 60 ? "checkmark-circle" : "time-outline"}
              size={20}
              color={safetyPercent > 60 ? "#28c840" : "#f5a623"}
            />
            <Text style={styles.breakdownLabel}>生活圏の地図タイル</Text>
            <Text style={styles.breakdownStatus}>
              {safetyPercent > 60 ? "準備完了" : "収集中"}
            </Text>
          </View>
        </View>

        {/* 最新データ一括ダウンロード */}
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownloadMyPlan}
        >
          <Text style={styles.downloadText}>最新データを一括ダウンロード</Text>
        </TouchableOpacity>

        {/* ★ 追加：テスト用の読み込みボタン */}
        <TouchableOpacity
          style={[
            styles.downloadButton,
            { backgroundColor: "#e0e0e0", marginTop: 10 },
          ]}
          onPress={handleLoadMyPlan}
        >
          <Text style={[styles.downloadText, { color: "#555" }]}>
            【テスト】ローカルからルート読込
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 20 }} onPress={handleReset}>
          <Text style={{ color: "#aaa", fontSize: 12 }}>
            ※テスト用：データを全削除する
          </Text>
        </TouchableOpacity>
      </View>

      {/* マイエリア管理 */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>マイエリア設定</Text>
          {/* エリア追加画面へ遷移 */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("../add_area")}
          >
            <Text style={styles.addButtonText}>＋ 新しいエリア</Text>
          </TouchableOpacity>
        </View>
        {/* 登録済みエリア一覧 */}
        <TouchableOpacity style={styles.areaButton}>
          <Text style={styles.areaText}>🏠 自宅周辺（半径3 km）</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.areaButton}>
          <Text style={styles.areaText}>💼 職場・学校周辺（半径3 km）</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.areaButton}>
          <Text style={styles.areaText}>🏡 実家周辺（半径3 km）</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.downloadButton,
            { backgroundColor: "#666", marginTop: 10 },
          ]}
          onPress={handleSetupTest}
        >
          <Text style={styles.downloadText}>
            【デバッグ】滞在実績を偽装する
          </Text>
        </TouchableOpacity>
      </View>
      {/* オフラインデータ情報 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>データの内訳と容量</Text>

        <Text style={styles.smallTitle}>基本地図データ</Text>
        {/* 保存済みデータ一覧 */}
        <View style={styles.dataRow}>
          <View>
            <Text style={styles.dataText}>避難所リスト・位置情報</Text>

            <Text style={styles.dataText}>洪水ハザードマップ</Text>

            <Text style={styles.dataText}>土砂災害ハザードマップ</Text>
          </View>
          {/* ストレージ使用状況 */}
          <View style={styles.storageBox}>
            <Text style={styles.storageSub}>このアプリが使用中の容量</Text>
            <View style={styles.storageboxs}>
              <Ionicons name="server" size={20} color="#28c840" />

              <Text style={styles.storageText}>150MB</Text>
            </View>

            <Text style={styles.storageSub}>この端末の空き容量: 20GB</Text>
          </View>
        </View>
      </View>

      {/* 自動更新設定 */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>自動か更新</Text>

            <Text style={styles.grayText}>（スマート・キャッシュ）</Text>
          </View>
          {/* スマートキャッシュ機能 ON/OFF */}
          <Switch
            value={true}
            trackColor={{
              false: "#ccc",
              true: "#FFEE37",
            }}
            thumbColor={true ? "#ffffff" : "#f4f3f4"}
          />
        </View>
        {/* 自動更新の説明 */}
        <Text style={styles.updateText}>
          Wi-Fi接続時に自動で最新データを更新する
        </Text>
        <Text style={styles.updateText2}>
          ONにしておくと、アプリを開かなくても寝ている間に
        </Text>
        <Text style={styles.updateText2}>
          最新の避難所情報や地図が自動で準備されます。
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    padding: 14,
  },

  header: {
    paddingTop: 40,
    alignItems: "flex-end",
    end: 14,
    marginBottom: 20,
    position: "relative",
  },

  redDot: {
    width: 8,
    height: 8,
    backgroundColor: "red",
    borderRadius: 99,
    position: "absolute",
    top: 40,
    right: -2,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginBottom: 8,
    marginLeft: 5,
    marginRight: 5,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.1,
    shadowRadius: 4,

    elevation: 3,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },

  safetyContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusRow: {
    flexDirection: "column",
    width: 180,
  },

  topStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: "#27d83e",
  },

  safeText: {
    color: "#22cc33",
    fontSize: 30,
    fontWeight: "bold",
  },

  subText: {
    color: "#555",
    fontSize: 10,
    marginTop: 2,
  },

  circle: {
    width: 120,
    height: 120,
    borderWidth: 8,
    borderColor: "#28c840",
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  circleText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#28c840",
  },

  downloadButton: {
    backgroundColor: "#ffe523",
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },

  downloadText: {
    fontWeight: "bold",
    fontSize: 12,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
  },

  addButton: {
    borderWidth: 1,
    borderColor: "#fff3a6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  addButtonText: {
    fontSize: 12,
    color: "#555",
  },

  areaButton: {
    backgroundColor: "#fff3a6",
    padding: 10,
    borderRadius: 10,
    marginTop: 5,
  },

  areaText: {
    fontSize: 14,
  },

  smallTitle: {
    marginTop: 10,
    fontWeight: "bold",
    color: "#333",
  },

  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    alignItems: "center",
  },

  dataText: {
    fontSize: 11,
    color: "#444",
    marginBottom: 8,
  },

  storageBox: {
    backgroundColor: "#fff3a6",
    paddingBottom: 10,
    paddingTop: 10,
    borderRadius: 12,
    alignItems: "center",
    width: "50%",
  },
  storageboxs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  storageText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2acb42",
  },

  storageSub: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    margin: 6,
  },

  grayText: {
    color: "#888",
    fontSize: 12,
  },

  updateText: {
    marginTop: 12,
    color: "#444",
    fontSize: 14,
  },
  updateText2: {
    color: "#8d8c8c",
    fontSize: 10,
    alignContent: "center",
  },
  breakdownContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    marginBottom: 20, // ボタンとの間隔
    gap: 12,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 14,
    color: "#555",
    marginLeft: 8,
  },
  breakdownStatus: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#888",
  },
});
