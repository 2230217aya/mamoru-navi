import { Ionicons } from '@expo/vector-icons';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { router } from 'expo-router';
import {
  SafeAreaView,
  ScrollView ,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
} from 'react-native';

export default function SafetyScreen() {
  return (
      <ScrollView showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push('../user_home')}
        >
        <Ionicons name="menu" size={28} color="#888" />
        <View style={styles.redDot} />
        </TouchableOpacity>

      {/* 安心度 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>現在の安心度</Text>

        <View style={styles.safetyContent}>
          
          <View style={styles.statusRow}>
            <View style={styles.topStatusRow}>
                <View style={styles.greenDot} />

                <Text style={styles.safeText}>
                完璧です！
                </Text>
            </View>

            <Text style={styles.subText}>
                通信が切れてもナビが使えます。
            </Text>
            </View>

          <AnimatedCircularProgress
            size={120}
            width={8}
            fill={70}
            tintColor="#28c840"
            backgroundColor="#d9d9d9"
            rotation={0}
            >
            {() => (
                <View style={{ alignItems: 'center' }}>
                <Text style={styles.circleText}>70%</Text>
                <Text style={styles.circleText}>安心</Text>
                </View>
            )}
            </AnimatedCircularProgress>

        </View>

        <TouchableOpacity style={styles.downloadButton}>
          <Text style={styles.downloadText}>
            最新データを一括ダウンロード
          </Text>
        </TouchableOpacity>
      </View>

      {/* マイエリア */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>マイエリア設定</Text>

          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>
              ＋ 新しいエリア
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.areaButton}>
          <Text style={styles.areaText}>
            🏠 自宅周辺（半径3 km）
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.areaButton}>
          <Text style={styles.areaText}>
            💼 職場・学校周辺（半径3 km）
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.areaButton}>
          <Text style={styles.areaText}>
            🏡 実家周辺（半径3 km）
          </Text>
        </TouchableOpacity>
      </View>

      {/* データ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>データの内訳と容量</Text>

        <Text style={styles.smallTitle}>基本地図データ</Text>

        <View style={styles.dataRow}>
          
          <View>
            <Text style={styles.dataText}>
              避難所リスト・位置情報
            </Text>

            <Text style={styles.dataText}>
              洪水ハザードマップ
            </Text>

            <Text style={styles.dataText}>
              土砂災害ハザードマップ
            </Text>
          </View>

          <View style={styles.storageBox}>
            <Ionicons name="server" size={40} color="#28c840" />

            <Text style={styles.storageText}>150MB</Text>

            <Text style={styles.storageSub}>
              この端末の空き容量: 20GB
            </Text>
          </View>
        </View>
      </View>

      {/* 自動更新 */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>
              自動か更新
            </Text>

            <Text style={styles.grayText}>
              （スマート・キャッシュ）
            </Text>
          </View>

          <Switch
            value={true}
            trackColor={{
                false: '#ccc',
                true: '#FFEE37',
            }}
            thumbColor={
                true ? '#ffffff' : '#f4f3f4'
            }
            />
        </View>

        <Text style={styles.updateText}>
          Wi-Fi接続時に自動で最新データを更新する
        </Text>
        <Text style={styles.updateText2}>
            ONにしておくと、アプリを開かなくても寝ている間に
            
        </Text>
        <Text style={styles.updateText2}>
            最新の避難所情報や地図が自動で準備されます。
        </Text>
      </View>
</ScrollView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 14,
  },

  header: {
    paddingTop: 40,
    alignItems: 'flex-end',
    end: 14,
    marginBottom: 20,
    position: 'relative',
  },

  redDot: {
    width: 8,
    height: 8,
    backgroundColor: 'red',
    borderRadius: 99,
    position: 'absolute',
    top:40,
    right: -2,
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    marginLeft: 10,
    marginRight: 10,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.1,
    shadowRadius: 4,

    elevation: 3,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },

  safetyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },

  statusRow: {
  flexDirection: 'column',
    },

    topStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    },

    greenDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: '#27d83e',
    },

    safeText: {
    color: '#22cc33',
    fontSize: 30,
    fontWeight: 'bold',
    },

    subText: {
    color: '#555',  
    fontSize: 10,
    marginTop: 2,
    
    },

  circle: {
    width: 120,
    height: 120,
    borderWidth: 8,
    borderColor: '#28c840',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },

  circleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#28c840',
  },

  downloadButton: {
    backgroundColor: '#ffe523',
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },

  downloadText: {
    fontWeight: 'bold',
    fontSize: 12,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },

  addButton: {
    borderWidth: 1,
    borderColor: '#e0cf39',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  addButtonText: {
    fontSize: 12,
    color: '#555',
  },

  areaButton: {
    backgroundColor: '#f6ef9d',
    padding: 10,
    borderRadius: 10,
    marginTop: 5,
  },

  areaText: {
    fontSize: 14,
  },

  smallTitle: {
    marginTop: 10,
    fontWeight: 'bold',
    color: '#333',
  },

  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    alignItems: 'center',
  },

  dataText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 8,
  },

  storageBox: {
    backgroundColor: '#fff3a6',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    width: 120,
  },

  storageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2acb42',
  },

  storageSub: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
  },

  grayText: {
    color: '#888',
    fontSize: 12,
  },

  updateText: {
    marginTop: 12,
    color: '#444',
    fontSize: 14,
  },
  updateText2: {
    color: '#8d8c8c',
    fontSize: 10,
    alignContent: 'center',
  },
  
});