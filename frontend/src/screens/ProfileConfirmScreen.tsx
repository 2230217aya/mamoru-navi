// frontend/src/screens/ProfileConfirmScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

// 仮のデータ
const dummyUserData = {
  name: '佐藤 健太',
  gender: '男性',
  birthday: '1998/12/09',
  age: 28, // 誕生日から計算して表示する想定
  bloodType: 'A',
  medicalConditions: 'なし',
  contact: '090-1111-1111',
  address: '大阪市北区\n中崎西2丁目3-35', // 改行を含める
};

export default function ProfileConfirmScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>個人情報の確認</Text>

        {/* 情報を囲む角丸の枠 */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>氏名</Text>
            <Text style={styles.value}>{dummyUserData.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>性別</Text>
            <Text style={styles.value}>{dummyUserData.gender}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>誕生日</Text>
            <Text style={styles.value}>{dummyUserData.birthday} ({dummyUserData.age}才)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>血液型</Text>
            <Text style={styles.value}>{dummyUserData.bloodType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>持病</Text>
            <Text style={styles.value}>{dummyUserData.medicalConditions}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>連絡先</Text>
            <Text style={styles.value}>{dummyUserData.contact}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>住所</Text>
            <Text style={styles.value}>{dummyUserData.address}</Text>
          </View>
        </View>

        {/* 編集画面へのボタン */}
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push('../profile-edit')} // ★ 編集ページへ遷移 ★
        >
          <Text style={styles.editButtonText}>個人情報の編集</Text>
        </TouchableOpacity>

        {/* 戻るボタン */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()} // ★ マイページへ戻る ★
        >
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', paddingTop: 60 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 30, color: '#333' },
  infoCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333', // 黒い枠線
    padding: 20,
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  label: {
    width: 80, // ラベルの幅を固定して揃える
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 24, // 改行時の行間
  },
  editButton: {
    backgroundColor: '#FDE047', // 黄色
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  editButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  backButton: {
    backgroundColor: '#E5E7EB', // グレー
    width: '80%',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  backButtonText: { color: '#4B5563', fontSize: 16, fontWeight: 'bold' },
});