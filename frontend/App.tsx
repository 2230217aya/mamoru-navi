// frontend/App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
// Stack Navigatorから、Bottom Tab Navigator に変更
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; 

// 各画面コンポーネントをインポート
import MyPageScreen from './src/screens/MyPageScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import OfflineDataScreen from './src/screens/OfflineData';
// 他にも追加する画面があればインポート

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        {/* マイページ（QRコード）画面 */}
        <Tab.Screen 
          name="MyPage" 
          component={MyPageScreen} 
          options={{ title: 'マイページ' }} // タブバーに表示される名前
        />
        {/* 個人情報編集画面（これはタブにはしない方が自然かも。マイページからモーダルなどで開く） */}
        {/* 
        <Tab.Screen 
          name="ProfileEdit" 
          component={ProfileEditScreen} 
          options={{ title: '編集' }} 
        /> 
        */}
        {/* オフラインデータ管理画面 */}
        <Tab.Screen 
          name="OfflineData" 
          component={OfflineDataScreen} 
          options={{ title: 'データ管理' }} 
        />
        {/* 今後、他のタブ画面（例：マップ、設定など）を追加 */}
      </Tab.Navigator>
    </NavigationContainer>
  );
}