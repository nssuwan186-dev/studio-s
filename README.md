# 🏨 รีสอร์ท สวีท - APK Builder

## วิธีได้ APK โดยไม่ต้องติดตั้งอะไรบนเครื่อง

---

### ขั้นตอนที่ 1 — สร้าง GitHub Repository

1. เปิด [github.com](https://github.com) → ล็อกอิน
2. กด **"New repository"** (มุมขวาบน)
3. ตั้งชื่อ: `resort-suite-app`
4. เลือก **Public**
5. กด **"Create repository"**

---

### ขั้นตอนที่ 2 — อัปโหลดไฟล์

บนหน้า repository ที่เพิ่งสร้าง:

1. กด **"uploading an existing file"**
2. ลาก **ทุกไฟล์จาก zip นี้** ขึ้นไป (รวมโฟลเดอร์ .github และ www)
3. กด **"Commit changes"**

> ⚠️ สำคัญ: ต้องอัปโหลดให้ครบโครงสร้างโฟลเดอร์ดังนี้:
> ```
> .github/workflows/build-apk.yml
> www/index.html
> www/js/app-local.js
> capacitor.config.json
> package.json
> ```

---

### ขั้นตอนที่ 3 — รอ Build อัตโนมัติ

1. ไปที่แท็บ **"Actions"** ใน repository
2. จะเห็น workflow **"Build Android APK"** กำลังรัน (ใช้เวลา ~5-10 นาที)
3. รอจนสถานะเป็น ✅ สีเขียว

---

### ขั้นตอนที่ 4 — ดาวน์โหลด APK

1. คลิกที่ workflow run ที่เสร็จแล้ว
2. เลื่อนลงมาที่ **"Artifacts"**
3. คลิก **"resort-suite-debug-apk"** → ดาวน์โหลด ZIP
4. แตก ZIP → ได้ไฟล์ `app-debug.apk`
5. ส่งไฟล์ไปยังมือถือ Android แล้วติดตั้งได้เลย!

---

### การติดตั้ง APK บนมือถือ

1. ไปที่ **การตั้งค่า → ความปลอดภัย → อนุญาตติดตั้งจากแหล่งที่ไม่รู้จัก**
2. เปิดไฟล์ APK → ติดตั้ง
3. เปิดแอป **รีสอร์ท สวีท** ได้เลย!

---

### ข้อมูลสำคัญ

- ✅ ข้อมูลเก็บใน **localStorage** ของมือถือ (ไม่หายหากปิดแอป)
- ✅ ใช้งาน **Offline** ได้ 100%
- ✅ รองรับ Android 7.0 ขึ้นไป
- ⚠️ Debug APK — สำหรับใช้งานส่วนตัว ไม่ได้ลงใน Play Store
