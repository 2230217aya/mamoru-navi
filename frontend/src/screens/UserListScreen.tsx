import { StyleSheet, Pressable, View, Text, Image, ScrollView } from "react-native";
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import UserLists from '../components/userList-component';

// テスト用のID
const TEST_SHELTER_ID = "123e4567-e89b-12d3-a456-426614174000";

// apiのurl
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// 避難所のIDを受け取り
type Props = { SHELTER_ID_GET: string; };

// SHELTER_IDを受け取る
export default function userList({ SHELTER_ID_GET }: Props) {
  // 避難所IDがない場合テストデータを入れる
  const SHELTER_ID = SHELTER_ID_GET ?? TEST_SHELTER_ID;

  // 使用するapiのurl
  const SHELTER_API_URL = `${API_BASE_URL}/shelters/${SHELTER_ID}`;
  const USERS_API_URL = `${API_BASE_URL}/checkins/shelter/${SHELTER_ID}`;

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
      evacuationShelter: ShelterData.name,
      maxPeople: ShelterData.capacity,
      nowPeople: "Error", // 現在人数を取得できない時にエラーを出す
    };
  };

  // ユーザー一覧のデータ
  type User = {
    name: string;
    gender: string;
    age: string
    blood: string;
    tel: string;
  };
  // ユーザー一覧の受け取り皿（中身は入力が無かったときの値）
  const [users, setUsers] = useState<User[]>([]);

  // 送られてきた生年月日から年齢を計算する
  const calcAge = (birthday: string) => {
    const birth = new Date(birthday);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();

    // 今年まだ誕生日が来ていなければ1歳引く
    const hasBirthdayPassed =
      today.getMonth() > birth.getMonth() ||
      (today.getMonth() === birth.getMonth() &&
        today.getDate() >= birth.getDate());

    if (!hasBirthdayPassed) {
      age--;
    }

    return age.toString();
  };

  // 画面表示時に実行
  useEffect(() => {
    // 避難所データ
    const fetchSData = async () => {
      // 避難所などの情報取得
      const response = await fetch(SHELTER_API_URL);
      if (!response.ok) {throw new Error("shelter fetch failed");}
      let ShelterData = await response.json();

      console.log(ShelterData);   // 確認用

      // バックから送られたデータの名前がuseStateと違っていたら名前変換
      ShelterData = convertShelterData(ShelterData);

      setShelterData(ShelterData);
    };

    // 避難所の中の人データ
    const fetchUData = async () => {
      // 避難所にチェックインしている人を取得
      const checkinResponse = await fetch(USERS_API_URL);
      if (!checkinResponse.ok) {throw new Error("checkin fetch failed");}
      const checkins = await checkinResponse.json();

      // 現在の人数を取得
      setShelterData(prev => ({
        ...prev,
        nowPeople: String(checkins.length),
      }));

      // 全ユーザー情報を取得
      const userList = await Promise.all(
        checkins.map(async (checkin: any) => {
          const response = await fetch(
            `${API_BASE_URL}/users/${checkin.user_id}`
          );
          const user = await response.json();

          return {
            name: user.name,
            gender: user.gender,
            age: calcAge(user.birthday),
            blood: user.blood_type,
            tel: user.phone_number,
          };
        })
      );
      console.log("userList =", userList);
      setUsers(userList);
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
            <Image source={require('@/assets/images/hinan.png')} style={styles.cardboardImage} />
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
    top: 40,
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
    fontSize: 20,
    textAlign: 'center',
    // marginTop: 60,
    fontWeight: 'bold',
  },
  // 人数
  peoples: {
    fontSize: 15,
    // position: 'absolute',
    // right: 10,
    // marginTop: 10,
  },
  column: {
    flexDirection: 'column',
  },
  // 遷移の画像
  cardboardImageButton: {
    position: 'absolute',
    top: 40,
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