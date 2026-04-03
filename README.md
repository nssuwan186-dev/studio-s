# 🏨 รีสอร์ท สวีท - ระบบจัดการห้องพัก v5

## 🎉 อัพเกรดใหม่ใน v5.0

### ✨ ฟีเจอร์ใหม่
- **🌓 Dark Mode** - รองรับโหมดมืด/สว่าง อัตโนมัติ
- **💾 IndexedDB** - ฐานข้อมูลประสิทธิภาพสูง แทน localStorage
- **📱 PWA Support** - ติดตั้งบนมือถือได้ ใช้งานแบบออฟไลน์
- **📊 Charts & Analytics** - กราฟแสดงรายได้ 7 วัน
- **🔔 Push Notifications** - พร้อมรองรับการแจ้งเตือน
- **📦 Vite Build** - Build เร็วขึ้นด้วย Vite
- **♿ UI/UX Improved** - ปรับปรุงการออกแบบให้ทันสมัย

### 🚀 การติดตั้ง

#### Development
```bash
# ติดตั้ง dependencies
npm install

# รัน development server
npm run dev

# เปิดที่ http://localhost:3000
```

#### Build for Production
```bash
# Build web assets
npm run build

# Sync กับ Capacitor
npm run sync

# Build APK
npm run android:build
```

### 📁 โครงสร้างโปรเจกต์
```
studio-s/
├── www/                    ← Web app
│   ├── index.html          ← หน้าหลัก (UI ใหม่)
│   ├── js/
│   │   ├── db.js           ← IndexedDB layer
│   │   └── app.js          ← Main logic
│   └── assets/             ← Images, icons
├── android/                ← Android project
├── .github/workflows/
│   └── build-apk.yml       ← CI/CD
├── capacitor.config.json   ← Capacitor config
├── package.json            ← Dependencies
├── vite.config.js          ← Vite config (ใหม่)
└── README.md
```

### 🎯 ฟีเจอร์หลัก
- 📊 **Dashboard** - แสดงสถานะห้องและการเงินแบบ Real-time
- 📝 **เช็คอิน/เช็คเอาท์** - พร้อมคำนวณยอดอัตโนมัติ
- 📷 **OCR บัตรประชาชน** - สแกนและดึงข้อมูลอัตโนมัติ
- 🏠 **จัดการห้องพัก** - 29 ห้อง (ตึก A, B, N)
- 👥 **ระบบลูกค้า** - พร้อมประวัติการเข้าพัก
- 💰 **บัญชีรายรับ-รายจ่าย** - พร้อมกราฟแสดงข้อมูล
- 📊 **รายงาน** - Export CSV/JSON
- 👨‍💼 **พนักงาน** - ระบบ Role (Admin, Manager, Staff)

### 🔐 บัญชีทดสอบ
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ผู้ดูแลระบบ |
| manager | manager123 | ผู้จัดการ |
| staff | staff123 | พนักงาน |

### 🛠️ เทคโนโลยีที่ใช้
- **Frontend:** Vanilla JS, CSS3, HTML5
- **Database:** IndexedDB (ผ่าน idb library)
- **Build Tool:** Vite v6
- **Mobile:** Capacitor v7
- **Charts:** Chart.js v4
- **OCR:** Tesseract.js v5

### 📦 Dependencies
```json
{
  "@capacitor/android": "^7.0.0",
  "@capacitor/core": "^7.0.0",
  "@capacitor/push-notifications": "^7.0.0",
  "idb": "^8.0.0",
  "chart.js": "^4.4.0",
  "vite": "^6.0.0",
  "vite-plugin-pwa": "^0.21.0"
}
```

### 🔧 การตั้งค่าเพิ่มเติม

#### เปลี่ยน Icon
วางไฟล์ icon ที่ `www/assets/`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `icon-maskable.png` (512x512)

#### Build APK
1. แก้ไข `capacitor.config.json` ตั้งค่า Keystore
2. รัน `npm run android:build`
3. หรือใช้ GitHub Actions (push ไป branch main)

### 📝 การอัปเดตจาก v4
```bash
# 1. Backup ข้อมูลเดิม
npm run dev
# ไปที่ Settings > สำรองข้อมูล

# 2. อัปเดต dependencies
npm install

# 3. Build ใหม่
npm run build
npm run sync

# 4. กู้ข้อมูล
# ไปที่ Settings > กู้ข้อมูล
```

### 🐛 Troubleshooting

**App ไม่แสดงข้อมูล**
- ลบ cache ของ browser
- ตรวจสอบ Console errors

**Build ล้มเหลว**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Android build error**
```bash
npx cap sync android
npx cap open android
# Build จาก Android Studio
```

### 📞 Support
หากพบปัญหาหรือต้องการคำแนะนำเพิ่มเติม กรุณาติดต่อทีมพัฒนา

---
**Version:** 5.0.0  
**Last Updated:** 2026  
**License:** MIT
