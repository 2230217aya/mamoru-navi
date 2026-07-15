// frontend\src\components\home\HomeBottomSheet.tsx

import React, { useEffect, useMemo, useRef } from "react";
import { router } from "expo-router";
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";

// 既存のパーツ
import NormalModeContent from "./NormalModeContent";
import DisasterModeContent from "./DisasterModeContent";

// 型定義の統合
type Facility = {
  facility_id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
};

type OfficeService = {
  id: number;
  title: string;
  number: string;
};

type Shelter = {
  shelter_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
};

type Props = {
  mode: string;
  officeServices: OfficeService[];
  loading: boolean;
  lastUpdate: string;
  onRefresh: (facilityId?: string) => void; // 統合のため optional 引数に
  selectedFacility: Facility | null;
  selectedShelter: Shelter | null; // null許容
  visible: boolean;
  onClose: () => void;
};

const MODES = {
  NORMAL: "normal",
  DISASTER: "disaster",
};

export default function HomeBottomSheet({
  mode,
  officeServices,
  loading,
  lastUpdate,
  onRefresh,
  selectedFacility,
  selectedShelter,
  visible,
  onClose,
}: Props) {
  const sheetRef = useRef<BottomSheet>(null);

  // 高さ設定の統合
  const snapPoints = useMemo(() => {
    return mode === MODES.NORMAL ? ["16%", "47%"] : ["33%", "88%"];
  }, [mode]);

  // 表示状態の管理
  const index = !visible ? -1 : 0;

  // 施設が選ばれたら自動リフレッシュ（平常時用）
  useEffect(() => {
    if (mode === MODES.NORMAL && selectedFacility?.facility_id) {
      onRefresh(selectedFacility.facility_id);
    }
  }, [selectedFacility, mode]);

  // タイトルの決定
  const title =
    mode === MODES.NORMAL
      ? (selectedFacility?.name ?? "施設情報")
      : (selectedShelter?.name ?? "避難所を選択してください");

  return (
    <>
      <BottomSheet
        ref={sheetRef}
        index={index}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose={mode === MODES.NORMAL}
        onClose={onClose}
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetView style={styles.container}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>

            {mode === MODES.NORMAL && (
              <TouchableOpacity
                style={styles.reserveButton}
                onPress={() => router.push("../reservation")}
              >
                <Text style={styles.reserveButtonText}>予約</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* モードに応じたコンテンツの切り替え */}
          {mode === MODES.NORMAL ? (
            <NormalModeContent
              officeServices={officeServices}
              loading={loading}
              lastUpdate={lastUpdate}
              onRefresh={() => onRefresh(selectedFacility?.facility_id)}
            />
          ) : (
            <BottomSheetScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <DisasterModeContent
                expanded={true}
                selectedShelter={selectedShelter}
              />
            </BottomSheetScrollView>
          )}
        </BottomSheetView>
      </BottomSheet>

      {/* 災害モード時のみ表示される統計パネル（シートの外に配置） */}
      {mode === MODES.DISASTER && visible && (
        <View style={styles.fixedStatsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statTitle}>移動中</Text>
            <Text style={styles.statValue}>
              {selectedShelter ? "150" : "0"}人
            </Text>
            <Image
              source={require("../../../assets/images/arukuhito.png")}
              style={styles.statImage}
            />
          </View>

          <View style={styles.statBox2}>
            <Text style={styles.statTitle}>最大収容</Text>
            <Text style={styles.statValue}>
              {selectedShelter ? selectedShelter.capacity : "--"}
            </Text>
            <Image
              source={require("../../../assets/images/hinan.png")}
              style={styles.statImage}
            />
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 200,
  },
  reserveButton: {
    backgroundColor: "#FFEE37",
    paddingHorizontal: 25,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reserveButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },
  fixedStatsContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    zIndex: 999,
    // 影をつけてパネル感を出す
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFEE37",
    borderRadius: 12,
    height: 140,
    padding: 12,
  },
  statBox2: {
    flex: 1,
    backgroundColor: "#D9D9D9",
    borderRadius: 12,
    height: 140,
    padding: 12,
  },
  statTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  statValue: {
    position: "absolute",
    left: 12,
    bottom: 10,
    fontSize: 30,
    fontWeight: "bold",
    color: "#000",
  },
  statImage: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 50,
    height: 50,
  },
});
