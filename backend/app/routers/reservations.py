from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_db

router = APIRouter(
    prefix="/reservations",
    tags=["Reservations"],
    responses={404: {"description": "Not found"}},
)

# ===== SCHEMA =====

class ReservationCreate(BaseModel):
    facility_id: str
    user_id: str
    start_time: datetime
    end_time: datetime
    purpose: Optional[str] = None

class ReservationStatusUpdate(BaseModel):
    status: str  # pending, confirmed, canceled, completed

# ===== ENDPOINTS =====

@router.post("/", summary="登録ページから新しい予約を作成する")
def create_reservation(data: ReservationCreate):
    if data.start_time >= data.end_time:
        raise HTTPException(status_code=400, detail="start_time は end_time より前である必要があります")

    with get_db() as conn:
        with conn.cursor() as cur:
            # purpose別・今日の現在の最大queue_numberを取得
            cur.execute("""
                SELECT COALESCE(MAX(queue_number), 0) FROM facility_reservations
                WHERE facility_id = %s AND purpose = %s AND status != 'canceled'
                AND DATE(created_at) = CURRENT_DATE
            """, (data.facility_id, data.purpose))
            last_number_before = cur.fetchone()[0]
            queue_number = last_number_before + 1

            cur.execute("""
                INSERT INTO facility_reservations (facility_id, user_id, start_time, end_time, purpose, queue_number)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING reservation_id, created_at
            """, (data.facility_id, data.user_id, data.start_time, data.end_time, data.purpose, queue_number))
            reservation_id, created_at = cur.fetchone()
            conn.commit()

            people_ahead = queue_number - 1
            estimated_wait_minutes = people_ahead * 10

            return {
                "message": "reservation created",
                "reservation_id": str(reservation_id),
                "facility_id": data.facility_id,
                "user_id": data.user_id,
                "purpose": data.purpose,
                "start_time": str(data.start_time),
                "end_time": str(data.end_time),
                "reserved_at": str(created_at),
                "your_queue_number": queue_number,
                "estimated_wait_minutes": estimated_wait_minutes
            }

@router.get("/user/{user_id}", summary="ユーザーのすべての予約を取得")
def get_reservations_by_user(user_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT reservation_id, facility_id, start_time, end_time, status, purpose, created_at, queue_number
                FROM facility_reservations WHERE user_id = %s
            """, (user_id,))
            reservations = cur.fetchall()
            if not reservations:
                raise HTTPException(status_code=404, detail="予約が見つかりません!")
            return [
                {
                    "reservation_id": str(r[0]),
                    "facility_id": str(r[1]),
                    "start_time": str(r[2]),
                    "end_time": str(r[3]),
                    "status": r[4],
                    "purpose": r[5],
                    "created_at": str(r[6]),
                    "queue_number": r[7]
                }
                for r in reservations
            ]

@router.get("/facility/{facility_id}", summary="施設別の予約一覧と最新受付番号を取得")
def get_reservations_by_facility(facility_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT reservation_id, user_id, start_time, end_time, status, purpose, queue_number
                FROM facility_reservations WHERE facility_id = %s
                ORDER BY purpose, queue_number ASC
            """, (facility_id,))
            reservations = cur.fetchall()
            if not reservations:
                raise HTTPException(status_code=404, detail="予約が見つかりません!")

            reservation_list = [
                {
                    "reservation_id": str(r[0]),
                    "user_id": str(r[1]),
                    "start_time": str(r[2]),
                    "end_time": str(r[3]),
                    "status": r[4],
                    "purpose": r[5],
                    "queue_number": r[6]
                }
                for r in reservations
            ]

            # purpose別の最新受付番号を計算（canceled以外、今日分のみ）
            cur.execute("""
                SELECT purpose, MAX(queue_number) as last_number
                FROM facility_reservations
                WHERE facility_id = %s AND status != 'canceled'
                AND DATE(created_at) = CURRENT_DATE
                GROUP BY purpose
            """, (facility_id,))
            last_queue_rows = cur.fetchall()
            last_queue_by_purpose = [
                {"purpose": row[0], "last_queue_number": row[1]}
                for row in last_queue_rows
            ]

            return {
                "facility_id": facility_id,
                "last_queue_by_purpose": last_queue_by_purpose,
                "reservations": reservation_list
            }

@router.patch("/{reservation_id}/status", summary="予約状況を更新")
def update_reservation_status(reservation_id: str, data: ReservationStatusUpdate):
    allowed_status = ["pending", "confirmed", "canceled", "completed"]
    if data.status not in allowed_status:
        raise HTTPException(status_code=400, detail=f"無効なステータスです。選択可能な値:{allowed_status}")

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT reservation_id FROM facility_reservations WHERE reservation_id = %s", (reservation_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="予約が見つかりません!")
            cur.execute("UPDATE facility_reservations SET status = %s WHERE reservation_id = %s", (data.status, reservation_id))
            conn.commit()
            return {"message": "status updated", "reservation_id": reservation_id, "status": data.status}

@router.delete("/{reservation_id}", summary="予約をキャンセルする")
def cancel_reservation(reservation_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT status FROM facility_reservations WHERE reservation_id = %s", (reservation_id,))
            reservation = cur.fetchone()
            if not reservation:
                raise HTTPException(status_code=404, detail="予約が見つかりません!")
            if reservation[0] == "completed":
                raise HTTPException(status_code=400, detail="完了した予約はキャンセルできません!")
            cur.execute("UPDATE facility_reservations SET status = 'canceled' WHERE reservation_id = %s", (reservation_id,))
            conn.commit()
            return {"message": "reservation canceled", "reservation_id": reservation_id}