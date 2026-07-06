// frontend/src/utils/api.ts
import Constants from "expo-constants";

/**
 * 開発環境に応じたAPIのベースURLを返す
 * Access Blocked を防ぐために トンネル(loca.lt)を使わない設定にする
 */
export const getBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localIp = debuggerHost ? debuggerHost.split(":")[0] : "localhost";

  // ホットスポット環境(192.168.137.1)ならそれを、
  // USB接続(localhost)ならそのまま返す
  if (localIp === "localhost" || localIp === "127.0.0.1") {
    return "http://localhost:8000";
  }

  // localIpが192.168.x.x系ならそれを使う
  return `http://${localIp}:8000`;
};

/**
 * Access Blocked を防ぐための共通ヘッダー
 */
export const API_HEADERS = {
  "Content-Type": "application/json",
  "Bypass-Tunnel-Reminder": "true",
};
