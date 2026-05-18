// frontend/app/profile-edit.tsx
import React from 'react';
import { useRouter } from 'expo-router';
// ★ UserHomeScreen のパスを修正 ★
import UserHomeScreenComponent from '../src/screens/UserHomeScreen'; 

export default function UserHomeScreen() {
  const router = useRouter();

  return (
    <UserHomeScreenComponent 
      // navigation prop を渡す必要があるので、router を使って adapter を作成
      navigation={{ 
        goBack: () => router.back(), // 一つ前の画面に戻る
      }}
    />
  );
}