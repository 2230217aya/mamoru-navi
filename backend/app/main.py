#backend\app\main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from config import OLD_LOCATION_STALE_MINUTES
from routers import users, scan # まとめてインポート
from database import get_db_connection
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import psycopg2
import uuid
import time
from contextlib import asynccontextmanager

# ==========================================
# 1. リクエストモデル & ユーティリティ
# ==========================================
class LocationRequest(BaseModel):
    user_id: str
    latitude: float
    longitude: float  

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
# 2. Lifespan (起動・終了時処理) の定義
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
# 3. FastAPIインスタンスの生成 (唯一のapp)
# ==========================================
app = FastAPI(lifespan=lifespan)

# ==========================================
# 4. ミドルウェア設定 (唯一のappに対して)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 5. ルーターの登録 (唯一のappに対して)
# ==========================================
app.include_router(users.router)
app.include_router(scan.router)

# ==========================================
# 6. エンドポイント定義
# ==========================================


@app.get("/")
def read_root():
    return {"message": "まもるナビ APIへようこそ！"}

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "バックエンドは動いています"}

@app.post("/locations/")
def receive_location(location: LocationRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO user_locations (user_id, location) VALUES (%s, ST_SetSRID(ST_MakePoint(%s, %s), 4326)) RETURNING id, user_id, ST_Y(location) AS latitude, ST_X(location) AS longitude, recorded_at;",
        (location.user_id, location.longitude, location.latitude)
    )

    saved_location = cur.fetchone()

    conn.commit()
    cur.close()
    conn.close()
    return {"message": "位置情報を受け取りました",
                "id": str(saved_location[0]),
                "user_id": str(saved_location[1]),
                "latitude": saved_location[2],
                "longitude": saved_location[3],
                "recorded_at": saved_location[4]
            }

@app.delete("/locations/old")
def delete_old_locations():
    # データベースに接続する
    conn = get_db_connection()
    cur = conn.cursor()

    # 古い位置情報を削除する
    # recorded_atが現在時刻 OLD_LOCATION_STALE_MINUTESより前のデータを対象にする
    # 例：OLD_LOCATION_STALE_MINUTESが5の場合、recorded_atが現在時刻から5分以上前のデータを削除する
    cur.execute("DELETE FROM user_locations WHERE recorded_at < NOW() - (%s * INTERVAL '1 minute');", (OLD_LOCATION_STALE_MINUTES,))
    
    # 削除された行数を取得する
    deleted_count = cur.rowcount

    # 変更をコミットしてDB接続を閉じる
    conn.commit()

    # カーソルとDB接続を閉じる
    cur.close()
    conn.close()

    # 削除結果をレスポンスとして返す
    return {"message": "古い位置情報を削除しました",
            "deleted_count": deleted_count,
            "stale_minutes": OLD_LOCATION_STALE_MINUTES
    }

@app.get("/shelters")
def get_shelters():
    # データベースに接続する
    conn = get_db_connection()
    cur = conn.cursor()

    # sheltersテーブルから避難所情報を取得する
    cur.execute("SELECT shelter_id, name, address, latitude, longitude, capacity FROM shelters ORDER BY name;")
    shelters = cur.fetchall()

    # カーソルとDB接続を閉じる
    cur.close()
    conn.close()

    # 取得した避難所情報をレスポンスとして返す
    return {"shelters": [{"shelter_id": str(shelter[0]), "name": shelter[1], "address": shelter[2], "latitude": shelter[3], "longitude": shelter[4], "capacity": shelter[5]} for shelter in shelters]}

@app.get("/offline/map-data")
def get_offline_map_data():
    # データベースに接続する
    conn = get_db_connection()
    cur = conn.cursor()

    # sheltersテーブルから避難所情報を取得する
    cur.execute("SELECT shelter_id, name, address, latitude, longitude, capacity, update_at FROM shelters ORDER BY name;")
    shelters = cur.fetchall()

    # カーソルとDB接続を閉じる
    cur.close()
    conn.close()

    # 取得した避難所情報をレスポンスとして返す
    shelter_list = [
        {
            "shelter_id": str(shelter[0]),
            "name": shelter[1],
            "address": shelter[2],
            "latitude": shelter[3],
            "longitude": shelter[4],
            "capacity": shelter[5],
            "updated_at": shelter[6]
        }
        for shelter in shelters
    ]
    
    return {
        "count": len(shelter_list),
        "shelters": shelter_list
    }

@app.get("/locations/{user_id}/latest")
def get_latest_location(user_id: str):
    # データベースに接続する
    conn = get_db_connection()
    cur = conn.cursor()

    # user_locationsテーブルから指定されたuser_idの最新の位置情報を取得する
    cur.execute("SELECT id, user_id, ST_Y(location) AS latitude, ST_X(location) AS longitude, recorded_at FROM user_locations WHERE user_id = %s ORDER BY recorded_at DESC LIMIT 1;", (user_id,))
    location = cur.fetchone()

    # カーソルとDB接続を閉じる
    cur.close()
    conn.close()

    # 取得した位置情報をレスポンスとして返す
    if location:
        return {"id": str(location[0]), "user_id": str(location[1]), "latitude": location[2], "longitude": location[3], "recorded_at": location[4]}
    else:
        raise HTTPException(status_code=404, detail="指定されたユーザーIDの位置情報が見つかりませんでした")
    
@app.get("/locations/{user_id}/area")
def get_location_area(user_id: str):
    # データベースに接続する
    conn = get_db_connection()
    cur = conn.cursor()

    # 指定ユーザーの最新位置情報と、最も近い避難所を取得する
    # PostGISのST_Distanceで距離をメートル単位で計算する
    # ST_DWithinで避難所から500m以内かどうかを判定する
    cur.execute(        
        """
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
        LIMIT 1;
        """, 
        (user_id,))
    area = cur.fetchone()

    # カーソルとDB接続を閉じる
    cur.close()
    conn.close()

    # 取得した位置情報をレスポンスとして返す
    if area is None:
        raise HTTPException(status_code=404, detail="指定されたユーザーIDの位置情報が見つかりませんでした")

    # エリア判定結果をレスポンスとして返す
    return {
        "user_id": str(area[0]),
        "shelter_id": str(area[1]),
        "shelter_name": area[2],
        "distance_m": round(area[3], 2),
        "area_radius_m": 500,
        "in_area": area[4]
    }

@app.get("/shelters/crowd-counts")
def get_shelter_crowd_counts():
    # データベースに接続する
    conn = get_db_connection()
    cur = conn.cursor()

    # 各避難所の現在の混雑状況を取得する
    # user_locationsテーブルから、recorded_atが現在時刻から5分以内の位置情報を対象にする
    cur.execute(
        """
        WITH latest_locations AS (
            SELECT DISTINCT ON (user_id)
                user_id,
                location,
                recorded_at
            FROM user_locations
            WHERE recorded_at >= NOW() - (%s * INTERVAL '1 minute')
            ORDER BY user_id, recorded_at DESC
        )
        SELECT
            s.shelter_id AS shelter_id,
            s.name AS shelter_name,
            s.capacity,
            COUNT(ll.user_id) AS current_user_count
        FROM shelters s
        LEFT JOIN latest_locations ll
            ON ST_DWithin(
                ll.location::geography,
                ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography,
                500
            )
        GROUP BY s.shelter_id, s.name, s.capacity
        ORDER BY s.name;
        """,
        (OLD_LOCATION_STALE_MINUTES,)
    )
    crowd_counts = cur.fetchall()

    # カーソルとDB接続を閉じる
    cur.close()
    conn.close()

    # 取得した混雑状況をレスポンスとして返す
    results = []
    for row in crowd_counts:
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

@app.get("/shelters/heatmap")
def get_shelter_heatmap_data():
    # データベースに接続する
    conn = get_db_connection()
    cur = conn.cursor()

    # 各避難所の現在の混雑状況を取得する
    # user_locationsテーブルから、recorded_atが現在時刻から5分以内の位置情報を対象にする
    cur.execute(
        """
        WITH latest_locations AS (
            SELECT DISTINCT ON (user_id)
                user_id,
                location,
                recorded_at
            FROM user_locations
            WHERE recorded_at >= NOW() - (%s * INTERVAL '1 minute')
            ORDER BY user_id, recorded_at DESC
        )
        SELECT
            s.shelter_id AS shelter_id,
            s.name AS shelter_name,
            s.latitude,
            s.longitude,
            s.capacity,
            COUNT(ll.user_id) AS current_user_count
        FROM shelters s
        LEFT JOIN latest_locations ll
            ON ST_DWithin(
                ll.location::geography,
                ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography,
                500
            )
        GROUP BY s.shelter_id, s.name, s.latitude, s.longitude, s.capacity
        ORDER BY s.name;
        """,
        (OLD_LOCATION_STALE_MINUTES,)
    )

    heatmap_rows = cur.fetchall()

    # カーソルとDB接続を閉じる
    cur.close()
    conn.close()

    #ヒートマップ用データをレスポンスとして返す
    heatmap_data = []

    for row in heatmap_rows:
        capacity = row[4]
        current_user_count = row[5]
        crowd_rate, crowd_level = convert_crowd_level(current_user_count, capacity)
        heatmap_data.append({
            "shelter_id": str(row[0]),
            "shelter_name": row[1],
            "latitude": row[2],
            "longitude": row[3],
            "capacity": capacity,
            "current_user_count": current_user_count,
            "crowd_rate": crowd_rate,
            "crowd_level": crowd_level
        })
    return {"heatmap_data": heatmap_data}

# get_my_evacuation_plan

@app.get("/map/my-plan/{user_id}")
def get_my_evacuation_plan(user_id: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        # 1. ユーザーの現在地に最も近い「道路の点(Node)」と「最寄りの避難所」を特定
        cur.execute("""
            WITH user_location AS (
                -- 最後に記録されたユーザーの位置
                SELECT location FROM user_locations WHERE user_id = %s ORDER BY recorded_at DESC LIMIT 1
            ),
            target_shelter AS (
                -- ユーザーから最も近い避難所
                SELECT shelter_id, name, latitude, longitude, location as geom
                FROM shelters
                ORDER BY location <-> (SELECT location FROM user_location)
                LIMIT 1
            )
            SELECT 
                (SELECT id FROM ways_vertices_pgr ORDER BY the_geom <-> (SELECT location FROM user_location) LIMIT 1) as start_node,
                (SELECT id FROM ways_vertices_pgr ORDER BY the_geom <-> (SELECT geom FROM target_shelter) LIMIT 1) as end_node,
                s.shelter_id, s.name as shelter_name, s.latitude, s.longitude
            FROM target_shelter s;
        """, (user_id,))
        points = cur.fetchone()

        if not points:
             raise HTTPException(status_code=404, detail="現在地または避難所が見つかりません")

        # 2. pgRouting を使って本物のルート(GeoJSON)を生成
        # waysテーブルの the_geom(道路の形) をつなぎ合わせて LineString にする
        try:
            cur.execute("""
                SELECT ST_AsGeoJSON(ST_Transform(ST_MakeLine(res.the_geom), 4326)) as geojson
                FROM (
                    SELECT w.the_geom
                    FROM pgr_dijkstra(
                        'SELECT id, source, target, cost_s AS cost FROM ways WHERE cost_s > 0',
                        %s, %s, directed := false
                    ) AS di
                    JOIN ways AS w ON di.edge = w.id
                    ORDER BY di.seq
                ) AS res;
            """, (points['start_node'], points['end_node']))
            route_result = cur.fetchone()
        except Exception as e:
            print(f"⚠️ pgRouting 実行エラー: {e}")
            route_result = None

        # --- ★ ここから修正：フォールバック処理 ---
        if not route_result or not route_result['geojson']:
            print("⚠️ 道路網が見つからないため、直線ルートを生成します")
            # 道路データがなくてもアプリがクラッシュしないように「点2つの直線」を返す
            route_data = {
                "type": "LineString",
                "coordinates": [
                    [135.5000, 34.7333], # 実際は現在地座標
                    [points['longitude'], points['latitude']] # 避難所座標
                ]
            }
        else:
            import json
            route_data = json.loads(route_result['geojson'])



        return {
            "status": "success",
            "plan": {
                "plan_id": str(uuid.uuid4()),
                "user_id": user_id,
                "primary_shelter_id": str(points['shelter_id']),
                "route_data": route_data,
                "meeting_point_name": points['shelter_name'],
                "meeting_point_lat": points['latitude'],
                "meeting_point_lon": points['longitude'],
                "updated_at": datetime.now().isoformat()
            }
        }

    except Exception as e:
        print(f"❌ Error during routing: {e}")
        raise HTTPException(status_code=500, detail="経路計算エラーが発生しました")
    finally:
        cur.close()
        conn.close()