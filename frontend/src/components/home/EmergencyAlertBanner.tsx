import React from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ===== Props =====
type Props = {

  // 標題
  title: string;

  // 地區內容
  message: string;

  // 左側數字
  level: string;

  // 震度文字
  levelText: string;
};

export default function EmergencyAlertBanner({

  title,
  message,
  level,
  levelText,

}: Props) {

  return (

    <View style={styles.container}>

      {/* ===== 左側震度 ===== */}
      <View style={styles.levelBox}>

        <Text style={styles.levelNumber}>
          {level}
        </Text>

      </View>

      {/* ===== 右側內容 ===== */}
      <View style={styles.contentArea}>

        {/* ===== 標題 ===== */}
        <Text style={styles.title}>
          {title}
        </Text>

        {/* ===== 地區 ===== */}
        <Text style={styles.message}>
          {message}
        </Text>

        {/* ===== 震度 ===== */}
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