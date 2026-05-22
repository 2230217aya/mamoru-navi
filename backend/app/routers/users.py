# backend/app/routers/users.py

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import uuid

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