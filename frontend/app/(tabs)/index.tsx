// frontend/app/(tabs)/index.tsx
import React from 'react';
// さきほど作成した MyPageScreen を読み込む
import MyPageScreen from '../../src/screens/MyPageScreen';

export default function HomeScreen() {
  // ナビゲーションの代わりに、今は直接画面を表示する
  return <MyPageScreen navigation={{ navigate: () => {} }} />;
}