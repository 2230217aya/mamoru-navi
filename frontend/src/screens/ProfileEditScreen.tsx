// frontend/src/screens/ProfileEditScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ScrollView, TouchableOpacity } from 'react-native';

// ユーザーの仮データ（本来はAPIから取得する）
const dummyUserData = {
  name: '佐藤 健太',
  gender: '男性',
  birthday: '1998/12/09',
  bloodType: 'A',
  medicalConditions: 'なし',
  contact: '090-1111-1111',
  address: '大阪市北区 中崎西2丁目3-35',
};

export default function ProfileEditScreen({ navigation }: any) {
    
  // 各入力フィールドの状態を管理
  const [name, setName] = useState(dummyUserData.name);
  const [gender, setGender] = useState(dummyUserData.gender);
  const [birthday, setBirthday] = useState(dummyUserData.birthday);
  const [bloodType, setBloodType] = useState(dummyUserData.bloodType);
  const [medicalConditions, setMedicalConditions] = useState(dummyUserData.medicalConditions);
  const [contact, setContact] = useState(dummyUserData.contact);
  const [address, setAddress] = useState(dummyUserData.address);

  // 保存ボタンが押されたときの処理（ここではコンソールに出力するだけ）
  const handleSave = () => {
    console.log('保存データ:', {
      name,
      gender,
      birthday,
      bloodType,
      medicalConditions,
      contact,
      address,
    });
    alert('保存しました（実際はAPIに送信します）');
    // 保存成功後、マイページに戻るなどの処理
    navigation.goBack(); 
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ width: '100%' }}>
        <Text style={styles.title}>個人情報の確認・編集</Text>

        {/* 各入力フィールド */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>氏名</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="氏名を入力"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>性別</Text>
          <TextInput
            style={styles.input}
            value={gender}
            onChangeText={setGender}
            placeholder="性別を入力"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>誕生日</Text>
          <TextInput
            style={styles.input}
            value={birthday}
            onChangeText={setBirthday}
            placeholder="YYYY/MM/DD"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>血液型</Text>
          <TextInput
            style={styles.input}
            value={bloodType}
            onChangeText={setBloodType}
            placeholder="A, B, AB, O, RH+"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>持病・アレルギー</Text>
          <TextInput
            style={[styles.input, styles.textArea]} //textAreaで高さを調整
            value={medicalConditions}
            onChangeText={setMedicalConditions}
            placeholder="特になければ「なし」と入力"
            multiline // 複数行入力可能に
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>連絡先</Text>
          <TextInput
            style={styles.input}
            value={contact}
            onChangeText={setContact}
            placeholder="電話番号を入力"
            keyboardType="phone-pad" // 電話番号入力に最適化
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>住所</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={address}
            onChangeText={setAddress}
            placeholder="都道府県から入力"
            multiline
          />
        </View>

        {/* 保存ボタン */}
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>

        {/* 戻るボタン */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()} // 一つ前の画面（マイページ）に戻る
        >
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  scrollView: {
    width: '100%',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB', // 薄いグレー
    fontSize: 16,
  },
  textArea: {
    minHeight: 80, // 入力欄の高さを少し広げる
  },
  saveButton: {
    backgroundColor: '#FDE047', // 黄色
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#E5E7EB', // 薄いグレー
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
});