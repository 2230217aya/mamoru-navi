from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db

router = APIRouter(
    prefix="/checkins",
    tags=["Checkins"],
    responses={404: {"description": "Not found"}},
)

# ===== SCHEMA =====

class CheckinCreate(BaseModel):
    user_id: str
    shelter_id: str
    method: str
    remarks: Optional[str] = None

# ===== ENDPOINTS =====

@router.post("/", summary="シェルターにチェックインする")
def create_checkin(data: CheckinCreate):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO checkins (user_id, shelter_id, method, remarks)
                VALUES (%s, %s, %s, %s)
                RETURNING checkin_id
            """, (data.user_id, data.shelter_id, data.method, data.remarks))
            conn.commit()
            return {"message": "checkin created", "checkin_id": str(cur.fetchone()[0])}

@router.get("/user/{user_id}", summary="ユーザーのすべてのチェックインを取得")
def get_checkins_by_user(user_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM checkins WHERE user_id = %s", (user_id,))
            checkins = cur.fetchall()
            if not checkins:
                raise HTTPException(status_code=404, detail="チェックイン見つけてない!")
            return [
                {
                    "checkin_id": str(c[0]),
                    "user_id": str(c[1]),
                    "shelter_id": str(c[2]),
                    "checkin_time": str(c[3]),
                    "checkout_time": str(c[4]) if c[4] else None,
                    "method": c[5],
                    "sync_status": c[6],
                    "remarks": c[7]
                }
                for c in checkins
            ]

@router.get("/shelter/{shelter_id}", summary="シェルターでのチェックインはすべてを取得")
def get_checkins_by_shelter(shelter_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM checkins WHERE shelter_id = %s", (shelter_id,))
            checkins = cur.fetchall()
            if not checkins:
                raise HTTPException(status_code=404, detail="チェックイン見つけてない!")
            return [
                {
                    "checkin_id": str(c[0]),
                    "user_id": str(c[1]),
                    "shelter_id": str(c[2]),
                    "checkin_time": str(c[3]),
                    "checkout_time": str(c[4]) if c[4] else None,
                    "method": c[5],
                    "sync_status": c[6]
                }
                for c in checkins
            ]

@router.patch("/{checkin_id}/checkout", summary="シェルターからチェックアウトする")
def checkout(checkin_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT checkout_time FROM checkins WHERE checkin_id = %s", (checkin_id,))
            checkin = cur.fetchone()
            if not checkin:
                raise HTTPException(status_code=404, detail="チェックイン見つけてない!")
            if checkin[0]:
                raise HTTPException(status_code=400, detail="既にcheckoutしている!")
            cur.execute("UPDATE checkins SET checkout_time = NOW() WHERE checkin_id = %s", (checkin_id,))
            conn.commit()
            return {"message": "checkout completed", "checkin_id": checkin_id}

@router.patch("/{checkin_id}/sync", summary="同期状況を更新する")
def update_sync_status(checkin_id: str, sync_status: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT checkin_id FROM checkins WHERE checkin_id = %s", (checkin_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="チェックイン見つけてない!")
            cur.execute("UPDATE checkins SET sync_status = %s WHERE checkin_id = %s", (sync_status, checkin_id))
            conn.commit()
            return {"message": "sync status updated", "sync_status": sync_status}