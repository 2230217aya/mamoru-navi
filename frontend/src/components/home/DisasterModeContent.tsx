// components/home/DisasterModeContent.tsx

import React from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ===== Props =====
type Props = {
  expanded: boolean;
};

export default function DisasterModeContent({
  expanded,
}: Props) {

  return (

    <View style={styles.container}>

      {/* ===== 展開時才顯示 ===== */}
      {expanded && (

        <View style={styles.contentArea}>

          <Text style={styles.infoText}>
            現在、一部地域で避難指示が発令されています。
          </Text>

          <Text style={styles.infoText}>
            安全な場所へ避難してください。
          </Text>

          <Text style={styles.infoText}>
            避難所の混雑状況を確認してください。
          </Text>
          <Text style={styles.infoText}>
            避難所の混雑状況を確認してください。
          </Text>
          <Text style={styles.infoText}>
            避難所の混雑状況を確認してください。
          </Text>
          <Text style={styles.infoText}>
            避難所の混雑状況を確認してください。
          </Text>
           <Text style={styles.infoText}>
            避難所の混雑状況を確認してください。
          </Text>
          <Text style={styles.infoText}>
            避難所の混雑状況を確認してください。
          </Text>
          <Text style={styles.infoText}>
            避難所の混雑状況を確認してください。
          </Text>
          <Text style={styles.infoText}>
            避難所の混雑状況を確認してください。
          </Text>
           <Text style={styles.infoText}>
            避難所の混雑状況を確認してください。
          </Text>
          <Text style={styles.infoText}>
            避難所の混雑状況を確認してください。
          </Text>
          <Text style={styles.infoText}>
            避難所の混雑状況を確認してください。
          </Text>
          <Text style={styles.infoText}>
            避難所の混雑状況を確認してください。
          </Text>



        </View>

      )}

    </View>

  );
}

const styles = StyleSheet.create({

  // ===== 全体 =====
  container: {
    flex: 1,
  },

  // ===== 上方內容 =====
  contentArea: {
    flex: 1,

    // 留空間給底部卡片
    paddingBottom: 170,
  },

  // ===== 文字 =====
  infoText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
  },

});