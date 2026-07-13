# backend/app/database_utils.py
import psycopg2 
import psycopg2.extras # 念のため
# 2. 同じフォルダのファイルなら app. を取ってインポートする
try:
    from database import get_db_connection
    from seed_data import SHELTERS_DATA
except ImportError:
    from app.database import get_db_connection
    from app.seed_data import SHELTERS_DATA


def seed_shelters():
    # 接続情報を database.py から取得
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            for s in SHELTERS_DATA:
                cur.execute("""
                    INSERT INTO shelters (
                        shelter_id, name, address, latitude, longitude, capacity, toilet_count, supplies
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (shelter_id) DO UPDATE SET 
                        capacity = EXCLUDED.capacity,
                        toilet_count = EXCLUDED.toilet_count,
                        supplies = EXCLUDED.supplies;
                """, (
                    s["id"], s["name"], s["address"], s["lat"], s["lon"], 
                    s["capacity"], s.get("toilet", 0), s.get("supplies", [])
                ))
            conn.commit()
            print(f"✅ {len(SHELTERS_DATA)}件の避難所データを同期しました。")
    except Exception as e:
        print(f"❌ Seed実行エラー: {e}")
        conn.rollback()
    finally:
        conn.close()