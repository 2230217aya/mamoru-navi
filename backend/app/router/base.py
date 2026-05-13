from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from app.database import SessionLocal
from app.models.base import User, Shelter, DangerArea, Notification
from datetime import date

router = APIRouter()  

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ===== SCHEMAS =====

class UserCreate(BaseModel):
    name: str
    gender: str
    birthday: date
    phone_number: str
    email: str
    address: str
    user_role: str
    blood_type: str
    medical_conditions: str
    home_location: str

class ShelterCreate(BaseModel):
    name: str
    address: str
    latitude: str
    longitude: str
    capacity: str

class DangerAreaCreate(BaseModel):
    risk_type: str
    risk_level: int
    intesity: str
    geometry: str
    source: str
    description: str
    trigger_conditions: str
    is_active: bool

class NotificationCreate(BaseModel):
    user_id: str
    area_id: str
    type: str
    priority: int
    title: str
    message: str

# ===== USER =====

@router.post("/users/")
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        new_user = User(
            name=user_data.name,
            email=user_data.email,
            gender=user_data.gender,
            birthday=user_data.birthday,
            phone_number=user_data.phone_number,
            address=user_data.address,
            user_role=user_data.user_role,
            blood_type=user_data.blood_type,
            medical_conditions=user_data.medical_conditions,
            home_location=user_data.home_location
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"message": "user created", "user_id": str(new_user.user_id)}
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email atau phone number sudah terdaftar!")

@router.get("/users/")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"user_id": str(u.user_id), "name": u.name, "email": u.email} for u in users]

@router.get("/users/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan!")
    return {"user_id": str(user.user_id), "name": user.name, "email": user.email}

# ===== SHELTER =====

@router.post("/shelters/")
def create_shelter(data: ShelterCreate, db: Session = Depends(get_db)):
    try:
        new_shelter = Shelter(
            name=data.name,
            address=data.address,
            latitude=data.latitude,
            longitude=data.longitude,
            capacity=data.capacity
        )
        db.add(new_shelter)
        db.commit()
        db.refresh(new_shelter)
        return {"message": "shelter created", "shelter_id": str(new_shelter.shelter_id)}
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Data sudah ada!")

@router.get("/shelters/")
def get_shelters(db: Session = Depends(get_db)):
    shelters = db.query(Shelter).all()
    return [{"shelter_id": str(s.shelter_id), "name": s.name, "address": s.address,
             "latitude": s.latitude, "longitude": s.longitude, "capacity": s.capacity} for s in shelters]

@router.get("/shelters/{shelter_id}")
def get_shelter(shelter_id: str, db: Session = Depends(get_db)):
    shelter = db.query(Shelter).filter(Shelter.shelter_id == shelter_id).first()
    if not shelter:
        raise HTTPException(status_code=404, detail="Shelter tidak ditemukan!")
    return {"shelter_id": str(shelter.shelter_id), "name": shelter.name, "address": shelter.address}

# ===== DANGER AREA =====

@router.post("/danger-areas/")
def create_danger_area(data: DangerAreaCreate, db: Session = Depends(get_db)):
    new_area = DangerArea(
        risk_type=data.risk_type,
        risk_level=data.risk_level,
        intesity=data.intesity,
        geometry=data.geometry,
        source=data.source,
        description=data.description,
        trigger_conditions=data.trigger_conditions,
        is_active=data.is_active
    )
    db.add(new_area)
    db.commit()
    db.refresh(new_area)
    return {"message": "danger area created", "area_id": str(new_area.area_id)}

@router.get("/danger-areas/")
def get_danger_areas(db: Session = Depends(get_db)):
    areas = db.query(DangerArea).all()
    return [{"area_id": str(a.area_id), "risk_type": a.risk_type,
             "risk_level": a.risk_level, "is_active": a.is_active} for a in areas]

# ===== NOTIFICATION =====

@router.post("/notifications/")
def create_notification(data: NotificationCreate, db: Session = Depends(get_db)):
    new_notif = Notification(
        user_id=data.user_id,
        area_id=data.area_id,
        type=data.type,
        priority=data.priority,
        title=data.title,
        message=data.message
    )
    db.add(new_notif)
    db.commit()
    db.refresh(new_notif)
    return {"message": "notification created", "notification_id": str(new_notif.notification_id)}

@router.get("/notifications/{user_id}")
def get_notifications(user_id: str, db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(Notification.user_id == user_id).all()
    if not notifs:
        raise HTTPException(status_code=404, detail="Notification tidak ditemukan!")
    return [{"notification_id": str(n.notification_id), "title": n.title,
             "message": n.message, "is_read": n.is_read} for n in notifs]