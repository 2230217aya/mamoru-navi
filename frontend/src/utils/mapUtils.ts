// frontend/src/utils/mapUtils.ts

import * as FileSystem from "expo-file-system/legacy";
import * as Network from "expo-network";
import { LocalDB } from "@/src/db/database"; // ★重要: これが抜けていました
// ===== baseAPIまとめ =====
import { getBaseUrl, API_HEADERS } from "@/src/utils/api";

/**
 * GeoJSONの座標配列を変換
 */
export function convertGeoJsonToMapPoints(geojson: any) {
  if (!geojson || !geojson.coordinates || !Array.isArray(geojson.coordinates)) {
    return [];
  }
  return geojson.coordinates.map((coord: [number, number]) => ({
    latitude: coord[1],
    longitude: coord[0],
  }));
}

/**
 * 目的地の取得
 */
export function getDestinationPoint(geojson: any) {
  const points = geojson;
  return points.length > 0 ? points[points.length - 1] : null;
}

/**
 * タイル座標計算
 */
function latLonToTile(lat: number, lon: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const xtile = Math.floor(((lon + 180) / 360) * n);
  const ytile = Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180),
      ) /
        Math.PI) /
      2) *
      n,
  );
  return { x: xtile, y: ytile };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 1枚のタイルをダウンロード
 */
export async function downloadTile(z: number, x: number, y: number) {
  const folderPath = `${FileSystem.documentDirectory}tiles/${z}/${x}/`;
  const filePath = `${folderPath}${y}.png`;
  const tileUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

  try {
    // フォルダ作成
    const folderInfo = await FileSystem.getInfoAsync(folderPath);
    if (!folderInfo.exists) {
      await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });
    }

    // ★重要：ダウンロード済みの場合は一度中身を確認するか、
    // テスト時は強制的に上書きするように一時的にフラグを変える
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) return; // 本番はこれでOK（リセット後なら綺麗なのが入る）

    // ★ ここに User-Agent を追加してダウンロード
    await FileSystem.downloadAsync(tileUrl, filePath, {
      headers: {
        "User-Agent": "MamoruNavi_Official_App_v1", // 固有の名前に
        Accept: "image/png",
      },
    });

    // ★サーバーへの負荷を考慮し、待ち時間を少し増やす (0.3秒〜0.5秒)
    await new Promise((resolve) => setTimeout(resolve, 300));
  } catch (error) {
    console.log(`⚠️ Tile failed: ${z}/${x}/${y}`);
  }
}

/**
 * 座標リスト周辺のタイルをまとめてキャッシュ
 */
export async function autoCacheTiles(routePoints: any[]) {
  try {
    const network = await Network.getNetworkStateAsync();
    if (
      !network.isInternetReachable ||
      (network.type !== Network.NetworkStateType.WIFI &&
        network.type !== "WIFI")
    ) {
      return;
    }

    const zoomLevels = [15, 16];
    for (const zoom of zoomLevels) {
      const tileSet = new Set<string>();
      for (const point of routePoints) {
        const { x, y } = latLonToTile(point.latitude, point.longitude, zoom);
        // 周辺9タイルをキャッシュするように広げる (より確実に)
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            tileSet.add(`${zoom},${x + dx},${y + dy}`);
          }
        }
      }

      for (const tileKey of tileSet) {
        const [z, x, y] = tileKey.split(",").map(Number);
        await downloadTile(z, x, y);
      }
    }

    // --- キャッシュ完了後にフラグを立てる ---
    const db = await LocalDB.init();
    for (const point of routePoints) {
      const meshId = `${point.latitude.toFixed(2)}:${point.longitude.toFixed(2)}`;

      // もし stay_stats に存在すればフラグを1にする、なければ作成する
      await db.runAsync(
        `INSERT INTO stay_stats (mesh_id, is_cached, total_hours) 
         VALUES (?, 1, 1) 
         ON CONFLICT(mesh_id) DO UPDATE SET is_cached = 1;`,
        [meshId],
      );
    }
    console.log("✅ タイルキャッシュ完了");
  } catch (error) {
    console.error("❌ autoCacheTiles Error:", error);
  }
}

/**
 * 滞在時間の加算 (15〜30分に1回呼ばれる想定)
 */
export async function updateStayStats(
  lat: number,
  lon: number,
  hours: number = 0.5,
) {
  const db = await LocalDB.init();
  // 座標を少し丸める（約1km四方のメッシュ単位にする）
  const meshId = `${lat.toFixed(2)}:${lon.toFixed(2)}`;

  await db.runAsync(
    `INSERT INTO stay_stats (mesh_id, total_hours, last_stayed_at)
     VALUES (?, ?, ?)
     ON CONFLICT(mesh_id) DO UPDATE SET 
     total_hours = total_hours + ?, 
     last_stayed_at = ?;`,
    [meshId, hours, new Date().toISOString(), hours, new Date().toISOString()],
  );
}

/**
 * 自動スマート・キャッシュ（Wi-Fi時のみ呼び出される）
 */
export async function smartAutoCache() {
  try {
    const db = await LocalDB.init();
    // 滞在10時間以上の未キャッシュ地点を取得
    const targets: any[] = await db.getAllAsync(
      "SELECT mesh_id FROM stay_stats WHERE total_hours >= 10 AND is_cached = 0 LIMIT 1",
    );

    if (targets.length === 0) return;

    const meshId = targets[0].mesh_id;
    const [lat, lon] = meshId.split(":").map(Number);

    // --- ① 地図タイルのキャッシュ (既存処理) ---
    const cacheArea = [{ latitude: lat, longitude: lon }];
    await autoCacheTiles(cacheArea);

    // --- ② 【追加】その場所からの「避難ルート」もAPIで取得してSQLiteへ ---
    const baseUrl = getBaseUrl();
    const testUserId = "11111111-1111-1111-1111-111111111111";

    // APIに「この地点(lat,lon)からのルートをくれ」とリクエスト（API側の対応が必要）
    const response = await fetch(
      `${baseUrl}/map/my-plan/${testUserId}?lat=${lat}&lon=${lon}`,
      {
        headers: API_HEADERS,
      },
    );
    const data = await response.json();

    if (data.status === "success") {
      // 保存！ (LocalDBに mesh_id ごとに保存するメソッドがあるとベスト)
      await LocalDB.saveMyEvacuationPlan(data.plan);
    }

    await db.runAsync("UPDATE stay_stats SET is_cached = 1 WHERE mesh_id = ?", [
      meshId,
    ]);
    console.log(`✅ 生活圏(${meshId})の地図とルートをすべて備蓄しました`);
  } catch (err) {
    console.error("SmartAutoCache error:", err);
  }
}

/**
 * 現在保存されている地図タイルの合計数を取得する
 */
export async function getCachedTileCount() {
  const tilesDir = `${FileSystem.documentDirectory}tiles/`;
  try {
    const info = await FileSystem.getInfoAsync(tilesDir);
    if (!info.exists) return 0;

    // 簡易的に全サブディレクトリを漁るか、特定の深さまで探す
    // ※ 厳密に数えると重いので、最初は「tilesフォルダがあるか」だけでもOK
    return 100; // 仮の数値（本来はディレクトリを再帰的にカウント）
  } catch {
    return 0;
  }
}

/**
 * 現在の「安心度（0〜100）」を計算する
 */
export async function calculateSafetyPercentage(
  userId: string,
): Promise<number> {
  let score = 0;

  try {
    const db = await LocalDB.init();

    // 1. マイ避難計画のチェック (+50%)
    const plan = await LocalDB.getMyEvacuationPlan(userId);
    if (plan && plan.route_data) {
      score += 50;
    }

    // 2. 滞在エリアのタイルキャッシュ状況チェック (MAX 40点)
    // 条件を「 total_hours >= 0 (1回でも通ったことがある) 」に一旦緩める
    const stayData: any[] = await db.getAllAsync(
      "SELECT COUNT(*) as total, SUM(is_cached) as cached FROM stay_stats WHERE mesh_id IS NOT NULL",
    );

    if (stayData && stayData[0].total > 0) {
      const ratio = stayData[0].cached / stayData[0].total;
      score += Math.round(ratio * 40);
    }

    // 3. 避難所詳細などのマスタキャッシュ (MAX 10点)
    const shelters: any[] = await db.getAllAsync(
      "SELECT COUNT(*) as count FROM shelters",
    );
    if (shelters && shelters[0].count > 0) {
      score += 10;
    }

    return Math.min(score, 100);
  } catch (error) {
    console.error("Safety calculation error:", error);
    return score;
  }
}

/**
 * 2点間の距離をメートルで取得 (ハバサイン公式)
 */
export function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371e3; // 地球の半径
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * 避難所への接近チェック
 */
export function checkShelterArrival(currentPos: any, destination: any) {
  const distance = getDistance(
    currentPos.latitude,
    currentPos.longitude,
    destination.latitude,
    destination.longitude,
  );

  if (distance < 50) return "ARRIVED"; // 50m以内で到着
  if (distance < 200) return "NEARBY"; // 200m以内で接近通知
  return "NAVIGATING";
}

/**
 * デバッグ用: 保存されているファイルパスのリストをコンソールに出す
 */
export async function debugListCachedFiles() {
  try {
    const tilesDir = `${FileSystem.documentDirectory}tiles/`;
    const zFolders = await FileSystem.readDirectoryAsync(tilesDir);
    console.log("📂 保存済みズームレベル:", zFolders);

    // 最初のズームレベルの中身を1つだけ見る
    if (zFolders.length > 0) {
      const xFolders = await FileSystem.readDirectoryAsync(
        `${tilesDir}${zFolders[0]}/`,
      );
      console.log(`📂 Z:${zFolders[0]} 内の Xフォルダ数: ${xFolders.length}`);
    }
  } catch (e) {
    console.log("📂 タイルフォルダがまだ存在しません");
  }
}

/**
 * 最も近い点の「配列番号（index）」を返すように改良
 */
export function findNearestPointIndex(origin: any, points: any[]) {
  if (!points || points.length === 0) return -1;

  let nearestIndex = 0;
  let minDistance = Infinity;

  points.forEach((point, index) => {
    const dist = getDistance(
      origin.latitude,
      origin.longitude,
      point.latitude,
      point.longitude,
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}
