// app/scan-result.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function ScanResultScreen() {
  const router = useRouter();
  const { result } = useLocalSearchParams();
  const data = result ? JSON.parse(result as string) : null;

  if (!data) {
    return (
      <View style={styles.container}>
        <Text>データがありません</Text>
      </View>
    );
  }

  const user = data.user_info;
  const action = data.action_result;

  // ★ モード判定: 避難所チェックイン（災害時）かどうかを判定
  const isEmergencyMode = action.type === "shelter_checkin";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>受付結果</Text>

        {/* 受付ステータス表示 */}
        <View
          style={[
            styles.statusCard,
            { backgroundColor: action.success ? "#DCFCE7" : "#FEE2E2" },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: action.success ? "#166534" : "#991b1b" },
            ]}
          >
            {action.success ? "✅ 受付成功" : "❌ 受付失敗"}
          </Text>
          <Text style={styles.statusDetail}>{action.detail}</Text>
        </View>

        {/* ユーザー詳細情報 */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            {isEmergencyMode ? "【緊急】住民重要情報" : "住民基本情報"}
          </Text>

          {/* 共通項目：氏名 */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>氏名</Text>
            <Text style={styles.value}>{user.name}</Text>
          </View>

          {/* 災害時のみ表示する項目 */}
          {isEmergencyMode && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>血液型</Text>
                <Text style={styles.value}>{user.blood_type}</Text>
              </View>

              <View style={[styles.infoRow, styles.alertRow]}>
                <Text style={[styles.label, styles.alertLabel]}>
                  持病・アレルギー
                </Text>
                <Text style={[styles.value, styles.alertValue]}>
                  {user.medical_conditions}
                </Text>
              </View>
            </>
          )}

          {/* 共通項目：連絡先 */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>連絡先</Text>
            <Text style={styles.value}>{user.phone_number}</Text>
          </View>
        </View>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  scrollContent: { padding: 20, paddingTop: 60, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#333" },
  statusCard: {
    width: "100%",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  statusText: { fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  statusDetail: { fontSize: 14, color: "#333", textAlign: "center" },
  infoCard: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#666",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  label: { fontSize: 16, color: "#666" },
  value: { fontSize: 16, fontWeight: "bold", color: "#333" },
  alertRow: {
    backgroundColor: "#FFFBEB",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE047",
  },
  alertLabel: { color: "#B45309", fontWeight: "bold" },
  alertValue: { color: "#B45309", fontWeight: "bold" },
  backButton: {
    marginTop: 30,
    backgroundColor: "#E5E7EB",
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  backButtonText: { fontSize: 16, fontWeight: "600", color: "#4B5563" },
});
