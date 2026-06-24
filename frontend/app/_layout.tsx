// frontend/app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { LocalDB } from "@/src/db/database";
import * as Network from "expo-network";
import Constants from "expo-constants";
import { updateStayStats, smartAutoCache } from "@/src/utils/mapUtils";
import * as Location from "expo-location";

export default function RootLayout() {
  const router = useRouter();

  // ★ 初期値を null にし、読み込み終わるまで待機するようにする
  const [userRole, setUserRole] = useState<"citizen" | "staff" | null>(null);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // --- ★ 共通設定：baseUrl生成を1箇所に集約 ---
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localIp = debuggerHost ? debuggerHost.split(":")[0] : "localhost";
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || `http://${localIp}:8000`;

    // 1. データベース初期化
    LocalDB.init()
      .then(() => {
        console.log("Database ready");
        setDbReady(true);
      })
      .catch((err) => {
        console.error("Database init failed", err);
        setDbReady(true);
      });

    // 2. ロール取得
    const fetchUserRole = async () => {
      try {
        const response = await fetch(`${baseUrl}/user/my-role`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (data.status === "success") {
          setUserRole(data.user_role);
          console.log(`👤 ログインロール: ${data.user_role}`);
        } else {
          setUserRole("citizen");
        }
      } catch (error) {
        console.log(
          "❌ ネットワークエラーにつき、オフラインモードで開始します",
        );
        setUserRole("citizen"); // ★ここが重要：エラーでも必ずセットする
      }
    };

    fetchUserRole();

    // 3. 同期ロジック (checkAndSync)
    let isSyncing = false;
    let consecutiveFailures = 0;

    const checkAndSync = async () => {
      if (isSyncing) return;
      try {
        const networkState = await Network.getNetworkStateAsync();
        if (networkState.isConnected && networkState.isInternetReachable) {
          isSyncing = true;
          const pendingItems = await LocalDB.getPendingSyncs(5);
          if (pendingItems && pendingItems.length > 0) {
            console.log(`📡 同期開始: ${pendingItems.length}件を送信...`);
            const result = await LocalDB.syncWithServer(baseUrl, pendingItems);
            if (result.success) {
              console.log(`✅ 同期成功`);
              consecutiveFailures = 0;
            } else {
              throw new Error(result.message);
            }
          }
        }
      } catch (error) {
        console.log(`❌ 同期エラー: ${error}`);
        consecutiveFailures++;
      } finally {
        isSyncing = false;
      }
    };

    // ポーリング開始
    const startSmartPolling = () => {
      const baseInterval = 10000;
      const maxInterval = 120000;
      const currentInterval = Math.min(
        baseInterval + consecutiveFailures * 10000,
        maxInterval,
      );
      setTimeout(async () => {
        await checkAndSync();
        startSmartPolling();
      }, currentInterval);
    };

    // 4. スマートバックグラウンドロジック (生活圏学習・キャッシュ)
    const startBackgroundSmartLogic = () => {
      const INTERVAL = 15 * 60 * 1000; // 15分
      setTimeout(async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            await updateStayStats(
              location.coords.latitude,
              location.coords.longitude,
            );
            console.log("📍 StayStats updated in background");
          }
          await smartAutoCache();
        } catch (error) {
          console.log("⚠️ Background logic skip:", error);
        } finally {
          startBackgroundSmartLogic();
        }
      }, INTERVAL);
    };

    // --- ★ 実行：両方のループを確実に開始する ---
    startSmartPolling();
    startBackgroundSmartLogic();
  }, []);

  // ★ 読み込みが終わるまで何も表示しない（またはスプラッシュ画面を出す）
  if (userRole === null || !dbReady) {
    return null;
  }

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
