// frontend/app/profile-edit.tsx
import React from 'react';
import { useRouter } from 'expo-router';
// ★ ProfileEditScreen のパスを修正 ★
import ProfileEditScreenComponent from '../src/screens/ProfileEditScreen'; 

export default function ProfileEditScreen() {
  const router = useRouter();

  return (
    <ProfileEditScreenComponent 
      // navigation prop を渡す必要があるので、router を使って adapter を作成
      navigation={{ 
        goBack: () => router.back(), // 一つ前の画面に戻る
      }}
    />
  );
}