// frontend/src/screens/ProfileConfirmScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Constants from "expo-constants";

export default function ProfileConfirmScreen() {
  const router = useRouter();

  // ★ プロフィールデータを管理するState
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ★ 画面起動時にAPIからデータを取得する
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchProfile = async () => {
        try {
          const debuggerHost = Constants.expoConfig?.hostUri;
          const localIp = debuggerHost
            ? debuggerHost.split(":")[0]
            : "localhost";
          const baseUrl =
            process.env.EXPO_PUBLIC_API_URL || `http://${localIp}:8000`;

          const response = await fetch(`${baseUrl}/user/profile`);
          const data = await response.json();

          if (isActive && data.status === "success") {
            setProfile(data.profile);
          }
        } catch (error) {
          console.error("プロフィール取得失敗:", error);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchProfile();

      // 画面から離れる時のクリーンアップ処理
      return () => {
        isActive = false;
      };
    }, []), // 依存配列は [] でOK
  );

  if (loading)
    return (
      <SafeAreaView style={styles.container}>
        <Text>読み込み中...</Text>
      </SafeAreaView>
    );
  if (!profile)
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ marginTop: 20, textAlign: "center" }}>
          データが見つかりません
        </Text>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>個人情報の確認</Text>

        {/* 情報を囲む角丸の枠：デザインはそのまま維持 */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>氏名</Text>
            {/* ★ dummyUserData ではなく profile から表示 */}
            <Text style={styles.value}>{profile.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>性別</Text>
            <Text style={styles.value}>{profile.gender || "未設定"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>誕生日</Text>
            <Text style={styles.value}>{profile.birthday || "未設定"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>血液型</Text>
            <Text style={styles.value}>{profile.blood_type || "未設定"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>持病</Text>
            <Text style={styles.value}>
              {profile.medical_conditions || "なし"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>連絡先</Text>
            <Text style={styles.value}>{profile.phone_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>住所</Text>
            <Text style={styles.value}>{profile.address || "未設定"}</Text>
          </View>
        </View>

        {/* ボタン部分はそのまま */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push("../profile-edit")}
        >
          <Text style={styles.editButtonText}>個人情報の編集</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// スタイル（styles）
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA", paddingTop: 60 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 30, color: "#333" },
  infoCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
    padding: 20,
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  label: {
    width: 80,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  editButton: {
    backgroundColor: "#FDE047",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  editButtonText: { color: "#333", fontSize: 16, fontWeight: "bold" },
  backButton: {
    backgroundColor: "#E5E7EB",
    width: "80%",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  backButtonText: { color: "#4B5563", fontSize: 16, fontWeight: "bold" },
});
