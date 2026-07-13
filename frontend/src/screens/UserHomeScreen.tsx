//frontend\src\screens\UserHomeScreen.tsx
// ===== アイコン =====
import { Ionicons } from '@expo/vector-icons';

// ===== 地図 =====
import MapView, { Marker, Polyline } from 'react-native-maps';

// ===== 画面遷移 =====
import { router } from 'expo-router';

// ===== BottomSheet =====
import HomeBottomSheet from '../components/home/HomeBottomSheet';

import Constants from "expo-constants";

// ===== Reanimated =====
import 'react-native-reanimated';

// ===== Gesture Handler =====
import { GestureHandlerRootView } from "react-native-gesture-handler";

// タイル保存先確認用
import * as ExpoFileSystem from "expo-file-system";

// ===== React Native =====
import {
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  Image,
  Modal,
  Animated,
} from 'react-native';

// ===== React =====
import { useEffect, useState, useRef } from "react";

// ===== 災害警報バナー =====
import EmergencyAlertBanner from "../components/home/EmergencyAlertBanner";

// --- SQLite ---
import { LocalDB } from "@/src/db/database";
import {
  convertGeoJsonToMapPoints,
  findNearestPointIndex,
  getDistance,
  decodeGooglePolyline,
} from "@/src/utils/mapUtils";

// ===== ネットワーク状態 =====
import * as Network from "expo-network";

// ===== baseAPIまとめ =====
import { getBaseUrl, API_HEADERS } from "@/src/utils/api";

// watchHeadingAsync のために必要
import * as Location from "expo-location";


const API_BASE_URL = "http://192.168.137.1:8000";
const API_URL = API_BASE_URL;

// ===== モード定義 =====
const MODES = {
  NORMAL: 'normal',
  DISASTER: 'disaster',
};

// ===== 型定義 =====
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

type Facility = {
  facility_id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  business_hours?: string;
  closed_days?: string;
};
// ===== クイック検索用の仮データ =====
const QUICK_SEARCH_ITEMS = [
  {
    id: 1,
    title: '市区役所',
    type: '市区役所',
  },
  {
    id: 2,
    title: '図書館',
    type: '図書館',
  },
  {
    id: 3,
    title: '体育館',
    type: '体育館',
  },
];

const TYPE_MAP: Record<string, string> = {
  市区役所: 'city_hall',
  図書館: 'library',
  体育館: 'gym',
};

// ===== 平常時施設情報の仮データ =====
const MOCK_OFFICE_SERVICES: OfficeService[] = [
  {
    id: 1,
    title: '証明書の発行',
    number: '22',
  },
  {
    id: 2,
    title: '住所の変更・印鑑登録',
    number: '57',
  },
  {
    id: 3,
    title: 'マイナンバー',
    number: '132',
  },
  {
    id: 4,
    title: '戸籍の提出・相談',
    number: '12',
  },
];

export default function UserHome() {

  // ===== 詳細モーダル表示状態 =====
  const [showDetail, setShowDetail] = useState(false);

  // ===== BottomSheet表示状態 =====
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  // ===== 選択されたクイック検索 =====
  const [selectedQuickSearch, setSelectedQuickSearch] =
    useState<string | null>(null);
  // ===== 現在モード =====
  const [mode, setMode] = useState(MODES.NORMAL);

  // ===== 施設サービス一覧 =====
  const [officeServices, setOfficeServices] =
    useState<OfficeService[]>([]);

  // ===== MapView参照 =====
  const mapRef = useRef<MapView | null>(null);

  // ===== ローディング状態 =====
  const [loading, setLoading] = useState(false);

  // ===== 最終更新時刻 =====
  const [lastUpdate, setLastUpdate] = useState('');

  // ===== 施設位置 =====
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  // ===== 現在地 =====
  const origin = {
    latitude: 34.706443,
    longitude: 135.503214,
  };

  // ===== 避難所位置 =====
  const destination = {
    latitude: 34.707500,
    longitude: 135.504684,
  };

  // ===== 仮ルートデータ =====
  const routeCoordinates = [
    {
      latitude: 34.706443,
      longitude: 135.503214,
    },
    {
      latitude: 34.706443,
      longitude: 135.503432,
    },

    {
      latitude: 34.707161,
      longitude: 135.503310,
    },

    {
      latitude: 34.707216,
      longitude: 135.503969,
    },

    {
      latitude: 34.707052,
      longitude: 135.504033,
    },

    {
      latitude: 34.707237,
      longitude: 135.504852,
    },

    {
      latitude: 34.707500,
      longitude: 135.504684,
    },
  ];
  const fitFacilities = (list: Facility[]) => {
    if (list.length === 0) return;

    mapRef.current?.fitToCoordinates(
      list.map((facility) => ({
        latitude: facility.latitude,
        longitude: facility.longitude,
      })),
      {
        edgePadding: {
          top: 80,
          right: 80,
          bottom: 80,
          left: 80,
        },
        animated: true,
      }
    );
  };
  const fetchFacilities = async (type?: string | null) => {
    try {
      setLoading(true);

      const url =
        type && type.trim().length > 0
          ? `${API_URL}/facilities?type=${encodeURIComponent(type)}`
          : `${API_URL}/facilities`;

      const response = await fetch(url);
      const data = await response.json();

      const list = data as Facility[];

      setFacilities(data);

      if (mode === MODES.NORMAL) {
        setTimeout(() => {
          fitFacilities(list);
        }, 300);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  // ===== API取得 =====
  const fetchOfficeServices = async (facilityId?: string) => {
    try {

      // ===== ローディング開始 =====
      setLoading(true);

      const res = await fetch(
        `${API_URL}/facilities/${facilityId}/office-services`
      );
      const data = await res.json();

      setOfficeServices(data);

      // ===== 更新時間保存 =====
      setLastUpdate(
        new Date().toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );

    } catch (error) {

      // ===== エラー表示 =====
      console.log(error);

    } finally {

      // ===== ローディング終了 =====
      setLoading(false);
    }
  };

  // ===== 初期読み込み =====
  useEffect(() => {
    fetchOfficeServices();
    fetchFacilities(null); // ← 改這裡
  }, []);



  return (

    <GestureHandlerRootView style={{ flex: 1 }}>

      <SafeAreaView style={styles.container}>

        {/* ===== 地図 ===== */}
        <MapView
          ref={mapRef}
          style={styles.map}
          googleRenderer="LEGACY"
          initialRegion={{
            latitude: 34.6937,
            longitude: 135.5023,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >

          {mode === MODES.NORMAL ? (

            // ===== 平常モード施設マーカー =====
            <>
              {facilities.map((facility) => (
                <Marker
                  key={facility.facility_id}
                  coordinate={{
                    latitude: facility.latitude,
                    longitude: facility.longitude,
                  }}
                  image={
                    facility.type === "city_hall"
                      ? require("../../assets/images/markers/cityhall.png")
                      : facility.type === "library"
                        ? require("../../assets/images/markers/library.png")
                        : require("../../assets/images/markers/gym.png")
                  }
                  onPress={() => {
                    setSelectedFacility(facility);
                    fetchOfficeServices(facility.facility_id);
                    setShowBottomSheet(true);

                    mapRef.current?.animateToRegion(
                      {
                        latitude: facility.latitude,
                        longitude: facility.longitude,
                        latitudeDelta: 0.003,
                        longitudeDelta: 0.003,
                      },
                      500
                    );
                  }}
                />
              ))}
            </>

          ) : (

            <>
              {/* ===== 現在地マーカー ===== */}
              <Marker
                coordinate={origin}
                title="現在地"
                description="ユーザー位置"
              />

              {/* ===== 避難所マーカー ===== */}
              <Marker
                coordinate={destination}
                pinColor="red"
                title="避難所"
                description="開設中"
              />

              {/* ===== 避難ルート ===== */}
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#1976d2"
                strokeWidth={5}
              />
            </>
          )}

        </MapView>

        {/* ===== ヘッダー ===== */}
        <View style={styles.header}>

          {/* ===== メニューボタン ===== */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('../offline-data')}
          >
            <Ionicons
              name="menu"
              size={28}
              color="#333"
            />
          </TouchableOpacity>

          {/* ===== 検索欄 ===== */}
          <View style={styles.searchContainer}>

            <Ionicons
              name="search"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />

            <TextInput
              placeholder="検索"
              placeholderTextColor="#888"
              style={styles.searchInput}
            />
          </View>

          {/* ===== マイページ ===== */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('../my-page')}
          >
            <Image
              source={require('../../assets/images/userpage.png')}
              style={{ width: 32, height: 32 }}
            />
          </TouchableOpacity>

        </View>

        {/* ===== 平常 / 災害モード切替 ===== */}
        {mode === MODES.NORMAL ? (

          // ===== 平常モード：クイック検索 =====
          <View style={styles.quickSearchContainer}>

            {QUICK_SEARCH_ITEMS.map((item) => (

              <TouchableOpacity
                key={item.id}
                style={[
                  styles.quickSearchButton,
                  selectedQuickSearch === item.title &&
                  styles.activeQuickSearchButton
                ]}
                onPress={() => {
                  if (selectedQuickSearch === item.title) {
                    setSelectedQuickSearch(null);
                    fetchFacilities(null);
                  } else {
                    setSelectedQuickSearch(item.title);
                    fetchFacilities(TYPE_MAP[item.title]);
                  }

                  setSelectedFacility(null);
                  setShowBottomSheet(false);
                  setOfficeServices([]);
                }}
              >

                <Text style={styles.quickSearchText}>
                  {item.title}
                </Text>

              </TouchableOpacity>

            ))}

          </View>

        ) : (

          // ===== 災害モード：警報表示 =====
          <EmergencyAlertBanner
            level="5"
            title="緊急地震速報"
            message="大阪府北部で地震発生"
            levelText="震度5弱"
          />

        )}

        {/* ===== モード切替（開発用） ===== */}
        <View style={styles.modeContainer}>

          <Text style={styles.modeText}>
            開発環境のみ表示
          </Text>

          {/* ===== 平常モードボタン ===== */}
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === MODES.NORMAL &&
              styles.activeModeButton
            ]}
            onPress={() => {

              // ===== 平常モードへ変更 =====
              setMode(MODES.NORMAL);

              // ===== BottomSheet非表示 =====
              setShowBottomSheet(false);
            }}
          >

            <Text
              style={[
                styles.modeText,
                mode === MODES.NORMAL &&
                styles.activeModeText
              ]}
            >
              平常
            </Text>

          </TouchableOpacity>

          {/* ===== 災害モードボタン ===== */}
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === MODES.DISASTER &&
              styles.activeModeButton
            ]}
            onPress={() => {

              // ===== 災害モードへ変更 =====
              setMode(MODES.DISASTER);

              // ===== BottomSheet表示 =====
              setShowBottomSheet(true);

              // ===== 避難所へ移動 =====
              mapRef.current?.animateToRegion(
                {
                  latitude: destination.latitude,
                  longitude: destination.longitude,

                  // ===== 災害モード時の拡大率 =====
                  latitudeDelta: 0.003,
                  longitudeDelta: 0.003,
                },
                1000
              );
            }}
          >

            <Text
              style={[
                styles.modeText,
                mode === MODES.DISASTER &&
                styles.activeModeText
              ]}
            >
              災害
            </Text>

          </TouchableOpacity>

        </View>

        {/* ===== BottomSheet ===== */}
        {showBottomSheet && (
          <HomeBottomSheet
            mode={mode}
            officeServices={officeServices}
            loading={loading}
            lastUpdate={lastUpdate}
            onRefresh={fetchOfficeServices}
            selectedFacility={selectedFacility}
            visible={showBottomSheet}
            onClose={() => {
              setShowBottomSheet(false);

              if (mode === MODES.NORMAL) {
                fitFacilities(facilities);
              }
            }}
          />
        )}

        {/* ===== 詳細モーダル ===== */}
        <Modal
          visible={showDetail}
          transparent
          animationType="slide"
        >

          <View style={styles.modalOverlay}>

            <View style={styles.detailModal}>

              {/* ===== モーダルハンドル ===== */}
              <View style={styles.modalHandle} />

              {/* ===== タイトル ===== */}
              <Text style={styles.modalTitle}>
                避難所詳細情報
              </Text>

              {/* ===== 情報 ===== */}
              <Text style={styles.modalText}>
                現在収容人数：12人
              </Text>

              <Text style={styles.modalText}>
                利用可能：毛布・水・食料
              </Text>

              <Text style={styles.modalText}>
                ペット同行可能
              </Text>

              {/* ===== 閉じるボタン ===== */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetail(false)}
              >

                <Text style={styles.closeButtonText}>
                  閉じる
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        </Modal>

      </SafeAreaView>

    </GestureHandlerRootView>

  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  // ヘッダー
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff9c',

    paddingTop: 30,
    paddingBottom: 10,
    paddingHorizontal: 5,


    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  //ヘッダーのicon
  iconButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  //検索欄
  searchContainer: {
    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#ffffff',

    borderRadius: 24,

    paddingHorizontal: 14,

    height: 48,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.15,
    shadowRadius: 4,

    elevation: 4,
  },
  //検索icon
  searchIcon: {
    marginRight: 8,
  },
  //検索
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  // クイック検索アイテム
  quickSearchContainer: {
    position: 'absolute',

    top: 85,
    left: 10,
    right: 20,
    flexDirection: 'row',
    padding: 6,

  },
  activeQuickSearchButton: {
    backgroundColor: '#d0d0d0',
  },

  quickSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 6,
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },

  quickSearchText: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
  },

  //下の情報欄
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },

  //施設タイトル
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',

    marginBottom: 8,
  },
  //施設説明
  cardText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    paddingBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },

  closedText: {
    fontSize: 13,
    color: '#666',
  },


  reserveButton: {
    backgroundColor: '#FFEE37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    width: '30%',
    alignItems: 'center',
  },

  reserveButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },

  detailLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },

  updateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },

  updateText: {

    fontSize: 12,
    color: '#888',
  },
  refreshButton: {
    padding: 4,
  },


  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  usuallystatBox: {
    flex: 1,
    backgroundColor: '#eeeeee',
    padding: 12,
    borderRadius: 12,


  },
  usuallyTitle: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000000',
  },

  numberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    alignSelf: 'flex-end',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFEE37',
    padding: 12,
    borderRadius: 12,
    height: 140,

    position: 'relative',
  },
  statBox2: {
    flex: 1,
    backgroundColor: '#D9D9D9',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValueLeft: {
    position: 'absolute',
    bottom: 10,
    left: 13,

    fontSize: 30,
    fontWeight: 'bold',
    color: '#000000',
  },
  //移動中・収容されるテキスト
  statTitle: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 0,
    fontWeight: 'bold',

    fontSize: 18,
    color: '#000000',
  },

  statValue: {
    position: 'absolute',
    bottom: 10,
    left: 10,

    fontSize: 29,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statImage: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 50,
    height: 50,
  },




  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },

  detailModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '90%',
  },

  modalHandle: {
    width: 50,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  modalText: {
    fontSize: 16,
    marginBottom: 12,
    color: '#444',
  },

  closeButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },

  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // モード切替
  // 開発環境のみ表示　start
  modeContainer: {
    position: 'absolute',

    top: 180,
    left: 20,
    right: 20,

    flexDirection: 'row',

    backgroundColor: 'white',

    borderRadius: 16,

    padding: 6,

    gap: 8,

    elevation: 4,
  },

  modeButton: {
    flex: 1,

    paddingVertical: 1,

    borderRadius: 12,

    alignItems: 'center',
  },

  activeModeButton: {
    backgroundColor: '#c1defa',
  },

  modeText: {
    fontSize: 15,
    fontWeight: '600',

    color: '#8f8c8c',
  },

  activeModeText: {
    color: 'white',
  },
});
// 開発環境のみ表示　end