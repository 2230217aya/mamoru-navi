// frontend/app/index.tsx
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import Constants from "expo-constants";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const debuggerHost = Constants.expoConfig?.hostUri;
        const localIp = debuggerHost ? debuggerHost.split(":")[0] : "localhost";
        const baseUrl =
          process.env.EXPO_PUBLIC_API_URL || `http://${localIp}:8000`;
        console.log("ロール取得API通信先:", `${baseUrl}/user/my-role`);
        const response = await fetch(`${baseUrl}/user/my-role`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "bypass-tunnel-reminder": "true",
          },
        });
        const data = await response.json();
        setRole(data.user_role);
      } catch (e) {
        console.error("Redirect Error:", e);
        setRole("citizen"); // エラー時はとりあえず住民
      }
    };
    fetchRole();
  }, []);

  // 判定中はローディングを表示（真っ白を防ぐ）
  if (role === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#60A5FA" />
      </View>
    );
  }

  // ★ ここで各画面へリダイレクト（転送）★
  if (role === "staff") {
    // 職員ならダッシュボードへ
    return <Redirect href="/dashbord" />;
  } else {
    // 住民なら住民ホームへ（または (tabs) へ）
    return <Redirect href="/user_home" />;
  }
}
