"""
Finance/Transactions API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from app.core.database import get_db
from app.models import Transaction, Settings

router = APIRouter()

class TransactionSchema(BaseModel):
    date: date
    item_name: str
    receipt: float = 0
    payment: float = 0
    room_number: Optional[str] = None
    customer_name: Optional[str] = None
    note: Optional[str] = None
    category: str
    payment_method: str = "cash"
    slip_image: Optional[str] = None

class TransactionResponse(TransactionSchema):
    id: int
    class Config:
        from_attributes = True

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if category:
        query = query.filter(Transaction.category == category)
    return query.order_by(Transaction.date.desc()).all()

@router.get("/{trans_id}", response_model=TransactionResponse)
def get_transaction(trans_id: int, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.id == trans_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.post("/", response_model=TransactionResponse)
def create_transaction(transaction: TransactionSchema, db: Session = Depends(get_db)):
    db_transaction = Transaction(**transaction.dict())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.put("/{trans_id}", response_model=TransactionResponse)
def update_transaction(trans_id: int, transaction: TransactionSchema, db: Session = Depends(get_db)):
    db_transaction = db.query(Transaction).filter(Transaction.id == trans_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    for key, value in transaction.dict().items():
        setattr(db_transaction, key, value)
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.delete("/{trans_id}")
def delete_transaction(trans_id: int, db: Session = Depends(get_db)):
    db_transaction = db.query(Transaction).filter(Transaction.id == trans_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(db_transaction)
    db.commit()
    return {"message": "Transaction deleted"}

@router.get("/daily/summary")
def get_daily_summary(trans_date: date, db: Session = Depends(get_db)):
    transactions = db.query(Transaction).filter(Transaction.date == trans_date).all()
    
    total_receipt = sum(t.receipt for t in transactions)
    total_payment = sum(t.payment for t in transactions)
    
    by_category = {}
    for t in transactions:
        if t.receipt > 0:
            by_category[f"receipt_{t.category}"] = by_category.get(f"receipt_{t.category}", 0) + t.receipt
        if t.payment > 0:
            by_category[f"payment_{t.category}"] = by_category.get(f"payment_{t.category}", 0) + t.payment
    
    return {
        "date": trans_date,
        "total_receipt": total_receipt,
        "total_payment": total_payment,
        "net": total_receipt - total_payment,
        "by_category": by_category
    }

@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/settings")
def update_settings(
    opening_balance: Optional[float] = None,
    deposit_amount: Optional[float] = None,
    electric_rate: Optional[float] = None,
    water_rate: Optional[float] = None,
    hotel_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings()
        db.add(settings)
    
    if opening_balance is not None:
        settings.opening_balance = opening_balance
    if deposit_amount is not None:
        settings.deposit_amount = deposit_amount
    if electric_rate is not None:
        settings.electric_rate = electric_rate
    if water_rate is not None:
        settings.water_rate = water_rate
    if hotel_name is not None:
        settings.hotel_name = hotel_name
    
    db.commit()
    db.refresh(settings)
    return settings
