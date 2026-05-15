// frontend/app/_layout.tsx
import React from 'react';
// ★ Tabs ではなく Stack をインポート ★
import { Stack } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons';

// ★ app/ フォルダ直下のコンポーネントをインポート ★
import HomeScreen from './index'; // app/(tabs)/index.tsx を指す
import MyPageScreen from './my-page'; // app/my-page.tsx を指す
import OfflineDataScreen from './offline-data'; // app/offline-data.tsx を指す
import DashboardScreen from './dashbord'; // app/dashboard.tsx を指す

export default function RootLayout() { // 関数名も RootLayout に変更
  return (
    // ★ Navigator を Stack に変更 ★
    <Stack
      screenOptions={({ route }) => ({
        // ★ 各画面のヘッダーは個別に設定するため、ここでは非表示 ★
        headerShown: false, 
        // 画面遷移のアニメーション (Figmaデザインに合わせて)
        animation: 'slide_from_right', 
      })}
      // ★★★ アプリ起動時に最初に表示する画面を "index" に指定 ★★★
      initialRouteName="index"
    >
      {/* 
        ここに、アプリを構成する画面（ファイル名）を登録します。
        "index" が最初の画面になります。
      */}
      <Stack.Screen name="index"  options={{ title: 'ホーム' }} />
      <Stack.Screen name="my-page" options={{ title: 'マイQR' }} />
      <Stack.Screen name="profile-edit"  options={{ title: '個人情報編集' }} />
      <Stack.Screen name="offline-data"  options={{ title: 'データ管理' }} />
      <Stack.Screen name="dashbord"options={{ title: 'ダッシュボード' }} />
    </Stack>
  );
}