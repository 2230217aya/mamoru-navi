// frontend/app/my-page.tsx
import React from "react";
import { useRouter } from "expo-router";
// ★ src/screens から MyPageScreen を直接インポート ★
import IdScanScreenComponent from "../src/screens/IdScanScreen";

// MyPageScreenComponent をラップして export する関数
export default function dashboard() {
  // export する関数名はファイル名と同じにするのが一般的
  const router = useRouter();

  // navigation prop が不要な場合は空でOK、あるいは goBack だけ定義
  const navigation = {
    goBack: () => router.back(),
  };

  return <IdScanScreenComponent />; // UIコンポーネントをそのまま render
}
