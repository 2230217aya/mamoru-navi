from fastapi import FastAPI
from pydantic import BaseModel
from config import OLD_LOCATION_STALE_MINUTES
from routers import users
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

class LocationRequest(BaseModel):
    user_id: str
    latitude: float
    longitude: float

def get_db_connection():
    return psycopg2.connect(
        host="db",
        database="mamoru_navi_db",
        user="user",
        password="user"
    )

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
    cur.execute("SELECT id, name, ST_Y(location) AS latitude, ST_X(location) AS longitude, capacity, status FROM shelters ORDER BY name;")
    shelters = cur.fetchall()

    # カーソルとDB接続を閉じる
    cur.close()
    conn.close()

    # 取得した避難所情報をレスポンスとして返す
    return {"shelters": [{"id": str(shelter[0]), "name": shelter[1], "latitude": shelter[2], "longitude": shelter[3], "capacity": shelter[4], "status": shelter[5]} for shelter in shelters]}

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
        return {"message": "指定されたユーザーIDの位置情報が見つかりませんでした"}
    
@app.get("/locations/{user_id}/area")
def get_location_area(user_id: str):
    # データベースに接続する
    conn = get_db_connection()
    cur = conn.cursor()

    # 指定ユーザーの最新位置情報と、最も近い避難所を取得する
    # PostGISのST_Distanceで距離をメートル単位で計算する
    # ST_DWithinで避難所から500m以内かどうかを判定する
    cur.execute("SELECT " \
                "ul.user_id, " \
                "s.id AS shelter_id, " \
                "s.name AS shelter_name, " \
                "ST_Distance(ul.location, s.location) AS distance_m, " \
                "ST_DWithin(ul.location, s.location, 500) AS in_area " \
                "FROM user_locations ul " \
                "JOIN shelters s ON ST_DWithin(ul.location, s.location, 500) " \
                "WHERE ul.user_id = %s ORDER BY recorded_at DESC LIMIT 1;", (user_id,))
    area = cur.fetchone()

    # カーソルとDB接続を閉じる
    cur.close()
    conn.close()

    # 取得した位置情報をレスポンスとして返す
    if area is None:
        return {"message": "指定されたユーザーIDの位置情報が見つかりませんでした", "user_id": user_id}
    
    # エリア判定結果をレスポンスとして返す
    return {
        "user_id": str(area[0]),
        "shelter_id": str(area[1]),
        "shelter_name": area[2],
        "distance_m": round(area[3], 2),
        "area_radius_m": 500,
        "in_area": area[4]
    }