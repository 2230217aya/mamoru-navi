// ===== React =====
import React, {
  useMemo,
  useRef,
  useState,
} from 'react';

// ===== BottomSheet =====
import BottomSheet, {
  BottomSheetView,
} from '@gorhom/bottom-sheet';

// ===== React Native =====
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ===== 各モード表示コンポーネント =====
import NormalModeContent from './NormalModeContent';
import DisasterModeContent from './DisasterModeContent';

// ===== 施設サービス型 =====
type OfficeService = {
  id: number;
  title: string;
  number: string;
};

// ===== Props型 =====
type Props = {

  // 現在モード
  mode: string;

  // 施設サービス一覧
  officeServices: OfficeService[];

  // ローディング状態
  loading: boolean;

  // 最終更新時間
  lastUpdate: string;

  // 更新処理
  onRefresh: () => void;
};

// ===== モード定義 =====
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

}: Props) {

  // ===== BottomSheet参照 =====
  const bottomSheetRef =
    useRef<BottomSheet>(null);

  // ===== 現在のBottomSheet位置 =====
  const [sheetIndex, setSheetIndex] =
    useState(0);

  // ===== BottomSheet高さ =====
  const snapPoints = useMemo(() => {

    // ===== 平常時 =====
    if (mode === MODES.NORMAL) {
      return ['15%', '45%'];
    }

    // ===== 災害時 =====
    return ['33%', '88%'];

  }, [mode]);

  return (

    <>

      {/* ===== BottomSheet ===== */}
      <BottomSheet

        // ===== BottomSheet参照 =====
        ref={bottomSheetRef}

        // ===== 初期位置 =====
        index={0}

        // ===== BottomSheet位置変更 =====
        onChange={setSheetIndex}

        // ===== 展開サイズ =====
        snapPoints={snapPoints}
         enableDynamicSizing={false}

        // ===== 背景デザイン =====
        backgroundStyle={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}

        // ===== 上部ハンドル =====
        handleIndicatorStyle={{
          backgroundColor: '#ccc',
          width: 60,
        }}
      >

        {/* ===== BottomSheet内部 ===== */}
        <BottomSheetView style={styles.container}>

          {/* ===== タイトル ===== */}
          <Text style={styles.title}>

            {mode === MODES.NORMAL
              ? '大阪市役所'
              : '避難所状況'}

          </Text>

          {/* ===== 平常時 ===== */}
          {mode === MODES.NORMAL ? (

            <NormalModeContent
              officeServices={officeServices}
              loading={loading}
              lastUpdate={lastUpdate}
              onRefresh={onRefresh}
            />

          ) : (

            // ===== 災害時 =====
            <DisasterModeContent
              expanded={sheetIndex >= 0}
            />

          )}

        </BottomSheetView>

      </BottomSheet>

      {/* ===== 災害時固定底部 ===== */}
      {mode === MODES.DISASTER && (

        <View style={styles.fixedStatsContainer}>

          {/* ===== 移動中 ===== */}
          <View style={styles.statBox}>

            <Text style={styles.statTitle}>
              移動中
            </Text>

            <Text style={styles.statValue}>
              6人
            </Text>

            <Image
              source={require('../../../assets/images/arukuhito.png')}
              style={styles.statImage}
            />

          </View>

          {/* ===== 収容される ===== */}
          <View style={styles.statBox2}>

            <Text style={styles.statTitle}>
              収容される
            </Text>

            <Text style={styles.statValue}>
              12人
            </Text>

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

  // ===== BottomSheet内部 =====
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  // ===== タイトル =====
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  // ===== 災害時固定底部 =====
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

  // ===== 黄色カード =====
  statBox: {
    flex: 1,
    backgroundColor: '#FFEE37',
    borderRadius: 12,
    height: 140,
    padding: 12,
  },

  // ===== 灰色カード =====
  statBox2: {
    flex: 1,
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    height: 140,
    padding: 12,
  },

  // ===== タイトル =====
  statTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // ===== 人数 =====
  statValue: {
    position: 'absolute',
    left: 12,
    bottom: 10,
    fontSize: 30,
    fontWeight: 'bold',
  },

  // ===== 画像 =====
  statImage: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 50,
    height: 50,
  },

});