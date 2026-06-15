from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import Point
from database import get_db

OLD_LOCATION_STALE_MINUTES = 5

router = APIRouter(
    prefix="/user-locations",
    tags=["User Locations"],
    responses={404: {"description": "Not found"}},
)

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
        
@router.delete("/old", summary="古い位置情報を削除する")
def delete_old_locations():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM user_locations 
                WHERE recorded_at < NOW() - (%s * INTERVAL '1 minute')
            """, (OLD_LOCATION_STALE_MINUTES,))
            conn.commit()
            return {
                "message": "古い位置情報を削除しました",
                "deleted_count": cur.rowcount,
                "stale_minutes": OLD_LOCATION_STALE_MINUTES
            }

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

@router.get("/{user_id}/area", summary="ユーザーが避難所エリア内にいるか判定する")
def get_location_area(user_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    ul.user_id,
                    s.shelter_id,
                    s.name AS shelter_name,
                    ST_Distance(ul.location::geography, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography) AS distance_m,
                    ST_DWithin(ul.location::geography, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography, 500) AS in_area
                FROM user_locations ul
                CROSS JOIN shelters s
                WHERE ul.user_id = %s
                ORDER BY ul.recorded_at DESC
                LIMIT 1
            """, (user_id,))
            area = cur.fetchone()
            if not area:
                raise HTTPException(status_code=404, detail="位置情報が見つかりません!")
            return {
                "user_id": str(area[0]),
                "shelter_id": str(area[1]),
                "shelter_name": area[2],
                "distance_m": round(area[3], 2),
                "area_radius_m": 500,
                "in_area": area[4]
            }
        
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