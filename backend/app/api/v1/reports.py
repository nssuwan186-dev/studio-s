"""
Reports API
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, datetime, timedelta
from app.core.database import get_db
from app.models import Transaction, Booking, Room, Customer, Employee

router = APIRouter()

@router.get("/daily/revenue")
def daily_revenue_report(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db)
):
    transactions = db.query(Transaction).filter(
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).all()
    
    receipts = {}
    payments = {}
    
    for t in transactions:
        day_key = str(t.date)
        if t.receipt > 0:
            receipts[day_key] = receipts.get(day_key, 0) + t.receipt
        if t.payment > 0:
            payments[day_key] = payments.get(day_key, 0) + t.payment
    
    daily_data = []
    current = start_date
    while current <= end_date:
        day_key = str(current)
        daily_data.append({
            "date": day_key,
            "receipt": receipts.get(day_key, 0),
            "payment": payments.get(day_key, 0),
            "net": receipts.get(day_key, 0) - payments.get(day_key, 0)
        })
        current += timedelta(days=1)
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_receipt": sum(receipts.values()),
        "total_payment": sum(payments.values()),
        "total_net": sum(receipts.values()) - sum(payments.values()),
        "daily": daily_data
    }

@router.get("/monthly/revenue")
def monthly_revenue_report(
    year: int,
    db: Session = Depends(get_db)
):
    transactions = db.query(Transaction).filter(
        func.extract("year", Transaction.date) == year
    ).all()
    
    monthly = {i: {"receipt": 0, "payment": 0} for i in range(1, 13)}
    
    for t in transactions:
        month = t.date.month
        if t.receipt > 0:
            monthly[month]["receipt"] += t.receipt
        if t.payment > 0:
            monthly[month]["payment"] += t.payment
    
    return {
        "year": year,
        "months": [
            {
                "month": m,
                "receipt": monthly[m]["receipt"],
                "payment": monthly[m]["payment"],
                "net": monthly[m]["receipt"] - monthly[m]["payment"]
            }
            for m in range(1, 13)
        ]
    }

@router.get("/occupancy")
def occupancy_report(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).filter(
        Booking.check_in_date <= end_date,
        Booking.check_out_date >= start_date
    ).all()
    
    total_rooms = db.query(Room).count()
    days = (end_date - start_date).days + 1
    
    room_nights = {}
    for b in bookings:
        room = db.query(Room).filter(Room.id == b.room_id).first()
        if room:
            room_key = f"{room.building}-{room.room_number}"
            room_nights[room_key] = room_nights.get(room_key, 0) + 1
    
    total_booked = sum(room_nights.values())
    total_available = total_rooms * days
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_rooms": total_rooms,
        "days": days,
        "room_nights_booked": total_booked,
        "occupancy_rate": (total_booked / total_available * 100) if total_available > 0 else 0,
        "by_room": room_nights
    }

@router.get("/employees/salary")
def employee_salary_report(
    month: int,
    year: int,
    db: Session = Depends(get_db)
):
    employees = db.query(Employee).filter(Employee.status == "active").all()
    
    salary_data = []
    total = 0
    
    for emp in employees:
        salary = emp.salary
        if emp.pay_type == "daily":
            days_in_month = 30
            salary = salary * days_in_month
        
        total += salary
        salary_data.append({
            "username": emp.username,
            "name": emp.name,
            "position": emp.position,
            "salary": emp.salary,
            "pay_type": emp.pay_type,
            "monthly_amount": salary
        })
    
    return {
        "month": month,
        "year": year,
        "employees": salary_data,
        "total_salary": total
    }

@router.get("/top/customers")
def top_customers_report(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    customers = db.query(Customer).order_by(Customer.total_spent.desc()).limit(limit).all()
    
    return {
        "customers": [
            {
                "customer_id": c.customer_id,
                "name": c.name,
                "phone": c.phone,
                "total_stays": c.total_stays,
                "total_spent": c.total_spent,
                "last_stay_date": c.last_stay_date
            }
            for c in customers
        ]
    }

@router.get("/summary")
def summary_report(db: Session = Depends(get_db)):
    today = date.today()
    month_start = today.replace(day=1)
    
    today_trans = db.query(Transaction).filter(Transaction.date == today).all()
    month_trans = db.query(Transaction).filter(
        Transaction.date >= month_start,
        Transaction.date <= today
    ).all()
    
    total_rooms = db.query(Room).count()
    occupied_rooms = db.query(Room).filter(Room.status == "occupied").count()
    
    return {
        "today": {
            "date": today,
            "receipt": sum(t.receipt for t in today_trans),
            "payment": sum(t.payment for t in today_trans)
        },
        "this_month": {
            "receipt": sum(t.receipt for t in month_trans),
            "payment": sum(t.payment for t in month_trans)
        },
        "rooms": {
            "total": total_rooms,
            "occupied": occupied_rooms,
            "available": total_rooms - occupied_rooms,
            "occupancy_rate": (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
        }
    }
