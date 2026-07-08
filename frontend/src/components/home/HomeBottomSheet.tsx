import React, { useMemo, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

import NormalModeContent from './NormalModeContent';
import DisasterModeContent from './DisasterModeContent';

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

type Props = {
  mode: string;
  officeServices: OfficeService[];
  loading: boolean;
  lastUpdate: string;
  onRefresh: (facilityId: string) => void;
  selectedFacility: Facility | null;
  visible: boolean;   // ⭐ 新增控制開關
  onClose: () => void; // ⭐ 關閉用
};

export default function HomeBottomSheet({
  mode,
  officeServices,
  loading,
  lastUpdate,
  onRefresh,
  selectedFacility,
  visible,
  onClose,
}: Props) {

  const snapPoints = useMemo(() => {
    return mode === 'normal' ? ['16%', '47%'] : ['33%', '88%'];
  }, [mode]);

  const sheetRef = useRef<BottomSheet>(null);

  const index = visible ? 1 : -1; // ⭐ 關鍵：控制開關

  useEffect(() => {
    if (!selectedFacility?.facility_id) return;
    onRefresh(selectedFacility.facility_id);
  }, [selectedFacility]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={index}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
    >
      <BottomSheetView style={styles.container}>

        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {mode === 'normal'
              ? (selectedFacility?.name ?? '大阪市役所')
              : '避難所状況'}
          </Text>

          {mode === 'normal' && (
            <TouchableOpacity
              style={styles.reserveButton}
              onPress={() => router.push('../reservation')}
            >
              <Text style={styles.reserveButtonText}>予約</Text>
            </TouchableOpacity>
          )}
        </View>

        {mode === 'normal' ? (
          <NormalModeContent
            officeServices={officeServices}
            loading={loading}
            lastUpdate={lastUpdate}
            onRefresh={() =>
              selectedFacility?.facility_id &&
              onRefresh(selectedFacility.facility_id)
            }
          />
        ) : (
          <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
            <DisasterModeContent expanded={true} />
          </BottomSheetScrollView>
        )}

      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 200,
  },
  reserveButton: {
    backgroundColor: '#FFEE37',
    paddingHorizontal: 30,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reserveButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});