from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db

router = APIRouter(
    prefix="/facilities",
    tags=["Facilities"],
    responses={404: {"description": "Not found"}},
)

class FacilityCreate(BaseModel):
    name: str
    type: str
    address: str

@router.post("/", summary="施設を作成する")
def create_facility(data: FacilityCreate):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO facilities (name, type, address)
                VALUES (%s, %s, %s)
                RETURNING facility_id
            """, (data.name, data.type, data.address))
            conn.commit()
            return {"message": "facility created", "facility_id": str(cur.fetchone()[0])}

@router.get("/", summary="全施設を取得する")
def get_facilities(type: Optional[str] = None):
    with get_db() as conn:
        with conn.cursor() as cur:
            query = "SELECT facility_id, name, type, address FROM facilities"
            params = []
            if type:
                query += " WHERE type = %s"
                params.append(type)
            cur.execute(query, params)
            facilities = cur.fetchall()
            return [
                {
                    "facility_id": str(f[0]),
                    "name": f[1],
                    "type": f[2],
                    "address": f[3]
                }
                for f in facilities
            ]

@router.get("/{facility_id}", summary="IDで施設を取得する")
def get_facility(facility_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT facility_id, name, type, address FROM facilities WHERE facility_id = %s", (facility_id,))
            f = cur.fetchone()
            if not f:
                raise HTTPException(status_code=404, detail="施設が見つかりません!")
            return {
                "facility_id": str(f[0]),
                "name": f[1],
                "type": f[2],
                "address": f[3]
            }