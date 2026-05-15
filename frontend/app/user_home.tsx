import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { router } from 'expo-router';

import {
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  Image,
} from 'react-native';
import { useState } from 'react';

export default function UserHome() {
  const [mode, setMode] = useState('normal');
{/* クイック検索アイテム 仮データ*/}
  const quickSearchItems = [
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
 {/* 平常時施設情報表示 仮データ*/}
 const officeServices = [
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
  return (
    <SafeAreaView style={styles.container}>

      {/* Map 仮データ*/}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 34.6937,
          longitude: 135.5023,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {mode === 'normal' ? (

        <Marker
          coordinate={{
            latitude: 34.6937,
            longitude: 135.5023,
          }}
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
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="menu" size={28} color="#333" />
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
        onPress={() => router.push('/user_profile')}>
          <Image
          source={require('../assets/images/userpage.png')}
          style={{ width: 32, height: 32 }}
        />
        </TouchableOpacity>

      </View>
        {/*クイック検索アイテム*/}
            <View style={styles.quickSearchContainer}>

        {quickSearchItems.map((item) => (

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
        {/* モード切替
        // 開発環境のみ表示　start */}
      <View style={styles.modeContainer}>
      <Text style={styles.modeText}>開発環境のみ表示</Text>
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === 'normal' && styles.activeModeButton
          ]}
          onPress={() => setMode('normal')}
        >
          <Text
            style={[
              styles.modeText,
              mode === 'normal' && styles.activeModeText
            ]}
          >
            平常
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === 'disaster' && styles.activeModeButton
          ]}
          onPress={() => setMode('disaster')}
        >
          <Text
            style={[
              styles.modeText,
              mode === 'disaster' && styles.activeModeText
            ]}
          >
            災害
          </Text>
        </TouchableOpacity>

      </View>
      {/*  開発環境のみ表示　end*/}

      {/* 下の情報欄 start*/}
      <View style={styles.bottomCard}>
        <Text style={styles.cardTitle}>

        {mode === 'normal'
          ? '大阪市役所'
          : '避難所状況'}

      </Text>
      

      <Text style={styles.cardText}>

        {mode === 'normal'
          ? '営業時間: 9:00~17:00'
          : '○○避難所'}

      </Text>
      
      {/* 平常時施設情報表示 */}
  {mode === 'normal' ? (
    <View style={styles.usuallystatBox}>
      {officeServices.map((item) => (
        <View key={item.id} style={styles.rowItem}>
          <Text style={styles.usuallyTitle}>{item.title}</Text>
          <Text style={styles.numberText}>{item.number}番</Text>
        </View>
      ))}
    </View>
        ) : (
            <View style={styles.statsContainer}>
            <View style={styles.statBox}>
                <Text style={styles.statTitle}>移動中</Text>
                <Text style={styles.statValue}>6人</Text>
            </View>

            <View style={styles.statBox2}>
                <Text style={styles.statTitle}>収容される</Text>
                <Text style={styles.statValue}>15人</Text>
            </View>
            </View>
        )}
        </View>  {/* 下の情報欄 end*/}
        </SafeAreaView>
      
    );
  };
     
    

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
statTitle: {
  position: 'absolute',
  top: 10,
  left: 10,
  right: 0,
  textAlign: 'left',
  fontWeight: 'bold',
  fontSize: 20,
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


  // モード切替
  // 開発環境のみ表示　start
  modeContainer: {
  position: 'absolute',

  top: 150,
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