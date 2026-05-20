from fastapi import FastAPI
from pydantic import BaseModel
from config import OLD_LOCATION_STALE_MINUTES
from routers import users
import psycopg2

app = FastAPI()

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
        "INSERT INTO user_locations (user_id, latitude, longitude) VALUES (%s, %s, %s) RETURNING id, user_id, latitude, longitude, created_at;",
        (location.user_id, location.latitude, location.longitude)
    )

    saved_location = cur.fetchone()

    conn.commit()
    cur.close()
    conn.close()
    return {"message": "位置情報を受け取りました",
                "id": saved_location[0],
                "user_id": saved_location[1],
                "latitude": saved_location[2],
                "longitude": saved_location[3],
                "created_at": saved_location[4]
            }

@app.delete("/locations/old")
def delete_old_locations():
    # データベースに接続する
    conn = get_db_connection()
    cur = conn.cursor()

    # 古い位置情報を削除する
    # created_atが現在時刻 OLD_LOCATION_STALE_MINUTESより前のデータを対象にする
    # 例：OLD_LOCATION_STALE_MINUTESが5の場合、created_atが現在時刻から5分以上前のデータを削除する
    cur.execute("DELETE FROM user_locations WHERE created_at < NOW() - (%s * INTERVAL '1 minute');", (OLD_LOCATION_STALE_MINUTES,))
    
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
    cur.execute("SELECT id, name, latitude, longitude, radius_m, created_at FROM shelters;")
    shelters = cur.fetchall()

    # カーソルとDB接続を閉じる
    cur.close()
    conn.close()

    # 取得した避難所情報をレスポンスとして返す
    return {"shelters": [{"id": shelter[0], "name": shelter[1], "latitude": shelter[2], "longitude": shelter[3], "radius_m": shelter[4], "created_at": shelter[5]} for shelter in shelters]}