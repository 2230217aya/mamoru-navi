import { Ionicons } from '@expo/vector-icons';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { router } from 'expo-router';
import { useState } from 'react';
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
    // オフラインデータの充実度（安心度）
    const [safetyPercent, setSafetyPercent] =
  useState(100);

 // 安心度に応じた表示内容を取得

const getSafetyStatus = () => {

  if (safetyPercent >= 70) {
    return {
      text: '完璧です！',
      Chart: '安心',
      color: '#28c840',
      Contents: '通信が切れてもナビが使えます。',
    };
  }

  if (safetyPercent >= 40) {
    return {
      text: '注意!',
      Chart: '注意',
      color: '#f5a623',
      Contents: '最新のハザードマップが追加されました。今すぐダウンロードしてください。',
    };
  }

  return {
    text: '危険です',
    Chart: '危険',
    color: '#ff4d4f',
    Contents: 'オフラインデータがありません。今すぐダウンロードしてください。',
  };
};


const safetyStatus = getSafetyStatus();

  return (
      <ScrollView showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      {/* メニュー画面へ戻るボタン */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push('../user_home')}
        >
        <Ionicons name="menu" size={28} color="#888" />
        <View style={styles.redDot} />
        </TouchableOpacity>

      {/* オフラインデータの安心度 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>現在の安心度</Text>

        <View style={styles.safetyContent}>
           {/* 安心度ステータス表示 */}
          <View style={styles.statusRow}>
            <View style={styles.topStatusRow}>
                <View
                    style={[
                        styles.greenDot,
                        {
                        backgroundColor: safetyStatus.color,
                        },
                    ]}
                    />

                <Text
                    style={[
                        styles.safeText,
                        {
                        color: safetyStatus.color,
                        },
                    ]}
                    >
                    {safetyStatus.text}
                    </Text>
            </View>

            <Text style={styles.subText}>
                {safetyStatus.Contents}
            </Text>
            </View>
          {/* 安心度ゲージ */}
          <AnimatedCircularProgress
            size={120}
            width={8}
            fill={safetyPercent}
            tintColor={safetyStatus.color}
            backgroundColor="#d9d9d9"
            rotation={0}
            >
            {() => (
                <View style={{ alignItems: 'center' }}>
                <Text
                    style={[
                        styles.circleText,
                        {
                        color: safetyStatus.color,
                        },
                    ]}
                    >
                    {safetyPercent}%
                    </Text>
                <Text
                    style={[
                        styles.circleText,
                        {
                        fontSize: 16,
                        color: safetyStatus.color,
                        },
                    ]}
                    >
                    {safetyStatus.Chart}
                    </Text>
                </View>
            )}
            </AnimatedCircularProgress>

        </View>
        {/* 最新データ一括ダウンロード */}
        <TouchableOpacity style={styles.downloadButton}>
          <Text style={styles.downloadText}>
            最新データを一括ダウンロード
          </Text>
        </TouchableOpacity>
      </View>

      {/* マイエリア管理 */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>マイエリア設定</Text>
            {/* エリア追加画面へ遷移 */}
           <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              router.push('../add_area')
            }
          >
            <Text style={styles.addButtonText}>
              ＋ 新しいエリア
            </Text>
          </TouchableOpacity>
        </View>
        {/* 登録済みエリア一覧 */}
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
      {/* オフラインデータ情報 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>データの内訳と容量</Text>

        <Text style={styles.smallTitle}>基本地図データ</Text>
          {/* 保存済みデータ一覧 */}
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
          {/* ストレージ使用状況 */}
          <View style={styles.storageBox}>
            <Text style={styles.storageSub}>
              このアプリが使用中の容量
            </Text>
                <View style={styles.storageboxs}>
                    <Ionicons name="server" size={20} color="#28c840" />

                    <Text style={styles.storageText}>150MB</Text>
                </View>

            <Text style={styles.storageSub}>
              この端末の空き容量: 20GB
            </Text>
          </View>
        </View>
      </View>

      {/* 自動更新設定 */}
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
          {/* スマートキャッシュ機能 ON/OFF */}
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
        {/* 自動更新の説明 */}
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
    padding: 15,
    marginBottom: 8,
    marginLeft: 5,
    marginRight: 5,

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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },

  safetyContent: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  
  },

  statusRow: {
  flexDirection: 'column',
  width: 180,

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
    borderColor: '#fff3a6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  addButtonText: {
    fontSize: 12,
    color: '#555',
  },

  areaButton: {
    backgroundColor: '#fff3a6',
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
    marginTop: 5,
    alignItems: 'center',
  },

  dataText: {
    fontSize: 11,
    color: '#444',
    marginBottom: 8,
  },

  storageBox: {
    backgroundColor: '#fff3a6',
    paddingBottom: 10,
    paddingTop: 10,
    borderRadius: 12,
    alignItems: 'center',
    width: '50%',
  },
    storageboxs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    },
  storageText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2acb42',
  },

  storageSub: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    margin: 6,
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