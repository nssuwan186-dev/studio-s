# Models module
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(20), unique=True, index=True)
    building = Column(String(10))  # A, B, N
    floor = Column(Integer)
    room_type = Column(String(50))  # Standard, Deluxe, Suite
    price_per_night = Column(Float, default=0)
    status = Column(String(20), default="available")  # available, occupied, maintenance
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(20), unique=True, index=True)
    name = Column(String(200))
    phone = Column(String(20))
    address = Column(Text)
    id_card = Column(String(20))
    email = Column(String(100))
    total_stays = Column(Integer, default=0)
    total_spent = Column(Float, default=0)
    last_stay_date = Column(Date)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(String(20), unique=True, index=True)
    customer_id = Column(String(20), ForeignKey("customers.customer_id"))
    room_id = Column(Integer, ForeignKey("rooms.id"))
    check_in_date = Column(Date)
    check_out_date = Column(Date)
    total_amount = Column(Float, default=0)
    deposit = Column(Float, default=0)
    status = Column(String(20))  # checked_in, checked_out, cancelled
    notes = Column(Text)
    source = Column(String(50))  # walk_in, booking_com, agoda, line
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    item_name = Column(String(200))
    receipt = Column(Float, default=0)
    payment = Column(Float, default=0)
    room_number = Column(String(20))
    customer_name = Column(String(200))
    note = Column(Text)
    category = Column(String(50))  # room, deposit, extra, expense, salary
    payment_method = Column(String(20))  # cash, transfer, qrcode
    slip_image = Column(Text)
    created_at = Column(DateTime, default=func.now())

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password = Column(String(200))
    name = Column(String(200))
    phone = Column(String(20))
    role = Column(String(20))  # admin, manager, staff
    position = Column(String(50))
    salary = Column(Float, default=0)
    pay_type = Column(String(20))  # monthly, daily
    status = Column(String(20), default="active")  # active, suspended
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True)
    opening_balance = Column(Float, default=0)
    deposit_amount = Column(Float, default=200)
    electric_rate = Column(Float, default=8)
    water_rate = Column(Float, default=25)
    hotel_name = Column(String(200), default="VIPAT Hotel")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
