# backend/app/routers/users.py

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import uuid
from database import get_db

# APIRouterのインスタンスを作成
# これが「ユーザー関連」のエンドポイントをまとめるルーターになります。
router = APIRouter(
    prefix="/users", # このルーター内の全てのエンドポイントは /user から始まります
    tags=["Users"], # Swagger UIで表示されるタグ
    responses={404: {"description": "Not found"}},
)

# --- レスポンスモデルの定義 ---
class UserCreate(BaseModel):
    name: str
    email: str
    gender: str
    birthday: str
    phone_number: str
    address: str
    user_role: str
    blood_type: Optional[str] = None
    medical_conditions: Optional[str] = None
    longitude: Optional[float] = None
    latitude: Optional[float] = None

class QRCodeDataResponse(BaseModel):
    """
    QRコードとして埋め込むデータを返すレスポンスモデル。
    フロントエンドはこの 'qr_code_content' を使用してQRコード画像を生成します。
    """
    qr_code_content: str
    message: str = "QRコードのコンテンツを生成しました。"

# --- エンドポイントの定義 ---

@router.post("/", summary="ユーザーを作成する")
def create_user(data: UserCreate):
    with get_db() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute("""
                    INSERT INTO users (name, email, gender, birthday, phone_number, address, user_role, blood_type, medical_conditions, home_location)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
                    RETURNING user_id
                """, (data.name, data.email, data.gender, data.birthday, data.phone_number,
                      data.address, data.user_role, data.blood_type, data.medical_conditions,
                      data.longitude, data.latitude))
                conn.commit()
                return {"message": "user created", "user_id": str(cur.fetchone()[0])}
            except Exception:
                conn.rollback()
                raise HTTPException(status_code=400, detail="メールアドレスまたは電話番号は既に登録されています!")

@router.get("/", summary="全ユーザーを取得する")
def get_users():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id, name, email FROM users")
            users = cur.fetchall()
            return [{"user_id": str(u[0]), "name": u[1], "email": u[2]} for u in users]

@router.get("/qr-code", response_model=QRCodeDataResponse, summary="ユーザーのQRコードコンテンツを取得")
def get_user_qr_code():
    dummy_user_identifier = "123e4567-e89b-12d3-a456-426614174000"
    qr_content_string = f"mamoru_navi_user:{dummy_user_identifier}"
    return QRCodeDataResponse(
        qr_code_content=qr_content_string,
        message="ユーザーIDに基づいたQRコードコンテンツを生成しました。"
    )

@router.get("/{user_id}", summary="IDでユーザーを取得する")
def get_user(user_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id, name, email FROM users WHERE user_id = %s", (user_id,))
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="ユーザーが見つかりません!")
            return {"user_id": str(user[0]), "name": user[1], "email": user[2]}
        



