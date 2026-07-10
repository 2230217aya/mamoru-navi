// ===== アイコン =====
import { Ionicons } from '@expo/vector-icons';

// ===== 地図 =====
import MapView, { Marker, Polyline, UrlTile, Callout } from "react-native-maps";

// ===== 画面遷移 =====
import { useFocusEffect, router } from 'expo-router';

// ===== BottomSheet =====
import HomeBottomSheet from "../components/home/HomeBottomSheet";

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
  Platform,
} from "react-native";

// ===== React =====
import { useEffect, useState, useRef, useCallback } from 'react';

// ===== 災害警報バナー =====
import EmergencyAlertBanner from "../components/home/EmergencyAlertBanner";

// --- SQLite ---
import { LocalDB } from "@/src/db/database";
import {
  convertGeoJsonToMapPoints,
  findNearestPointIndex,
  getDistance,
} from "@/src/utils/mapUtils";

// ===== ネットワーク状態 =====
import * as Network from "expo-network";

// ===== baseAPIまとめ =====
import { getBaseUrl, API_HEADERS } from "@/src/utils/api";

// watchHeadingAsync のために必要
import * as Location from "expo-location";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// ===== モード定義 =====
const MODES = {
  NORMAL: "normal",
  DISASTER: "disaster",
};

// ===== 型定義 =====
type OfficeService = {
  id: string;
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

// ===== クイック検索用の仮データ =====
const QUICK_SEARCH_ITEMS = [
  {
    id: 1,
    title: '市区役所',
  },
  {
    id: 2,
    title: '図書館',
  },
  {
    id: 3,
    title: '体育館',
  },
];

// frontend/src/screens/UserHomeScreen.tsx

export default function UserHome() {
  // ---------------------------------------------------------
  // 1. 画面表示・UI状態 (States)
  // ---------------------------------------------------------
  const [mode, setMode] = useState(MODES.NORMAL); // 平常/災害モード
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false); // 通信中フラグ
  const [lastUpdate, setLastUpdate] = useState(""); // 最終更新時刻
  const [selectedQuickSearch, setSelectedQuickSearch] = useState<string | null>(
    null,
  );

  // ---------------------------------------------------------
  // 2. ナビゲーション・地図状態 (Navigation States)
  // ---------------------------------------------------------
  const [isOnline, setIsOnline] = useState(true); // ネットワーク(赤/オレンジ判定)
  const [origin, setOrigin] = useState({
    latitude: 34.6937,
    longitude: 135.5023,
  }); // 現在地
  const [destination, setDestination] = useState<any>(null); // 避難所
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]); // 全経路
  const [distanceToGoal, setDistanceToGoal] = useState<number | null>(null); // 残り距離
  const [isArrived, setIsArrived] = useState(false); // 到着判定フラグ
  const [heading, setHeading] = useState<number>(0); // デバイスの向き(0-359度)

  // ---------------------------------------------------------
  // 3. 外部参照・固定データ (Refs & Constants)
  // ---------------------------------------------------------
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);

  // ===== MapView参照 =====
  const mapRef = useRef<MapView | null>(null);

  // ===== 施設サービス一覧 =====
  const [officeServices, setOfficeServices] = useState<OfficeService[]>([]);

  // ===== 施設ID =====
  const [facilityId, setFacilityId] = useState<string | null>(null);

  // ===== 施設位置（市役所マーカー用） =====
  const [facilityLocation, setFacilityLocation] = useState({
    latitude: 34.6937,
    longitude: 135.5023,
  });

  // タイル保存先のパス設定（オフライン地図に必須）
  const TILE_DIR = (ExpoFileSystem as any).documentDirectory?.endsWith("/")
    ? (ExpoFileSystem as any).documentDirectory
    : `${(ExpoFileSystem as any).documentDirectory}/`;
  const TILE_PATH = `${TILE_DIR}tiles/{z}/{x}/{y}.png`;

  // ---------------------------------------------------------
  // 4. 動的計算 (Computed Values) ★ ここが「先のルートだけ」の肝
  // ---------------------------------------------------------
  const nearestIdx = findNearestPointIndex(origin, routeCoordinates);
  const remainingRoute =
    nearestIdx !== -1 ? routeCoordinates.slice(nearestIdx) : routeCoordinates;

  // ---------------------------------------------------------
  // 5. API通信関数 (Data Fetching)
  // ---------------------------------------------------------

  /**
   * 避難所リストの取得
   * NOTE: /facilities/?type=shelter が現状 address / capacity を返さない場合、
   * バックエンド側のレスポンスに合わせて Shelter 型・マッピングの調整が必要。
   */
  const fetchShelters = async () => {
    try {
      const url = `${API_BASE_URL}/facilities/?type=shelter`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      setShelters(data);
    } catch (error) {
      console.log('避難所リスト取得エラー:', error);
    }
  };

  // ===== 施設情報を取得（市役所のfacility_idを取得） =====
  const fetchFacilityId = async () => {
    try {
      const url = `${API_BASE_URL}/facilities/?type=city_hall&name=${encodeURIComponent('大阪市役所')}`;
      console.log('Fetching:', url);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();

      console.log('Data received:', data);

      if (data.length > 0) {
        console.log('Setting facilityId:', data[0].facility_id);
        setFacilityId(data[0].facility_id);

        // 市役所マーカーの座標も一緒に更新
        if (data[0].latitude && data[0].longitude) {
          setFacilityLocation({
            latitude: data[0].latitude,
            longitude: data[0].longitude,
          });
        }
      } else {
        console.log('データを取得できませんでした: ', data);
      }
    } catch (error) {
      console.log('施設ID取得エラー:', error);
    }
  };

  // ===== 窓口サービス取得 =====
  const fetchOfficeServices = async () => {
    if (!facilityId) return;
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/facilities/${facilityId}/office-services`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setOfficeServices(data);

      setLastUpdate(
        new Date().toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch (error) {
      console.log(error);
      setOfficeServices([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 災害時：避難計画（ルート）の取得
   */
  const loadEvacuationPlan = async () => {
    setRouteCoordinates([]);
    setDestination(null);

    const testUserId = "11111111-1111-1111-1111-111111111111";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      // --- A. オンライン試行 ---
      const response = await fetch(
        `${getBaseUrl()}/map/my-plan/${testUserId}`,
        {
          headers: API_HEADERS,
          signal: controller.signal,
        },
      );

      if (!response.ok) throw new Error("ServerDown");

      const data = await response.json();
      if (data && data.status === "success" && data.plan) {
        console.log("✅ オンライン成功（赤色表示）");
        setIsOnline(true);
        const points = convertGeoJsonToMapPoints(data.plan.route_data);
        setRouteCoordinates(points);
        if (points.length > 0) setDestination(points[points.length - 1]);
        await LocalDB.saveMyEvacuationPlan(data.plan);
      }
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      console.log("⚠️ オフライン：オレンジ色表示へ切り替え");
      setIsOnline(false);

      const cachedPlans = await LocalDB.getAllSavedPlans();

      if (!cachedPlans || cachedPlans.length === 0) {
        console.log("❌ SQLiteにもデータがありません");
        return;
      }

      let bestPlan: any = null;
      let minDistance = Infinity;

      cachedPlans.forEach((plan: any) => {
        if (plan.route_data && plan.route_data.coordinates) {
          const start = plan.route_data.coordinates[0];
          const dist = getDistance(
            origin.latitude,
            origin.longitude,
            start[1], // 緯度
            start[0], // 経度
          );

          if (dist < minDistance) {
            minDistance = dist;
            bestPlan = plan;
          }
        }
      });

      if (bestPlan) {
        const points = convertGeoJsonToMapPoints(bestPlan.route_data);
        setRouteCoordinates(points);
        if (points.length > 0) setDestination(points[points.length - 1]);
        console.log("✅ オフライン：最適な予備ルートを表示しました");
      }
    }
  };

  // ---------------------------------------------------------
  // 6. 地図操作関数 (Map Actions)
  // ---------------------------------------------------------
  const moveToCityHall = () => {
    mapRef.current?.animateToRegion(
      {
        latitude: facilityLocation.latitude,
        longitude: facilityLocation.longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      },
      1000
    );
  };

  // ---------------------------------------------------------
  // 7. 副作用監視 (Side Effects)
  // ---------------------------------------------------------

  // A. マウント時初期化（一度きりでよい処理）
  useEffect(() => {
    fetchFacilityId();
    fetchShelters();
    loadEvacuationPlan(); // 事前の備蓄を試みる
  }, []);

  // A-2. facilityId が取れたら、画面フォーカス時に窓口情報を取得
  useFocusEffect(
    useCallback(() => {
      if (facilityId) {
        fetchOfficeServices();
      }
    }, [facilityId])
  );

  // B. ネットワーク状態の監視
  useEffect(() => {
    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsOnline(!!(state.isConnected && state.isInternetReachable));
    };
    checkNetwork();
  }, [mode]);

  // C. 災害時の動的HUD・距離更新
  useEffect(() => {
    if (mode !== MODES.DISASTER || !destination || !origin) {
      setDistanceToGoal(null);
      return;
    }

    const dist = getDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude,
    );
    const roundedDist = Math.round(dist);

    setDistanceToGoal(roundedDist);

    if (roundedDist < 50 && !isArrived) {
      setIsArrived(true);
    }
  }, [origin, destination, mode, isArrived]);

  // D. デバイスの向き（コンパス）監視
  useEffect(() => {
    let headingSubscription: any;

    const startHeadingWatch = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      headingSubscription = await Location.watchHeadingAsync(
        (data: Location.LocationHeadingObject) => {
          setHeading(data.trueHeading);
        },
      );
    };

    startHeadingWatch();

    return () => {
      if (headingSubscription) {
        headingSubscription.remove();
      }
    };
  }, []);

  // E. 現在地の監視
  useEffect(() => {
    let locationSubscription: any;

    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("位置情報の権限がありません");
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 10000,
          distanceInterval: 3,
        },
        (location: Location.LocationObject) => {
          const newCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setOrigin(newCoords);
          console.log("📍 現在地更新:", newCoords);
        },
      );
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // ---------------------------------------------------------
  // 8. 描画 (Render)
  // ---------------------------------------------------------

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>

        {/* ===== 地図 ===== */}
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: facilityLocation.latitude,
            longitude: facilityLocation.longitude,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          }}
          showsCompass={true}
          rotateEnabled={true}
          pitchEnabled={true}
          scrollEnabled={true}
          showsUserLocation={false}
          followsUserLocation={false}
          showsMyLocationButton={true}
          mapPadding={{ top: 50, right: 10, bottom: 10, left: 10 }}
        >
          {/* 1. オフライン地図レイヤー */}
          {mode === MODES.DISASTER && !isOnline && (
            <UrlTile
              key="offline-tile"
              urlTemplate={
                mode === MODES.DISASTER && !isOnline
                  ? `file://${TILE_PATH}`
                  : "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              }
              zIndex={-1}
              tileSize={256}
            />
          )}
          {mode === MODES.NORMAL ? (
            // ===== 平常モード施設マーカー =====
            <Marker
              coordinate={facilityLocation}
              title="大阪市役所"
              description="公共施設"
            />
          ) : (
            <>
              {/* ① 避難ルート本体 */}
              {remainingRoute.length > 0 && (
                <Polyline
                  coordinates={remainingRoute}
                  strokeColor={isOnline ? "#ff3b30" : "#E67E22"}
                  strokeWidth={6}
                  zIndex={5}
                />
              )}

              {/* ② 現在地からルート入口までの誘導点線 */}
              {destination && (
                <Polyline
                  coordinates={[
                    origin,
                    remainingRoute[0] || destination,
                  ]}
                  strokeColor={isOnline ? "#007AFF" : "#FF9500"}
                  strokeWidth={5}
                  lineDashPattern={[6, 6]}
                  zIndex={6}
                />
              )}

              {/* ③ 現在地マーカー */}
              <Marker
                coordinate={origin}
                anchor={{ x: 0.5, y: 0.5 }}
                flat={true}
                zIndex={10}
              >
                <View style={{ transform: [{ rotate: `${heading}deg` }] }}>
                  <Ionicons name="navigate" size={32} color="#007AFF" />
                </View>
              </Marker>

              {/* ④ 周辺の避難所リスト */}
              {shelters.map((shelter) => (
                <Marker
                  key={shelter.shelter_id}
                  coordinate={{
                    latitude: shelter.latitude,
                    longitude: shelter.longitude,
                  }}
                  pinColor="red"
                  title={shelter.name}
                  description={`${shelter.address} / 収容人数: ${shelter.capacity}人`}
                  onPress={() => {
                    setSelectedShelter(shelter);
                    console.log("選択された避難所 onPress:", shelter);
                  }}
                >
                  <Callout
                    onPress={() => {
                      setSelectedShelter(shelter);
                      console.log("選択された避難所 Callout:", shelter);
                    }}
                  >
                    <View>
                      <Text>{shelter.name}</Text>
                      <Text>{shelter.address}</Text>
                      <Text>収容人数: {shelter.capacity}人</Text>
                    </View>
                  </Callout>
                </Marker>
              ))}

              {/* ⑤ ナビの目的地：最優先で表示 */}
              {destination && (
                <Marker
                  key={`shelter-marker-${isOnline ? "online" : "offline"}`}
                  coordinate={destination}
                  pinColor={isOnline ? "red" : "orange"}
                  title="指定避難所"
                  zIndex={15}
                />
              )}
            </>
          )}
        </MapView>

        {/* 到着ポップアップ */}
        {isArrived && (
          <View style={styles.arrivalOverlay}>
            <View style={styles.arrivalCard}>
              <Ionicons name="checkmark-circle" size={60} color="#28c840" />
              <Text style={styles.arrivalTitle}>避難所に到着しました</Text>
              <Text style={styles.arrivalSub}>
                すぐに受付用QRを表示しますか？
              </Text>

              <TouchableOpacity
                style={styles.qrButton}
                onPress={() => {
                  setIsArrived(false);
                  router.push("/my-page");
                }}
              >
                <Text style={styles.qrButtonText}>はい（QRを表示）</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 10 }}
                onPress={() => setIsArrived(false)}
              >
                <Text style={{ color: "#666" }}>地図に戻る</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {mode === MODES.DISASTER && distanceToGoal !== null && (
          <View style={styles.navInfoPanel}>
            <Text style={styles.navLabel}>避難所まであと</Text>
            <View style={styles.distanceRow}>
              <Text style={styles.navDistance}>{distanceToGoal}</Text>
              <Text style={styles.unitText}>m</Text>
            </View>
          </View>
        )}

        {/* ===== ヘッダー ===== */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('../offline-data')}
          >
            <Ionicons name="menu" size={28} color="#333" />
          </TouchableOpacity>

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
                    setShowBottomSheet(false);
                    return;
                  }

                  setSelectedQuickSearch(item.title);

                  if (item.title === '市区役所') {
                    moveToCityHall();
                    setShowBottomSheet(true);
                  }
                }}
              >
                <Text style={styles.quickSearchText}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
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

          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === MODES.NORMAL && styles.activeModeButton
            ]}
            onPress={() => {
              setMode(MODES.NORMAL);
              setShowBottomSheet(false);
            }}
          >
            <Text
              style={[
                styles.modeText,
                mode === MODES.NORMAL && styles.activeModeText
              ]}
            >
              平常
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === MODES.DISASTER && styles.activeModeButton
            ]}
            onPress={() => {
              setMode(MODES.DISASTER);
              setShowBottomSheet(true);

              loadEvacuationPlan();

              setTimeout(() => {
                if (destination) {
                  mapRef.current?.animateToRegion(
                    {
                      latitude: destination.latitude,
                      longitude: destination.longitude,
                      latitudeDelta: 0.003,
                      longitudeDelta: 0.003,
                    },
                    1000
                  );
                }
              }, 500);
            }}
          >
            <Text
              style={[
                styles.modeText,
                mode === MODES.DISASTER && styles.activeModeText
              ]}
            >
              災害
            </Text>
          </TouchableOpacity>
        </View>

        {/* ===== BottomSheet ===== */}
        {showBottomSheet && facilityId && (
          <HomeBottomSheet
            mode={mode}
            officeServices={officeServices}
            loading={loading}
            lastUpdate={lastUpdate}
            onRefresh={fetchOfficeServices}
            selectedShelter={selectedShelter}
            facilityId={facilityId}
          />
        )}

        {/* ===== 詳細モーダル ===== */}
        <Modal visible={showDetail} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.detailModal}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>
                避難所詳細情報
              </Text>
              <Text style={styles.modalText}>
                現在収容人数：12人
              </Text>
              <Text style={styles.modalText}>
                利用可能：毛布・水・食料
              </Text>
              <Text style={styles.modalText}>
                ペット同行可能
              </Text>
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
    width: "100%",
    height: "100%",
    position: "absolute",
  },

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff9c",

    paddingTop: 30,
    paddingBottom: 10,
    paddingHorizontal: 5,

    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },

  quickSearchContainer: {
    position: "absolute",
    top: 85,
    left: 10,
    right: 20,
    flexDirection: "row",
    padding: 6,
  },

  activeQuickSearchButton: {
    backgroundColor: "#d0d0d0",
  },

  quickSearchButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 6,
    backgroundColor: "#ffffff",
    borderRadius: 16,
  },

  quickSearchText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "bold",
  },

  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },

  cardText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    paddingBottom: 10,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontWeight: "bold",
    fontSize: 14,
    color: "#000000",
  },

  numberText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1976d2",
    alignSelf: "flex-end",
  },

  statBox: {
    flex: 1,
    backgroundColor: "#FFEE37",
    padding: 12,
    borderRadius: 12,
    height: 140,
    position: "relative",
  },

  statBox2: {
    flex: 1,
    backgroundColor: "#D9D9D9",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  statValueLeft: {
    position: "absolute",
    bottom: 10,
    left: 13,
    fontSize: 30,
    fontWeight: "bold",
    color: "#000000",
  },

  statTitle: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 0,
    fontWeight: "bold",
    fontSize: 18,
    color: "#000000",
  },

  statValue: {
    position: "absolute",
    bottom: 10,
    left: 10,
    fontSize: 29,
    fontWeight: "bold",
    color: "#1976d2",
  },

  statImage: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 50,
    height: 50,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },

  detailModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: "90%",
  },

  modalHandle: {
    width: 50,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },

  modalText: {
    fontSize: 16,
    marginBottom: 12,
    color: "#444",
  },

  closeButton: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  modeContainer: {
    position: "absolute",
    top: 180,
    left: 20,
    right: 20,
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 6,
    gap: 8,
    elevation: 4,
  },

  modeButton: {
    flex: 1,
    paddingVertical: 1,
    borderRadius: 12,
    alignItems: "center",
  },

  activeModeButton: {
    backgroundColor: "#c1defa",
  },

  modeText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8f8c8c",
  },

  activeModeText: {
    color: "white",
  },

  navInfoPanel: {
    position: "absolute",
    top: 250,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    minWidth: 120,
    elevation: 5,
  },

  navLabel: {
    color: "#ccc",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },

  distanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },

  navDistance: {
    color: "#FFEE37",
    fontSize: 32,
    fontWeight: "bold",
  },

  unitText: {
    color: "#FFEE37",
    fontSize: 14,
    marginLeft: 4,
    fontWeight: "600",
  },

  arrivalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },

  arrivalCard: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    elevation: 10,
  },

  arrivalTitle: { fontSize: 20, fontWeight: "bold", marginVertical: 10 },
  arrivalSub: { fontSize: 14, color: "#666", marginBottom: 20 },

  qrButton: {
    backgroundColor: "#FFEE37",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },

  qrButtonText: { fontWeight: "bold", fontSize: 16 },
});