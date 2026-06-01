from fastapi import APIRouter, Depends
from database import get_db_connection

router = APIRouter(
    prefix="/map",
    tags=["Map"],
    responses={404: {"description": "Not found"}},
)

def get_db():
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

# ===== ENDPOINTS =====

@router.get("/", summary="マップに表示するためのすべてのデータを取得")
def get_map():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT shelter_id, name, address, latitude, longitude, capacity FROM shelters")
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
                        "capacity": s[5]
                    }
                    for s in shelters
                ],
                "danger_areas": [
                    {
                        "area_id": str(a[0]),
                        "risk_type": a[1],
                        "risk_level": a[2],
                        "description": a[3],
                        "is_active": a[4]
                    }
                    for a in danger_areas
                ]
            }

@router.get("/location-info", summary="タップされた位置情報の取得")
def get_location_info(lat: float, lng: float):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT shelter_id, name, address, latitude, longitude, capacity FROM shelters")
            shelters = cur.fetchall()
            nearest = min(shelters, key=lambda s: abs(s[3] - lat) + abs(s[4] - lng), default=None)

            cur.execute("SELECT area_id, risk_type, risk_level, description FROM danger_areas WHERE is_active = TRUE")
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
                        "capacity": nearest[5]
                    }
                    if nearest else None
                ),
                "danger_areas": [
                    {
                        "area_id": str(a[0]),
                        "risk_type": a[1],
                        "risk_level": a[2],
                        "description": a[3]
                    }
                    for a in danger_areas
                ]
            }