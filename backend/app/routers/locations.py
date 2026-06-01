from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import Point
from database import get_db_connection

router = APIRouter(
    prefix="/user-locations",
    tags=["User Locations"],
    responses={404: {"description": "Not found"}},
)

def get_db():
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

# ===== SCHEMA =====

class UserLocationCreate(BaseModel):
    user_id: str
    longitude: float
    latitude: float

# ===== ENDPOINTS =====

@router.post("/", summary="ユーザーの位置情報を保存する")
def create_user_location(data: UserLocationCreate):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO user_locations (user_id, location)
                VALUES (%s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
                RETURNING id
            """, (data.user_id, data.longitude, data.latitude))
            conn.commit()
            return {"message": "location saved", "id": str(cur.fetchone()[0])}

@router.get("/{user_id}", summary="ユーザーのすべての位置情報を取得する")
def get_user_locations(user_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, ST_X(location::geometry), ST_Y(location::geometry), recorded_at
                FROM user_locations WHERE user_id = %s
            """, (user_id,))
            locs = cur.fetchall()
            if not locs:
                raise HTTPException(status_code=404, detail="Location 見つけてない!")
            return [
                {
                    "id": str(l[0]),
                    "longitude": l[1],
                    "latitude": l[2],
                    "recorded_at": str(l[3])
                }
                for l in locs
            ]

@router.get("/{user_id}/latest", summary="ユーザーの最終位置情報を取得します")
def get_latest_user_location(user_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, ST_X(location::geometry), ST_Y(location::geometry), recorded_at
                FROM user_locations WHERE user_id = %s
                ORDER BY recorded_at DESC LIMIT 1
            """, (user_id,))
            loc = cur.fetchone()
            if not loc:
                raise HTTPException(status_code=404, detail="Location 見つけてない!")
            return {
                "id": str(loc[0]),
                "longitude": loc[1],
                "latitude": loc[2],
                "recorded_at": str(loc[3])
            }