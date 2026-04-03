# 🚀 Quick Start Guide - Resort Suite v5

## Installation (First Time)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open http://localhost:3000 in your browser

### 3. Build for Production
```bash
npm run build
npm run sync
npm run android:build
```

## Daily Development

```bash
# Start dev server
npm run dev

# Make changes to code
# Vite will hot-reload automatically

# When ready to test on Android
npm run build
npm run sync
npm run android
```

## Building APK

### Option 1: Local Build
```bash
npm run build
npm run sync
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

### Option 2: GitHub Actions
1. Push to `main` branch
2. GitHub automatically builds APK
3. Download from Actions tab or Releases

## Features Overview

### Dashboard (🏠 หน้าหลัก)
- Quick action buttons
- Room statistics
- Today's finance
- Activity summary
- Checkout alerts
- Revenue chart (7 days)

### Check-in (📝 เช็คอิน)
- OCR ID card scanning
- Customer search & history
- Room selection
- Automatic calculations
- Payment options
- Slip attachment

### Rooms (🏠 ห้องพัก)
- 29 rooms (A, B, N buildings)
- Status filtering
- Visual room cards
- Room detail modal

### Customers (👥 ลูกค้า)
- Search by name/phone/ID
- Customer history
- Stay statistics

### Accounting (💰 บัญชี)
- Income/Expense tracking
- Date range filter
- Finance chart
- Transaction list

### Employees (👨‍💼 พนักงาน)
- Add/manage staff
- Role assignment
- Status control

### Settings (⚙️ ตั้งค่า)
- Financial settings
- Room configuration
- API settings
- Data export/import
- Theme toggle

## Test Accounts

| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| admin | admin123 | Admin | Full access |
| manager | manager123 | Manager | All except settings |
| staff | staff123 | Staff | Basic operations |

## Common Tasks

### Add New Customer
1. Go to Check-in
2. Click "+ ใหม่" in customer search
3. Or use Quick Guest button on dashboard

### Check-in Guest
1. Go to Check-in section
2. Scan ID card (OCR) or search customer
3. Select room
4. Choose dates
5. Add utilities/deposit
6. Select payment method
7. Confirm check-in

### Record Income/Expense
1. Use Quick Income/Expense on dashboard
2. Or go to Accounting section
3. Fill in details
4. Save

### Backup Data
1. Go to Settings
2. Click "สำรองข้อมูล (JSON)"
3. Save file securely

### Restore Data
1. Go to Settings
2. Click "กู้ข้อมูล"
3. Select backup JSON file
4. Confirm

## Troubleshooting

### App shows blank screen
- Clear browser cache
- Check console for errors
- Rebuild: `npm run build`

### Data not showing
- Check if logged in
- Verify IndexedDB support
- Try different browser

### Build fails
```bash
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### Android build error
```bash
npx cap sync android
npx cap open android
# Build from Android Studio
```

## Tips & Tricks

### Keyboard Shortcuts
- `Ctrl + S`: Save (in code editor)
- `F5`: Refresh (rebuild in dev)

### Performance Tips
- Keep customer database under 10,000 records
- Export data regularly
- Clear old transactions periodically

### Best Practices
- Backup before major updates
- Test on real devices
- Use meaningful transaction notes
- Regular data exports

## Getting Help

1. Check README.md for detailed docs
2. Review UPGRADE_SUMMARY.md for v5 changes
3. Check browser console for errors
4. Contact development team

---

**Happy Managing! 🏨**
