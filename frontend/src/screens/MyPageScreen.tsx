import { navigate } from "expo-router/build/global-state/routing";
import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
// QRコードを生成するライブラリ
import QRCode from "react-native-qrcode-svg";
import { SafeAreaFrameContext } from "react-native-safe-area-context";
import { useRouter } from 'expo-router'; 

export default function MyPageScreen({ navigator }: any) {
  const router = useRouter(); // router を取得

  // QRコードを表示するかどうかの状態管理（初期値は true = 表示）
  const [isQrVisible, setIsQrVisible] = useState(true);

  // QRコードに埋め込むデータ（バックエンドと繋ぐまでは仮のIDにしておく）
  const qrData = "DummyUserId_123456789";

  return (
    // SafeAreaViewは、iPhoneのノッチ（画面上の切り欠き）にUIが被らないようにするコンポーネント
    <SafeAreaView style={styles.container}>
      {/* タイトル */}
      <Text style={styles.title}>マイQRコード</Text>

      {/* QRコード表示エリア */}
      <View style={styles.qrContainer}>
        {isQrVisible ? (
          <QRCode
            value={qrData}
            size={220} // QRコードの大きさ
            backgroundColor="transparent" // 背景色を透明に
          />
        ) : (
          // 「隠す」を押した時に表示されるグレーのモザイク代わりのブロック
          <View style={styles.hiddenQrBox}>
            <Text style={styles.hiddenQrText}>非表示</Text>
          </View>
        )}
      </View>

      {/* 「QRコードを隠す/表示する」切り替えボタン */}
      <TouchableOpacity
        onPress={() => setIsQrVisible(!isQrVisible)} // ボタンを押した時の処理
        style={styles.toggleButton}
      >
        <Text style={styles.toggleButtonText}>
          {isQrVisible ? "QRコードを隠す" : "QRコードを表示"}
        </Text>
      </TouchableOpacity>

      {/* 個人情報の確認・編集ボタン（黄色） */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push('../profile-edit')} // ※後で作る確認画面への遷移名
      >
        <Text style={styles.primaryButtonText}>個人情報の確認・編集</Text>
      </TouchableOpacity>

      {/* 下部の余白を作るためのスペーサー */}
      <View style={{ flex: 1 }} />

      {/* ホームへ戻るボタン（グレー） */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/')} // ※後で作るホーム画面への遷移名
      >
        <Text style={styles.secondaryButtonText}>ホームへ戻る</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- デザイン（スタイル）の設定 ---
const styles = StyleSheet.create({
  container: {
    flex: 1, // 画面いっぱいに広がる
    alignItems: "center", // 水平方向（横）の中央寄せ
    backgroundColor: "#FAFAFA", // 背景色
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20, // 文字の大きさ
    fontWeight: "bold", // 文字の太さ
    marginBottom: 40, // 下に20dp余白
    color: "#333", // フォントの色（暗い黄色）
    letterSpacing: 2, // 文字の間隔を少し開ける
  },
  qrContainer: {
    width: 250,
    height: 250,
    backgroundColor: "#FFFFFF", // 白のボックス
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12, // 角丸
    shadowColor: "#000", // iOS用影の色
    shadowOffset: { width: 0, height: 2 }, // 影の方向（上0、下2）
    shadowOpacity: 0.1, // 影の濃さ
    shadowRadius: 4, // 影のぼかし
    // Android用影（より自然な影になります）
    elevation: 3,
    marginBottom: 20,
  },

  hiddenQrBox: {
    width: 220,
    height: 220,
    backgroundColor: "#E5E7EB", // グレーのボックス
    justifyContent: "center",
    alignItems: "center",
  },

  hiddenQrText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#9CA3AF", // グレーの文字
  },
  toggleButton: {
    backgroundColor: "#E5E7EB", // グレーの背景
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 50,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151", // グレーの文字
  },
  primaryButton: {
    backgroundColor: "#FDE047", // 明るい黄色
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333", // グレーの文字
  },
  secondaryButton: {
    backgroundColor: "#E5E7EB", // グレーの背景
    width: "80%",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563", // グレーの文字
  },
});
