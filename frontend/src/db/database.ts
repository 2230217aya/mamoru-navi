// frontend/src/db/database.ts
import * as SQLite from "expo-sqlite";

// データベースのファイル名
const DB_NAME = "mamoru_navi_local.db";

export class LocalDB {
  private static db: SQLite.SQLiteDatabase | null = null;

  // データベースの初期化（テーブル作成）
  static async init() {
    if (this.db) return this.db;

    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);

      // 1. checkins テーブルの作成 (PDF設計書に準拠)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS checkins (
          checkin_id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          shelter_id TEXT NOT NULL,
          checkin_time TEXT NOT NULL,
          method TEXT,
          sync_status TEXT DEFAULT 'pending',
          remarks TEXT
        );
      `);

      // 2. sync_queue テーブルの作成 (同期待ちリスト)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
          transaction_id TEXT NOT NULL,
          action_type TEXT NOT NULL,
          payload TEXT NOT NULL,
          created_at TEXT NOT NULL,
          sync_status TEXT DEFAULT 'pending'
        );
      `);

      // await this.db.execAsync("DELETE FROM sync_queue;");
      // await this.db.execAsync("DELETE FROM checkins;");
      // console.log("🧹 データベースのゴミデータを強制消去しました！");

      console.log("✅ Local SQLite DB initialized");
      return this.db;
    } catch (error) {
      console.error("❌ DB Init Error:", error);
      throw error;
    }
  }

  // データの保存 (チェックイン記録)
  static async saveCheckin(checkin: {
    checkin_id: string;
    user_id: string;
    shelter_id: string;
    checkin_time: string;
    method: string;
    sync_status: string;
    remarks: string;
  }) {
    const db = await this.init();
    await db?.runAsync(
      `INSERT INTO checkins (checkin_id, user_id, shelter_id, checkin_time, method, sync_status, remarks) 
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        checkin.checkin_id,
        checkin.user_id,
        checkin.shelter_id,
        checkin.checkin_time,
        checkin.method,
        checkin.sync_status,
        checkin.remarks,
      ],
    );
  }

  // 同期キューへの追加
  static async addToSyncQueue(
    transaction_id: string,
    action_type: string,
    payload: string,
  ) {
    const db = await this.init();
    const now = new Date().toISOString();
    await db?.runAsync(
      `INSERT INTO sync_queue (transaction_id, action_type, payload, created_at, sync_status) 
       VALUES (?, ?, ?, ?, 'pending');`,
      [transaction_id, action_type, payload, now],
    );
  }

  // 未同期データの取得（★ 修正：一度に最大5件だけ取得する）
  static async getPendingSyncs(limit?: number) {
    const db = await this.init();
    // LIMIT を付けて、溜まっていても5件ずつしか出さないようにする
    return await db?.getAllAsync(
      `SELECT * FROM sync_queue WHERE sync_status = "pending" LIMIT ?`,
      [limit],
    );
  }

  // 同期完了後のキュー削除
  static async markAsSynced(queue_id: number) {
    try {
      const db = await this.init();

      if (queue_id === undefined || queue_id === null) {
        console.error("❌ queue_id が存在しないため削除できません！");
        return;
      }

      // 確実に削除を実行
      await db?.runAsync("DELETE FROM sync_queue WHERE queue_id = ?;", [
        queue_id,
      ]);
      console.log(`🗑️ ✅ queue_id ${queue_id} の削除に成功しました！`);
    } catch (error) {
      console.error(`❌ markAsSynced Error (id: ${queue_id}):`, error);
    }
  }

  // サーバーへ一括同期する処理
  // サーバーへ一括同期する処理（★引数に pendingItems を追加）
  static async syncWithServer(baseUrl: string, pendingItems: any[]) {
    try {
      if (!pendingItems || pendingItems.length === 0) {
        return {
          success: true,
          count: 0,
          message: "同期するデータはありません",
        };
      }

      const response = await fetch(`${baseUrl}/scan/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Bypass-Tunnel-Reminder": "true",
        },
        body: JSON.stringify({ items: pendingItems }),
      });

      if (!response.ok) {
        throw new Error(`同期サーバーエラー: ${response.status}`);
      }

      const result = await response.json();

      // ★ 確実に LocalDB.markAsSynced を呼ぶように修正
      for (const item of pendingItems) {
        console.log(`削除指示: queue_id = ${item.queue_id}`); // 念のためログ
        await LocalDB.markAsSynced(item.queue_id);
      }

      return {
        success: true,
        count: result.synced_count,
        message: "同期が完了しました",
      };
    } catch (error) {
      console.error("同期失敗:", error);
      return { success: false, count: 0, message: "同期に失敗しました" };
    }
  }
}
