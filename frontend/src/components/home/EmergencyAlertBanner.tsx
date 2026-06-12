import React from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

// コンポーネントのProps定義
type Props = {
  title: string;
  message: string;
  level: string;
  levelText: string;
};

export default function EmergencyAlertBanner({

  title,
  message,
  level,
  levelText,

}: Props) {

  return (

    // 緊急地震速報バナー
    <View style={styles.container}>

      {/* 震度表示エリア */}
      <View style={styles.levelBox}>

        <Text style={styles.levelNumber}>
          {level}
        </Text>

      </View>

      {/* 災害情報表示エリア */}
      <View style={styles.contentArea}>

        {/* 災害情報タイトル */}
        <Text style={styles.title}>
          {title}
        </Text>

        {/* 対象地域・メッセージ */}
        <Text style={styles.message}>
          {message}
        </Text>

        {/* 震度情報 */}
        <Text style={styles.levelText}>
          {levelText}
        </Text>

      </View>

    </View>

  );
}

const styles = StyleSheet.create({

  // ===== 全体 =====
 container: {
  position: 'relative', // 或直接刪掉
top: 80,

width: 250,
alignSelf: 'center',
  marginTop: 10,

  flexDirection: 'row',

  backgroundColor: '#ffffff',

  borderRadius: 18,
  borderWidth: 1,
  borderColor: '#FF0909',

  overflow: 'hidden',

  elevation: 4,
},

  // ===== 左側紅色 =====
  levelBox: {
  width: 55,

  margin: 10, 

  backgroundColor: '#FF0909',

  borderRadius: 12,

  justifyContent: 'center',
  alignItems: 'center',
},

  // ===== 左側數字 =====
  levelNumber: {
    color: '#fff',

    fontSize: 26,
    fontWeight: 'bold',
  },

  // ===== 右側 =====
  contentArea: {
    flex: 1,

    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 2,
  },
  // ===== 標題 =====
  title: {
    fontSize: 15,
    fontWeight: 'bold',
textAlign: 'center', 
    color: '#FF0909',
  },

  // ===== 地區 =====
  message: {
    marginTop: 2,
textAlign: 'center', 
    fontSize: 13,
fontWeight: 'bold',
    color: '#FF0909',
  },

  // ===== 震度 =====
levelText: {
  marginTop: 2,

  textAlign: 'center', 

  fontSize: 13,
  fontWeight: 'bold',
  color: '#661212',
},

});