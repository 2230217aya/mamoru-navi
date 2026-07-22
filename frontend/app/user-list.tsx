import React from 'react';
import { useLocalSearchParams } from 'expo-router';
// ★ src/screens から MyPageScreen を直接インポート ★
import UserListScreen from "../src/screens/UserListScreen";

export default function Page() {
  // 避難所のIDを受けとり
  const { shelter_id } = useLocalSearchParams();

  return(<UserListScreen SHELTER_ID_GET={shelter_id as string} />);
}