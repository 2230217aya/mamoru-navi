#backend\app\main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db
from config import OLD_LOCATION_STALE_MINUTES

from routers import users
from routers import scan
from routers import checkins
from routers import notifications
from routers import reservations
from routers import danger_area
from routers import congestion
from routers import facilities

app = FastAPI()

app.include_router(users.router)
app.include_router(scan.router)
app.include_router(checkins.router)
app.include_router(notifications.router)
app.include_router(reservations.router)
app.include_router(danger_area.router)
app.include_router(congestion.router)
app.include_router(facilities.router)

# ===== HELPERS =====
 
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
 
class LocationRequest(BaseModel):
    user_id: str
    latitude: float
    longitude: float
 
class ShelterCreate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    capacity: Optional[int] = None

# ===== ROOT =====
 
@app.get("/")
def read_root():
    return {"message": "まもるナビ APIへようこそ！"}
 
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "バックエンドは動いています"}
 
 
# ===== LOCATIONS =====
 
@app.post("/locations/", summary="ユーザーの位置情報を保存する")
def receive_location(location: LocationRequest):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO user_locations (user_id, location)
                VALUES (%s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
                RETURNING id, user_id,
                          ST_Y(location) AS latitude,
                          ST_X(location) AS longitude,
                          recorded_at
            """, (location.user_id, location.longitude, location.latitude))
            conn.commit()
            saved = cur.fetchone()
            return {
                "message": "位置情報を受け取りました",
                "id": str(saved[0]),
                "user_id": str(saved[1]),
                "latitude": saved[2],
                "longitude": saved[3],
                "recorded_at": saved[4],
            }
 
@app.delete("/locations/old", summary="古い位置情報を削除する")
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
                "stale_minutes": OLD_LOCATION_STALE_MINUTES,
            }
 
@app.get("/locations/{user_id}/latest", summary="ユーザーの最終位置情報を取得する")
def get_latest_location(user_id: str):
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
                "recorded_at": str(loc[3]),
            }
 
@app.get("/locations/{user_id}/area", summary="ユーザーが避難所エリア内にいるか判定する")
def get_location_area(user_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    ul.user_id,
                    s.shelter_id,
                    s.name AS shelter_name,
                    ST_Distance(
                        ul.location::geography,
                        ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography
                    ) AS distance_m,
                    ST_DWithin(
                        ul.location::geography,
                        ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography,
                        500
                    ) AS in_area
                FROM user_locations ul
                CROSS JOIN shelters s
                WHERE ul.user_id = %s
                ORDER BY ul.recorded_at DESC, distance_m ASC
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
                "in_area": area[4],
            }
 
@app.get("/locations/{user_id}", summary="ユーザーのすべての位置情報を取得する")
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
                    "recorded_at": str(l[3]),
                }
                for l in locs
            ]
 
 
# ===== SHELTERS =====
 
@app.post("/shelters/", summary="新しいシェルターを作成する")
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
 
@app.get("/shelters/nearest", summary="最寄りの避難所を取得")
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
                    "distance": round(s[6], 6),
                }
                for s in shelters
            ]
 
@app.get("/shelters/search", summary="シェルターを名前または容量で検索")
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
                    "capacity": s[3],
                }
                for s in shelters
            ]
 
@app.get("/shelters/crowd-counts", summary="各避難所の混雑状況を取得")
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
                    "crowd_level": crowd_level,
                })
            return {"crowd_counts": results}
 
@app.get("/shelters/heatmap", summary="ヒートマップ用データを取得")
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
                    "crowd_level": crowd_level,
                })
            return {"heatmap_data": heatmap_data}
 
@app.get("/shelters/{shelter_id}", summary="IDでシェルターを取得")
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
                "capacity": s[5],
            }
 
@app.get("/shelters/", summary="すべてのシェルターを取得")
def get_shelters():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT shelter_id, name, address, latitude, longitude, capacity
                FROM shelters ORDER BY name
            """)
            shelters = cur.fetchall()
            return [
                {
                    "shelter_id": str(s[0]),
                    "name": s[1],
                    "address": s[2],
                    "latitude": s[3],
                    "longitude": s[4],
                    "capacity": s[5],
                }
                for s in shelters
            ]
 
 
# ===== MAP =====
 
@app.get("/map/", summary="マップに表示するためのすべてのデータを取得")
def get_map():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT shelter_id, name, address, latitude, longitude, capacity
                FROM shelters
            """)
            shelters = cur.fetchall()
            cur.execute("""
                SELECT area_id, risk_type, risk_level, description, is_active
                FROM danger_areas WHERE is_active = TRUE
            """)
            danger_areas = cur.fetchall()
            return {
                "shelters": [
                    {
                        "shelter_id": str(s[0]),
                        "name": s[1],
                        "address": s[2],
                        "latitude": s[3],
                        "longitude": s[4],
                        "capacity": s[5],
                    }
                    for s in shelters
                ],
                "danger_areas": [
                    {
                        "area_id": str(a[0]),
                        "risk_type": a[1],
                        "risk_level": a[2],
                        "description": a[3],
                        "is_active": a[4],
                    }
                    for a in danger_areas
                ],
            }
 
@app.get("/map/location-info", summary="タップされた位置情報の取得")
def get_location_info(lat: float, lng: float):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT shelter_id, name, address, latitude, longitude, capacity
                FROM shelters
            """)
            shelters = cur.fetchall()
            nearest = min(
                shelters,
                key=lambda s: abs(s[3] - lat) + abs(s[4] - lng),
                default=None,
            )
            cur.execute("""
                SELECT area_id, risk_type, risk_level, description
                FROM danger_areas WHERE is_active = TRUE
            """)
            danger_areas = cur.fetchall()
            return {
                "latitude": lat,
                "longitude": lng,
                "nearest_shelter": (
                    {
                        "shelter_id": str(nearest[0]),
                        "name": nearest[1],
                        "address": nearest[2],
                        "latitude": nearest[3],
                        "longitude": nearest[4],
                        "capacity": nearest[5],
                    }
                    if nearest else None
                ),
                "danger_areas": [
                    {
                        "area_id": str(a[0]),
                        "risk_type": a[1],
                        "risk_level": a[2],
                        "description": a[3],
                    }
                    for a in danger_areas
                ],
            }
 
@app.get("/offline/map-data", summary="オフライン用マップデータを取得")
def get_offline_map_data():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT shelter_id, name, address, latitude, longitude, capacity, update_at
                FROM shelters ORDER BY name
            """)
            shelters = cur.fetchall()
            shelter_list = [
                {
                    "shelter_id": str(s[0]),
                    "name": s[1],
                    "address": s[2],
                    "latitude": s[3],
                    "longitude": s[4],
                    "capacity": s[5],
                    "updated_at": s[6],
                }
                for s in shelters
            ]
            return {"count": len(shelter_list), "shelters": shelter_list}