// frontend/app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { LocalDB } from "@/src/db/database";
import * as Network from "expo-network";
import Constants from "expo-constants";

// ★ app/ フォルダ直下のコンポーネントをインポート ★
import HomeScreen from "./index"; // app/(tabs)/index.tsx を指す
import MyPageScreen from "./my-page"; // app/my-page.tsx を指す
import OfflineDataScreen from "./offline-data"; // app/offline-data.tsx を指す
import DashboardScreen from "./dashbord"; // app/dashboard.tsx を指す
import UserHomeScreen from "./user_home";

export default function RootLayout() {
  const router = useRouter();

  // ★ 初期値を null にし、読み込み終わるまで待機するようにする
  const [userRole, setUserRole] = useState<"citizen" | "staff" | null>(null);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // --- データベース初期化 ---
    LocalDB.init()
      .then(() => {
        console.log("Database ready");
        setDbReady(true); // ★ 修正：これを追加して描画を許可する
      })
      .catch((err) => {
        console.error("Database init failed", err);
        // エラー時も一応描画させるために true にするか、エラー画面を出す
        setDbReady(true);
      });

    // 2. データベース(PostgreSQL)からロールを取得する
    const fetchUserRole = async () => {
      try {
        const debuggerHost = Constants.expoConfig?.hostUri;
        const localIp = debuggerHost ? debuggerHost.split(":")[0] : "localhost";
        const baseUrl =
          process.env.EXPO_PUBLIC_API_URL || `http://${localIp}:8000`;

        const response = await fetch(`${baseUrl}/user/my-role`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "bypass-tunnel-reminder": "true",
          },
        });

        const data = await response.json();

        if (data.status === "success") {
          setUserRole(data.user_role); // "citizen" か "staff" が入る
          console.log(`👤 ログインロール: ${data.user_role}`);
        }
      } catch (error) {
        console.error("ロール取得失敗:", error);
        // エラー時はデフォルトとして citizen にしておくなどのフォールバック
        setUserRole("citizen");
      }
    };

    fetchUserRole();

    // --- 同期ロジック ---
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

  // ★ 読み込みが終わるまで何も表示しない（またはスプラッシュ画面を出す）
  if (userRole === null || !dbReady) {
    return null;
  }

  // 関数名も RootLayout に変更
  return (
    // ★ Navigator を Stack に変更 ★
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
      // ★ ロールによって最初に表示したい画面を出し分ける
      //initialRouteName={userRole === "staff" ? "dashbord" : "user_home"}
    >
      {/* 
         画面の登録（順序は関係ありません） 
      */}
      <Stack.Screen name="index" options={{ title: "ホーム" }} />
      <Stack.Screen name="user_home" options={{ title: "住民ホーム" }} />
      <Stack.Screen name="dashbord" options={{ title: "ダッシュボード" }} />

      {/* 住民専用エリア */}
      <Stack.Screen name="my-page" options={{ title: "マイQR" }} />
      <Stack.Screen
        name="profile-confirm"
        options={{ title: "個人情報確認" }}
      />
      <Stack.Screen name="profile-edit" options={{ title: "個人情報編集" }} />
      <Stack.Screen
        name="offline-data"
        options={{ title: "データ管理", animation: "slide_from_left" }}
      />

      {/* 職員専用エリア */}
      <Stack.Screen name="scan-qr" options={{ title: "QRコードスキャン" }} />
      <Stack.Screen name="scan-result" options={{ title: "受付結果" }} />
      <Stack.Screen name="id-scan" options={{ title: "身分証明書スキャン" }} />
    </Stack>
  );
}
