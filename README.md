# 🏨 รีสอร์ท สวีท - ระบบจัดการห้องพัก v4

## โครงสร้างโปรเจกต์
```
studio-s/
├── www/                    ← Web app (Capacitor webDir)
│   ├── index.html          ← หน้าหลัก
│   └── js/
│       ├── db.js           ← จัดการข้อมูล (localStorage)
│       ├── app.js          ← Logic ทั้งหมด
│       ├── moment.min.js
│       └── moment-th.min.js
├── android/                ← Android project (สร้างโดย Capacitor)
├── .github/workflows/
│   └── build-apk.yml       ← GitHub Actions build
├── capacitor.config.json
└── package.json
```

## ฟีเจอร์
- 📊 Dashboard แสดงสถานะห้องและการเงินแบบ Real-time
- 📝 เช็คอิน/เช็คเอาท์ พร้อมคำนวณยอดอัตโนมัติ
- 📷 สแกน OCR บัตรประชาชน (ต้องมี internet)
- 🏠 จัดการ 29 ห้อง (ตึก A, B, N)
- 👥 ระบบลูกค้า พร้อมประวัติการเข้าพัก
- 💰 บัญชีรายรับ-รายจ่าย พร้อมแนบรูปใบเสร็จ
- 📊 รายงานรายเดือน + Export CSV/JSON
- 📥 Import ลูกค้า/ห้องจาก CSV

## Build APK
Push ไป branch `main` หรือ `master` แล้ว GitHub Actions จะ build ให้อัตโนมัติ
