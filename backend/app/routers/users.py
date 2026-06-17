# backend/app/routers/users.py

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import uuid
from database import get_db_connection
from psycopg2.extras import RealDictCursor

# APIRouterのインスタンスを作成
# これが「ユーザー関連」のエンドポイントをまとめるルーターになります。
router = APIRouter(
    prefix="/user", # このルーター内の全てのエンドポイントは /user から始まります
    tags=["Users"], # Swagger UIで表示されるタグ
    responses={404: {"description": "Not found"}},
)

# --- レスポンスモデルの定義 ---
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

@router.get(
    "/qr-code", # prefixが /user なので、実際のエンドポイントは /user/qr-code となります
    response_model=QRCodeDataResponse,
    summary="ユーザーのQRコードコンテンツを取得",
    description="認証済みのユーザーに、QRコードとして埋め込むための固有ID文字列を返します。現在はダミーデータを返却します。"
)
async def get_user_qr_code():
    """
    認証済みユーザーのQRコードコンテンツを生成・返却します。
    現時点ではダミーのユーザーIDを生成していますが、
    実際のアプリケーションでは、認証情報（例: JWTトークンから抽出したユーザーID）を使用して、
    データベースに登録されている永続的なユーザーIDを元にQRコードコンテンツを生成します。
    """
    # TODO: 認証ロジックをここに追加し、リクエストから実際のユーザーIDを取得する
    # 例: current_user_id = await get_current_user_id_from_token(token)
    # qr_content = f"mamoru_navi_user:{current_user_id}"

    # 【固定テストユーザー対応】
    # 毎回ランダムなUUID( uuid.uuid4() )を作るのではなく、全員共通の固定UUIDを使用します。
    # データベースの users テーブルにも、このUUIDを持つユーザーを1件だけ登録しておきます。
    dummy_user_identifier = "123e4567-e89b-12d3-a456-426614174000"
    qr_content_string = f"mamoru_navi_user:{dummy_user_identifier}"

    return QRCodeDataResponse(
        qr_code_content=qr_content_string,
        message="ユーザーIDに基づいたQRコードコンテンツを生成しました。"
    )



# 本来は認証トークンから取得しますが、今はテストユーザーの固定UUIDを使用します
TEST_USER_ID = "123e4567-e89b-12d3-a456-426614174000"

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


# backend/app/routers/users.py

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

