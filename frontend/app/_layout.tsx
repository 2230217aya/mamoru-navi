// frontend/app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { LocalDB } from "@/src/db/database";
import * as Network from "expo-network";
import Constants from "expo-constants";
import { updateStayStats, smartAutoCache } from "@/src/utils/mapUtils";
import * as Location from "expo-location";

const syncEvacuationPlanInBackground = async (
  baseUrl: string,
  userId: string,
) => {
  try {
    const network = await Network.getNetworkStateAsync();

    // Wi-Fi接続時のみ備蓄を実行
    if (network.isConnected && network.type === Network.NetworkStateType.WIFI) {
      console.log("📡 [Background Sync] 最新の避難ルートを確認中...");

      const response = await fetch(`${baseUrl}/map/my-plan/${userId}`, {
        method: "GET",
        headers: {
          "Bypass-Tunnel-Reminder": "true",
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) return;

      const data = await response.json();
      if (data.status === "success" && data.plan.route_data) {
        // 高品質なデータ（座標が一定数以上）なら上書き保存
        if (data.plan.route_data.coordinates.length > 5) {
          await LocalDB.saveMyEvacuationPlan(data.plan);
          console.log("✅ [Background Sync] 避難ルートの備蓄が完了しました。");
        }
      }
    }
  } catch (e) {
    // ネットワークエラーなどは無視してOK（平常時の裏側処理なので）
    console.log("ℹ️ [Background Sync] 同期スキップ:", e);
  }
};

// ★ 1. スマート・キャッシュ全体の司令塔
const runSmartStorageManager = async (baseUrl: string, userId: string) => {
  try {
    const network = await Network.getNetworkStateAsync();

    // Wi-Fi接続時のみ、重い処理（タイルダウンロード等）を解禁
    const isWifi =
      network.isConnected && network.type === Network.NetworkStateType.WIFI;
    if (!isWifi) return;

    console.log(
      "📡 [Smart Manager] Wi-Fi接続確認。データの自動備蓄を開始します...",
    );

    // (1) 避難計画の備蓄（前回実装分）
    const planResponse = await fetch(`${baseUrl}/map/my-plan/${userId}`, {
      method: "GET",
      headers: {
        "Bypass-Tunnel-Reminder": "true",
        "Content-Type": "application/json",
      },
    });
    if (planResponse.ok) {
      const data = await planResponse.json();
      if (data.status === "success" && data.plan.route_data) {
        // 高品質データのみ保存
        if (data.plan.route_data.coordinates.length > 5) {
          await LocalDB.saveMyEvacuationPlan(data.plan);
          console.log("✅ 避難ルート備蓄完了");

          // ★ 追加：ルート上のタイルも自動でキャッシュ
          const {
            convertGeoJsonToMapPoints,
            autoCacheTiles,
          } = require("@/src/utils/mapUtils");
          const points = convertGeoJsonToMapPoints(data.plan.route_data);
          await autoCacheTiles(points);
        }
      }
    }

    // (2) 【解決策①】手動登録エリアの地図自動更新（自宅・職場など）
    // 本来は my_areas テーブルなどから座標を引っ張る
    // 今回はマイエリア設定があると仮定したフロー
    const myAreas = [{ id: "home", lat: 34.73, lon: 135.5 }]; // ダミー
    for (const area of myAreas) {
      const { autoCacheTiles } = require("@/src/utils/mapUtils");
      await autoCacheTiles([{ latitude: area.lat, longitude: area.lon }]);
      console.log(`✅ マイエリア(${area.id})の地図を更新しました`);
    }

    // (3) 【解決策②】滞在時間ベースの学習済みエリアをキャッシュ
    // すでに utils/mapUtils.ts にある smartAutoCache を叩くだけ
    const { smartAutoCache } = require("@/src/utils/mapUtils");
    await smartAutoCache();
    console.log("✅ 頻出エリアの学習とキャッシュを完了しました");
  } catch (e) {
    console.log("ℹ️ [Smart Manager] スキップ:", e);
  }
};

export default function RootLayout() {
  const router = useRouter();

  // ★ 初期値を null にし、読み込み終わるまで待機するようにする
  const [userRole, setUserRole] = useState<"citizen" | "staff" | null>(null);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // --- ★ 共通設定：baseUrl生成を1箇所に集約 ---
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localIp = debuggerHost ? debuggerHost.split(":")[0] : "localhost";

    // ★ 修正：開発中は問答無用で localhost:8000 を優先する（USBの場合）
    const baseUrl =
      localIp === "localhost" ||
      localIp === "127.0.0.1" ||
      localIp.includes("10.144")
        ? "http://localhost:8000"
        : `http://${localIp}:8000`;

    console.log(`📡 接続先API: ${baseUrl}`);

    const testUserId = "11111111-1111-1111-1111-111111111111";

    // 1. データベース初期化
    LocalDB.init()
      .then(() => {
        console.log("✅ Database initialized");
        setDbReady(true); // ★まず「準備完了」のフラグを立てる

        // ★重いダウンロード処理は、UIが描画されるのを 1秒待ってから「こっそり」始める
        setTimeout(() => {
          runSmartStorageManager(baseUrl, testUserId);
        }, 10000);
      })
      .catch((err) => {
        console.error("❌ Database init failed", err);
        setDbReady(true); // エラーでも止まらないようにフラグは立てる
      });

    // 2. ロール取得
    const fetchUserRole = async () => {
      try {
        const response = await fetch(`${baseUrl}/user/my-role`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Bypass-Tunnel-Reminder": "true",
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
    const startBackgroundLocationLogic = (baseUrl: string, userId: string) => {
      const INTERVAL = 2 * 60 * 1000; // 2分

      setTimeout(async () => {
        try {
          // --- ① 滞在場所のカウント（電波に関わらず実行） ---
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const pos = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const { updateStayStats } = require("@/src/utils/mapUtils");
            await updateStayStats(
              pos.coords.latitude,
              pos.coords.longitude,
              0.5,
            );
          }

          // --- ② ネットワーク系の一括処理 ---
          // ※ sync... 関数の中でWi-Fiチェックをしているので、ここで再度IF文を書かなくても安全です
          await syncEvacuationPlanInBackground(baseUrl, userId);

          // --- ③ 滞在エリアのタイルキャッシュ ---
          // 内部でWi-Fiチェックしているはずなので、そのまま実行
          const { smartAutoCache } = require("@/src/utils/mapUtils");
          await smartAutoCache();
        } catch (e) {
          console.log("Smart Logic Error:", e);
        } finally {
          // ループを維持
          startBackgroundLocationLogic(baseUrl, userId);
        }
      }, INTERVAL);
    };

    // --- ★ 実行：両方のループを確実に開始する ---
    startSmartPolling();
    startBackgroundLocationLogic(baseUrl, testUserId);
  }, []);

  // デバッグ用: どちらが原因で止まっているかログを出す
  console.log(`Debug - userRole: ${userRole}, dbReady: ${dbReady}`);

  // ★ 読み込みが終わるまで何も表示しない（またはスプラッシュ画面を出す）
  // if (userRole === null || !dbReady) {
  //   return null;
  // }

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
