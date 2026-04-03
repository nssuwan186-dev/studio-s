# 🏗️ โครงสร้างโปรเจกต์ - Resort Suite v5

## โครงสร้างไดเรกทอรี

```
studio-s/                              # รูทโปรเจกต์
│
├── 📦 src/                            # 📝 ซอร์สโค้ด (พัฒนาที่นี่)
│   ├── index.html                     # ไฟล์ HTML หลัก
│   │
│   ├── 📂 js/                         # โมดูล JavaScript
│   │   ├── app.js                     # ตรรกะหลักของแอป
│   │   ├── db.js                      # ชั้นฐานข้อมูล IndexedDB
│   │   └── api.js                     # API integration
│   │
│   ├── 📂 css/                        # สไตล์ชีต
│   │   └── main.css                   # สไตล์หลัก
│   │
│   └── 📂 assets/                     # ทรัพยากรสถิต
│       ├── 📂 libs/                   # ไลบรารีภายนอก
│       │   ├── moment.min.js          # จัดการวันที่
│       │   └── moment-th.min.js       # ภาษาไทย
│       │
│       ├── 📂 images/                 # รูปภาพ
│       ├── 📂 icons/                  # ไอคอนแอป
│       └── 📂 fonts/                  # ฟอนต์
│
├── 📦 public/                         # ไฟล์สาธารณะ
│   └── manifest.webmanifest           # PWA manifest
│
├── 📦 dist/                           # ⚙️ สร้างโดย npm run build
│   ├── index.html                     # HTML ที่ build แล้ว
│   └── assets/
│       ├── main-XXXXXXX.js            # JavaScript ที่ minify แล้ว
│       └── manifest-XXXXXXX.webmanifest
│
├── 📦 android/                        # โปรเจกต์ Android (Capacitor)
│   └── app/src/main/assets/public/    # เว็บแอสเซ็ต (sync จาก dist/)
│
├── 📦 .github/workflows/              # CI/CD
│   └── build-apk.yml                  # GitHub Actions
│
├── 📄 package.json                    # การตั้งค่าโปรเจกต์
├── 📄 vite.config.js                  # การตั้งค่า Vite
├── 📄 capacitor.config.json           # การตั้งค่า Capacitor
├── 📄 .gitignore                      # กฎ Git ignore
│
└── 📄 เอกสาร
    ├── README.md                      # เอกสารหลัก
    ├── QUICKSTART.md                  # คู่มือเริ่มต้น
    ├── PROJECT_STRUCTURE.md           # โครงสร้างโปรเจกต์
    └── UPGRADE_SUMMARY.md             # สรุปการอัปเกรด
```

## 📍 ตำแหน่งที่สำคัญ

### 🎯 โฟลเดอร์ `src/` - พัฒนาที่นี่!

**นี่คือที่ที่คุณเขียนโค้ดทั้งหมด**

| ไฟล์ | หน้าที่ |
|------|---------|
| `src/index.html` | หน้าหลัก HTML, CSS, โครงสร้าง UI |
| `src/js/app.js` | ตรรกะแอป, Event Handlers, Controllers |
| `src/js/db.js` | ฐานข้อมูล IndexedDB, CRUD Operations |
| `src/js/api.js` | เชื่อมต่อ API ภายนอก |

### 🎯 โฟลเดอร์ `dist/` - สร้างอัตโนมัติ

**ห้ามแก้ไขด้วยตนเอง!** สร้างจากคำสั่ง `npm run build`

### 🎯 โฟลเดอร์ `android/` - Android Native

**สร้างโดย Capacitor** แก้ไขผ่าน Android Studio เท่านั้น

## 🔄 ขั้นตอนการพัฒนา

### 1️⃣ พัฒนาในโหมด Development
```bash
npm run dev
```
- เปิด `http://localhost:3000`
- Auto-reload เมื่อแก้ไขโค้ด
- Debug ง่าย (ไม่ minify)

### 2️⃣ Build สำหรับ Production
```bash
npm run build
```
- Minify JavaScript
- Optimize ไฟล์ทั้งหมด
- สร้างโฟลเดอร์ `dist/`

### 3️⃣ Sync ไป Android
```bash
npm run sync
```
- คัดลอก `dist/` ไป `android/`
- อัปเดต Capacitor plugins

### 4️⃣ รันบนมือถือ
```bash
npm run android
```
- ติดตั้งบนมือถือที่เชื่อมต่อ
- หรือเปิด Android Studio

### 5️⃣ สร้าง APK
```bash
npm run android:build
```
- สร้างไฟล์ APK
- ตำแหน่ง: `android/app/build/outputs/apk/debug/app-debug.apk`

## 📂 โครงสร้างไฟล์ HTML

```
src/index.html
│
├── <header class="hdr">           # แถบบน
│   ├── โลโก้แอป
│   └── ปุ่มธีม/เครือข่าย
│
├── <section id="login">           # หน้าล็อกอิน
│
├── <div class="body">             # เนื้อหาหลัก
│   │
│   ├── <section id="dashboard">   # แดชบอร์ด
│   │   ├── Quick Actions
│   │   ├── สถิติห้อง
│   │   ├── การเงินวันนี้
│   │   ├── กิจกรรม
│   │   └── กราฟรายได้
│   │
│   ├── <section id="checkin">     # เช็คอิน
│   │   ├── OCR สแกนบัตร
│   │   ├── ค้นหาลูกค้า
│   │   ├── เลือกห้อง
│   │   ├── วันที่
│   │   ├── ค่าใช้จ่าย
│   │   └── ชำระเงิน
│   │
│   ├── <section id="rooms">       # ห้องพัก
│   │   ├── ตัวกรอง
│   │   └── ตารางห้อง
│   │
│   ├── <section id="customers">   # ลูกค้า
│   │   ├── ค้นหา
│   │   └── รายการ
│   │
│   ├── <section id="accounting">  # บัญชี
│   │   ├── สรุปการเงิน
│   │   ├── กรองวันที่
│   │   ├── กราฟ
│   │   └── รายการ
│   │
│   ├── <section id="employees">   # พนักงาน
│   │   ├── ฟอร์มเพิ่ม
│   │   └── รายการ
│   │
│   └── <section id="settings">    # ตั้งค่า
│       ├── การเงิน
│       ├── จำนวนห้อง
│       ├── API & Sync
│       └── สำรอง/กู้ข้อมูล
│
├── <nav class="bnav">             # แถบล่าง (8 ปุ่ม)
│
└── <div class="overlay">          # Modal Dialogs
    ├── Quick Check-in
    ├── Quick Guest
    ├── Quick Income
    └── Quick Expense
```

## 🗂️ โครงสร้างฐานข้อมูล (db.js)

```
IndexedDB: resort-suite-v5
│
├── 📂 rooms                       # ห้องพัก
│   ├── id (key)
│   ├── room_number
│   ├── building (A/B/N)
│   ├── floor
│   ├── room_type
│   ├── price_per_night
│   └── status (available/occupied/maintenance/cleaning)
│
├── 📂 customers                   # ลูกค้า
│   ├── customer_id (key)
│   ├── name
│   ├── phone
│   ├── id_card
│   ├── address
│   ├── total_stays
│   └── total_spent
│
├── 📂 bookings                    # การจอง
│   ├── booking_id (key)
│   ├── customer_id
│   ├── room_id
│   ├── check_in_date
│   ├── check_out_date
│   ├── total_amount
│   ├── deposit
│   └── status
│
├── 📂 transactions                # ธุรกรรม
│   ├── id (key, auto)
│   ├── date
│   ├── item_name
│   ├── receipt (รายรับ)
│   ├── payment (รายจ่าย)
│   ├── room_number
│   ├── note
│   └── type (income/expense)
│
├── 📂 settings                    # การตั้งค่า
│   ├── key (key)
│   └── value {
│         openingBalance,
│         depositAmount,
│         electricRate,
│         waterRate
│       }
│
├── 📂 employees                   # พนักงาน
│   ├── id (key, auto)
│   ├── username
│   ├── password
│   ├── name
│   ├── role (admin/manager/staff)
│   ├── phone
│   └── status
│
├── 📂 images                      # รูปภาพ
│   ├── id (key)
│   ├── type
│   ├── refId
│   └── data (base64)
│
└── 📂 sync                        # Sync metadata
    └── key (key)
        └── timestamp
```

## 🔧 การตั้งค่าไฟล์สำคัญ

### package.json
```json
{
  "scripts": {
    "dev": "vite",                    // เริ่ม dev server
    "build": "vite build",            // Build สำหรับ production
    "preview": "vite preview",        // ดูตัวอย่าง production
    "sync": "npx cap sync",           // Sync ไป Capacitor
    "android": "npx cap run android", // รันบน Android
    "android:build": "npx cap build android" // สร้าง APK
  }
}
```

### vite.config.js
```javascript
{
  root: 'src/',                       // โฟลเดอร์ซอร์สโค้ด
  publicDir: 'public/',               // โฟลเดอร์ไฟล์สาธารณะ
  build: {
    outDir: 'dist/',                  // โฟลเดอร์ผลลัพธ์
    target: 'esnext'                  // ES modules target
  }
}
```

### capacitor.config.json
```json
{
  "appId": "com.resortsuite.app",    // Package ID
  "appName": "รีสอร์ท สวีท",         // ชื่อแอป
  "webDir": "dist",                   // โฟลเดอร์เว็บแอสเซ็ต
  "plugins": { ... }                  // การตั้งค่า plugins
}
```

## 📊 การทำงานของโมดูล

```
┌─────────────────────────────────────────┐
│           src/index.html                │
│         (UI, HTML, CSS)                 │
└──────────────┬──────────────────────────┘
               │
               │ เรียกใช้ functions
               ▼
┌─────────────────────────────────────────┐
│            src/js/app.js                │
│      (Controllers, Logic, State)        │
└──────────────┬──────────────────────────┘
               │
               │ CRUD operations
               ▼
┌─────────────────────────────────────────┐
│            src/js/db.js                 │
│      (IndexedDB, Data Access)           │
└──────────────┬──────────────────────────┘
               │
               │ เก็บข้อมูล
               ▼
┌─────────────────────────────────────────┐
│          IndexedDB (Browser)            │
│        (resort-suite-v5)                │
└─────────────────────────────────────────┘
```

## 🎨 CSS Architecture

```css
/* ตัวแปร CSS (CSS Variables) */
:root {
  --primary: #1B4332;          /* สีหลัก */
  --accent: #52B788;           /* สีเน้น */
  --danger: #E63946;           /* สีอันตราย */
  --bg: #F8FAF9;               /* สีพื้นหลัง */
  --surface: #FFFFFF;          /* สีพื้นผิว */
}

[data-theme="dark"] {
  /* สีสำหรับโหมดมืด */
}

/* Classes */
.hdr       /* Header */
.bnav      /* Bottom Navigation */
.card      /* Card Container */
.sec       /* Section */
.btn       /* Button */
.inp       /* Input */
.sel       /* Select */
.toast     /* Toast Notification */
.overlay   /* Modal Overlay */
.sheet     /* Modal Sheet */
```

## 🚀 Workflow Diagram

```
┌──────────────┐
│  แก้ไขโค้ด   │
│  (src/)      │
└──────┬───────┘
       │
       ▼
┌──────────────┐     npm run dev      ┌──────────────┐
│  Dev Server  │ ──────────────────>   │  Browser     │
│  (Vite)      │ <──────────────────   │  (localhost) │
└──────┬───────┘    Hot Reload         └──────────────┘
       │
       │ npm run build
       ▼
┌──────────────┐
│  Build       │
│  (dist/)     │
└──────┬───────┘
       │
       │ npm run sync
       ▼
┌──────────────┐
│  Capacitor   │
│  (android/)  │
└──────┬───────┘
       │
       │ npm run android
       ▼
┌──────────────┐
│  Android     │
│  Device/     │
│  Emulator    │
└──────────────┘
```

## ✅ สรุป

### ✅ โฟลเดอร์หลัก
- **`src/`** - พัฒนาที่นี่เท่านั้น
- **`public/`** - ไฟล์สาธารณะ
- **`dist/`** - สร้างอัตโนมัติ
- **`android/`** - โปรเจกต์ Android

### ✅ ไฟล์สำคัญ
- **`src/index.html`** - UI และโครงสร้าง
- **`src/js/app.js`** - ตรรกะแอป
- **`src/js/db.js`** - ฐานข้อมูล
- **`package.json`** - การตั้งค่า

### ✅ คำสั่งที่ใช้บ่อย
```bash
npm run dev          # พัฒนา (dev server)
npm run build        # สร้าง production
npm run sync         # sync ไป Android
npm run android      # รันบน Android
npm run android:build  # สร้าง APK
```

---

**เวอร์ชัน**: 5.0.0  
**อัปเดตล่าสุด**: 2026-04-03  
**พัฒนาโดย**: VIPAT Hotel Development Team
