# backend/app/database.py
import psycopg2

def get_db_connection():
    return psycopg2.connect(
        host="db",
        database="mamoru_navi_db",
        user="user",
        password="password"
    )