//frontend\src\screens\UserHomeScreen.tsx
// ===== アイコン =====
import { Ionicons } from "@expo/vector-icons";

// ===== 地図 =====
import MapView, { Marker, Polyline, UrlTile } from "react-native-maps";

// ===== 画面遷移 =====
import { router } from "expo-router";

// ===== BottomSheet =====
import HomeBottomSheet from "../components/home/HomeBottomSheet";

// ===== Reanimated =====
import "react-native-reanimated";

// ===== Gesture Handler =====
import { GestureHandlerRootView } from "react-native-gesture-handler";

// タイル保存先確認用
import { documentDirectory } from "expo-file-system";

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
} from "react-native";

// ===== React =====
import { useEffect, useState, useRef } from "react";

// ===== 災害警報バナー =====
import EmergencyAlertBanner from "../components/home/EmergencyAlertBanner";

// --- SQLite ---
import { LocalDB } from "@/src/db/database";
import { convertGeoJsonToMapPoints } from "@/src/utils/mapUtils";

import Constants from "expo-constants";

// ===== ネットワーク状態 =====
import * as Network from "expo-network";

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

// ===== クイック検索用の仮データ =====
const QUICK_SEARCH_ITEMS = [
  {
    id: 1,
    title: "市区役所",
  },
  {
    id: 2,
    title: "図書館",
  },
  {
    id: 3,
    title: "体育館",
  },
];

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

// コンポーネント自体を any でキャストして使う
const RootView = GestureHandlerRootView as any;

export default function UserHome() {
  // ===== 詳細モーダル表示状態 =====
  const [showDetail, setShowDetail] = useState(false);

  // ===== BottomSheet表示状態 =====
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  // ===== 選択されたクイック検索 =====
  const [selectedQuickSearch, setSelectedQuickSearch] = useState<string | null>(
    null,
  );
  // ===== 現在モード =====
  const [mode, setMode] = useState(MODES.NORMAL);

  // ===== 施設サービス一覧 =====
  const [officeServices, setOfficeServices] = useState<OfficeService[]>([]);

  // ===== MapView参照 =====
  const mapRef = useRef<MapView | null>(null);

  // ===== ローディング状態 =====
  const [loading, setLoading] = useState(false);

  // ===== 最終更新時刻 =====
  const [lastUpdate, setLastUpdate] = useState("");

  // ===== 施設位置 =====
  const [facilityLocation, setFacilityLocation] = useState({
    latitude: 34.6937,
    longitude: 135.5023,
  });

  // ===== 現在地・避難所・ルートを「状態」として定義 =====
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]); // これで setRouteCoordinates が使えるようになります

  // オフライン地図タイルの保存先ディレクトリ
  const TILE_PATH = `${documentDirectory || ""}tiles/{z}/{x}/{y}.png`;

  const [origin, setOrigin] = useState({
    latitude: 34.706443,
    longitude: 135.503214,
  });

  const [destination, setDestination] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [routeSource, setRouteSource] = useState("");

  // ===== 現在地から避難所までの残り距離を画面上に表示・管理するための状態 =====
  const [distanceToGoal, setDistanceToGoal] = useState<number | null>(null);

  // ===== 避難所到着判定 =====
  const [isArrived, setIsArrived] = useState(false);

  // ===== ネットワーク状態 =====
  const [isOnline, setIsOnline] = useState(true);

  // ===== API取得 =====
  const fetchOfficeServices = async () => {
    try {
      // ===== ローディング開始 =====
      setLoading(true);

      // ===== 今後API接続予定 =====
      // const response = await axios.get(...)

      // ===== 仮データ使用 =====
      const data = MOCK_OFFICE_SERVICES;

      setOfficeServices(data);

      // ===== 更新時間保存 =====
      setLastUpdate(
        new Date().toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch (error) {
      // ===== エラー表示 =====
      console.log(error);
    } finally {
      // ===== ローディング終了 =====
      setLoading(false);
    }
  };

  // ===== ★ オフライン避難計画の読み込み関数 =====
  // frontend/src/screens/UserHomeScreen.tsx

  // frontend/src/screens/UserHomeScreen.tsx

  const loadEvacuationPlan = async () => {
    setRouteCoordinates([]);
    setDestination(null);

    const testUserId = "test-user-id-1234";
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localIp = debuggerHost ? debuggerHost.split(":")[0] : "localhost";
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || `http://${localIp}:8000`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // タイムアウトを3秒に少し伸ばす

    try {
      console.log("📡 [LOG] 取得開始...");
      const response = await fetch(`${baseUrl}/map/my-plan/${testUserId}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("API ERROR");

      const data = await response.json();

      if (data.status === "success" && data.plan.route_data) {
        console.log("✅ オンライン成功");
        setIsOnline(true); // ★ ここでオンラインを確定
        const points = convertGeoJsonToMapPoints(data.plan.route_data);
        setRouteCoordinates(points);
        if (points.length > 0) setDestination(points[points.length - 1]);
        await LocalDB.saveMyEvacuationPlan(data.plan);
        return;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.log("⚠️ SQLiteモードへ強制移行");
      setIsOnline(false); // ★ APIに失敗した＝オフライン扱いにする

      const cachedPlan = await LocalDB.getMyEvacuationPlan(testUserId);
      if (cachedPlan && cachedPlan.route_data) {
        const points = convertGeoJsonToMapPoints(cachedPlan.route_data);
        setRouteCoordinates(points);
        if (points.length > 0) setDestination(points[points.length - 1]);
        console.log("✅ オフライン表示成功");
      }
    }
  };

  // ===== 初期読み込み =====
  useEffect(() => {
    fetchOfficeServices();
  }, []);

  useEffect(() => {
    const check = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsOnline(state.isConnected && state.isInternetReachable);
    };
    check();
  }, [mode]); // モード切替時にネットワークも再確認

  useEffect(() => {
    // 災害モードで、かつ現在地と目的地が両方あるときだけ計算する
    if (mode === MODES.DISASTER && destination && origin) {
      const { getDistance } = require("@/src/utils/mapUtils"); // 以前作った関数を呼ぶ

      const dist = getDistance(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude,
      );

      // 計算した距離(メートル)をStateに入れる
      setDistanceToGoal(Math.round(dist));

      // 到着判定：50m以内 かつ まだモーダルを出していない場合
      if (dist < 50 && !isArrived) {
        setIsArrived(true);
      }
    } else {
      // 災害モードじゃないときはリセット
      setDistanceToGoal(null);
    }
  }, [origin, destination, mode]); // origin, destination, mode が変わるたびに動く

  // ===== 市区役所へ移動 =====
  const moveToCityHall = () => {
    mapRef.current?.animateToRegion(
      {
        latitude: 34.6937,
        longitude: 135.5023,

        // ===== 地図拡大率 =====
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      },
      1000,
    );
  };

  return (
    <RootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* ===== 地図 ===== */}
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: facilityLocation.latitude,
            longitude: facilityLocation.longitude,

            // ===== 初期地図拡大率 =====
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          }}
        >
          {/* オフライン用の地図背景設定 */}
          <UrlTile
            /**
             * isOnline が true ならネットから最新タイルを。
             * fetch が失敗して isOnline が false になったらスマホ内のタイルを探しに行きます。
             */
            urlTemplate={
              mode === MODES.DISASTER && !isOnline
                ? `file://${TILE_PATH}`
                : "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
            zIndex={-1}
            tileSize={256}
          />

          {mode === MODES.NORMAL ? (
            // ===== 平常モード施設マーカー =====
            <Marker
              coordinate={facilityLocation}
              title="大阪市役所"
              description="公共施設"
            />
          ) : (
            <>
              {/* ===== 現在地マーカー ===== */}
              <Marker
                coordinate={origin}
                title="現在地"
                description="ユーザー位置"
              />

              {/* ===== 避難所マーカー ===== */}
              {mode === MODES.DISASTER && destination && (
                <Marker
                  coordinate={destination}
                  // isOnline が false になっていればオレンジになるはずです
                  pinColor={isOnline ? "red" : "orange"}
                  title="避難所"
                  description={isOnline ? "最新情報" : "オフラインデータ"}
                />
              )}

              {/* ===== 現在地から避難ルート入口までの誘導線（点線） ===== */}
              {/* 災害モードで、かつ現在地とルートデータが両方ある場合のみ表示 */}
              {mode === MODES.DISASTER && routeCoordinates.length > 0 && (
                <Polyline
                  coordinates={[origin, routeCoordinates[0]]} // 現在地から、保存済みルートの1点目を結ぶ
                  strokeColor="#888" // 目立ちすぎないグレー
                  strokeWidth={3}
                  lineDashPattern={[5, 5]} // 点線にする設定
                />
              )}

              {/* ===== 避難ルート ===== */}
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#ff3b30"
                strokeWidth={5}
              />
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
          // ===== 平常モード：クイック検索 =====
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

                    setShowBottomSheet(false);

                    return;
                  }

                  setSelectedQuickSearch(item.title);

                  if (item.title === "市区役所") {
                    moveToCityHall();

                    setShowBottomSheet(true);
                  }
                }}
              >
                <Text style={styles.quickSearchText}>{item.title}</Text>
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

        {/* ===== BottomSheet ===== */}
        {showBottomSheet && (
          <HomeBottomSheet
            mode={mode}
            officeServices={officeServices}
            loading={loading}
            lastUpdate={lastUpdate}
            onRefresh={fetchOfficeServices}
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
    top: 170, // モード切替コンテナの下あたりに配置
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.75)", // 半透明の黒
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
});
// 開発環境のみ表示　end
