from fastapi import FastAPI
from routers import users
from routers import scan
from routers import checkins
from routers import shelters
from routers import locations
from routers import map
from routers import notifications
from routers import reservations
from routers import danger_area
from routers import congestion
from routers import facilities

app = FastAPI()

app.include_router(users.router)
app.include_router(scan.router)
app.include_router(checkins.router)
app.include_router(shelters.router)
app.include_router(locations.router)
app.include_router(map.router)
app.include_router(notifications.router)
app.include_router(reservations.router)
app.include_router(danger_area.router)
app.include_router(congestion.router)
app.include_router(facilities.router)

@app.get("/")
def read_root():
    return {"message": "まもるナビ APIへようこそ！"}

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "バックエンドは動いています"}