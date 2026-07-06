#backend\app\main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db_connection, get_db
from config import OLD_LOCATION_STALE_MINUTES
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import psycopg2
import psycopg2.extras
import uuid
import time
import json
from contextlib import asynccontextmanager

# --- ルーターのインポート（すべて集約） ---
from routers import (
    users, scan, checkins, notifications, 
    reservations, danger_area, congestion, facilities
)


# ==========================================
# 1. リクエストモデル & ユーティリティ
# ==========================================
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



# ===== HELPERS =====
 # --- 2. ユーティリティ ---
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
 

# ==========================================
# 3. Lifespan (起動・終了時処理) の定義
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 アプリケーション起動シーケンス開始...")
    
    # データベース接続リトライロジック
    conn = None
    retry_count = 5
    while retry_count > 0:
        try:
            conn = get_db_connection()
            print("✅ データベースに接続できました。")
            break
        except Exception as e:
            print(f"⚠️ DB接続待ち... 残り {retry_count} 回: {e}")
            retry_count -= 1
            time.sleep(2)

    if conn:
        try:
            cur = conn.cursor()
            print("🛠️ データベースの初期設定を確認中...")
            cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
            # pgrouting はインストールされていない環境が多いので失敗してもスキップするようにする
            try:
                cur.execute("CREATE EXTENSION IF NOT EXISTS pgrouting;")
            except:
                print("ℹ️ pgrouting extension is not available. Skipping.")
            conn.commit()
            cur.close()
            conn.close()
            print("✅ データベースの初期設定が完了しました。")
        except Exception as e:
            print(f"❌ DB初期化中にエラー発生: {e}")
    
    yield  # ここでAPIの受付が始まる
    print("🛑 アプリケーション終了")

# ==========================================
# 4. FastAPIインスタンスの生成 (唯一のapp)
# ==========================================
app = FastAPI(lifespan=lifespan)

# ==========================================
# 5. ミドルウェア設定 (唯一のappに対して)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 開発時は "*"、本番は特定のURL
    allow_credentials=True,
    allow_methods=["*"], # 全メソッド許可
    allow_headers=["*"],
)


# --- 6. ルーターの登録 (インスタンス生成後に行う) ---
app.include_router(users.router)
app.include_router(scan.router)
app.include_router(checkins.router)
app.include_router(notifications.router)
app.include_router(reservations.router)
app.include_router(danger_area.router)
app.include_router(congestion.router)
app.include_router(facilities.router)

# ==========================================
# 7. エンドポイント定義
# ==========================================


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
 
# --- 1. タップされた位置情報の取得 (main側の新しい実装を採用) ---
@app.get("/map/location-info", summary="タップされた位置情報の取得")
def get_location_info(lat: float, lng: float):
    with get_db_connection() as conn: # メソッド名に注意
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

# --- 2. 経路計算API (HEAD側の苦労した機能をそのままキープ) ---
@app.get("/map/my-plan/{user_id}")
def get_my_evacuation_plan(user_id: str):
    conn = None
    try:
        conn = get_db_connection()
        import psycopg2.extras
        import json
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # 1. ユーザー位置取得
        cur.execute("SELECT ST_X(location::geometry) as lon, ST_Y(location::geometry) as lat FROM user_locations WHERE user_id = %s ORDER BY recorded_at DESC LIMIT 1;", (user_id,))
        u_loc = cur.fetchone()
        
        # 位置がない場合のフォールバック（エラーで止めない）
        u_lon = u_loc['lon'] if u_loc else 135.4950
        u_lat = u_loc['lat'] if u_loc else 34.7024

        # 2. ノード検索と最寄り避難所 (KNN検索)
        cur.execute("""
            WITH target_shelter AS (
                SELECT shelter_id, name, latitude, longitude,
                       ST_SetSRID(ST_Point(longitude, latitude), 4326) as shelter_geom
                FROM shelters
                ORDER BY ST_SetSRID(ST_Point(longitude, latitude), 4326) <-> ST_SetSRID(ST_Point(%s, %s), 4326)
                LIMIT 1
            )
            SELECT 
                (SELECT id FROM ways_vertices_pgr ORDER BY the_geom <-> ST_SetSRID(ST_Point(%s, %s), 4326) LIMIT 1) as start_node,
                (SELECT id FROM ways_vertices_pgr ORDER BY the_geom <-> (SELECT shelter_geom FROM target_shelter) LIMIT 1) as end_node,
                s.*
            FROM target_shelter s;
        """, (u_lon, u_lat, u_lon, u_lat))
        points = cur.fetchone()

        if not points or not points['start_node'] or not points['end_node']:
             raise HTTPException(status_code=404, detail="経路計算の基点が見つかりません。道路データを確認してください。")

        # 3. pgr_dijkstra 実行 
        # ★ 修正ポイント: cost_s が存在しない場合が多いため 'length' または 'cost' に修正
        cur.execute("""
            SELECT ST_AsGeoJSON(ST_Transform(ST_MakeLine(res.the_geom), 4326)) as geojson
            FROM (
                SELECT w.the_geom
                FROM pgr_dijkstra(
                    'SELECT gid as id, source, target, length as cost FROM ways WHERE source IS NOT NULL AND target IS NOT NULL',
                    %s, %s, directed := false
                ) AS di
                JOIN ways AS w ON di.edge = w.gid
                ORDER BY di.seq
            ) AS res;
        """, (points['start_node'], points['end_node']))
        
        route_result = cur.fetchone()

        # ★ 修正ポイント: route_result['geojson'] ではなく route_result.get('geojson') で安全に取得
        geojson_str = route_result['geojson'] if (route_result and route_result.get('geojson')) else None

        if geojson_str:
            route_data = json.loads(geojson_str)
        else:
            # 経路が見つからなかった時の直線フォールバック
            route_data = {
                "type": "LineString", 
                "coordinates": [[u_lon, u_lat], [float(points['longitude']), float(points['latitude'])]]
            }

        return {
            "status": "success",
            "plan": {
                "plan_id": str(uuid.uuid4()),
                "user_id": user_id,
                "primary_shelter_id": str(points['shelter_id']),
                "route_data": route_data,
                "meeting_point_name": points['name'],
                "meeting_point_lat": float(points['latitude']),
                "meeting_point_lon": float(points['longitude']),
                "updated_at": datetime.now().isoformat()
            }
        }
    except Exception as e:
        # 詳細をログに出して、クライアントにはエラーメッセージを返す
        print(f"❌ Route Engine Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"経路計算失敗: {str(e)}")
    finally:
        if conn: conn.close()

# --- 3. オフライン用データAPI (main側にあるのでキープ) ---
@app.get("/offline/map-data", summary="オフライン用マップデータを取得")
def get_offline_map_data():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT shelter_id, name, address, latitude, longitude, capacity, updated_at
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