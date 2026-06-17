// frontend/app/my-page.tsx
import React from 'react';
import { useRouter } from 'expo-router';
// ★ src/screens から MyPageScreen を直接インポート ★
import SuppliesStatus from "../src/screens/SuppliesStatus";

export default function Page() {
  return <SuppliesStatus />;
}