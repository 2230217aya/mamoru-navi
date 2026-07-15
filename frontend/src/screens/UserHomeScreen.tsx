//frontend\src\screens\UserHomeScreen.tsx
// ===== アイコン =====
import { Ionicons } from "@expo/vector-icons";

// ===== 地図 =====
import MapView, { Marker, Polyline, UrlTile, Callout } from "react-native-maps";

// ===== 画面遷移 =====
import { router } from "expo-router";

// ===== BottomSheet =====
import HomeBottomSheet from "../components/home/HomeBottomSheet";

import Constants from "expo-constants";

// ===== Reanimated =====
import "react-native-reanimated";

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

// ===== モード定義 =====
const MODES = {
  NORMAL: "normal",
  DISASTER: "disaster",
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

// クイック検索用定数
const TYPE_MAP: Record<string, string> = {
  市区役所: "city_hall",
  図書館: "library",
  体育館: "gym",
};

const QUICK_SEARCH_ITEMS = [
  { id: 1, title: "市区役所" },
  { id: 2, title: "図書館" },
  { id: 3, title: "体育館" },
];

// コンポーネント自体を any でキャストして使う
const RootView = GestureHandlerRootView as any;

// ===== 平常時施設情報の仮データ =====
const MOCK_OFFICE_SERVICES: OfficeService[] = [
  {
    id: 1,
    title: "証明書の発行",
    number: "22",
  },
  {
    id: 2,
    title: "住所の変更・印鑑登録",
    number: "57",
  },
  {
    id: 3,
    title: "マイナンバー",
    number: "132",
  },
  {
    id: 4,
    title: "戸籍の提出・相談",
    number: "12",
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
  // 2. 平常モード用
  // ---------------------------------------------------------
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null,
  );
  const [officeServices, setOfficeServices] = useState<OfficeService[]>([]);

  // ---------------------------------------------------------
  // 3. 災害モード用
  // ---------------------------------------------------------
  const [isOnline, setIsOnline] = useState(true);
  const [origin, setOrigin] = useState({
    latitude: 34.7064406, // 修正
    longitude: 135.5037224, // 修正
  });
  const [destination, setDestination] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [distanceToGoal, setDistanceToGoal] = useState<number | null>(null);
  const [isArrived, setIsArrived] = useState(false);
  const [heading, setHeading] = useState<number>(0);
  const [nearShelters, setNearShelters] = useState<Shelter[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(
    null,
  );

  // 地図参照・パス
  const mapRef = useRef<MapView | null>(null);
  const TILE_DIR = (ExpoFileSystem as any).documentDirectory?.endsWith("/")
    ? (ExpoFileSystem as any).documentDirectory
    : `${(ExpoFileSystem as any).documentDirectory}/`;
  const TILE_PATH = `${TILE_DIR}tiles/{z}/{x}/{y}.png`;

  // ---------------------------------------------------------
  // 4. API通信関数（統合分）
  // ---------------------------------------------------------

  // 【平常】施設リストの取得（getBaseUrlを使用）
  const fetchFacilities = async (type?: string | null) => {
    try {
      setLoading(true);
      const baseUrl = getBaseUrl();
      const url = type
        ? `${baseUrl}/facilities?type=${encodeURIComponent(type)}`
        : `${baseUrl}/facilities`;

      const response = await fetch(url, { headers: API_HEADERS });
      const data = await response.json();
      setFacilities(data);

      if (mode === MODES.NORMAL && data.length > 0) {
        // 少し遅延させてFitさせる
        setTimeout(() => fitFacilities(data), 300);
      }
    } catch (e) {
      console.log("❌ 施設取得エラー:", e);
    } finally {
      setLoading(false);
    }
  };

  // 【平常】施設内サービス情報の取得
  const fetchOfficeServices = async (facilityId?: string) => {
    try {
      if (!facilityId) return;
      setLoading(true);
      const baseUrl = getBaseUrl();
      const res = await fetch(
        `${baseUrl}/facilities/${facilityId}/office-services`,
        { headers: API_HEADERS },
      );
      const data = await res.json();
      setOfficeServices(data);
      setLastUpdate(
        new Date().toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch (error) {
      console.log("❌ サービス情報取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const fitFacilities = (list: Facility[]) => {
    if (list.length === 0) return;
    mapRef.current?.fitToCoordinates(
      list.map((f) => ({ latitude: f.latitude, longitude: f.longitude })),
      {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      },
    );
  };

  // ---------------------------------------------------------
  // 5. API通信関数（既存の災害ロジック維持）
  // ---------------------------------------------------------
  const fetchShelters = async () => {
    /* 既存のコードをそのまま配置 */
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/shelters/`, {
        method: "GET",
        headers: API_HEADERS,
      });
      if (response.ok) {
        const data = await response.json();
        setShelters(data);
      }
    } catch (e) {}
  };

  /**
   * 災害時：避難計画（ルート）の取得
   * オンライン時：Google Directions API でのルート
   * オフライン時：SQLiteから直近のバックアップを抽出
   */
  const loadEvacuationPlan = async (destinationStr?: string) => {
    setRouteCoordinates([]);
    setDestination(null);

    const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || "";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // ：関数全体で使う目的地の座標
    let finalTargetLat: number | null = null;
    let finalTargetLng: number | null = null;

    try {
      console.log("🌐 Google Maps への接続を試行中...");

      let targetDest = destinationStr;

      // 自動決定ロジック
      if (!targetDest) {
        if (nearShelters && nearShelters.length > 0) {
          const firstShelter = nearShelters[0];
          targetDest = `${firstShelter.latitude},${firstShelter.longitude}`;
          setSelectedShelterId(firstShelter.shelter_id);
          setSelectedShelter(firstShelter);
        } else if (shelters.length > 0) {
          const sorted = [...shelters].sort((a, b) => {
            return (
              getDistance(
                origin.latitude,
                origin.longitude,
                a.latitude,
                a.longitude,
              ) -
              getDistance(
                origin.latitude,
                origin.longitude,
                b.latitude,
                b.longitude,
              )
            );
          });
          targetDest = `${sorted[0].latitude},${sorted[0].longitude}`;
          setSelectedShelterId(sorted[0].shelter_id);
          setSelectedShelter(sorted[0]);
        }
      }

      // 目的地の座標を確定（オフライン検索用）
      if (targetDest) {
        const [lat, lng] = targetDest.split(",").map(Number);
        finalTargetLat = lat;
        finalTargetLng = lng;
      }

      console.log(`📍 最終的な目的地: ${finalTargetLat}, ${finalTargetLng}`);

      const requestUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${targetDest}&mode=walking&key=${GOOGLE_API_KEY}`;
      const response = await fetch(requestUrl, { signal: controller.signal });
      const data = await response.json();

      if (data.status === "OK") {
        console.log("✅ Google API 成功");
        const points = decodeGooglePolyline(
          data.routes[0].overview_polyline.points,
        );
        setIsOnline(true);
        setRouteCoordinates(points);
        if (points.length > 0) setDestination(points[points.length - 1]);

        try {
          // ★ 修正：IDを目的地ベースにして重複を避ける（データ爆発防止）
          const destId = `target_${finalTargetLat?.toFixed(4)}_${finalTargetLng?.toFixed(4)}`;
          await LocalDB.saveMyEvacuationPlan({
            plan_id: destId,
            user_id: "11111111-1111-1111-1111-111111111111",
            route_data: {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: points.map((p) => [p.longitude, p.latitude]),
              },
            },
          });
          console.log("✅ SQLiteに保存完了");
        } catch (dbError) {
          console.error("❌ SQLite保存エラー:", dbError);
        }
        clearTimeout(timeoutId);
        return;
      } else {
        throw new Error(`Google API Status: ${data.status}`);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.log("⚠️ オフライン：最適なルートをSQLiteから検索中...");
      setIsOnline(false);

      const cachedPlans = await LocalDB.getAllSavedPlans();
      if (!cachedPlans || cachedPlans.length === 0) return;

      let bestPlan: any = null;
      let minScore = Infinity;

      console.log(
        `📊 検索キーとなる座標: ${finalTargetLat}, ${finalTargetLng}`,
      );

      cachedPlans.forEach((plan: any) => {
        const coords = plan.route_data?.geometry?.coordinates;
        if (coords && coords.length > 0) {
          const routeEnd = {
            latitude: coords[coords.length - 1][1],
            longitude: coords[coords.length - 1][0],
          };

          let score = 0;
          let distToEnd = 0;

          // ★ 修正：finalTargetLat を使って目的地の一致を判定
          if (finalTargetLat !== null && finalTargetLng !== null) {
            distToEnd = getDistance(
              finalTargetLat,
              finalTargetLng,
              routeEnd.latitude,
              routeEnd.longitude,
            );
            if (distToEnd > 200) {
              score += 1000000; // 全く別の避難所行きならペナルティ
            } else {
              score += distToEnd * 100;
            }
          }

          const distFromMe = getDistance(
            origin.latitude,
            origin.longitude,
            coords[0][1],
            coords[0][0],
          );
          score += distFromMe;

          if (score < minScore) {
            minScore = score;
            bestPlan = plan;
          }
        }
      });

      if (bestPlan) {
        const points = convertGeoJsonToMapPoints(
          bestPlan.route_data.geometry || bestPlan.route_data,
        );
        console.log(
          `✅ [Offline] 最適プラン確定 (Score: ${minScore.toFixed(0)})`,
        );
        setRouteCoordinates(points);
        if (points.length > 0) setDestination(points[points.length - 1]);

        // ★ ここに追加：現在地にアニメーションで移動
        mapRef.current?.animateToRegion(
          {
            latitude: origin.latitude,
            longitude: origin.longitude,
            latitudeDelta: 0.003, // ナビしやすいズーム倍率
            longitudeDelta: 0.003,
          },
          1000, // 1秒かけて移動
        );
      }
    }
  };

  // ---------------------------------------------------------
  // 6. 地図・イベント処理
  // ---------------------------------------------------------
  const handleSelectShelter = (shelter: Shelter) => {
    setSelectedShelterId(shelter.shelter_id);
    setSelectedShelter(shelter);
    const dest = `${shelter.latitude},${shelter.longitude}`;
    loadEvacuationPlan(dest);
    mapRef.current?.animateToRegion(
      {
        latitude: shelter.latitude,
        longitude: shelter.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      1000,
    );
  };

  // ---------------------------------------------------------
  // 7. 副作用監視
  // ---------------------------------------------------------
  useEffect(() => {
    fetchFacilities(null); // 平常時施設の初期読み込み
    fetchShelters();
    loadEvacuationPlan();
  }, []);

  // B. ネットワーク状態の監視
  useEffect(() => {
    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsOnline(!!(state.isConnected && state.isInternetReachable));
    };
    checkNetwork();
  }, [mode]); // モード切替時にネットワークも再確認

  // C. 災害時の動的HUD・距離更新（1秒毎や移動毎に発火）
  useEffect(() => {
    if (mode !== MODES.DISASTER || !destination || !origin) {
      setDistanceToGoal(null);
      return;
    }

    const { getDistance } = require("@/src/utils/mapUtils");
    const dist = getDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude,
    );
    const roundedDist = Math.round(dist);

    setDistanceToGoal(roundedDist);

    // 到着判定：一度切りだけ発動
    if (roundedDist < 50 && !isArrived) {
      setIsArrived(true);
    }
  }, [origin, destination, mode, isArrived]);

  //D. 自分から近い上位3つの避難所を自動抽出する
  useEffect(() => {
    console.log("🔍 nearShelters計算開始: shelters件数=", shelters.length);

    if (shelters && shelters.length > 0 && origin) {
      const sorted = [...shelters]
        .map((s) => ({
          ...s,
          distance: getDistance(
            origin.latitude,
            origin.longitude,
            s.latitude,
            s.longitude,
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3); // 近い順3つを抽出

      console.log("📍 nearShelters を更新しました:", sorted.length, "件");
      setNearShelters(sorted);
    }
  }, [shelters, origin]); // <--- 避難所データが届いた時、または現在地が動いた時に再計算

  // Ⅾ. デバイスの向き（コンパス）監視
  useEffect(() => {
    let headingSubscription: any;

    const startHeadingWatch = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      // デバイスのコンパス（磁気センサー）を監視
      headingSubscription = await Location.watchHeadingAsync(
        (data: Location.LocationHeadingObject) => {
          // コンパスの角度をStateに保存
          setHeading(data.trueHeading);
        },
      );
    };

    startHeadingWatch();

    // クリーンアップ処理
    return () => {
      if (headingSubscription) {
        headingSubscription.remove();
      }
    };
  }, []);

  // E. 現在地の監視（1秒ごと or 1m移動ごと）
  useEffect(() => {
    let locationSubscription: any;

    const startLocationTracking = async () => {
      // 1. 権限チェック
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("位置情報の権限がありません");
        return;
      }

      // 2. 位置情報の継続監視（1秒ごと or 1m移動ごとに発動）
      locationSubscription = await Location.watchPositionAsync(
        {
          // 避難用なので高精度モード
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 10000, // 10000ミリ秒ごとに更新
          distanceInterval: 3, // 3メートル移動するごとに更新
        },
        (location: Location.LocationObject) => {
          // ★ ここで origin ステートを更新する！
          const newCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setOrigin(newCoords); // これでHUDの距離や点線がリアルタイムに動きます
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

  // 災害ルート計算ロジック
  // 試しにカットせず、全ルートをそのまま表示させてみる
  const nearestIdx = findNearestPointIndex(origin, routeCoordinates);
  // 重要：nearestIdxより後ろ（避難所側）だけを抽出。
  // これにより、自分の背後にある「余計な線」が消えます。
  const remainingRoute =
    nearestIdx !== -1 ? routeCoordinates.slice(nearestIdx) : routeCoordinates;
  // ---------------------------------------------------------
  // 8. 描画 (Render)
  // ---------------------------------------------------------

  return (
    <RootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* 開発確認用タグ */}

        {/* ===== 地図本体 ===== */}
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: 34.6937,
            longitude: 135.5023,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          // ★ ここから下が「ナビ仕様」の設定
          showsCompass={true} // 地図が回転したときにコンパス（指針）を表示
          rotateEnabled={true} // 2本指での地図回転を許可
          pitchEnabled={true} // 2本指でスワイプして地図を傾ける(3D表示)を許可
          scrollEnabled={true} // 地図のスクロールを許可
          showsUserLocation={false} // 自作の「回転する矢印」を使うので、標準の青丸は消す
          followsUserLocation={false} // ★ 勝手に地図が動かないように(手動操作を優先)
          showsMyLocationButton={true} // ★ 右下に「現在地へ戻る」ボタンを出す
          mapPadding={{ top: 50, right: 10, bottom: 10, left: 10 }} // UIに重ならないよう調整
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
            // ===== 2. 平常モード：施設マーカー =====
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
                      500,
                    );
                  }}
                />
              ))}
            </>
          ) : (
            // ===== 3. 災害モード：ナビゲーション表示（複数重ねる） =====
            <>
              {/* ① [線] 避難ルート本体：remainingRoute（自分より先）だけを表示 */}
              {remainingRoute.length > 0 && (
                <Polyline
                  coordinates={remainingRoute} // routeCoordinates を remainingRoute に変更
                  strokeColor={isOnline ? "#ff3b30" : "#E67E22"}
                  strokeWidth={6}
                  zIndex={50}
                />
              )}

              {/* ② [線] 【誘導ロジック】現在地からルート入口までの「動く点線」 */}
              {destination && (
                <Polyline
                  coordinates={[
                    origin, // 現在地
                    // remainingRouteの先頭（＝今一番近い場所）へ結ぶ
                    remainingRoute[0] || destination,
                  ]}
                  strokeColor={isOnline ? "#007AFF" : "#FF9500"} // オフラインはオレンジ
                  strokeWidth={5}
                  lineDashPattern={[6, 6]}
                  zIndex={6}
                />
              )}

              {/* ③ [点] 現在地マーカー */}
              <Marker
                coordinate={origin}
                anchor={{ x: 0.5, y: 0.5 }} // 中心を軸に回転させる
                flat={true} // 地図を傾けてもマーカーが垂直に立たないようにする
                zIndex={10}
              >
                {/* ★ ここから中身をカスタムアイコンに変更 ★ */}
                <View style={{ transform: [{ rotate: `${heading}deg` }] }}>
                  {/* navigation アイコンは三角形の矢印なので、方位表示に最適です */}
                  <Ionicons name="navigate" size={32} color="#007AFF" />
                </View>
              </Marker>

              {/* ④ [点] 周辺の避難所リスト */}
              {/* ===== 避難所マーカー ===== */}
              {shelters.map((shelter) => {
                // ★ 追加：今の shelter が「目的地(destination)」と同じ座標かチェック
                // 誤差を考慮して完全に一致するか、目的地が存在しない場合のみ描画
                const isTarget =
                  destination &&
                  Math.abs(shelter.latitude - destination.latitude) < 0.0001 &&
                  Math.abs(shelter.longitude - destination.longitude) < 0.0001;

                // すでに「⑤」で描画するので、ここではスキップ（nullを返す）
                if (isTarget) return null;

                return (
                  <Marker
                    key={shelter.shelter_id}
                    coordinate={{
                      latitude: shelter.latitude,
                      longitude: shelter.longitude,
                    }}
                    pinColor="red" // 目的地以外のピン
                    title={shelter.name}
                    onPress={() => handleSelectShelter(shelter)}
                  >
                    <Callout>
                      <View style={{ padding: 5 }}>
                        <Text style={{ fontWeight: "bold" }}>
                          {shelter.name}
                        </Text>
                        <Text style={{ fontSize: 12 }}>
                          収容人数: {shelter.capacity}人
                        </Text>
                      </View>
                    </Callout>
                  </Marker>
                );
              })}

              {/* ⑤ [点] ★ナビの目的地：最優先で表示 */}
              {destination && (
                <Marker
                  key={`shelter-marker-${isOnline ? "online" : "offline"}`}
                  coordinate={destination}
                  // ★ 目的地は青や特別な色にすると分かりやすい（お好みで！）
                  // pinColor={isOnline ? "#007AFF" : "#FF9500"}
                  pinColor={isOnline ? "blue" : "orange"}
                  title="目的地"
                  zIndex={15}
                  flat={false}
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
          {/* ===== メニューボタン ===== */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("../offline-data")}
          >
            <Ionicons name="menu" size={28} color="#333" />
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
            onPress={() => router.push("../my-page")}
          >
            <Image
              source={require("../../assets/images/userpage.png")}
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
                    styles.activeQuickSearchButton,
                ]}
                onPress={() => {
                  if (selectedQuickSearch === item.title) {
                    setSelectedQuickSearch(null);
                    fetchFacilities(null);
                    setShowBottomSheet(false);
                  } else {
                    setSelectedQuickSearch(item.title);
                    fetchFacilities(TYPE_MAP[item.title]);
                    setSelectedFacility(null);
                    setShowBottomSheet(false);
                  }
                }}
              >
                <Text style={styles.quickSearchText}>{item.title}</Text>
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
          <Text style={styles.modeText}>開発環境のみ表示</Text>

          {/* ===== 平常モードボタン ===== */}
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === MODES.NORMAL && styles.activeModeButton,
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
                mode === MODES.NORMAL && styles.activeModeText,
              ]}
            >
              平常
            </Text>
          </TouchableOpacity>

          {/* ===== 災害モードボタン ===== */}
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === MODES.DISASTER && styles.activeModeButton,
            ]}
            onPress={() => {
              console.log("👆 災害ボタンが押されました");
              // ===== 災害モードへ変更 =====
              setMode(MODES.DISASTER);

              // ===== BottomSheet表示 =====
              setShowBottomSheet(true);

              // 1. オンライン/オフライン自動判別のルート読み込みを実行
              loadEvacuationPlan();

              // ===== 避難所へ移動 =====
              // 2. 少し遅延させてから（座標がセットされてから）移動
              setTimeout(() => {
                if (destination) {
                  mapRef.current?.animateToRegion(
                    {
                      latitude: destination.latitude,
                      longitude: destination.longitude,
                      latitudeDelta: 0.003,
                      longitudeDelta: 0.003,
                    },
                    1000,
                  );
                }
              }, 500);
            }}
          >
            <Text
              style={[
                styles.modeText,
                mode === MODES.DISASTER && styles.activeModeText,
              ]}
            >
              災害
            </Text>
          </TouchableOpacity>
        </View>

        {/* 災害時：避難所選択リスト */}
        {/* 災害時：避難所選択エリア */}
        {mode === MODES.DISASTER && nearShelters.length > 0 && (
          <View style={styles.shelterSelectorWrapper}>
            {!selectedShelterId ? (
              /* --- 1. 未選択：3枚の避難所カードを表示 --- */
              <>
                <Text style={styles.selectorTitle}>
                  避難所を選択してください
                </Text>
                <View style={{ height: 160 }}>
                  <Animated.ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 10, gap: 12 }}
                  >
                    {nearShelters.map((item) => (
                      <TouchableOpacity
                        key={item.shelter_id}
                        style={styles.shelterCard}
                        onPress={() => handleSelectShelter(item)}
                      >
                        <View style={styles.shelterCardHeader}>
                          <Text
                            style={styles.shelterCardName}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                        </View>
                        <View style={styles.shelterCardTags}>
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>
                              収容:{item.capacity}人
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.selectBtnText}>ここへ行く →</Text>
                      </TouchableOpacity>
                    ))}
                  </Animated.ScrollView>
                </View>
              </>
            ) : (
              /* --- 2. 選択済み：ルート案内に集中するため「変更ボタン」だけ表示 --- */
              <TouchableOpacity
                style={styles.changeShelterButton}
                onPress={() => {
                  setSelectedShelterId(null); // IDを消すことで、また3枚のカードが出る
                  setSelectedShelter(null);
                  // ルートは消さずに残しておきたい場合は clear しなくてもOK
                }}
              >
                <Ionicons name="swap-horizontal" size={20} color="#007AFF" />
                <Text style={styles.changeBtnText}>避難先を変更する</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ===== BottomSheet ===== */}
        {showBottomSheet && (
          <HomeBottomSheet
            mode={mode}
            selectedShelter={selectedShelter}
            selectedFacility={selectedFacility}
            officeServices={officeServices}
            loading={loading}
            lastUpdate={lastUpdate}
            onRefresh={(facilityId) => fetchOfficeServices(facilityId)}
            visible={showBottomSheet}
            onClose={() => setShowBottomSheet(false)}
          />
        )}

        {/* ===== 詳細モーダル ===== */}
        <Modal visible={showDetail} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.detailModal}>
              {/* ===== モーダルハンドル ===== */}
              <View style={styles.modalHandle} />

              {/* ===== タイトル ===== */}
              <Text style={styles.modalTitle}>避難所詳細情報</Text>

              {/* ===== 情報 ===== */}
              <Text style={styles.modalText}>現在収容人数：12人</Text>

              <Text style={styles.modalText}>利用可能：毛布・水・食料</Text>

              <Text style={styles.modalText}>ペット同行可能</Text>

              {/* ===== 閉じるボタン ===== */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetail(false)}
              >
                <Text style={styles.closeButtonText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </RootView>
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
  // ヘッダー
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
  //ヘッダーのicon
  iconButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  //検索欄
  searchContainer: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#ffffff",

    borderRadius: 24,

    paddingHorizontal: 14,

    height: 48,

    shadowColor: "#000",

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
    color: "#333",
  },
  // クイック検索アイテム
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

  //下の情報欄
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
    fontWeight: "bold",

    marginBottom: 8,
  },
  //施設説明
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
    color: "#666",
  },

  reserveButton: {
    backgroundColor: "#FFEE37",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    width: "30%",
    alignItems: "center",
  },

  reserveButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "600",
  },

  detailLink: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },

  updateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },

  updateText: {
    fontSize: 12,
    color: "#888",
  },
  refreshButton: {
    padding: 4,
  },

  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  usuallystatBox: {
    flex: 1,
    backgroundColor: "#eeeeee",
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
  //移動中・収容されるテキスト
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

  // モード切替
  // 開発環境のみ表示　start
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
    top: 250, // ★170から250くらいに下げると、開発ボタン(180)の下に綺麗に並びます
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
    color: "#FFEE37", // 警告色と同じ黄色
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
  shelterSelectorWrapper: {
    position: "absolute",
    bottom: 300,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },

  changeBtnText: {
    color: "#007AFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  selectorTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    alignSelf: "flex-start", // タイトルは左寄せ
    marginLeft: 20,
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  changeShelterButton: {
    backgroundColor: "white",
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
    gap: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginBottom: 20, // 少し上に浮かせる
  },
  shelterCard: {
    width: 260,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedShelterCard: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f7ff",
  },
  shelterCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  shelterCardName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  shelterCardSub: {
    fontSize: 12,
    color: "#777",
    marginBottom: 8,
  },
  shelterCardTags: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: "#666",
  },
  selectBtnText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "bold",
    textAlign: "right",
  },
});
// 開発環境のみ表示　end
