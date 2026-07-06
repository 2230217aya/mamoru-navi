// ===== React =====
import React, { useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
// ===== BottomSheet =====
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

// ===== React Native =====
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

// ===== Components =====
import NormalModeContent from './NormalModeContent';
import DisasterModeContent from './DisasterModeContent';

// ===== Types =====
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
  onRefresh: () => void;
  selectedShelter: Shelter | null;
};

const MODES = {
  NORMAL: 'normal',
  DISASTER: 'disaster',
};

export default function HomeBottomSheet({
  mode,
  officeServices,
  loading,
  lastUpdate,
  onRefresh,
  selectedShelter
}: Props) {

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [sheetIndex, setSheetIndex] = useState(0);

  const snapPoints = useMemo(() => {
    if (mode === MODES.NORMAL) {
      return ['16%', '47%'];
    }
    return ['33%', '88%'];
  }, [mode]);

  return (
    <>
      {/* ===== BottomSheet ===== */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        onChange={setSheetIndex}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        backgroundStyle={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
        handleIndicatorStyle={{
          backgroundColor: '#ccc',
          width: 60,
        }}
      >


        <BottomSheetView style={styles.container}>

        <View style={styles.titleRow}>

          <Text style={styles.title}>
            {mode === MODES.NORMAL
              ? '大阪市役所'
              : '避難所状況'}
          </Text>

          {mode === MODES.NORMAL && (
            <TouchableOpacity
              style={styles.reserveButton
                
              }
             onPress={() => router.push('../reservation')}
            >
              <Text style={styles.reserveButtonText}>
                予約
              </Text>
            </TouchableOpacity>
          )}

        </View>

          {/* ========================= */}
          {/* NORMAL MODE */}
          {/* ========================= */}
          {mode === MODES.NORMAL ? (
            <NormalModeContent
              officeServices={officeServices}
              loading={loading}
              lastUpdate={lastUpdate}
              onRefresh={onRefresh}
            />
          ) : (
            /* ========================= */
            /* DISASTER MODE */
            /* ========================= */

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


      {mode === MODES.DISASTER && (
        <View style={styles.fixedStatsContainer}>

          <View style={styles.statBox}>
            <Text style={styles.statTitle}>移動中</Text>
            <Text style={styles.statValue}>6人</Text>
            <Image
              source={require('../../../assets/images/arukuhito.png')}
              style={styles.statImage}
            />
          </View>

          <View style={styles.statBox2}>
            <Text style={styles.statTitle}>収容される</Text>
            <Text style={styles.statValue}>12人</Text>
            <Image
              source={require('../../../assets/images/hinan.png')}
              style={styles.statImage}
            />
          </View>

        </View>
      )}
    </>
  );
}
// ===== Style =====
const styles = StyleSheet.create({

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  title: {
  fontSize: 22,
  fontWeight: 'bold',
},
  titleRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
},

  scrollContent: {
    paddingBottom: 200, 
  },

  fixedStatsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,

    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,

    flexDirection: 'row',
    gap: 12,

    backgroundColor: '#fff',
    zIndex: 999,
  },

  statBox: {
    flex: 1,
    backgroundColor: '#FFEE37',
    borderRadius: 12,
    height: 140,
    padding: 12,
  },

  statBox2: {
    flex: 1,
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    height: 140,
    padding: 12,
  },

  statTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  statValue: {
    position: 'absolute',
    left: 12,
    bottom: 10,
    fontSize: 30,
    fontWeight: 'bold',
  },

  statImage: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 50,
    height: 50,
  },
  // ===== 予約ボタン =====
reserveButton: {
  backgroundColor: '#FFEE37',
  paddingHorizontal: 30,
  paddingVertical: 8,
  borderRadius: 20,
},

reserveButtonText: {
  color: '#000',
  fontSize: 14,
  fontWeight: 'bold',
},
});