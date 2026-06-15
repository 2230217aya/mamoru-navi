from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
    responses={404: {"description": "Not found"}},
)

# ===== SCHEMA =====

class NotificationCreate(BaseModel):
    user_id: str
    danger_area_id: Optional[str] = None
    type: str                          # emergency, warning, info, routine
    priority: int = 1                  # 1:低 〜 3:高
    title: str
    message: str
    action_url: Optional[str] = None

# ===== ENDPOINTS =====

@router.post("/", summary="ユーザーに通知を送信する")
def create_notification(data: NotificationCreate):
    allowed_types = ["emergency", "warning", "info", "routine"]
    if data.type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Type tidak valid! Pilihan: {allowed_types}")
    if data.priority not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="優先順位は1、2、または3でなければなりません!")

    with get_db() as conn:
        with conn.cursor() as cur:
            values = (data.user_id, data.danger_area_id, data.type, data.priority, data.title, data.message, data.action_url)
            cur.execute("""
                INSERT INTO notifications (user_id, danger_area_id, type, priority, title, message, action_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING notification_id
            """, values)
            conn.commit()
            return {"message": "notification created", "notification_id": str(cur.fetchone()[0])}

@router.get("/user/{user_id}", summary="ユーザーのすべての通知を取得する")
def get_notifications_by_user(user_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT notification_id, type, priority, title, message, is_read, sent_at, read_at, action_url
                FROM notifications WHERE user_id = %s ORDER BY sent_at DESC
            """, (user_id,))
            notifs = cur.fetchall()
            if not notifs:
                raise HTTPException(status_code=404, detail="通知が見つかりません!")
            return [
                {
                    "notification_id": str(n[0]),
                    "type": n[1],
                    "priority": n[2],
                    "title": n[3],
                    "message": n[4],
                    "is_read": n[5],
                    "sent_at": str(n[6]),
                    "read_at": str(n[7]) if n[7] else None,
                    "action_url": n[8]
                }
                for n in notifs
            ]

@router.get("/user/{user_id}/unread", summary="未読通知を取得する")
def get_unread_notifications(user_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT notification_id, type, priority, title, message, sent_at, action_url
                FROM notifications WHERE user_id = %s AND is_read = FALSE
                ORDER BY priority DESC, sent_at DESC
            """, (user_id,))
            notifs = cur.fetchall()
            return {
                "unread_count": len(notifs),
                "notifications": [
                    {
                        "notification_id": str(n[0]),
                        "type": n[1],
                        "priority": n[2],
                        "title": n[3],
                        "message": n[4],
                        "sent_at": str(n[5]),
                        "action_url": n[6]
                    }
                    for n in notifs
                ]
            }

@router.patch("/{notification_id}/read", summary="通知を既読にする")
def mark_as_read(notification_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT is_read FROM notifications WHERE notification_id = %s", (notification_id,))
            notif = cur.fetchone()
            if not notif:
                raise HTTPException(status_code=404, detail="通知が見つかりません!")
            if notif[0]:
                return {"message": "既に既読になっています", "notification_id": notification_id}
            cur.execute("UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE notification_id = %s", (notification_id,))
            conn.commit()
            return {"message": "通知が既読にマークされました", "notification_id": notification_id}

@router.patch("/user/{user_id}/read-all", summary="すべてのユーザー通知を既読にする")
def mark_all_as_read(user_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE notifications SET is_read = TRUE, read_at = NOW()
                WHERE user_id = %s AND is_read = FALSE
            """, (user_id,))
            conn.commit()
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="未読の通知がありません!")
            return {"message": f"{cur.rowcount} 通知が既読にマークされました"}
