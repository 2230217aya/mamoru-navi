// frontend/src/screens/ProfileEditScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
// ★ Pickerをインポート ★
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import Constants from "expo-constants";

const dummyUserData = {
  name: "佐藤 健太",
  gender: "男性",
  birthday: "1998-12-09",
  bloodType: "A",
  medicalConditions: "なし",
  contact: "090-1111-1111",
  address: "大阪市北区 中崎西2丁目3-35",
};

export default function ProfileEditScreen() {
  const router = useRouter();

  // ★ フォームの状態管理（初期値は空文字などにしておく）
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bloodType, setBloodType] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true); // ★ 読み込み状態

  // ★ 1. 画面起動時に現在のプロフィールを取得してセットする ★
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const debuggerHost = Constants.expoConfig?.hostUri;
        const localIp = debuggerHost ? debuggerHost.split(":")[0] : "localhost";
        const baseUrl =
          process.env.EXPO_PUBLIC_API_URL || `http://${localIp}:8000`;

        const response = await fetch(`${baseUrl}/users/profile`);
        const data = await response.json();

        if (data.status === "success") {
          const p = data.profile;
          setName(p.name || "");
          setGender(p.gender || "");
          if (p.birthday) setBirthday(new Date(p.birthday));
          setBloodType(p.blood_type || "");
          setMedicalConditions(p.medical_conditions || "");
          setContact(p.phone_number || "");
          setAddress(p.address || "");
        }
      } catch (error) {
        console.error("データ取得失敗:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ★ 日付が選択された時の処理 ★
  const onChangeDate = (event: any, selectedDate?: Date) => {
    // Androidの場合は選択後に自動で閉じるが、iOSは手動で閉じる設定などが必要な場合がある
    // 今回はシンプルに、選択されたら閉じる（またはiOSの場合は外側タップで閉じる）挙動にする
    setShowDatePicker(Platform.OS === "ios"); // iOSの場合はPickerを開きっぱなしにする（後述のUI調整のため）

    if (selectedDate) {
      setBirthday(selectedDate);
    }
  };

  // ★ 日付を 'YYYY/MM/DD' の文字列にフォーマットする関数 ★
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // 月は0始まりなので+1
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  // ★ 2. 送信ボタン（保存）が押された時の処理 ★
  const handleSubmit = async () => {
    try {
      const debuggerHost = Constants.expoConfig?.hostUri;
      const localIp = debuggerHost ? debuggerHost.split(":")[0] : "localhost";
      const baseUrl =
        process.env.EXPO_PUBLIC_API_URL || `http://${localIp}:8000`;

      const response = await fetch(`${baseUrl}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Bypass-Tunnel-Reminder": "true",
        },
        body: JSON.stringify({
          name: name,
          gender: gender,
          // birthday: formatDate(birthday), // 今回のUserUpdate型定義にbirthdayがない場合は除外
          blood_type: bloodType,
          medical_conditions: medicalConditions,
          phone_number: contact,
        }),
      });

      if (!response.ok) throw new Error("更新に失敗しました");

      Alert.alert("成功", "プロフィールを保存しました！");
      router.back(); // 確認画面に戻る
    } catch (error) {
      console.error(error);
      Alert.alert("エラー", "情報の更新に失敗しました。");
    }
  };

  if (loading)
    return (
      <SafeAreaView style={styles.container}>
        <Text>読み込み中...</Text>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>個人情報の編集</Text>

        {/* 氏名 */}
        <View style={styles.inputWithPrefixContainer}>
          <Text style={styles.prefixText}>氏名：</Text>
          <TextInput
            style={styles.inputFlex} // ★inputFlexを適用して整える
            value={name}
            onChangeText={setName}
            placeholder="氏名を入力"
            placeholderTextColor="#999"
          />
        </View>

        {/* 性別 (Picker) */}
        <View style={styles.inputWithPrefixContainer}>
          <Text style={styles.prefixText}>性別：</Text>
          <Picker
            selectedValue={gender}
            onValueChange={(itemValue: string) => setGender(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="未選択" value="" color="#999" />
            <Picker.Item label="男性" value="男性" />
            <Picker.Item label="女性" value="女性" />
            <Picker.Item label="その他" value="その他" />
          </Picker>
        </View>

        {/* 生年月日 */}
        <TouchableOpacity
          style={styles.inputWithPrefixContainer}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.prefixText}>生年月日：</Text>
          <Text style={styles.dateText}>
            {formatDate(birthday).replace(/-/g, "/")}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={birthday}
            mode="date"
            display="spinner"
            onChange={onChangeDate}
            maximumDate={new Date()}
            locale="ja-JP"
          />
        )}

        {/* 血液型 (Picker) */}
        <View style={styles.inputWithPrefixContainer}>
          <Text style={styles.prefixText}>血液型：</Text>
          <Picker
            selectedValue={bloodType}
            onValueChange={(itemValue: string) => setBloodType(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="未選択" value="" color="#999" />
            <Picker.Item label="A" value="A" />
            <Picker.Item label="B" value="B" />
            <Picker.Item label="O" value="O" />
            <Picker.Item label="AB" value="AB" />
            <Picker.Item label="不明" value="不明" />
          </Picker>
        </View>

        {/* 持病 */}
        <View style={styles.inputWithPrefixContainer}>
          <Text style={styles.prefixText}>持病：</Text>
          <TextInput
            style={styles.inputFlex}
            value={medicalConditions}
            onChangeText={setMedicalConditions}
            placeholder="持病・アレルギー"
            placeholderTextColor="#999"
          />
        </View>

        {/* 連絡先 */}
        <View style={styles.inputWithPrefixContainer}>
          <Text style={styles.prefixText}>連絡先：</Text>
          <TextInput
            style={styles.inputFlex}
            value={contact}
            onChangeText={setContact}
            placeholder="090-XXXX-XXXX"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>

        {/* 住所 */}
        <View style={styles.inputWithPrefixContainer}>
          <Text style={styles.prefixText}>住所：</Text>
          <TextInput
            style={styles.inputFlex}
            value={address}
            onChangeText={setAddress}
            placeholder="住所"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>

        {/* ボタン類 */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>保存する</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA", paddingTop: 60 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 30, color: "#333" },
  input: {
    width: "100%",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
    marginBottom: 15,
    color: "#333",
  },
  // ★ Picker用のスタイル追加 ★
  pickerContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
    // iOSとAndroidでPickerの表示仕様が違うため、枠の中に収めるための設定
    overflow: "hidden",
    justifyContent: "center",
    // Androidのみ、高さを指定してTextInputと揃える
    ...(Platform.OS === "android" && { height: 55 }),
  },
  picker: {
    width: "100%",
    // iOSではPicker自体が高さを持つため、枠のスタイルは pickerContainer に任せる
    ...(Platform.OS === "android" && { color: "#333" }),
  },
  pickerItem: {
    fontSize: 16,
    // iOS用の文字スタイル（Androidには効かない）
  },
  dateInput: {
    width: "100%",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
    justifyContent: "center", // テキストを縦中央に
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  inputWithPrefixContainer: {
    flexDirection: "row", // 横に並べる
    alignItems: "center", // 縦の中央で揃える
    width: "100%",
    paddingHorizontal: 16, // paddingを内側に設定
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
    minHeight: 55, // 高さを確保
  },
  // ★ 追加：固定テキストのスタイル ★
  prefixText: {
    fontSize: 16,
    color: "#333",

    marginRight: 5, // 入力欄との隙間
  },
  // ★ 追加：プレフィックスの横にある入力欄自体のスタイル ★
  inputFlex: {
    flex: 1, // 残りの幅をすべて入力欄にする
    fontSize: 16,
    color: "#333",
    // backgroundColor: 'transparent', // (デフォルトで透明なので不要だが、枠線をなくす意味合い)
    // padding: 0, // OSによってはpaddingが邪魔になるのでリセット
  },
  // ---------------------------
  textArea: { minHeight: 100, textAlignVertical: "top" },
  submitButton: {
    backgroundColor: "#FDE047",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  submitButtonText: { color: "#333", fontSize: 16, fontWeight: "bold" },
  backButton: {
    backgroundColor: "#E5E7EB",
    width: "80%",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  backButtonText: { color: "#4B5563", fontSize: 16, fontWeight: "bold" },
});
