# backend/app/routers/scan.py

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from database import get_db_connection
from psycopg2.extras import RealDictCursor
import json
from typing import List

router = APIRouter(
    prefix="/scan",
    tags=["Scan"],
)

# --- リクエスト/レスポンスモデル ---

class QRScanRequest(BaseModel):
    qr_data: str                # 例: "mamoru_navi_user:123e4567..."
    scan_mode: str              # "facility" (平常時) または "shelter" (災害時)
    location_id: str            # スキャンしている場所のID

class IDScanRequest(BaseModel):
    image_base64: str           # 身分証画像のBase64文字列
    scan_mode: str              # "facility" または "shelter"
    location_id: str            # スキャンしている場所のID

class QRScanResponse(BaseModel):
    status: str
    message: str
    user_info: Optional[Dict[str, Any]] = None
    action_result: Optional[Dict[str, Any]] = None

# --- 一括同期用のリクエスト/レスポンスモデル ---
class SyncQueueItem(BaseModel):
    transaction_id: str # スマホ側で生成したcheckin_id
    action_type: str    # 'CHECK_IN' などの操作種別
    payload: str        # JSON文字列 (user_id, shelter_id など)
    created_at: str     # オフラインでスキャンした時刻

class SyncRequest(BaseModel):
    items: List[SyncQueueItem]

class SyncResponse(BaseModel):
    status: str
    message: str
    synced_count: int

class SyncItem(BaseModel):
    queue_id: int
    transaction_id: str
    action_type: str
    payload: str  # JSON文字列
    created_at: str
    sync_status: str

class SyncRequest(BaseModel):
    items: List[SyncItem]

# --- 共通処理関数 (リファクタリング) ---
# ユーザーIDが確定した後の「受付処理（DB操作）」だけを切り出した関数です
def perform_checkin(cur, user_id: str, location_id: str, scan_mode: str) -> Dict[str, Any]:
    action_result = {}

    if scan_mode == "facility":
        # 【平常時】施設の予約受付処理
        cur.execute("""
            SELECT reservation_id, start_time, end_time 
            FROM facility_reservations 
            WHERE user_id = %s AND facility_id = %s AND status = 'confirmed'
            AND DATE(start_time) = CURRENT_DATE;
        """, (user_id, location_id))
        reservation = cur.fetchone()

        if reservation:
            cur.execute("""
                UPDATE facility_reservations 
                SET status = 'completed' 
                WHERE reservation_id = %s;
            """, (reservation['reservation_id'],))
            action_result = {
                "type": "facility_checkin",
                "success": True,
                "detail": f"予約（{reservation['start_time']}〜）の受付を完了しました。"
            }
        else:
            action_result = {
                "type": "facility_checkin",
                "success": False,
                "detail": "本日の有効な予約が見つかりませんでした。"
            }

    elif scan_mode == "shelter":
        # 【災害時】避難所の受付処理
        cur.execute("""
            SELECT checkin_id FROM checkins 
            WHERE user_id = %s AND shelter_id = %s AND DATE(checkin_time) = CURRENT_DATE;
        """, (user_id, location_id))
        existing_checkin = cur.fetchone()

        if existing_checkin:
            action_result = {
                "type": "shelter_checkin",
                "success": True,
                "detail": "既に本日のチェックインが完了しています。"
            }
        else:
            cur.execute("""
                INSERT INTO checkins (user_id, shelter_id, checkin_time, method, sync_status) 
                VALUES (%s, %s, CURRENT_TIMESTAMP, 'qr', 'synced')
                RETURNING checkin_id;
            """, (user_id, location_id))
            action_result = {
                "type": "shelter_checkin",
                "success": True,
                "detail": "避難所の受付（チェックイン）が完了しました。"
            }
    else:
        raise HTTPException(status_code=400, detail="無効なスキャンモードです")

    return action_result

# --- エンドポイント ---

@router.post(
    "/qr-code",
    response_model=QRScanResponse,
    summary="QRコード読み取り結果を受信して処理を行う"
)
def process_scanned_qr(request: QRScanRequest):
    prefix = "mamoru_navi_user:"
    if not request.qr_data.startswith(prefix):
        raise HTTPException(status_code=400, detail="無効なQRコード形式です")
    
    user_id = request.qr_data.replace(prefix, "")
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("SELECT user_id, name, gender, blood_type, medical_conditions, phone_number FROM users WHERE user_id = %s;", (user_id,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")

        # ★ 共通関数を呼び出して受付処理を行う ★
        action_result = perform_checkin(cur, user_id, request.location_id, request.scan_mode)

        conn.commit()
        return QRScanResponse(
            status="success",
            message="スキャン処理が正常に完了しました",
            user_info=dict(user),
            action_result=action_result
        )
    except Exception as e:
        import traceback
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"エラー: {str(e)}\n{traceback.format_exc()}")
    finally:
        cur.close()
        conn.close()

@router.post(
    "/id-card",
    response_model=QRScanResponse,
    summary="身分証明書スキャン結果を受信して処理を行う"
)
async def process_id_card_scan(request: IDScanRequest):
    # 本来はここでOCR処理を行い、画像から名前を抽出します
    # 現在は開発用シミュレーションとして固定の名前を使用します
    extracted_name = "テストユーザー太郎" 

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 名前でユーザーを検索
        cur.execute("SELECT user_id, name, gender, blood_type, medical_conditions, phone_number FROM users WHERE name = %s LIMIT 1;", (extracted_name,))
        user = cur.fetchone()

        if not user:
            raise HTTPException(status_code=404, detail=f"ユーザー「{extracted_name}」が見つかりません")

        # ★ QRコードの時と同じ共通関数を呼び出して受付処理を行う ★
        action_result = perform_checkin(cur, user['user_id'], request.location_id, request.scan_mode)

        conn.commit()
        return QRScanResponse(
            status="success",
            message="身分証による受付が正常に完了しました",
            user_info=dict(user),
            action_result=action_result
        )
    except Exception as e:
        import traceback
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"エラー: {str(e)}\n{traceback.format_exc()}")
    finally:
        cur.close()
        conn.close()

@router.post("/sync", summary="オフラインで記録されたデータを一括同期する")
def sync_offline_data(request: SyncRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    
    synced_count = 0
    try:
        for item in request.items:
            if item.action_type == 'CHECK_IN':
                # フロントから来た payload (JSON文字列) を辞書に変換
                payload_data = json.loads(item.payload)
                user_id = payload_data.get('user_id')
                shelter_id = payload_data.get('shelter_id')
                # 端末で記録した時刻を使用
                checkin_time = item.created_at 
                
                # すでに同じID(transaction_id)が保存されていないかチェック
                cur.execute("SELECT checkin_id FROM checkins WHERE checkin_id = %s;", (item.transaction_id,))
                exists = cur.fetchone()

                if not exists:
                    # データベースに新規登録
                    cur.execute("""
                        INSERT INTO checkins (checkin_id, user_id, shelter_id, checkin_time, method, sync_status) 
                        VALUES (%s, %s, %s, %s, 'offline_sync', 'synced');
                    """, (item.transaction_id, user_id, shelter_id, checkin_time))
                
                synced_count += 1
                
        # ループが終わったら全て確定
        conn.commit()
        return {"status": "success", "synced_count": synced_count}

    except Exception as e:
        conn.rollback()
        print(f"Sync Error: {e}") # ターミナルにエラー詳細を出す
        raise HTTPException(status_code=500, detail="データベースの同期処理に失敗しました")
    finally:
        cur.close()
        conn.close()     

@router.get("/users/download", summary="住民リストの差分ダウンロード(オフライン用)")
def download_users_for_offline(updated_at: Optional[str] = None):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # クエリを動的に変更
        if updated_at:
            # 最後に取得した時刻よりも新しいデータだけを検索
            query = """
                SELECT user_id, name, gender, blood_type, medical_conditions, phone_number, created_at AS updated_at
                FROM users
                WHERE created_at > %s::timestamp;
            """
            cur.execute(query, (updated_at,))
        else:
            # updated_at がなければ全件取得（初回用）
            cur.execute("""
                SELECT user_id, name, gender, blood_type, medical_conditions, phone_number, created_at AS updated_at 
                FROM users;
            """)
            
        users = cur.fetchall()

        return {
            "status": "success",
            "count": len(users),
            "users": users
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()    