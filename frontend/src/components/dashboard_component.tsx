import { StyleSheet, Pressable, View, Text, Image, DimensionValue } from "react-native";
import { Link, Href, useRouter  } from 'expo-router';

type Props = {
  title: string;
  img: any;
  href: Href;
  backgroundColor: string;
  textColor: string;
  width: DimensionValue;
  imgsize: DimensionValue;
};

export default function dashboardButton({
    title,
    img,
    href,
    backgroundColor,
    textColor,
    width,
    imgsize,
  }: Props) {
    const router = useRouter();
  return (
      // ひとつのボタン
      <Pressable 
        // 遷移先
        onPress={() => router.push(href)} // linkだと背景色が上手く動かなかったのでこちらを使用
        style={[ styles.button, { backgroundColor: backgroundColor, width: width,}]}>
        {/* ボタンの画像イメージ */}
        <Image
          source={img}
          style={[ styles.image, { width: imgsize, height: imgsize }]}>
        </Image>
        {/* ボタンのテキスト */}
        <Text style={[ styles.text, { color: textColor }]}>
          {title}
        </Text>

      </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    // width: 300, // 横幅
    height: 275,  // 縦幅

    // 中身の要素を中央寄せする効果もある
    justifyContent: 'flex-end', // 文字を下に置く
    alignItems: 'center',

    borderRadius: 12, // 角丸
    padding: 20,  // マージン
  },

  image: {
    // width: 130,
    // height: 130,

    // 画像位置固定
    position: 'absolute',
    top: '15%',
  },

  text: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',  // 身分証明書 撮る が改行なので二行目を中央寄せするのに必要
  },
});