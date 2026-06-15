from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db

router = APIRouter(
    prefix="/shelters",
    tags=["Shelters"],
    responses={404: {"description": "Not found"}},
)

# ===== SCHEMA =====

class ShelterCreate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    capacity: Optional[int] = None

# ===== ENDPOINTS =====

@router.post("/", summary="新しいシェルターを作成する")
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

@router.get("/", summary="すべてのシェルターを取得")
def get_shelters():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT shelter_id, name, address, latitude, longitude, capacity FROM shelters")
            shelters = cur.fetchall()
            return [
                {
                    "shelter_id": str(s[0]),
                    "name": s[1],
                    "address": s[2],
                    "latitude": s[3],
                    "longitude": s[4],
                    "capacity": s[5]
                }
                for s in shelters
            ]

@router.get("/search", summary="シェルターを名前または容量で検索")
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
                    "capacity": s[3]
                }
                for s in shelters
            ]

@router.get("/{shelter_id}", summary="IDでシェルターを取得")
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
                "capacity": s[5]
            }