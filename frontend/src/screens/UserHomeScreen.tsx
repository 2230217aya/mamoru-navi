import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { router } from 'expo-router';
import HomeBottomSheet from '../components/home/HomeBottomSheet';
import 'react-native-reanimated';

import {
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
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
import { useEffect, useState } from 'react';
import EmergencyAlertBanner
  from '../components/home/EmergencyAlertBanner';
// モード
const MODES = {
  NORMAL: 'normal',
  DISASTER: 'disaster',
};

// types
type OfficeService = {
  id: number;
  title: string;
  number: string;
};

// クイック検索アイテム 仮データ*
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
// 平常時施設情報表示 仮データ
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
const [showDetail, setShowDetail] = useState(false);
  // ===== state =====
  const [mode, setMode] = useState(MODES.NORMAL);

  const [officeServices, setOfficeServices] =
    useState<OfficeService[]>([]);

  const [loading, setLoading] = useState(false);

  const [lastUpdate, setLastUpdate] = useState('');

  const [facilityLocation, setFacilityLocation] =
    useState({
      latitude: 34.6937,
      longitude: 135.5023,
    });

  // ===== API =====
  const fetchOfficeServices = async () => {
    try {
      setLoading(true);

      // ===== future API =====
      // const response = await axios.get(...)

      // 仮
      const data = MOCK_OFFICE_SERVICES;

      setOfficeServices(data);

      setLastUpdate(
        new Date().toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );

    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  //初期化
  useEffect(() => {
    fetchOfficeServices();
  }, []);

  return (

  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container}>

      {/* Map */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: facilityLocation.latitude,
          longitude: facilityLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >

        {mode === MODES.NORMAL ? (
          <Marker
            coordinate={facilityLocation}
            title="大阪市役所"
            description="公共施設"
          />
        ) : (
          <Marker
            coordinate={{
              latitude: 34.707500,
              longitude: 135.504684,
            }}
            pinColor="red"
            title="避難所"
            description="開設中"
          />
        )}

      </MapView>

      {/* Header */}
      <View style={styles.header}>

        {/* Menu */}
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

        {/* Search */}
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

        {/* MyPage */}
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

      {/* ===== 平常 / 災害 切換區 ===== */}
      {mode === MODES.NORMAL ? (

        // ===== 平常模式：Quick Search =====
        <View style={styles.quickSearchContainer}>

          {QUICK_SEARCH_ITEMS.map((item) => (

            <TouchableOpacity
              key={item.id}
              style={styles.quickSearchButton}
            >
              <Text style={styles.quickSearchText}>
                {item.title}
              </Text>
            </TouchableOpacity>

          ))}

        </View>

      ) : (

        // ===== 災害模式：警報 =====
        <EmergencyAlertBanner

          level="5"
          title="緊急地震速報"
          message="大阪府北部で地震発生"
          levelText="震度5弱"

        />

      )}
      {/* モード切替 // 開発環境のみ表示　start */}
      <View style={styles.modeContainer}>

        <Text style={styles.modeText}>
          開発環境のみ表示
        </Text>

        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === MODES.NORMAL &&
              styles.activeModeButton
          ]}
          onPress={() => setMode(MODES.NORMAL)}
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

        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === MODES.DISASTER &&
              styles.activeModeButton
          ]}
          onPress={() => setMode(MODES.DISASTER)}
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
      {/* 開発環境のみ表示　end*/}

     


      {/* 下の情報欄 start*/}
      <HomeBottomSheet
          mode={mode}
          officeServices={officeServices}
          loading={loading}
          lastUpdate={lastUpdate}
          onRefresh={fetchOfficeServices}
        />
              {/* 下の情報欄 end */}
        <Modal
          visible={showDetail}
          transparent
          animationType="slide"
        >
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