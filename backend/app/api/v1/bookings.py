"""
Bookings API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from app.core.database import get_db
from app.models import Booking

router = APIRouter()

class BookingSchema(BaseModel):
    booking_id: str
    customer_id: str
    room_id: int
    check_in_date: date
    check_out_date: date
    total_amount: float
    deposit: float
    status: str = "checked_in"
    notes: Optional[str] = None
    source: str = "walk_in"

class BookingResponse(BookingSchema):
    id: int
    class Config:
        from_attributes = True

@router.get("/", response_model=List[BookingResponse])
def get_bookings(
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Booking)
    if status:
        query = query.filter(Booking.status == status)
    if start_date:
        query = query.filter(Booking.check_in_date >= start_date)
    if end_date:
        query = query.filter(Booking.check_out_date <= end_date)
    return query.all()

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@router.post("/", response_model=BookingResponse)
def create_booking(booking: BookingSchema, db: Session = Depends(get_db)):
    db_booking = Booking(**booking.dict())
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(booking_id: str, booking: BookingSchema, db: Session = Depends(get_db)):
    db_booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    for key, value in booking.dict().items():
        setattr(db_booking, key, value)
    
    db.commit()
    db.refresh(db_booking)
    return db_booking

@router.delete("/{booking_id}")
def delete_booking(booking_id: str, db: Session = Depends(get_db)):
    db_booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    db.delete(db_booking)
    db.commit()
    return {"message": "Booking deleted"}

@router.get("/today/checkins")
def get_today_checkins(db: Session = Depends(get_db)):
    today = date.today()
    checkins = db.query(Booking).filter(Booking.check_in_date == today).all()
    return checkins

@router.get("/today/checkouts")
def get_today_checkouts(db: Session = Depends(get_db)):
    today = date.today()
    checkouts = db.query(Booking).filter(Booking.check_out_date == today).all()
    return checkouts
