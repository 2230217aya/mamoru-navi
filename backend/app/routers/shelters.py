from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db
from config import OLD_LOCATION_STALE_MINUTES

router = APIRouter(
    prefix="/shelters",
    tags=["Shelters"],
    responses={404: {"description": "Not found"}},
)

def convert_crowd_level(current_user_count: int, capacity: int):
    if capacity is None or capacity <= 0:
        return None, "unknown"
    crowd_rate = current_user_count / capacity
    if crowd_rate < 0.5:
        crowd_level = "空きあり"
    elif crowd_rate < 0.8:
        crowd_level = "やや混雑"
    elif crowd_rate < 1.0:
        crowd_level = "混雑"
    else:
        crowd_level = "満員"
    return round(crowd_rate, 2), crowd_level
# ===== SCHEMA =====

class ShelterCreate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    capacity: Optional[int] = None

# ===== ENDPOINTS =====

@router.post("/", summary="新しいシェルターを作成する")
def create_shelter(data: ShelterCreate):
    with get_db() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute("""
                    INSERT INTO shelters (name, address, latitude, longitude, capacity)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING shelter_id
                """, (data.name, data.address, data.latitude, data.longitude, data.capacity))
                conn.commit()
                return {"message": "shelter created", "shelter_id": str(cur.fetchone()[0])}
            except Exception:
                conn.rollback()
                raise HTTPException(status_code=400, detail="データは既に存在します!")

@router.get("/", summary="すべてのシェルターを取得")
def get_shelters():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT shelter_id, name, address, latitude, longitude, capacity FROM shelters")
            shelters = cur.fetchall()
            return [
                {
                    "shelter_id": str(s[0]),
                    "name": s[1],
                    "address": s[2],
                    "latitude": s[3],
                    "longitude": s[4],
                    "capacity": s[5]
                }
                for s in shelters
            ]
        
@router.get("/nearest", summary="最寄りの避難所を取得")
def get_nearest_shelters(lat: float, lng: float, limit: int = 5):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT shelter_id, name, address, latitude, longitude, capacity,
                       ABS(latitude - %s) + ABS(longitude - %s) AS distance
                FROM shelters
                ORDER BY distance ASC
                LIMIT %s
            """, (lat, lng, limit))
            shelters = cur.fetchall()
            if not shelters:
                raise HTTPException(status_code=404, detail="避難所が見つかりません!")
            return [
                {
                    "shelter_id": str(s[0]),
                    "name": s[1],
                    "address": s[2],
                    "latitude": s[3],
                    "longitude": s[4],
                    "capacity": s[5],
                    "distance": round(s[6], 6)
                }
                for s in shelters
            ]

@router.get("/search", summary="シェルターを名前または容量で検索")
def search_shelters(q: Optional[str] = None, capacity: Optional[int] = None):
    with get_db() as conn:
        with conn.cursor() as cur:
            query = "SELECT shelter_id, name, address, capacity FROM shelters WHERE 1=1"
            params = []
            if q:
                query += " AND name ILIKE %s"
                params.append(f"%{q}%")
            if capacity:
                query += " AND capacity >= %s"
                params.append(capacity)
            cur.execute(query, params)
            shelters = cur.fetchall()
            return [
                {
                    "shelter_id": str(s[0]),
                    "name": s[1],
                    "address": s[2],
                    "capacity": s[3]
                }
                for s in shelters
            ]
        

@router.get("/{shelter_id}", summary="IDでシェルターを取得")
def get_shelter(shelter_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT shelter_id, name, address, latitude, longitude, capacity
                FROM shelters WHERE shelter_id = %s
            """, (shelter_id,))
            s = cur.fetchone()
            if not s:
                raise HTTPException(status_code=404, detail="シェルターが見つかりません!")
            return {
                "shelter_id": str(s[0]),
                "name": s[1],
                "address": s[2],
                "latitude": s[3],
                "longitude": s[4],
                "capacity": s[5]
            }
        
@router.get("/crowd-counts", summary="各避難所の混雑状況を取得")
def get_shelter_crowd_counts():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                WITH latest_locations AS (
                    SELECT DISTINCT ON (user_id)
                        user_id, location, recorded_at
                    FROM user_locations
                    WHERE recorded_at >= NOW() - (%s * INTERVAL '1 minute')
                    ORDER BY user_id, recorded_at DESC
                )
                SELECT
                    s.shelter_id, s.name, s.capacity,
                    COUNT(ll.user_id) AS current_user_count
                FROM shelters s
                LEFT JOIN latest_locations ll
                    ON ST_DWithin(
                        ll.location::geography,
                        ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography,
                        500
                    )
                GROUP BY s.shelter_id, s.name, s.capacity
                ORDER BY s.name
            """, (OLD_LOCATION_STALE_MINUTES,))
            rows = cur.fetchall()
            results = []
            for row in rows:
                crowd_rate, crowd_level = convert_crowd_level(row[3], row[2])
                results.append({
                    "shelter_id": str(row[0]),
                    "shelter_name": row[1],
                    "capacity": row[2],
                    "current_user_count": row[3],
                    "crowd_rate": crowd_rate,
                    "crowd_level": crowd_level
                })
            return {"crowd_counts": results}

@router.get("/heatmap", summary="ヒートマップ用データを取得")
def get_shelter_heatmap_data():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                WITH latest_locations AS (
                    SELECT DISTINCT ON (user_id)
                        user_id, location, recorded_at
                    FROM user_locations
                    WHERE recorded_at >= NOW() - (%s * INTERVAL '1 minute')
                    ORDER BY user_id, recorded_at DESC
                )
                SELECT
                    s.shelter_id, s.name, s.latitude, s.longitude, s.capacity,
                    COUNT(ll.user_id) AS current_user_count
                FROM shelters s
                LEFT JOIN latest_locations ll
                    ON ST_DWithin(
                        ll.location::geography,
                        ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography,
                        500
                    )
                GROUP BY s.shelter_id, s.name, s.latitude, s.longitude, s.capacity
                ORDER BY s.name
            """, (OLD_LOCATION_STALE_MINUTES,))
            rows = cur.fetchall()
            heatmap_data = []
            for row in rows:
                crowd_rate, crowd_level = convert_crowd_level(row[5], row[4])
                heatmap_data.append({
                    "shelter_id": str(row[0]),
                    "shelter_name": row[1],
                    "latitude": row[2],
                    "longitude": row[3],
                    "capacity": row[4],
                    "current_user_count": row[5],
                    "crowd_rate": crowd_rate,
                    "crowd_level": crowd_level
                })
            return {"heatmap_data": heatmap_data}