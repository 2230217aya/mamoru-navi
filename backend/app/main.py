from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from config import OLD_LOCATION_STALE_MINUTES
from routers import users
from routers import scan
from database import get_db_connection
from fastapi.middleware.cors import CORSMiddleware
import psycopg2

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開発時はすべて許可
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, DELETE などすべて許可
    allow_headers=["*"],  # すべてのヘッダー（Bypass-Tunnel-Reminderなど）を許可
)

app.include_router(users.router)
app.include_router(scan.router)

class LocationRequest(BaseModel):
    user_id: str
    latitude: float
    longitude: float  

def convert_crowd_level(current_user_count: int, capacity: int):
    # capacityが0の場合はcrowd_levelを「unknown」とする
    if capacity is None or capacity <= 0:
        return "unknown"
    # 混雑度を計算する
    crowd_rate = current_user_count / capacity
    # 混雑度に応じてcrowd_levelを判定する
    if crowd_rate < 0.5:
        crowd_level = "空きあり"
    elif crowd_rate < 0.8:
        crowd_level = "やや混雑"
    elif crowd_rate < 1.0:
        crowd_level = "混雑"
    else:
        crowd_level = "満員"
        

    return round(crowd_rate, 2), crowd_level



@app.get("/")
def read_root():
    return {"message": "まもるナビ APIへようこそ！"}

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
    return {"shelters": [{"shelter_id": str(shelter[0]), "name": shelter[1], "address": shelter[2], "latitude": shelter[3], "longitude": shelter[4], "capacity": shelter[5], "updated_at": shelter[6]} for shelter in shelters]}

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