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
    purpose_id: Optional[str] = None
    start_time: datetime
    end_time: datetime

class ReservationStatusUpdate(BaseModel):
    status: str  # waiting, in_progress, confirmed, canceled, completed

# ===== ENDPOINTS =====

@router.post("/", summary="登録ページから新しい予約を作成する")
def create_reservation(data: ReservationCreate):
    if data.start_time >= data.end_time:
        raise HTTPException(status_code=400, detail="start_time は end_time より前である必要があります")

    with get_db() as conn:
        with conn.cursor() as cur:
            # purpose別・今日の現在の最大issued_numberを取得
            cur.execute("""
                SELECT COALESCE(MAX(issued_number), 0) FROM facility_reservations
                WHERE facility_id = %s AND purpose_id = %s AND status != 'canceled'
                AND DATE(created_at) = CURRENT_DATE
            """, (data.facility_id, data.purpose_id))

            last_number_before = cur.fetchone()[0]
            issued_number = last_number_before + 1

            cur.execute("""
                INSERT INTO facility_reservations 
                (
                    facility_id,
                    user_id,
                    purpose_id,
                    issued_number,
                    start_time,
                    end_time
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING reservation_id, created_at
            """, (data.facility_id, data.user_id, data.purpose_id, issued_number, data.start_time, data.end_time))

            reservation_id, created_at = cur.fetchone()
            conn.commit()

            people_ahead = issued_number - 1
            estimated_wait_minutes = people_ahead * 10

            return {
                "message": "reservation created",
                "reservation_id": str(reservation_id),
                "facility_id": data.facility_id,
                "user_id": data.user_id,
                "purpose_id": data.purpose_id,
                "issued_number": issued_number,
                "estimated_wait_minutes": estimated_wait_minutes,
                "start_time": str(data.start_time),
                "end_time": str(data.end_time),
                "created_at": str(created_at)
            }

@router.get("/user/{user_id}", summary="ユーザーのすべての予約を取得")
def get_reservations_by_user(user_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                reservation_id,
                facility_id,
                purpose_id,
                issued_number,
                start_time,
                end_time,
                status,
                created_at
                FROM facility_reservations
                WHERE user_id=%s
            """, (user_id,))

            reservations = cur.fetchall()
            if not reservations:
                raise HTTPException(status_code=404, detail="予約が見つかりません!")
            return [
                {
                    "reservation_id": str(r[0]),
                    "facility_id": str(r[1]),
                    "purpose_id": str(r[2]) if r[2] else None,
                    "issued_number": r[3],
                    "start_time": str(r[4]),
                    "end_time": str(r[5]),
                    "status": r[6],
                    "created_at": str(r[7]),
                }
                for r in reservations
            ]

@router.get("/facility/{facility_id}", summary="施設別の予約一覧と最新受付番号を取得")
def get_reservations_by_facility(facility_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                reservation_id,
                user_id,
                purpose_id,
                issued_number,
                start_time,
                end_time,
                status
                FROM facility_reservations
                WHERE facility_id=%s
                ORDER BY purpose_id, issued_number ASC;
            """, (facility_id,))

            reservations = cur.fetchall()
            if not reservations:
                raise HTTPException(status_code=404, detail="予約が見つかりません!")

            reservation_list = [
                {
                    "reservation_id": str(r[0]),
                    "user_id": str(r[1]),
                    "purpose_id": str(r[2]) if r[2] else None,
                    "issued_number": r[3],
                    "start_time": str(r[4]),
                    "end_time": str(r[5]),
                    "status": r[6]
                }
                for r in reservations
            ]

            # purpose別の最新受付番号を計算（canceled以外、今日分のみ）
            cur.execute("""
                SELECT purpose_id, MAX(issued_number) as last_issued_number
                FROM facility_reservations
                WHERE facility_id = %s AND status != 'canceled'
                AND DATE(created_at) = CURRENT_DATE
                GROUP BY purpose_id
            """, (facility_id,))

            last_queue_rows = cur.fetchall()
            last_queue_by_purpose = [
                {
                    "purpose_id": str(row[0]) if row[0] else None,
                    "last_issued_number": row[1]
                }
                for row in last_queue_rows
            ]

            return {
                "facility_id": facility_id,
                "last_issued_number_by_purpose": last_queue_by_purpose,
                "reservations": reservation_list
            }

@router.patch("/{reservation_id}/status", summary="予約状況を更新")
def update_reservation_status(reservation_id: str, data: ReservationStatusUpdate):
    allowed_status = ["waiting", "in_progress", "confirmed", "canceled", "completed"]
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