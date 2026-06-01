// frontend/app/offline-data.tsx
import React from 'react';
import ReservationScreen from '../src/screens/ReservationScreen';
import { useRouter } from 'expo-router';

export default function ReservationScreenWrapped() { // 関数名を分けることで、元のコンポーネントと区別
  const router = useRouter();
  
  // navigation prop が不要な場合は空でOK、あるいは goBack だけ定義
  const navigation = { 
    goBack: () => router.back(),
  };

  return <ReservationScreen/>; // UIコンポーネントをそのまま render
}