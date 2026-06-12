// components/home/NormalModeContent.tsx

import React from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

// 窓口サービス情報
type OfficeService = {
  id: number;
  title: string;
  number: string;
};

// コンポーネントのProps定義
type Props = {
  officeServices: OfficeService[];
  loading: boolean;
  lastUpdate: string;
  onRefresh: () => void;
};

export default function NormalModeContent({
  officeServices,
  loading,
  lastUpdate,
  onRefresh,
}: Props) {

  return (
    <>

      {/* 営業時間・定休日表示 */}
      <View style={styles.infoRow}>

        <Text style={styles.cardText}>
          営業時間: 9:00~17:00
        </Text>

        <Text style={styles.closedText}>
          定休日: 土日祝
        </Text>

      </View>

      {/* 最終更新日時および更新ボタン */}
      <View style={styles.updateRow}>

        <Text style={styles.updateText}>
          最終更新: {lastUpdate}
        </Text>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons
            name="refresh"
            size={20}
            color="#373737"
          />
        </TouchableOpacity>

      </View>

      {/* 窓口の呼び出し状況一覧 */}
      <View style={styles.serviceBox}>

        {loading ? (

          // データ更新中
          <Text>更新中...</Text>

        ) : (

          officeServices.map((item) => (

            <View
              key={item.id}
              style={styles.rowItem}
            >

              {/* 窓口名 */}
              <Text style={styles.serviceTitle}>
                {item.title}
              </Text>

              {/* 現在の呼出番号 */}
              <Text style={styles.numberText}>
                {item.number}番
              </Text>

            </View>

          ))

        )}

      </View>

    </>
  );
}

const styles = StyleSheet.create({

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  cardText: {
    fontSize: 15,
    color: '#555',
  },

  closedText: {
    fontSize: 13,
    color: '#666',
  },

  updateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  updateText: {
    fontSize: 12,
    color: '#888',
  },

  refreshButton: {
    padding: 4,
  },

  serviceBox: {
    backgroundColor: '#eeeeee',
    borderRadius: 14,
    padding: 14,
  },

  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  serviceTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  numberText: {
    fontSize: 15,
    color: '#1976d2',
    fontWeight: 'bold',
  },

});