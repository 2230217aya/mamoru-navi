// frontend/app/index.tsx
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { View, ActivityIndicator, Text } from "react-native"; // Textを追加
import { getBaseUrl, API_HEADERS } from "@/src/utils/api";

export default function Index() {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        // --- 1. 共通ユーティリティからベースURLを取得 ---
        const baseUrl = getBaseUrl();

        console.log(`📡 [Index] ロール取得API通信先: ${baseUrl}/users/my-role`);

        // --- 2. 共通ヘッダーを使ってリクエスト送信 ---
        const response = await fetch(`${baseUrl}/users/my-role`, {
          method: "GET",
          headers: API_HEADERS, // bypass-tunnel-reminder もここに含まれています
        });

        // --- 3. エラーハンドリング ---
        if (!response.ok) {
          console.log("⚠️ [Index] APIエラー:", response.status);
          setRole("citizen"); // エラー時は住民としてフォールバック
          return;
        }

        const data = await response.json();
        console.log("✅ [Index] 取得成功:", data.user_role); // ロールの中身を確認

        // ロールを確定 (staff 以外はすべて citizen)
        const finalRole = data.user_role === "staff" ? "staff" : "citizen";
        setRole(finalRole);
      } catch (e) {
        console.error("❌ [Index] Redirect Error:", e);
        setRole("citizen"); // エラー時にフォールバック
      }
    };
    fetchUserRole();
  }, []);

  console.log(`🎨 [Index] 現在のステート: role = ${role}`); // 画面が描画されるたびに確認

  useEffect(() => {
    // role が確定("citizen" や "staff") したら、すぐに移動
    if (role === "citizen") {
      console.log("🚀 [Index] citizen として /user_home へ転送します");
      router.replace("/user_home");
    } else if (role === "staff") {
      router.replace("/dashbord");
    }
  }, [role]);

  if (role === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#60A5FA" />
        {/* 画面に直接メッセージを出すと、コンソールを見なくてもわかります */}
        <Text style={{ marginTop: 10, color: "#666" }}>
          ロールを取得しています...
        </Text>
      </View>
    );
  }

  console.log(
    `🚀 [Index] ${role === "staff" ? "/dashbord" : "/user_home"} へ転送します`,
  );

  if (role === "staff") {
    return <Redirect href="/dashbord" />;
  } else {
    return <Redirect href="/user_home" />;
  }

  return null;
}
