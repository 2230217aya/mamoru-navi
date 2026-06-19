import { StyleSheet, Pressable, View, Text, Image, ScrollView } from "react-native";
import { Stack, router  } from 'expo-router';
import { useState, useEffect } from 'react';
import UserLists from '../components/userList-component';

// apiのurl
const API_BASE_URL = "";
// 使用するapiのurl
// /の後に避難所と人のやつ付け足す
const SHELTER_API_URL = `${API_BASE_URL}/`;
const USERS_API_URL = `${API_BASE_URL}/`;

export default function userList() {
  // 避難所データの受け取り皿（中身は入力が無かったときの値）
  const [shelterData, setShelterData] = useState({
      evacuationShelter: '',
      maxPeople: 'Error',
      nowPeople: 'Error',
  });

  // バックから送られた避難所データの名前がuseStateと違っていたら入力し直す
  // .testの部分をバックの型名に変更
  const convertShelterData = (ShelterData: any) => {
    return {
      evacuationShelter: ShelterData.test,
      maxPeople: ShelterData.test,
      nowPeople: ShelterData.test,
    };
  };

  // ユーザー一覧のデータ
  type User = {
    name: string;
    gender: string;
    age: number;
    blood: string;
    tel: string;
  };
  // ユーザー一覧の受け取り皿（中身は入力が無かったときの値）
  const [users, setUsers] = useState<User[]>([]);

  // バックから送られた避難所データの内データの名前がuseStateと違っていたら入力し直す
  // .testの部分をバックの型名に変更
  const convertUsersData = (userData: any) => {
    return userData.map((user: any) => ({
      name: user.test,
      gender: user.test,
      age: user.test,
      blood: user.test,
      tel: user.test,
    }));
  };

  // 画面表示時に実行
  useEffect(() => {
    // 避難所データ
    const fetchSData = async () => {
      // 避難所などの情報取得（テスト用）
      const testShelterData = {
        evacuationShelter: "〇〇避難所",
        maxPeople: "50",
        nowPeople: "15",
      };

      setShelterData(testShelterData);


      // // 避難所などの情報取得
      // const response = await fetch(SHELTER_API_URL);
      // let ShelterData = await response.json();

      // // バックから送られたデータの名前がuseStateと違っていたら名前変換
      // ShelterData = convertShelterData(ShelterData);

      // setShelterData(ShelterData);
    };

    // 避難所の中の人データ
    const fetchUData = async () => {
      // 避難所内の情報取得（テスト用）
      const testUsers = [
        { name: "田中", gender: "M", age: 20, blood: "A", tel: "0120-123-456", },
        { name: "佐藤", gender: "F", age: 22, blood: "O", tel: "080-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
        { name: "test", gender: "T", age: 0, blood: "T", tel: "000-0000-0000", },
      ];

      setUsers(testUsers);


      // 避難所内の情報取得
      // const response = await fetch(USERS_API_URL);
      // const userData = await response.json();
      // setUsers(userData);
    };
  
    fetchSData();
    fetchUData();
  },[]);

  return (
    <View style={styles.container}>
      {/* ヘッダー部分 */}
      <View style={styles.header}>
        {/* 左上のアイコン */}
        <Pressable onPress={() => router.push("/dashbord")} style={styles.qrcodeImageButton}>
            <Image source={require('@/assets/images/dashboard-qrcode.png')} style={styles.qrcodeImage} />
        </Pressable>

        <View style={styles.column}>
          {/* 避難所名 */}
          <Text style={styles.shelter}>{shelterData.evacuationShelter}</Text>

          {/* 人数 */}
          <Text style={styles.peoples}>人数：{shelterData.nowPeople}/{shelterData.maxPeople}</Text>
        </View>

        {/* 右上のアイコン */}
        <Pressable onPress={() => router.push("/supplies-status")} style={styles.cardboardImageButton}>
            <Image source={require('@/assets/images/userList-cardboard.png')} style={styles.cardboardImage} />
        </Pressable>
      </View>

      {/* ボディ部分 */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* 一番上の項目（横並び） */}
        <View style={styles.rowTexts}>
          <Text style={styles.cell}>名前</Text>
          <Text style={styles.cell}>性別</Text>
          <Text style={styles.cell}>年齢</Text>
          <Text style={styles.cell}>血液型</Text>
          <Text style={[ styles.cell, { flex:1.5 }]}>電話番号</Text>
        </View>

        {/* ここに取得した人間のデータ */}
        {users.map((user, index) => (
          <UserLists
            key={index}
            name={user.name}
            gender={user.gender}
            age={user.age}
            blood={user.blood}
            tel={user.tel}
          />
        ))}
      </ScrollView>      
    </View>
  );
}

const styles = StyleSheet.create({
  // 全体のview
  container: {
    flex: 1,
    // justifyContent: 'flex-start',
    // alignItems: 'stretch',     // 横中央
    // paddingTop: 80,
  },

  // ヘッダー部分
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 120,
    
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,

    backgroundColor: '#FFFFFF',
  },

  // QRアイコン
  qrcodeImageButton: {
    position: 'absolute',
    top: 50,
    left: 10,
    zIndex: 10,
  },
  // 画像のサイズ
  qrcodeImage: {
    width: 60,
    height: 60,
  },
  // 避難所名
  shelter: {
    fontSize: 30,
    textAlign: 'center',
    marginTop: 60,
    fontWeight: 'bold',
  },
  // 人数
  peoples: {
    fontSize: 20,
    // position: 'absolute',
    // right: 10,
    // marginTop: 10,
  },
  column: {
    flexDirection: 'column',
  },
  cardboardImageButton: {
    position: 'absolute',
    top: 50,
    right: 10,
    zIndex: 10,
  },
  cardboardImage: {
    width: 60,
    height: 60,
  },

  // 上の名前 性別とかのやつ
  rowTexts: {
    fontSize: 25,
    flexDirection: 'row', // 横並び
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  content: {
    marginTop: 140, // ヘッダー分だけ空ける
    paddingBottom: 40,
    alignItems: 'center',
  },
  cell: {
    flex: 0.7,
    textAlign: 'center',
  }
});