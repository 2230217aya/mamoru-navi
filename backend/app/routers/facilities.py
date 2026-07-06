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
    type_id: str
    latitude: float
    longitude: float
    business_hours: Optional[str] = None
    closed_days: Optional[str] = None


@router.get("/", summary="全施設を取得する（typeで絞り込み可）")
def get_facilities(type: Optional[str] = None):
    with get_db() as conn:
        with conn.cursor() as cur:
            query = """
                SELECT f.facility_id, f.name, ft.type_name,
                       f.latitude, f.longitude, f.business_hours, f.closed_days
                FROM facilities f
                JOIN facility_types ft ON ft.type_id = f.type_id
            """
            params = []
            if type:
                query += " WHERE ft.type_name = %s"
                params.append(type)
            cur.execute(query, params)
            facilities = cur.fetchall()
            return [
                {
                    "facility_id": str(f[0]),
                    "name": f[1],
                    "type": f[2],
                    "latitude": f[3],
                    "longitude": f[4],
                    "business_hours": f[5],
                    "closed_days": f[6],
                }
                for f in facilities
            ]

@router.get("/{facility_id}", summary="IDで施設を取得する")
def get_facility(facility_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT f.facility_id, f.name, ft.type_name,
                       f.latitude, f.longitude, f.business_hours, f.closed_days
                FROM facilities f
                JOIN facility_types ft ON ft.type_id = f.type_id
                WHERE f.facility_id = %s
            """, (facility_id,))
            f = cur.fetchone()
            if not f:
                raise HTTPException(status_code=404, detail="施設が見つかりません!")
            return {
                "facility_id": str(f[0]),
                "name": f[1],
                "type": f[2],
                "latitude": f[3],
                "longitude": f[4],
                "business_hours": f[5],
                "closed_days": f[6],
            }
        
@router.get("/{facility_id}/office-services", summary="窓口サービス情報（現在の受付番号）を取得")
def get_office_services(facility_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                  fp.purpose_id,
                  fp.purpose_name,
                  COALESCE(
                    MAX(fr.issued_number) FILTER (
                      WHERE fr.status = 'in_progress' AND DATE(fr.created_at) = CURRENT_DATE
                    ), 0
                  ) AS number
                FROM facility_purposes fp
                JOIN facilities f ON f.type_id = fp.type_id
                LEFT JOIN facility_reservations fr
                  ON fr.purpose_id = fp.purpose_id AND fr.facility_id = f.facility_id
                WHERE f.facility_id = %s
                GROUP BY fp.purpose_id, fp.purpose_name
                ORDER BY fp.purpose_name
            """, (facility_id,))
            rows = cur.fetchall()
            if not rows:
                raise HTTPException(status_code=404, detail="この施設の窓口サービス情報が見つかりません")

            return [
                {"id": str(r[0]), "title": r[1], "number": str(r[2])}
                for r in rows
            ]