// frontend/app/profile-edit.tsx
import React from "react";
import { useRouter } from "expo-router";
// ★ UserHomeScreen のパスを修正 ★
import UserHomeScreenComponent from "../src/screens/UserHomeScreen";

export default function UserHomeScreen() {
  const router = useRouter();

  return <UserHomeScreenComponent />;
}
