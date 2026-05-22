import { StyleSheet, Pressable, View, Image } from "react-native";
import { router } from 'expo-router';
import DashboardButton from '../components/dashboard-component';

export default function dashboard() {
  return (
    <View style={styles.container}>
      {/* 右上のアイコン */}
      <Pressable onPress={() => router.push("/user-list")} style={styles.userIconButton}>
        <Image
          source={require('@/assets/images/dashboard-userIcon.png')}
          style={styles.userIcon}
        />
      </Pressable>

      {/* QRコード受付 */}
      <DashboardButton
        title="QRコード受付"
        img={require('@/assets/images/dashboard-qrcode.png')}
        href="/"
        backgroundColor="#FFF693"
        textColor="#000000"
        width="90%"
        imgsize={170}
      />

      {/* ボタンを横並びに */}
      <View style={styles.rowButtons}>
        <DashboardButton
          title={"身分証明書\n撮る"}
          img={require('@/assets/images/dashboard-photo.png')}
          href="/"
          backgroundColor="#9D9D9D"
          textColor="#FFF693"
          width="40%"
          imgsize={120}
        />

        <DashboardButton
          title="手入力"
          img={require('@/assets/images/dashboard-input.png')}
          href="/"
          backgroundColor="#9D9D9D"
          textColor="#FFF693"
          width="40%"
          imgsize={120}
        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  // ボタンが入ってる全体のview
  container: {
    flex: 1,
    justifyContent: 'center', // 縦中央
    alignItems: 'center',     // 横中央
    gap: 20,                  // ボタン間隔
  },

  // 写真と手入力のボタンがが入ってるview（横並びにする為に入れてる）
  rowButtons: {
    flexDirection: 'row', // 横並び
    gap: 20,
  },

  // ユーザーアイコンが入っているPressable
  userIconButton: {
    position: 'absolute',
    top: 50,
    right: 10,
    zIndex: 10,
  },

  // ユーザーアイコン
  userIcon: {
    width: 50,
    height: 50,
  },  
});