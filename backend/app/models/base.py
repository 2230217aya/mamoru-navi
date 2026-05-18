from sqlalchemy import Integer, Boolean, Column, ForeignKey, String, Date, Text, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    gender = Column(String(20), nullable=False)
    birthday = Column(Date, nullable=False)
    blood_type = Column(String(5), nullable=False)
    medical_conditions = Column(Text, nullable=False)
    phone_number = Column(String(20), nullable=False, unique=True)
    email = Column(String(100), unique=True, index=True)
    address = Column(Text, nullable=False)
    home_location = Column(String, nullable=False)
    user_role = Column(String(20), nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    
class Shelter(Base):
    __tablename__ = "shelters"

    shelter_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    address = Column(Text, nullable=False)
    latitude = Column(String(20), nullable=False)
    longitude = Column(String(20), nullable=False)
    capacity = Column(String(20), nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.now())

class DangerArea(Base):
    __tablename__ = "danger_areas"

    area_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False, unique=True)
    risk_type = Column(String(50), nullable=False)
    risk_level = Column(Integer, nullable=False)
    intesity = Column(String(100), nullable=False)
    geometry = Column(String, nullable=False)
    source = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    trigger_conditions = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False, unique=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    area_id = Column(UUID(as_uuid=True), ForeignKey("danger_areas.area_id"), nullable=False)
    type = Column(String(20), nullable=False)
    priority = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    sent_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    read_at = Column(TIMESTAMP, nullable=True)
    action_url = Column(Text, nullable=True)

class Reservation(Base):
    __tablename__ = "facility_reservations"

    reservation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False, unique=True)
    facility_id = Column(UUID(as_uuid=True), ForeignKey("shelters.shelter_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    start_time = Column(TIMESTAMP, nullable=False)
    end_time = Column(TIMESTAMP, nullable=False)
    status = Column(String(20), nullable=False, server_default="pending")
    purpose = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())

