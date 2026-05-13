// frontend/src/components/themed-text.tsx
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

// TextProps を継承して、React Native の Text コンポーネントの全てのプロパティを受け入れられるようにする
interface ThemedTextProps extends TextProps {
  // その他のカスタムプロパティがあればここに追加
}

export default function ThemedText({ style, ...rest }: ThemedTextProps) {
  return (
    // StyleSheet.compose で、デフォルトスタイルと外部から渡されたスタイルをマージ
    <Text style={[styles.default, style]} {...rest} />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16, // デフォルトのフォントサイズ
    color: '#333', // デフォルトの文字色
    // 必要に応じて、他のデフォルトスタイルを追加
  },
});