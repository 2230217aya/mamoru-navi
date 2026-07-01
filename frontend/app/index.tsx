// frontend/app/index.tsx
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { View, ActivityIndicator, Text } from "react-native"; // Textを追加

export default function Index() {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const debuggerHost = Constants.expoConfig?.hostUri;
        const localIp = debuggerHost ? debuggerHost.split(":")[0] : "localhost";

        // RootLayoutと同じ判定ロジックを使う、または USB接続なら localhost に直書きする
        const baseUrl =
          localIp === "localhost" ||
          localIp === "127.0.0.1" ||
          localIp.includes("10.144")
            ? "http://localhost:8000"
            : `http://${localIp}:8000`;

        console.log(`📡 [Index] リクエスト送信先: ${baseUrl}/user/my-role`);

        const response = await fetch(`${baseUrl}/user/my-role`);
        const data = await response.json();

        console.log("✅ [Index] 取得成功:", data.user_role); // ロールの中身を確認
        setRole(data.user_role);
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
