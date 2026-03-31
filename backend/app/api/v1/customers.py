"""
Customers API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from app.core.database import get_db
from app.models import Customer

router = APIRouter()

class CustomerSchema(BaseModel):
    customer_id: str
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    id_card: Optional[str] = None
    email: Optional[str] = None
    total_stays: int = 0
    total_spent: float = 0
    last_stay_date: Optional[date] = None

class CustomerResponse(CustomerSchema):
    id: int
    class Config:
        from_attributes = True

@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Customer)
    if search:
        query = query.filter(
            (Customer.name.contains(search)) | 
            (Customer.phone.contains(search)) |
            (Customer.customer_id.contains(search))
        )
    return query.order_by(Customer.created_at.desc()).all()

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("/", response_model=CustomerResponse)
def create_customer(customer: CustomerSchema, db: Session = Depends(get_db)):
    existing = db.query(Customer).filter(Customer.customer_id == customer.customer_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer ID already exists")
    db_customer = Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: str, customer: CustomerSchema, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    for key, value in customer.dict().items():
        setattr(db_customer, key, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.delete("/{customer_id}")
def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(db_customer)
    db.commit()
    return {"message": "Customer deleted"}

@router.get("/top/customers")
def get_top_customers(limit: int = 10, db: Session = Depends(get_db)):
    customers = db.query(Customer).order_by(Customer.total_spent.desc()).limit(limit).all()
    return customers
