# backend/app/routers/scan.py

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from database import get_db_connection
import psycopg2
from psycopg2.extras import RealDictCursor

# ※ main.py にある get_db_connection をインポートできるように調整するか、
# 簡単のため、今回はここで直接インポートできる想定で記述します。
# 実際のファイル構成に合わせて from ..main import get_db_connection のようにしてください。

router = APIRouter(
    prefix="/scan",
    tags=["Scan"],
)

# --- リクエスト/レスポンスモデル ---

class QRScanRequest(BaseModel):
    qr_data: str                # 例: "mamoru_navi_user:123e4567..."
    scan_mode: str              # "facility" (平常時) または "shelter" (災害時)
    location_id: str            # スキャンしている場所のID (facility_id または shelter_id)

class QRScanResponse(BaseModel):
    status: str
    message: str
    user_info: Optional[Dict[str, Any]] = None
    action_result: Optional[Dict[str, Any]] = None

# --- エンドポイント ---

@router.post(
    "/qr-code",
    response_model=QRScanResponse,
    summary="QRコード読み取り結果を受信して処理を行う"
)
def process_scanned_qr(request: QRScanRequest):
    # 1. QRデータからユーザーIDを抽出
    prefix = "mamoru_navi_user:"
    if not request.qr_data.startswith(prefix):
        raise HTTPException(status_code=400, detail="無効なQRコード形式です")
    
    user_id = request.qr_data.replace(prefix, "")

    conn = get_db_connection()
    # RealDictCursorを使うと、結果が辞書形式(dict)で取得できて便利です
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 2. ユーザー情報の取得 (PDFのusersテーブル設計に準拠)
        cur.execute("""
            SELECT user_id, name, gender, blood_type, medical_conditions, phone_number 
            FROM users 
            WHERE user_id = %s;
        """, (user_id,))
        user = cur.fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")

        action_result = {}

        # 3. モードに応じた処理の分岐
        if request.scan_mode == "facility":
            # 【平常時】施設の予約受付処理
            # 本日の 'confirmed' な予約があるか確認
            cur.execute("""
                SELECT reservation_id, start_time, end_time 
                FROM facility_reservations 
                WHERE user_id = %s AND facility_id = %s AND status = 'confirmed'
                AND DATE(start_time) = CURRENT_DATE;
            """, (user_id, request.location_id))
            reservation = cur.fetchone()

            if reservation:
                # 予約があればステータスを 'completed' (利用済) に更新
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

        elif request.scan_mode == "shelter":
            # 【災害時】避難所の受付処理 (checkinsテーブルへの挿入)
            # すでにチェックイン済みでないか簡易チェック (今回は当日チェックインがあるか)
            cur.execute("""
                SELECT checkin_id FROM checkins 
                WHERE user_id = %s AND shelter_id = %s AND DATE(checkin_time) = CURRENT_DATE;
            """, (user_id, request.location_id))
            existing_checkin = cur.fetchone()

            if existing_checkin:
                action_result = {
                    "type": "shelter_checkin",
                    "success": True,
                    "detail": "既に本日のチェックインが完了しています。"
                }
            else:
                # 新規チェックインを記録 (sync_statusはオンラインなので'synced')
                cur.execute("""
                    INSERT INTO checkins (user_id, shelter_id, checkin_time, method, sync_status) 
                    VALUES (%s, %s, CURRENT_TIMESTAMP, 'qr', 'synced')
                    RETURNING checkin_id;
                """, (user_id, request.location_id))
                
                action_result = {
                    "type": "shelter_checkin",
                    "success": True,
                    "detail": "避難所の受付（チェックイン）が完了しました。"
                }
        else:
            raise HTTPException(status_code=400, detail="無効なスキャンモードです")

        # 変更を確定
        conn.commit()

        # 4. レスポンスの返却
        # （※持病などのmedical_conditionsが含まれるため、フロント側で警告表示などに利用できる）
        return QRScanResponse(
            status="success",
            message="スキャン処理が正常に完了しました",
            user_info=dict(user),
            action_result=action_result
        )

    except Exception as e:
        import traceback
        conn.rollback()
        # エラーの履歴（スタックトレース）を丸ごとエラーメッセージとしてブラウザに返します
        error_details = traceback.format_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"デバッグエラー: {str(e)}\n\n【詳細】\n{error_details}"
        )
    finally:
        cur.close()
        conn.close()