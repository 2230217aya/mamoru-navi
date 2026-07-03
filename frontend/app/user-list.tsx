// frontend/app/my-page.tsx
import React from 'react';
import { useRouter } from 'expo-router';
// ★ src/screens から MyPageScreen を直接インポート ★
import UserListScreen from "../src/screens/UserListScreen";

export default function Page() {
  return <UserListScreen />;
}