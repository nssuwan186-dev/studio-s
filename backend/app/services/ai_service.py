"""
AI Service - Auto Fill Forms
"""
import re
from typing import Dict, Optional
from app.core.config import settings

class AIService:
    """AI Assistant for Hotel Operations"""
    
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
    
    def parse_id_card(self, text: str) -> Dict[str, str]:
        """Parse Thai ID Card text from OCR"""
        result = {
            "id_card": "",
            "name": "",
            "birthdate": "",
            "address": ""
        }
        
        # Extract ID card number (13 digits)
        id_match = re.search(r'(\d[\d\s-]{12,17}\d)', text)
        if id_match:
            result["id_card"] = re.sub(r'[\s-]', '', id_match.group(1))[:13]
        
        # Extract name
        name_patterns = [
            r'(?:นาย|นาง|นางสาว|Mr\.|Mrs\.|Miss\.?|Ms\.?)\s+([ก-๏\s]+)',
            r'ชื่อ\s*[:\-]?\s*([ก-๏\s]+)',
            r'Name\s*[:\-]?\s*([ก-๏\sa-zA-Z]+)'
        ]
        for pattern in name_patterns:
            match = re.search(pattern, text)
            if match:
                result["name"] = match.group(1).strip()
                break
        
        # Extract birthdate
        date_patterns = [
            r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})',
            r'เกิด\s*[:\-]?\s*(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})'
        ]
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                result["birthdate"] = f"{match.group(1)}/{match.group(2)}/{match.group(3)}"
                break
        
        return result
    
    def suggest_room_price(self, room_type: str, building: str, floor: int) -> float:
        """Suggest room price based on type and location"""
        base_prices = {
            "Standard": 400,
            "Standard Twin": 500,
            "Deluxe": 800,
            "Suite": 1500,
            "VIP": 2000
        }
        
        base = base_prices.get(room_type, 400)
        
        # Adjust for building
        if building == "N":  # N villa
            base *= 1.5
        
        # Adjust for floor
        if floor >= 2:
            base *= 1.1
        
        return round(base, -1)  # Round to nearest 10
    
    def predict_checkout_time(self, booking_data: Dict) -> str:
        """Predict optimal checkout time"""
        room_type = booking_data.get("room_type", "Standard")
        
        if room_type in ["Suite", "VIP"]:
            return "14:00"  # Late checkout
        return "12:00"
    
    def calculate_advance_payment(self, room_price: int, nights: int) -> Dict[str, int]:
        """Calculate advance payment amount"""
        if nights <= 1:
            deposit = room_price
        elif nights <= 3:
            deposit = room_price
        else:
            deposit = room_price * 2
        
        return {
            "deposit": deposit,
            "full_payment": room_price * nights,
            "remaining": (room_price * nights) - deposit
        }
    
    def generate_booking_confirmation(self, data: Dict) -> str:
        """Generate booking confirmation message"""
        msg = f"""🏨 ยืนยันการจองห้องพัก

📅 วันที่เข้าพัก: {data.get('check_in')}
📅 วันที่ออก: {data.get('check_out')}
🏠 ห้อง: {data.get('room_number')}
👤 ลูกค้า: {data.get('customer_name')}
💰 ราคารวม: {data.get('total', 0):,} บาท

กรุณาชำระเงินมัดจำ {data.get('deposit', 0):,} บาท
ภายใน 24 ชั่วโมง

ขอบคุณที่ใช้บริการ"""
        return msg
    
    def categorize_expense(self, description: str) -> str:
        """Auto-categorize expense"""
        desc = description.lower()
        
        categories = {
            "ค่าซ่อม": ["ซ่อม", "อุปกรณ์", "ประปา", "ไฟฟ้า"],
            "ค่าของ": ["ของ", "อุปกรณ์", "เครื่องดื่ม", "ขนม"],
            "ค่าน้ำ": ["น้ำ", "ประปา"],
            "ค่าไฟ": ["ไฟ", "ไฟฟ้า", "การไฟ"],
            "ค่าอินเทอร์เน็ต": ["อินเทอร์เน็ต", "wifi", "เน็ต"],
            "ค่าจ้าง": ["จ้าง", "เงินเดือน", "ค่าตอบแทน"],
            "ค่าจัดทำ": ["จัดทำ", "เอกสาร", "กระดาษ"],
            "อื่นๆ": []
        }
        
        for category, keywords in categories.items():
            if not keywords:
                continue
            if any(k in desc for k in keywords):
                return category
        
        return "อื่นๆ"
    
    def suggest_booking_source(self, customer_data: Dict) -> str:
        """Suggest booking source based on customer"""
        phone = customer_data.get("phone", "")
        
        if "line" in phone.lower():
            return "line"
        elif len(phone) > 0:
            return "walk_in"
        return "walk_in"

# Singleton instance
ai_service = AIService()
