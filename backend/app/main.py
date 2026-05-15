from fastapi import FastAPI
from pydantic import BaseModel
import psycopg2

app = FastAPI()

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