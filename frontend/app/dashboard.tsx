import { StyleSheet, Pressable, View, Text, Image } from "react-native";
import { Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';

export default function dashboard() {
  return (
    <View style={styles.container}>
      {/* ひとつのボタン */}
      <Link href="/" asChild>
        <Pressable style={styles.qrcode}>
          {/* ボタンの画像イメージ */}
          <Image
            source={require('@/assets/images/dashboard-qrcode.png')}
            style={styles.image}
          />
          {/* ボタンのテキスト */}
          <Text style={styles.qrcodeText}>QRコード受付</Text>
        </Pressable>
      </Link>

      {/* ボタンを横並びに */}
      <View style={styles.rowButtons}>
        <Link href="/" asChild>
          <Pressable style={styles.photo}>
            <Image
              source={require('@/assets/images/dashboard-photo.png')}
              style={styles.image}
            />
            <Text style={styles.buttonText}>身分証明書{'\n'}撮る</Text>
          </Pressable>
        </Link>

        <Link href="/" asChild>
          <Pressable style={styles.input}>
            <Image
              source={require('@/assets/images/dashboard-input.png')}
              style={styles.image}
            />
            <Text style={styles.buttonText}>手入力</Text>
          </Pressable>
        </Link>
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

  // QRコードのボタン
  qrcode: {
    width: '90%', // 横幅
    height: 275,  // 縦幅

    backgroundColor: '#FFF693', // 背景色

    // 中身の要素を中央寄せする効果もある
    justifyContent: 'flex-end', // 文字を下に置く
    alignItems: 'center',

    borderRadius: 12, // 角丸
    padding: 20,  // マージン
  },

  // QRボタンのテキスト
  qrcodeText: {
    color: '#000000',
    fontSize: 30,
    fontWeight: 'bold',
  },

  // 写真のボタン
  photo: {
    width: '40%',
    height: 250,

    backgroundColor: '#9D9D9D',

    justifyContent: 'flex-end',
    alignItems: 'center',

    borderRadius: 12,
    padding: 20,
  },

  // 手入力のボタン
  input: {
    width: '40%',
    height: 250,

    backgroundColor: '#9D9D9D',

    justifyContent: 'flex-end',
    alignItems: 'center',

    borderRadius: 12,
    padding: 20,
  },

  // 写真、手入力のテキスト
  buttonText: {
    color: '#FFF693',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',  // 身分証明書 撮る が改行なので二行目を中央寄せするのに必要
  },

  // 写真と手入力のボタンがが入ってるview（横並びにする為に入れてる）
  rowButtons: {
    flexDirection: 'row', // 横並び
    gap: 20,
  },

  image: {},
  
});