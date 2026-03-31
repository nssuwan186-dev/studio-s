"""
VIPAT Hotel Management System - FastAPI Backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import rooms, bookings, customers, employees, finance, reports, ai
from app.core.config import settings
from app.core.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VIPAT Hotel API",
    description="Hotel Management System with AI",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(rooms.router, prefix="/api/v1/rooms", tags=["Rooms"])
app.include_router(bookings.router, prefix="/api/v1/bookings", tags=["Bookings"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["Customers"])
app.include_router(employees.router, prefix="/api/v1/employees", tags=["Employees"])
app.include_router(finance.router, prefix="/api/v1/finance", tags=["Finance"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])

@app.get("/")
async def root():
    return {"message": "VIPAT Hotel API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
