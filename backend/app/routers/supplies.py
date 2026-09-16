from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db
from enum import Enum

router = APIRouter(
    prefix="/supplies",
    tags=["Supplies"],
    responses={404: {"description": "Not found"}},
)

class Genre(str, Enum):
    drinking_water = "drinking_water"
    food = "food"
    bedding = "bedding"
    clothing = "clothing"
    domestic_water = "domestic_water"
    medicine = "medicine"
    hygiene_supplies = "hygiene_supplies"
    other = "other"

class SupplyCreate(BaseModel):
    shelter_id: str
    genre: Genre
    name: str
    quantity: int
    unit: str
    expiration: Optional[str] = None

# 更新時に更新したいものだけ変えられるようにNoneにする
class SupplyUpdate(BaseModel):
    genre: Optional[Genre] = None
    name: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    expiration: Optional[str] = None

# GET /supplies/{shelter_id}
# shelter_id の避難所の物資状況を一覧取得
@router.get("/{shelter_id}", summary="避難所の物資状況を一覧取得")
def get_supplies(shelter_id: str):  # /supplies/{shelter_id} がshelter_idに入る
    with get_db() as conn:          # DB接続
        with conn.cursor() as cur:  # SQLを実行するためのカーソル

            # sql実行(物資を取得)
            cur.execute("""
                SELECT supply_id, shelter_id, genre, name, quantity, unit, expiration
                FROM supplies
                WHERE shelter_id = %s
            """, (shelter_id,))

            # sqlの結果取得
            supplies = cur.fetchall()

            # sqlの結果をjsonにしてフロントに返す
            return [{"supply_id": str(s[0]), "shelter_id": str(s[1]), "genre": s[2], "name": s[3], "quantity": s[4], "unit": s[5], "expiration": s[6] }for s in supplies]

# POST /supplies/
# フロントから送られた物資データをDBに登録する
@router.post("/", summary="物資データの登録")
def create_supply(data: SupplyCreate):
    with get_db() as conn:              # DBへ接続
        with conn.cursor() as cur:      # SQL実行用カーソル

            # sql実行(同じ物資があるか確認)
            cur.execute("""
                SELECT supply_id
                FROM supplies
                WHERE shelter_id = %s AND genre = %s AND name = %s AND expiration = %s
            """, (data.shelter_id, data.genre.value, data.name, data.expiration))

            # sqlで取得した結果を一件取り出す
            existing = cur.fetchone()

            # 存在しない物資を取り出そうとした場合
            if not existing and data.quantity < 0:
                raise HTTPException(
                    status_code=400,
                    detail="取り出す物資が存在しません"
                )

            # 存在する場合、数量追加
            if existing:
                supply_id = existing[0] # existingの一件目(supply_id)を取り出し、物資が存在するか確認

                # 物資の現在の数量を取得
                cur.execute("""
                    SELECT quantity
                    FROM supplies
                    WHERE supply_id = %s
                """, (supply_id,))

                # current_quantityに取得した数量を入れる
                current_quantity = cur.fetchone()[0]

                # 更新後の数量がマイナスになるならエラー
                if current_quantity + data.quantity < 0:
                    raise HTTPException(
                        status_code=400,
                        detail="在庫不足です"
                    )

                # 数量を更新する
                cur.execute("""
                    UPDATE supplies
                    SET quantity = quantity + %s
                    WHERE supply_id = %s
                """, (data.quantity, supply_id))

                # 登録を確定
                conn.commit()

                # フロントへ返す
                return {"message": "existing supply updated", "supply_id": str(supply_id)}

            # sql実行(物資を登録)
            cur.execute("""
                INSERT INTO supplies (shelter_id, genre, name, quantity, unit, expiration)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING supply_id
            """, (data.shelter_id, data.genre.value, data.name, data.quantity, data.unit, data.expiration))

            # 登録した物資のIDを取得
            supply_id = cur.fetchone()[0]

            # 登録を確定
            conn.commit()

            # フロントへ返す
            return {"message": "supply created", "supply_id": str(supply_id)}

# PATCH /supplies/{supply_id}
# 登録済み物資の情報を更新
@router.patch("/{supply_id}", summary="登録済み物資の更新")
def update_supply(supply_id: str, data: SupplyUpdate):
    with get_db() as conn:              # DBへ接続
        with conn.cursor() as cur:      # SQL実行用カーソル

            # sql実行(物資情報の更新)
            cur.execute("""
                UPDATE supplies
                SET quantity = quantity + %s
                WHERE supply_id = %s
            """, (data.quantity, supply_id))

            # 更新対象が存在しない場合
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="物資が見つかりません")

            # 更新を確定
            conn.commit()

            # フロントへ返す
            return {"message": "supply updated", "supply_id": supply_id}

# DELETE /supplies/{supply_id}
# 登録済み物資を削除
@router.delete("/{supply_id}", summary="登録済み物資の削除(物資そのものを削除するので数を減らすあ場合はPOSTやPATCH)")
def delete_supply(supply_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:

            # 物資削除
            cur.execute("""
                DELETE FROM supplies
                WHERE supply_id = %s
            """, (supply_id,))

            # 対象が存在しない
            if cur.rowcount == 0:
                raise HTTPException(
                    status_code=404,
                    detail="物資が見つかりません"
                )

            conn.commit()

            return {
                "message": "supply deleted",
                "supply_id": supply_id
            }
