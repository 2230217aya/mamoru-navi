from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class LocationRequest(BaseModel):
    user_id: str
    latitude: float
    longitude: float

@app.get("/")
def read_root():
    return {"message": "まもるナビ APIへようこそ！"}

@app.post("/locations/")
def receive_location(location: LocationRequest):
    return {"message": "位置情報を受け取りました",
                "user_id": location.user_id,
                "latitude": location.latitude,
                "longitude": location.longitude
            }