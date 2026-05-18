from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from app.database import SessionLocal
from app.models.base import User, Shelter, DangerArea, Notification, Reservation
from datetime import date, datetime

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

class ReservationCreate(BaseModel):
    user_id: str
    facility_id: str
    start_time: datetime
    end_time: datetime
    purpose: str | None = None

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

# ===== RESERVATION =====

@router.post("/reservations/")
def create_reservation(data: ReservationCreate, db: Session = Depends(get_db)):
    new_reservation = Reservation(
        facility_id=data.facility_id,
        user_id=data.user_id,
        start_time=data.start_time,
        end_time=data.end_time,
        purpose=data.purpose
    )
    db.add(new_reservation)
    db.commit()
    db.refresh(new_reservation)
    return {"message": "reservation created", "reservation_id": str(new_reservation.reservation_id)}

@router.get("/reservations/{user_id}")
def get_reservations(user_id: str, db: Session = Depends(get_db)):
    reservations = db.query(Reservation).filter(Reservation.user_id == user_id).all()
    if not reservations:
        raise HTTPException(status_code=404, detail="Reservation tidak ditemukan!")
    return [{"reservation_id": str(r.reservation_id),
             "facility_id": str(r.facility_id),
             "start_time": str(r.start_time),
             "end_time": str(r.end_time),
             "status": r.status,
             "purpose": r.purpose} for r in reservations]

# ===== MAP =====
@router.get("/map")
def get_map(db: Session = Depends(get_db)):
    shelters = db.query(Shelter).all()
    danger_areas = db.query(DangerArea).all()
    return {
        "shelters": [{"shelter_id": str(s.shelter_id), "name": s.name,
                      "latitude": s.latitude, "longitude": s.longitude} for s in shelters],
        "danger_areas": [{"area_id": str(a.area_id), "risk_type": a.risk_type,
                          "risk_level": a.risk_level} for a in danger_areas]
    }

# ===== LOCATION INFO =====
@router.get("/location-info")
def get_location_info(lat: float, lng: float, db: Session = Depends(get_db)):
    shelters = db.query(Shelter).all()
    nearest = None
    min_dist = float("inf")
    for s in shelters:
        dist = abs(float(s.latitude) - lat) + abs(float(s.longitude) - lng)
        if dist < min_dist:
            min_dist = dist
            nearest = s
    danger_areas = db.query(DangerArea).filter(DangerArea.is_active == True).all()
    return {
        "latitude": lat,
        "longitude": lng,
        "nearest_shelter": {"name": nearest.name, "address": nearest.address} if nearest else None,
        "danger_level": [{"risk_type": a.risk_type, "risk_level": a.risk_level} for a in danger_areas]
    }

# ===== SEARCH =====
@router.get("/shelters/search")
def search_shelters(q: str = None, capacity: int = None, db: Session = Depends(get_db)):
    query = db.query(Shelter)
    if q:
        query = query.filter(Shelter.name.ilike(f"%{q}%"))
    if capacity:
        query = query.filter(Shelter.capacity >= capacity)
    shelters = query.all()
    return [{"shelter_id": str(s.shelter_id), "name": s.name,
             "address": s.address, "capacity": s.capacity} for s in shelters]