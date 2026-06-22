# backend/app/database.py
import psycopg2
from contextlib import contextmanager

def get_db_connection():
    return psycopg2.connect(
        host="db",
        database="mamoru_navi_db",
        user="user",
        password="password"
    )

@contextmanager
def get_db():
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SET timezone = 'Asia/Tokyo'")
        cur.close()
        yield conn
    finally:
        conn.close()