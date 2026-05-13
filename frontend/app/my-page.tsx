// frontend/app/my-page.tsx
import React from 'react';
import { useRouter } from 'expo-router';
// ★ src/screens から MyPageScreen を直接インポート ★
import MyPageScreenComponent from '../src/screens/MyPageScreen'; 

// MyPageScreenComponent をラップして export する関数
export default function MyPageScreen() { // export する関数名はファイル名と同じにするのが一般的
  const router = useRouter();

  // MyPageScreenComponent に navigation prop を渡すためのアダプター
  const navigation = {
    navigate: (routeName: string) => {
      if (routeName === 'ProfileEdit') {
        router.push('./profile-edit'); // profile-edit.tsx へ遷移
      }
    },
    goBack: () => router.back(),
  };

  // UIコンポーネントをそのままレンダリング
  return <MyPageScreenComponent navigation={navigation} />;
}