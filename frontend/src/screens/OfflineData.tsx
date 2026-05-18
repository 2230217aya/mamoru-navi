import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // アイコン表示用 (npm install expo-font @expo/vector-icons を実行済みの前提)

// TODO: 後で円グラフライブラリもインストールして差し替えます
// import CircularProgress from 'react-native-circular-progress'; 

export default function OfflineDataScreen() {
  // TODO: これらのデータは本来APIから取得、またはローカルDBから読み込みます
  const mapData = {
    downloaded: true, // true: ダウンロード済み, false: 未ダウンロード
    progress: 1.0,    // 0.0 ～ 1.0 の進捗度 (円グラフ用)
  };

  const shelterListData = {
    downloaded: true,
    progress: 1.0,
  };

  // 更新ボタンが押されたときの処理（ここではダミーでログ出力）
  const handleUpdate = (dataType: string) => {
    console.log(`${dataType}の更新処理を実行`);
    alert(`${dataType}の更新処理を実行しました（実際はAPI通信やデータ保存を行います）`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>オフラインデータ管理</Text>

      <ScrollView style={styles.scrollView}>
        {/* 地図データセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>地図データ</Text>
          
          <View style={styles.dataItem}>
            <Text style={styles.label}>ダウンロード状況: </Text>
            <Text style={mapData.downloaded ? styles.statusAvailable : styles.statusUnavailable}>
              {mapData.downloaded ? 'ダウンロード済み' : '未ダウンロード'}
            </Text>
            {/* TODO: 円グラフコンポーネントをここに差し替える */}
            <View style={styles.progressPlaceholder}>
              <FontAwesome name={mapData.downloaded ? "check-circle" : "times-circle"} size={24} color={mapData.downloaded ? "#10B981" : "#EF4444"} />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.updateButton, !mapData.downloaded && styles.disabledButton]} // 未ダウンロード時はグレーアウト
            onPress={() => handleUpdate('地図データ')}
            disabled={mapData.downloaded} // ダウンロード済みならボタン無効化
          >
            <Text style={styles.updateButtonText}>{mapData.downloaded ? '更新済み' : 'ダウンロード'}</Text>
          </TouchableOpacity>
        </View>

        {/* 避難所リストセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>避難所リスト</Text>

          <View style={styles.dataItem}>
            <Text style={styles.label}>ダウンロード状況: </Text>
            <Text style={shelterListData.downloaded ? styles.statusAvailable : styles.statusUnavailable}>
              {shelterListData.downloaded ? 'ダウンロード済み' : '未ダウンロード'}
            </Text>
             {/* TODO: 円グラフコンポーネントをここに差し替える */}
             <View style={styles.progressPlaceholder}>
               <FontAwesome name={shelterListData.downloaded ? "check-circle" : "times-circle"} size={24} color={shelterListData.downloaded ? "#10B981" : "#EF4444"} />
             </View>
          </View>

          <TouchableOpacity 
            style={[styles.updateButton, !shelterListData.downloaded && styles.disabledButton]}
            onPress={() => handleUpdate('避難所リスト')}
            disabled={shelterListData.downloaded}
          >
            <Text style={styles.updateButtonText}>{shelterListData.downloaded ? '更新済み' : 'ダウンロード'}</Text>
          </TouchableOpacity>
        </View>

        {/* 他のオフラインデータ項目もここに追加 */}

      </ScrollView>
    </SafeAreaView>
  );
}

// frontend/src/screens/OfflineDataScreen.tsx の styles 部分を修正

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    padding: 20,
    paddingTop: 60,
  },
  scrollView: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#4B5563',
    marginRight: 8,
  },
  statusText: { // このスタイルは使わないので一旦コメントアウトしてもOK
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981', // Success Green
    marginRight: 8,
  },
  // ★★★ statusAvailable スタイルを追加 ★★★
  statusAvailable: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981', // Success Green
    marginRight: 8,
  },
  statusUnavailable: { // これはOK
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444', // Red
    marginRight: 8,
  },
  progressPlaceholder: { 
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  updateButton: {
    backgroundColor: '#60A5FA',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
