# backend/app/routers/users.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
import json
from database import get_db,get_db_connection
import psycopg2
from psycopg2.extras import RealDictCursor 

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

# プロフィール更新で受け取るデータの型定義
class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[str] = None
    blood_type: Optional[str] = None
    medical_conditions: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None    

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
    dummy_user_identifier = "11111111-1111-1111-1111-111111111111"
    qr_content_string = f"mamoru_navi_user:{dummy_user_identifier}"
    return QRCodeDataResponse(
        qr_code_content=qr_content_string,
        message="ユーザーIDに基づいたQRコードコンテンツを生成しました。"
    )


@router.get("/my-role", summary="現在のユーザーのロールを取得")
def get_user_role():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # TEST_USER_ID は 123e4567... を使用
        cur.execute("SELECT user_role FROM users WHERE user_id = %s;", (TEST_USER_ID,))
        result = cur.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
            
        return {"status": "success", "user_role": result["user_role"]}
    finally:
        cur.close()
        conn.close()        
@router.get("/{user_id}", summary="IDでユーザーを取得する")
def get_user(user_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id, name, gender, birthday, age, blood_type, medical_conditions, phone_number, address FROM users WHERE user_id = %s", (user_id,))
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="ユーザーが見つかりません!")
            return {"user_id": str(user[0]), "name": user[1], "gender": user[2], "birthday": user[3], "age": user[4], "blood_type": user[5], "medical_conditions": user[6], "phone_number": user[7], "address": user[8]}


@router.get("/{user_id}", summary="IDでユーザーを取得する")
def get_user(user_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id, name, email FROM users WHERE user_id = %s", (user_id,))
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="ユーザーが見つかりません!")
            return {"user_id": str(user[0]), "name": user[1], "email": user[2]}
        



# 本来は認証トークンから取得しますが、今はテストユーザーの固定UUIDを使用します
TEST_USER_ID = "11111111-1111-1111-1111-111111111111"

@router.get("/profile", summary="ユーザーのプロフィールを取得")
def get_user_profile():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT name, gender, birthday, blood_type, medical_conditions, phone_number, address  -- ★birthdayを追加
            FROM users WHERE user_id = %s;
        """, (TEST_USER_ID,))
        user = cur.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
            
        return {"status": "success", "profile": dict(user)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.patch("/profile", summary="ユーザーのプロフィールを更新")
def update_user_profile(profile: UserProfileUpdate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Pydanticモデルから、値が入っている（送信された）項目だけを辞書で取得
        update_data = profile.model_dump(exclude_unset=True)
        
        if not update_data:
            return {"status": "success", "message": "更新するデータがありません"}

        update_fields = []
        values = []
        
        for key, value in update_data.items():
            # SQLの「カラム名 = %s」の部分を作る
            update_fields.append(f"{key} = %s")
            # 空文字 "" が送られてきた場合は None (NULL) に変換する処理を入れるとDBが安定します
            values.append(value if value != "" else None)
            
        # 更新日時(updated_at)を追加
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        
        # SQL文を組み立て
        sql = f"UPDATE users SET {', '.join(update_fields)} WHERE user_id = %s"
        values.append(TEST_USER_ID)
        
        # デバッグ用：どんなSQLが実行されるかサーバーのログに出す
        print(f"Executing SQL: {sql} with values: {values}")
        
        cur.execute(sql, tuple(values))
        conn.commit()
        
        return {"status": "success", "message": "プロフィールを更新しました！"}
    except Exception as e:
        conn.rollback()
        # ★ エラーメッセージを print して Docker ログで見えるようにする
        print(f"Database update error: {str(e)}")
        # 500エラーとして詳細な理由を返す
        raise HTTPException(status_code=500, detail=f"Database update failed: {str(e)}")
    finally:
        cur.close()
        conn.close()             





