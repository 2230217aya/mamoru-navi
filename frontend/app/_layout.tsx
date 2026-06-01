// frontend/app/_layout.tsx
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { LocalDB } from "@/src/db/database";
import * as Network from "expo-network";
import Constants from "expo-constants";

// ★ app/ フォルダ直下のコンポーネントをインポート ★
import HomeScreen from "./index"; // app/(tabs)/index.tsx を指す
import MyPageScreen from "./my-page"; // app/my-page.tsx を指す
import OfflineDataScreen from "./offline-data"; // app/offline-data.tsx を指す
import DashboardScreen from "./dashbord"; // app/dashboard.tsx を指す

export default function RootLayout() {
  useEffect(() => {
    LocalDB.init()
      .then(() => console.log("Database ready"))
      .catch((err) => console.error("Database init failed", err));

    let isSyncing = false; // ★防衛策2: 同期中かどうかの「ロック」
    let consecutiveFailures = 0; // ★防衛策3: 連続失敗回数

    const checkAndSync = async () => {
      // もし既に同期中なら、何もせず終了（二重送信防止）
      if (isSyncing) return;

      try {
        const networkState = await Network.getNetworkStateAsync();

        if (networkState.isConnected && networkState.isInternetReachable) {
          isSyncing = true; // ロックをかける

          // ★防衛策1: 5件だけ取得して送る
          const pendingItems = await LocalDB.getPendingSyncs(5);

          if (pendingItems && pendingItems.length > 0) {
            console.log(`📡 同期開始: ${pendingItems.length}件を送信...`);

            const debuggerHost = Constants.expoConfig?.hostUri;
            const localIp = debuggerHost
              ? debuggerHost.split(":")[0]
              : "localhost";
            const baseUrl =
              process.env.EXPO_PUBLIC_API_URL || `http://${localIp}:8000`;

            const result = await LocalDB.syncWithServer(baseUrl, pendingItems);

            if (result.success) {
              console.log(`✅ 同期成功`);
              consecutiveFailures = 0; // 成功したら失敗回数をリセット
            } else {
              throw new Error(result.message);
            }
          }
        }
      } catch (error) {
        console.log(`❌ 同期エラー: ${error}`);
        consecutiveFailures++; // 失敗したらカウントアップ
      } finally {
        isSyncing = false; // 処理が終わったらロックを解除
      }
    };

    // ★防衛策3: 動的なタイマー（バックオフ）
    const startSmartPolling = () => {
      // 基本は10秒間隔。連続失敗が多いほど、待機時間を長くする（最大2分）
      // 例: 0回=10秒, 1回=20秒, 2回=30秒...
      const baseInterval = 10000;
      const maxInterval = 120000;
      const currentInterval = Math.min(
        baseInterval + consecutiveFailures * 10000,
        maxInterval,
      );

      setTimeout(async () => {
        await checkAndSync();
        startSmartPolling(); // 終わったら、次のタイマーを再帰的にセットする
      }, currentInterval);
    };

    startSmartPolling(); // ループ開始

    // ※ クリーンアップ処理は不要な設計にしています
  }, []);

  // 関数名も RootLayout に変更
  return (
    // ★ Navigator を Stack に変更 ★
    <Stack
      screenOptions={({ route }) => ({
        // ★ 各画面のヘッダーは個別に設定するため、ここでは非表示 ★
        headerShown: false,
        // 画面遷移のアニメーション (Figmaデザインに合わせて)
        animation: "slide_from_right",
      })}
      // ★★★ アプリ起動時に最初に表示する画面を "index" に指定 ★★★
      initialRouteName="index"
    >
      {/* 
        ここに、アプリを構成する画面（ファイル名）を登録します。
        "index" が最初の画面になります。
      */}
      <Stack.Screen name="index" options={{ title: "ホーム" }} />
      <Stack.Screen name="my-page" options={{ title: "マイQR" }} />
      <Stack.Screen
        name="profile-confirm"
        options={{ title: "個人情報確認" }}
      />
      <Stack.Screen name="profile-edit" options={{ title: "個人情報編集" }} />
      <Stack.Screen name="offline-data" options={{ title: "データ管理" }} />
      <Stack.Screen name="dashbord" options={{ title: "ダッシュボード" }} />
      <Stack.Screen name="scan-qr" options={{ title: "QRコードスキャン" }} />
      <Stack.Screen name="scan-result" options={{ title: "受付結果" }} />
      <Stack.Screen name="id-scan" options={{ title: "身分証明書スキャン" }} />
    </Stack>
  );
}
