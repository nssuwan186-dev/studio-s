"""
Rooms API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models import Room

router = APIRouter()

# Schema
class RoomSchema(BaseModel):
    room_number: str
    building: str
    floor: int
    room_type: str
    price_per_night: float
    status: str = "available"

class RoomResponse(RoomSchema):
    id: int
    class Config:
        from_attributes = True

@router.get("/", response_model=List[RoomResponse])
def get_rooms(
    building: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Room)
    if building:
        query = query.filter(Room.building == building)
    if status:
        query = query.filter(Room.status == status)
    return query.all()

@router.get("/{room_id}", response_model=RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.post("/", response_model=RoomResponse)
def create_room(room: RoomSchema, db: Session = Depends(get_db)):
    # Check duplicate
    existing = db.query(Room).filter(Room.room_number == room.room_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Room number already exists")
    
    db_room = Room(**room.dict())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@router.put("/{room_id}", response_model=RoomResponse)
def update_room(room_id: int, room: RoomSchema, db: Session = Depends(get_db)):
    db_room = db.query(Room).filter(Room.id == room_id).first()
    if not db_room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    for key, value in room.dict().items():
        setattr(db_room, key, value)
    
    db.commit()
    db.refresh(db_room)
    return db_room

@router.delete("/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db)):
    db_room = db.query(Room).filter(Room.id == room_id).first()
    if not db_room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    db.delete(db_room)
    db.commit()
    return {"message": "Room deleted"}

@router.get("/stats/summary")
def get_room_stats(db: Session = Depends(get_db)):
    rooms = db.query(Room).all()
    total = len(rooms)
    available = len([r for r in rooms if r.status == "available"])
    occupied = len([r for r in rooms if r.status == "occupied"])
    maintenance = len([r for r in rooms if r.status == "maintenance"])
    
    return {
        "total": total,
        "available": available,
        "occupied": occupied,
        "maintenance": maintenance
    }
