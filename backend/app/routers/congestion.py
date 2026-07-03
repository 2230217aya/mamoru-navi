from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db

router = APIRouter(
    prefix="/congestion",
    tags=["Congestion"],
    responses={404: {"description": "Not found"}},
)

class CongestionCreate(BaseModel):
    shelter_id: str
    status: str          # empty, moderate, full
    current_count: int
    max_capacity: int
    data_source: str     # manual, estimated, sensor

@router.post("/", summary="混雑スナップショットを記録する")
def create_snapshot(data: CongestionCreate):
    allowed_status = ["empty", "moderate", "full"]
    if data.status not in allowed_status:
        raise HTTPException(status_code=400, detail=f"無効なステータス。選択可能: {allowed_status}")

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO congestion_snapshots (shelter_id, status, current_count, max_capacity, data_source)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING snapshot_id
            """, (data.shelter_id, data.status, data.current_count, data.max_capacity, data.data_source))
            conn.commit()
            return {"message": "snapshot created", "snapshot_id": str(cur.fetchone()[0])}

@router.get("/", summary="全避難所の最新混雑状況を取得")
def get_all_latest():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT DISTINCT ON (shelter_id)
                    snapshot_id, shelter_id, status, current_count, max_capacity, data_source, captured_at
                FROM congestion_snapshots
                ORDER BY shelter_id, captured_at DESC
            """)
            snapshots = cur.fetchall()
            return [
                {
                    "snapshot_id": str(s[0]),
                    "shelter_id": str(s[1]),
                    "status": s[2],
                    "current_count": s[3],
                    "max_capacity": s[4],
                    "data_source": s[5],
                    "captured_at": str(s[6])
                }
                for s in snapshots
            ]

@router.get("/{shelter_id}/latest", summary="避難所の最新混雑状況を取得")
def get_latest(shelter_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT snapshot_id, shelter_id, status, current_count, max_capacity, data_source, captured_at
                FROM congestion_snapshots WHERE shelter_id = %s
                ORDER BY captured_at DESC LIMIT 1
            """, (shelter_id,))
            s = cur.fetchone()
            if not s:
                raise HTTPException(status_code=404, detail="混雑情報が見つかりません!")
            return {
                "snapshot_id": str(s[0]),
                "shelter_id": str(s[1]),
                "status": s[2],
                "current_count": s[3],
                "max_capacity": s[4],
                "data_source": s[5],
                "captured_at": str(s[6])
            }

@router.get("/{shelter_id}", summary="避難所の混雑履歴を取得")
def get_history(shelter_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT snapshot_id, status, current_count, max_capacity, data_source, captured_at
                FROM congestion_snapshots WHERE shelter_id = %s
                ORDER BY captured_at DESC
            """, (shelter_id,))
            snapshots = cur.fetchall()
            if not snapshots:
                raise HTTPException(status_code=404, detail="混雑情報が見つかりません!")
            return [
                {
                    "snapshot_id": str(s[0]),
                    "status": s[1],
                    "current_count": s[2],
                    "max_capacity": s[3],
                    "data_source": s[4],
                    "captured_at": str(s[5])
                }
                for s in snapshots
            ]