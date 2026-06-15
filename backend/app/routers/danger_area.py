from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db

router = APIRouter(
    prefix="/danger-areas",
    tags=["Danger Areas"],
    responses={404: {"description": "Not found"}},
)

# ===== SCHEMA =====

class DangerAreaCreate(BaseModel):
    risk_type: str
    risk_level: int
    intensity: Optional[str] = None
    geom: str                        # GeoJSON string
    source: str
    description: Optional[str] = None
    trigger_condition: Optional[str] = None
    is_active: bool = True

class DangerAreaUpdate(BaseModel):
    risk_type: Optional[str] = None
    risk_level: Optional[int] = None
    intensity: Optional[str] = None
    geom: Optional[str] = None
    source: Optional[str] = None
    description: Optional[str] = None
    trigger_condition: Optional[str] = None
    is_active: Optional[bool] = None

# ===== ENDPOINTS =====

@router.post("/", summary="危険エリアを作成する")
def create_danger_area(data: DangerAreaCreate):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO danger_areas (risk_type, risk_level, intensity, geom, source, description, trigger_condition, is_active)
                VALUES (%s, %s, %s, ST_GeomFromGeoJSON(%s), %s, %s, %s, %s)
                RETURNING area_id
            """, (data.risk_type, data.risk_level, data.intensity, data.geom,
                  data.source, data.description, data.trigger_condition, data.is_active))
            conn.commit()
            return {"message": "danger area created", "area_id": str(cur.fetchone()[0])}

@router.get("/", summary="すべての危険エリアを取得する")
def get_danger_areas(is_active: Optional[bool] = None):
    with get_db() as conn:
        with conn.cursor() as cur:
            query = """
                SELECT area_id, risk_type, risk_level, intensity, source,
                       description, trigger_condition, is_active, created_at, updated_at,
                       ST_AsGeoJSON(geom) as geom
                FROM danger_areas
            """
            params = []
            if is_active is not None:
                query += " WHERE is_active = %s"
                params.append(is_active)

            cur.execute(query, params)
            areas = cur.fetchall()
            return [
                {
                    "area_id": str(a[0]),
                    "risk_type": a[1],
                    "risk_level": a[2],
                    "intensity": a[3],
                    "source": a[4],
                    "description": a[5],
                    "trigger_condition": a[6],
                    "is_active": a[7],
                    "created_at": str(a[8]),
                    "updated_at": str(a[9]),
                    "geom": a[10]
                }
                for a in areas
            ]

@router.get("/{area_id}", summary="IDで危険エリアを取得する")
def get_danger_area(area_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT area_id, risk_type, risk_level, intensity, source,
                       description, trigger_condition, is_active, created_at, updated_at,
                       ST_AsGeoJSON(geom) as geom
                FROM danger_areas WHERE area_id = %s
            """, (area_id,))
            a = cur.fetchone()
            if not a:
                raise HTTPException(status_code=404, detail="危険エリアが見つかりません!")
            return {
                "area_id": str(a[0]),
                "risk_type": a[1],
                "risk_level": a[2],
                "intensity": a[3],
                "source": a[4],
                "description": a[5],
                "trigger_condition": a[6],
                "is_active": a[7],
                "created_at": str(a[8]),
                "updated_at": str(a[9]),
                "geom": a[10]
            }

@router.patch("/{area_id}", summary="危険エリアを更新する")
def update_danger_area(area_id: str, data: DangerAreaUpdate):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT area_id FROM danger_areas WHERE area_id = %s", (area_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="危険エリアが見つかりません!")

            fields = []
            params = []
            if data.risk_type is not None:
                fields.append("risk_type = %s"); params.append(data.risk_type)
            if data.risk_level is not None:
                fields.append("risk_level = %s"); params.append(data.risk_level)
            if data.intensity is not None:
                fields.append("intensity = %s"); params.append(data.intensity)
            if data.geom is not None:
                fields.append("geom = ST_GeomFromGeoJSON(%s)"); params.append(data.geom)
            if data.source is not None:
                fields.append("source = %s"); params.append(data.source)
            if data.description is not None:
                fields.append("description = %s"); params.append(data.description)
            if data.trigger_condition is not None:
                fields.append("trigger_condition = %s"); params.append(data.trigger_condition)
            if data.is_active is not None:
                fields.append("is_active = %s"); params.append(data.is_active)

            fields.append("updated_at = NOW()")
            params.append(area_id)

            cur.execute(f"UPDATE danger_areas SET {', '.join(fields)} WHERE area_id = %s", params)
            conn.commit()
            return {"message": "danger area updated", "area_id": area_id}

@router.delete("/{area_id}", summary="危険エリアを削除する")
def delete_danger_area(area_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT area_id FROM danger_areas WHERE area_id = %s", (area_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="危険エリアが見つかりません!")
            cur.execute("DELETE FROM danger_areas WHERE area_id = %s", (area_id,))
            conn.commit()
            return {"message": "danger area deleted", "area_id": area_id}