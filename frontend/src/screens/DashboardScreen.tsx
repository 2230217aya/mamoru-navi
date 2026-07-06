import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Pressable,
  View,
  Text,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack, router } from "expo-router";
import DashboardButton from "../components/dashboard-component";

// ★ 追加するインポート
import { LocalDB } from "@/src/db/database";
import Constants from "expo-constants";
import { Feather } from "@expo/vector-icons"; // Figmaと同じアップロードアイコン用
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getBaseUrl, API_HEADERS } from "@/src/utils/api";

// 設定時間（ミリ秒）
const SYNC_INTERVAL = 10 * 1000; // 1時間 (テスト用に短くしてもOK)1 * 60 * 60 * 1000;
const LAST_CHECK_KEY = "last_user_download_check";

export default function dashboard() {
  // ★ 状態管理
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  //未送信件数取得
  const fetchCount = async () => {
    try {
      const items = await LocalDB.getPendingSyncs(1000);
      setPendingCount(items ? items.length : 0);
    } catch (error) {
      console.error("未同期データの取得エラー:", error);
    }
  };

  // --- 3. サイレント差分ダウンロードの関数（統合版） ---
  const silentDownloadUsers = async () => {
    try {
      // 最後にチェックした時刻をストレージから取得
      const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
      const now = Date.now();

      // もし最後にチェックしてから設定時間（1時間）経っていなければ終了
      if (lastCheck && now - parseInt(lastCheck) < SYNC_INTERVAL) {
        console.log(
          "前回のチェックから1時間以内なので、差分確認をスキップします。",
        );
        return;
      }

      console.log(
        "前回のチェックから1時間経過、または初回。差分を確認します...",
      );

      // SQLite内の最新の更新日時を取得
      const latestUpdateAt = await LocalDB.getLatestUserUpdateAt();
      const baseUrl = getBaseUrl();

      let url = `${baseUrl}/scan/users/download`;
      if (latestUpdateAt) {
        url += `?updated_at=${encodeURIComponent(latestUpdateAt)}`;
      }

      // ★追加：どこに通信しようとしているか確認
      console.log("API通信先:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: API_HEADERS,
      });

      // ★追加：エラーが返ってきた場合に理由を表示
      if (!response.ok) {
        console.log(`❌ APIエラー: ステータスコード ${response.status}`);
        // サーバー側のエラー詳細が見たい場合は、テキストとして取得する
        const errorText = await response.text();
        console.log("❌ エラー詳細:", errorText);
        return;
      }

      const data = await response.json();

      // 更新があった（1件以上）ときだけ SQLite に保存
      if (data.status === "success" && data.users && data.users.length > 0) {
        await LocalDB.saveUsersCache(data.users);
        console.log(`✅ 差分更新完了: ${data.count}件。`);
      } else {
        console.log(
          "ℹ️ サーバー側に更新はありません。ダウンロードをスキップしました。",
        );
      }

      // 成否に関わらず「チェックした」という事実を記録
      await AsyncStorage.setItem(LAST_CHECK_KEY, now.toString());
    } catch (error) {
      console.log("Silent Sync error:", error);
    }
  };

  const fetchOfflineMapData = async () => {
    try {
      const baseUrl = getBaseUrl();
      const url = `${baseUrl}/offline/map-data`;

      console.log("オフライン地図API通信先:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: API_HEADERS,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`オフライン地図APIエラー: ${response.status}`);
        console.log("エラー詳細:", errorText);
        return;
      }

      const data = await response.json();

      console.log("オフライン地図データ取得成功:", data);
      console.log("避難所件数:", data.count);
      console.log("避難所一覧:", data.shelters);
    } catch (error) {
      console.log("オフライン地図データ取得エラー:", error);
    }
  };

  // --- 4. 画面を開いた時の処理 (useEffectを1つに統合) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchCount(); // まず未送信件数を数える
      await silentDownloadUsers(); // 次に賢い自動ダウンロードを走らせる
      await fetchOfflineMapData();
    };

    fetchInitialData();

    // 5秒おきの更新は件数だけでOK
    const interval = setInterval(fetchCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // ★ 手動同期ボタンの処理
  const handleManualSync = async () => {
    if (pendingCount === 0) return;

    setIsSyncing(true);
    let totalSynced = 0;

    const baseUrl = getBaseUrl();
    try {
      while (true) {
        // 5件ずつ取得して送る（サーバー負荷対策）
        const pendingItems = await LocalDB.getPendingSyncs(5);
        if (!pendingItems || pendingItems.length === 0) break;

        const result = await LocalDB.syncWithServer(baseUrl, pendingItems);

        if (result.success) {
          totalSynced += result.count;
          setPendingCount((prev) => Math.max(0, prev - result.count)); // 画面の数字を減らす
        } else {
          Alert.alert(
            "通信エラー",
            "同期中に通信が途絶えました。残りは後で送信します。",
          );
          break;
        }
      }

      if (totalSynced > 0) {
        Alert.alert(
          "同期完了",
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
    <View style={styles.container}>
      {/* 右上のアイコン */}
      <Pressable
        onPress={() => router.push("../user-list")}
        style={styles.userIconButton}
      >
        <Image
          source={require("@/assets/images/dashboard-userIcon.png")}
          style={styles.userIcon}
        />
      </Pressable>

      {/* QRコード受付 */}
      <DashboardButton
        title="QRコード受付"
        img={require("@/assets/images/dashboard-qrcode.png")}
        href="../scan-qr"
        backgroundColor="#FFF693"
        textColor="#000000"
        width="85%"
        imgsize={170}
      />

      {/* ボタンを横並びに */}
      <View style={styles.rowButtons}>
        <DashboardButton
          title={"身分証明書\n撮る"}
          img={require("@/assets/images/dashboard-photo.png")}
          href="../id-scan"
          backgroundColor="#9D9D9D"
          textColor="#FFF693"
          width="40%"
          imgsize={120}
        />

        <DashboardButton
          title="手入力"
          img={require("@/assets/images/dashboard-input.png")}
          href="/" // 手入力画面のパスに変更してください
          backgroundColor="#9D9D9D"
          textColor="#FFF693"
          width="40%"
          imgsize={120}
        />
      </View>

      {/* ★ 管理系ツールバー（ダウンロード＆同期） ★ */}
      <View style={styles.adminToolbar}>
        {/* 右側：未同期データ件数と同期ボタン（既存のものを移動） */}
        <View style={styles.syncContainer}>
          <Text
            style={[styles.syncText, pendingCount > 0 && styles.syncTextActive]}
          >
            未同期データ： {pendingCount}
          </Text>

          <Pressable
            onPress={handleManualSync}
            disabled={pendingCount === 0 || isSyncing}
            style={({ pressed }: { pressed: boolean }) => [
              styles.syncButton,
              pressed && { opacity: 0.5 },
              (pendingCount === 0 || isSyncing) && { opacity: 0.3 },
            ]}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Feather name="upload" size={28} color="black" />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    backgroundColor: "#FAFAFA", // 背景色を少し指定（必要に応じて）
  },
  rowButtons: {
    flexDirection: "row",
    gap: 20,
  },
  userIconButton: {
    position: "absolute",
    top: 50,
    right: 10,
    zIndex: 10,
  },
  userIcon: {
    width: 50,
    height: 50,
  },

  adminToolbar: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "flex-end", // ボタンを右端に寄せる
    alignItems: "center",
    marginTop: -5,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E7EB", // 薄いグレーのボタン背景
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    gap: 8, // アイコンと文字の隙間
  },
  downloadText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
  },
  syncContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  syncText: {
    fontSize: 18, // 少しだけ小さくしてバランス調整
    fontWeight: "bold",
    color: "#9CA3AF",
    marginRight: 10,
  },
  syncTextActive: {
    color: "#000",
  },
  syncButton: {
    padding: 5,
  },
});
