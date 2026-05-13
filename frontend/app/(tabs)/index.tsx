// frontend/app/(tabs)/index.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router'; // 画面遷移用のフック
//import TextComponent from '../../components/themed-text';
// ★ホーム画面自体のUIコードは、このファイル内に直接書くのがシンプル★
// このファイルが、タブの「ホーム」として機能します。

export default function HomeScreen() {
  const router = useRouter(); // 画面遷移を管理するオブジェクト

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>まもるナビ仮ホームページ</Text>
      <Text style={styles.subtitle}>ようこそ！</Text>

      {/* マイページへのボタン */}
      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push('../my-page')} // ★ app/my-page.tsx へ遷移 ★
      >
        <Text style={styles.buttonText}>マイページへ</Text>
      </TouchableOpacity>

      {/* オフラインデータ管理へ遷移 */}
      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push('../offline-data')} // ★ app/offline-data.tsx へ遷移 ★
      >
        <Text style={styles.buttonText}>オフラインデータ管理</Text>
      </TouchableOpacity>

       {/* ダッシュボードへ遷移 */}
      {/* <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push('../dashboard')} // app/dashboard.tsx へ遷移
      >
        <Text style={styles.buttonText}>ダッシュボード</Text>
      </TouchableOpacity> */}
      
      <Text style={styles.footerText}>災害時も安心の備えを。</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4f8',
    padding: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 20,
    color: '#555',
    marginBottom: 50,
  },
  button: {
    backgroundColor: '#60A5FA', // 青系のボタン色
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    marginTop: 50,
    fontSize: 14,
    color: '#777',
  },
});