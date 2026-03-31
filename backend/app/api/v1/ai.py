"""
AI API - Auto Fill Forms
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict
from app.core.database import get_db
from app.services.ai_service import ai_service

router = APIRouter()

class OCRRequest(BaseModel):
    text: str

class RoomPriceRequest(BaseModel):
    room_type: str
    building: str
    floor: int

class BookingData(BaseModel):
    check_in: str
    check_out: str
    room_number: str
    customer_name: str
    total: float
    deposit: float

class ExpenseRequest(BaseModel):
    description: str

@router.post("/parse-id-card")
def parse_id_card(request: OCRRequest) -> Dict:
    """Parse ID card text from OCR"""
    return ai_service.parse_id_card(request.text)

@router.post("/suggest-room-price")
def suggest_room_price(request: RoomPriceRequest) -> Dict:
    """Suggest room price"""
    price = ai_service.suggest_room_price(
        request.room_type,
        request.building,
        request.floor
    )
    return {"suggested_price": price}

@router.post("/calculate-advance-payment")
def calculate_advance(room_price: int, nights: int) -> Dict:
    """Calculate advance payment"""
    return ai_service.calculate_advance_payment(room_price, nights)

@router.post("/generate-confirmation")
def generate_confirmation(data: BookingData) -> Dict:
    """Generate booking confirmation message"""
    return {"message": ai_service.generate_booking_confirmation(data.dict())}

@router.post("/categorize-expense")
def categorize_expense(request: ExpenseRequest) -> Dict:
    """Auto-categorize expense"""
    category = ai_service.categorize_expense(request.description)
    return {"category": category}
