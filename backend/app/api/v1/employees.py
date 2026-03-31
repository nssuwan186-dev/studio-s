"""
Employees API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models import Employee
import hashlib

router = APIRouter()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

class EmployeeSchema(BaseModel):
    username: str
    password: str
    name: str
    phone: Optional[str] = None
    role: str = "staff"
    position: Optional[str] = None
    salary: float = 0
    pay_type: str = "monthly"
    status: str = "active"

class EmployeeResponse(BaseModel):
    id: int
    username: str
    name: str
    phone: Optional[str]
    role: str
    position: Optional[str]
    salary: float
    pay_type: str
    status: str
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

@router.get("/", response_model=List[EmployeeResponse])
def get_employees(
    role: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Employee)
    if role:
        query = query.filter(Employee.role == role)
    if status:
        query = query.filter(Employee.status == status)
    return query.order_by(Employee.created_at.desc()).all()

@router.get("/{username}", response_model=EmployeeResponse)
def get_employee(username: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.username == username).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.post("/", response_model=EmployeeResponse)
def create_employee(employee: EmployeeSchema, db: Session = Depends(get_db)):
    existing = db.query(Employee).filter(Employee.username == employee.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    emp_data = employee.dict()
    emp_data["password"] = hash_password(emp_data["password"])
    
    db_employee = Employee(**emp_data)
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.put("/{username}", response_model=EmployeeResponse)
def update_employee(username: str, employee: EmployeeSchema, db: Session = Depends(get_db)):
    db_employee = db.query(Employee).filter(Employee.username == username).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    emp_data = employee.dict()
    if emp_data["password"]:
        emp_data["password"] = hash_password(emp_data["password"])
    
    for key, value in emp_data.items():
        setattr(db_employee, key, value)
    
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.delete("/{username}")
def delete_employee(username: str, db: Session = Depends(get_db)):
    db_employee = db.query(Employee).filter(Employee.username == username).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db.delete(db_employee)
    db.commit()
    return {"message": "Employee deleted"}

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.username == request.username).first()
    if not employee:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if employee.status != "active":
        raise HTTPException(status_code=401, detail="Account is suspended")
    
    hashed = hash_password(request.password)
    if employee.password != hashed:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "username": employee.username,
        "name": employee.name,
        "role": employee.role,
        "position": employee.position
    }
