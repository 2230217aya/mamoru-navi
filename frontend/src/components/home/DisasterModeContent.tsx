import React from "react";
import { StyleSheet, Text, View } from "react-native";

// 型定義
type Shelter = {
  shelter_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  toilet_count?: number; // APIから来る値
  supplies?: string[]; // APIから来る値（例: ["水", "食料"]）
};

type Props = {
  expanded: boolean;
  selectedShelter?: Shelter | null;
};

export default function DisasterModeContent({
  expanded,
  selectedShelter,
}: Props) {
  // 展開されていない場合は何も表示しない
  if (!expanded || !selectedShelter) return null;

  // ★ APIから来た値を使いつつ、無い場合のデフォルト値を設定
  const capacity = selectedShelter.capacity || 0;
  const toiletCount = selectedShelter.toilet_count || 0;
  const suppliesList = selectedShelter.supplies || [];

  return (
    <View style={styles.container}>
      {/* 最大収容人数表示 */}
      <View style={styles.row}>
        <Text style={styles.label}>最大収容人数</Text>
        <Text style={styles.value}>{capacity}名</Text>
      </View>

      {/* 2. トイレ設備情報表示 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>トイレ</Text>
        <Text style={styles.text}>総トイレ数：{toiletCount} 箇所</Text>
        <Text style={styles.subText}>※詳細は現地でご確認ください</Text>
      </View>

      {/* 3. 備蓄されている物資（文字列配列 ['水', '食料'] をループ） */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>備蓄されている物資</Text>
        {suppliesList.length > 0 ? (
          suppliesList.map((item, index) => (
            <View key={index} style={styles.supplyRow}>
              {/* item は文字列なのでそのまま表示 */}
              <Text style={styles.supplyName}>・ {item}</Text>
              <Text style={[styles.supplyStatus, { color: "#1BAA00" }]}>
                あり
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.text}>現在、備蓄情報の登録はありません。</Text>
        )}
      </View>

      {/* 4. 入浴施設（APIに無い場合は仮に「調査中」とする） */}
      <View style={styles.row}>
        <Text style={styles.label}>入浴施設</Text>
        <Text style={[styles.statusText, { color: "#888" }]}>なし</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  label: { fontSize: 17, fontWeight: "bold" },
  value: { fontSize: 17 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 10 },
  text: { fontSize: 15, lineHeight: 24 },
  subText: { fontSize: 12, color: "#888" },
  statusText: { fontSize: 17, fontWeight: "bold" },
  supplyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  supplyName: { fontSize: 15 },
  supplyStatus: { fontSize: 15, fontWeight: "bold" },
});
