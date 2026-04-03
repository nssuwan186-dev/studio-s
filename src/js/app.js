/**
 * VIPAT Hotel Manager v5.2 - Hotel ERP
 * แยกชัดเจน: รายวัน (โรงแรม) vs รายเดือน (หอพัก)
 * พร้อมระบบภาษีอัตโนมัติ
 */

import { db, TaxCalculator, IDGenerator } from './db.js';

// =============================================================
// STATE
// =============================================================
let state = {
  currentUser: null,
  currentSection: 'login',
  settings: null,
  // Daily check-in state
  dailyCust: null,
  // Monthly check-in state
  monthlyCust: null
};

// =============================================================
// INIT
// =============================================================
async function init() {
  console.log('[App] Hotel ERP v5.2 Initializing...');
  
  try {
    state.settings = await db.settings.get();
    console.log('[App] Settings loaded');
  } catch (e) {
    state.settings = { vatRate: 7, paoTaxRate: 1, electricRate: 8, waterRate: 25, depositAmount: 200 };
  }
  
  const saved = localStorage.getItem('currentUser');
  if (saved) {
    try {
      state.currentUser = JSON.parse(saved);
      updateNavForRole();
      updateUserDisplay();
      goSec('dashboard');
    } catch(e) {
      goSec('login');
    }
  } else {
    goSec('login');
  }
  
  console.log('[App] Initialization complete');
}

// =============================================================
// NAVIGATION
// =============================================================
function goSec(id) {
  state.currentSection = id;
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nb').forEach(b => b.classList.toggle('active', b.dataset.s === id));
  const body = document.querySelector('.body');
  if (body) body.scrollTop = 0;
  
  switch(id) {
    case 'dashboard': loadDash(); break;
    case 'daily': loadDailyList(); break;
    case 'monthly': loadMonthlyList(); break;
    case 'rooms': loadRooms(); break;
    case 'reports': loadReports(); break;
    case 'settings': loadSettings(); break;
  }
}

// =============================================================
// AUTH
// =============================================================
async function login() {
  const username = document.getElementById('login-user')?.value.trim();
  const password = document.getElementById('login-pass')?.value;
  
  if (!username || !password) {
    showToast('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', 'err');
    return;
  }

  try {
    const emp = await db.employees.getByUsername(username);
    if (!emp) { showToast('ไม่พบผู้ใช้', 'err'); return; }
    if (emp.password !== password) { showToast('รหัสผ่านไม่ถูกต้อง', 'err'); return; }
    if (emp.status !== 'active') { showToast('บัญชีถูกระงับ', 'err'); return; }

    state.currentUser = emp;
    localStorage.setItem('currentUser', JSON.stringify(emp));
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
    updateNavForRole();
    updateUserDisplay();
    goSec('dashboard');
    showToast(`ยินดีต้อนรับ ${emp.name}`);
  } catch (e) {
    showToast('เกิดข้อผิดพลาด: ' + e.message, 'err');
  }
}

function logout() {
  state.currentUser = null;
  localStorage.removeItem('currentUser');
  updateNavForRole();
  updateUserDisplay();
  goSec('login');
  showToast('ออกจากระบบแล้ว');
}

function updateNavForRole() {
  document.querySelectorAll('.nb').forEach(btn => {
    const sec = btn.dataset.s;
    if (!state.currentUser) {
      btn.style.display = 'none';
    } else if (sec === 'settings') {
      btn.style.display = state.currentUser.role === 'admin' ? '' : 'none';
    } else {
      btn.style.display = '';
    }
  });
}

function updateUserDisplay() {
  const hdrUser = document.getElementById('hdr-user');
  const userName = document.getElementById('user-name');
  if (state.currentUser && hdrUser) {
    hdrUser.style.display = 'flex';
    if (userName) userName.textContent = state.currentUser.name;
  } else if (hdrUser) {
    hdrUser.style.display = 'none';
  }
}

// =============================================================
// DASHBOARD
// =============================================================
async function loadDash() {
  try {
    const rooms = await db.rooms.getAll();
    const dailyActive = await db.dailyGuests.getActive();
    const monthlyActive = await db.monthlyTenants.getActive();
    const today = new Date().toISOString().split('T')[0];
    const todayTx = await db.transactions.getByDate(today);

    // Room stats
    const totalEl = document.getElementById('dash-total');
    const dailyEl = document.getElementById('dash-daily');
    const monthlyEl = document.getElementById('dash-monthly');
    const availEl = document.getElementById('dash-avail');
    
    if (totalEl) totalEl.textContent = rooms.length;
    if (dailyEl) dailyEl.textContent = dailyActive.length;
    if (monthlyEl) monthlyEl.textContent = monthlyActive.length;
    if (availEl) availEl.textContent = rooms.filter(r => r.status === 'available').length;

    // Finance
    const inc = todayTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.receipt || 0), 0);
    const exp = todayTx.filter(t => t.type === 'expense').reduce((s, t) => s + (t.payment || 0), 0);
    
    const incEl = document.getElementById('dash-income');
    const expEl = document.getElementById('dash-expense');
    const balEl = document.getElementById('dash-balance');
    
    if (incEl) incEl.textContent = `฿${inc.toLocaleString()}`;
    if (expEl) expEl.textContent = `฿${exp.toLocaleString()}`;
    if (balEl) balEl.textContent = `฿${(inc - exp).toLocaleString()}`;

    // Checkout today
    const coToday = await db.dailyGuests.checkingOutToday();
    const list = document.getElementById('dash-colist');
    if (list) {
      if (coToday.length) {
        list.innerHTML = coToday.map(g => 
          `<div class="coi">
            <div>
              <div class="con">${g.Customer_Name}</div>
              <div class="cor">ห้อง ${g.Room_ID} | เช็คเอาท์วันนี้</div>
            </div>
            <button class="cobtn" onclick="doDailyCheckout('${g.RCP_ID}')">เช็คเอาท์</button>
          </div>`
        ).join('');
      } else {
        list.innerHTML = '<div class="empty">ไม่มีรายการเช็คเอาท์วันนี้</div>';
      }
    }
    
    console.log('[Dash] Loaded successfully');
  } catch (e) {
    console.error('[Dash] Error:', e);
  }
}

// =============================================================
// DAILY CHECK-IN (โรงแรม)
// =============================================================
async function openDailyCheckin() {
  try {
    const rooms = await db.rooms.getByRentalType('daily');
    const avail = rooms.filter(r => r.status === 'available');
    
    const sel = document.getElementById('daily-room');
    if (sel) {
      sel.innerHTML = '<option value="">-- เลือกห้องว่าง --</option>' +
        avail.map(r => `<option value="${r.id}" data-rate="${r.rate_daily}" data-num="${r.room_number}">${r.room_number} - ${r.room_type} (฿${r.rate_daily}/คืน)</option>`).join('');
    }
    
    // Reset form
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const ciDate = document.getElementById('daily-ci-date');
    const coDate = document.getElementById('daily-co-date');
    if (ciDate) ciDate.value = today;
    if (coDate) coDate.value = tomorrow;
    
    clearDailyCust();
    dailyCalcTotal();
    
    document.getElementById('daily-checkin-popup')?.classList.add('show');
  } catch (e) {
    showToast('เกิดข้อผิดพลาด', 'err');
  }
}

function dailyRoomChanged() {
  const sel = document.getElementById('daily-room');
  const opt = sel?.options[sel.selectedIndex];
  if (opt?.dataset.rate) {
    document.getElementById('daily-rate').value = opt.dataset.rate;
    dailyCalcTotal();
  }
}

function dailyCalcTotal() {
  const ciDate = document.getElementById('daily-ci-date')?.value;
  const coDate = document.getElementById('daily-co-date')?.value;
  const rate = parseInt(document.getElementById('daily-rate')?.value) || 0;
  
  if (!ciDate || !coDate) return;
  
  const ci = new Date(ciDate);
  const co = new Date(coDate);
  const nights = Math.max(1, Math.ceil((co - ci) / 86400000));
  
  const totalRoomCharge = rate * nights;
  const taxes = TaxCalculator.calculate(totalRoomCharge);
  
  const nightsEl = document.getElementById('daily-nights');
  const roomTotalEl = document.getElementById('daily-room-total');
  const grandEl = document.getElementById('daily-grand-total');
  const detailEl = document.getElementById('daily-total-detail');
  
  if (nightsEl) nightsEl.value = nights;
  if (roomTotalEl) roomTotalEl.value = totalRoomCharge;
  if (grandEl) grandEl.textContent = `฿${taxes.totalIncome.toLocaleString()}`;
  if (detailEl) {
    detailEl.innerHTML = `${nights} คืน × ฿${rate} = ฿${totalRoomCharge.toLocaleString()}<br>VAT 7%: ฿${taxes.vatAmount.toLocaleString()} | อบจ. 1%: ฿${taxes.paoTax.toLocaleString()}`;
  }
}

async function saveDailyCheckin() {
  const roomId = document.getElementById('daily-room')?.value;
  const ciDate = document.getElementById('daily-ci-date')?.value;
  const coDate = document.getElementById('daily-co-date')?.value;
  
  if (!roomId || !ciDate || !coDate) {
    showToast('กรุณาเลือกห้องและวันที่', 'err');
    return;
  }
  
  if (!state.dailyCust) {
    showToast('กรุณาเลือกหรือเพิ่มลูกค้า', 'err');
    return;
  }
  
  try {
    const room = await db.rooms.getById(parseInt(roomId));
    if (!room) { showToast('ไม่พบห้อง', 'err'); return; }
    
    const rate = parseInt(document.getElementById('daily-rate')?.value) || room.rate_daily;
    const ci = new Date(ciDate);
    const co = new Date(coDate);
    const nights = Math.max(1, Math.ceil((co - ci) / 86400000));
    const totalRoomCharge = rate * nights;
    const taxes = TaxCalculator.calculate(totalRoomCharge);
    
    const rcpId = IDGenerator.receipt();
    const bkId = IDGenerator.booking();
    
    // Create daily guest record
    const guest = {
      RCP_ID: rcpId,
      BK_ID: bkId,
      Transaction_Date: new Date().toISOString(),
      Check_In_Date: ciDate,
      Check_Out_Date: coDate,
      Room_ID: room.room_number,
      Customer_Name: state.dailyCust.name,
      Customer_Phone: state.dailyCust.phone || '',
      Citizen_ID_Passport: state.dailyCust.idCard || '',
      Nationality: state.dailyCust.nationality || 'ไทย',
      Address_Full: state.dailyCust.address || '',
      Occupation: '',
      Destination_To: '',
      Nights: nights,
      Room_Rate: rate,
      Total_Room_Charge: totalRoomCharge,
      Service_Fee: 0,
      Total_Income: taxes.totalIncome,
      VAT_Base: taxes.vatBase,
      VAT_Amount: taxes.vatAmount,
      PAO_Tax_1: taxes.paoTax,
      Net_Revenue: taxes.netRevenue,
      Payment_Status: 'checked_in',
      Check_VAT: 'OK',
      Check_PAO: 'OK',
      Remarks: 'Walk-in'
    };
    
    await db.dailyGuests.add(guest);
    await db.rooms.update(room.id, { status: 'occupied' });
    
    // Add to master data
    await db.masterData.add({
      ...guest,
      Rental_Type: 'daily'
    });
    
    showToast(`✅ เช็คอินสำเร็จ ห้อง ${room.room_number}`);
    clearDailyCust();
    closeQuickPopup(null, 'daily-checkin-popup');
    loadDash();
  } catch (e) {
    showToast('เกิดข้อผิดพลาด: ' + e.message, 'err');
  }
}

// Daily customer search
async function searchDailyCust(query) {
  if (!query || query.length < 2) {
    document.getElementById('daily-csearch-res').innerHTML = '';
    return;
  }
  
  try {
    const results = await db.masterData.search(query);
    const res = document.getElementById('daily-csearch-res');
    if (res) {
      res.innerHTML = results.slice(0, 5).map(c => 
        `<div class="sri" onclick="selectDailyCust('${c.Customer_Name}', '${c.Customer_Phone}', '${c.Citizen_ID_Passport}')">
          <div class="srn">${c.Customer_Name}</div>
          <div class="srs">${c.Customer_Phone || 'ไม่มีเบอร์'} | ${c.Citizen_ID_Passport ? 'มีบัตร' : 'ไม่มี'}</div>
        </div>`
      ).join('') || '<div class="empty">ไม่พบ - กด "+ ใหม่"</div>';
    }
  } catch (e) {
    console.error('[DailyCust] Search error:', e);
  }
}

function selectDailyCust(name, phone, idCard) {
  state.dailyCust = { name, phone, idCard };
  const box = document.getElementById('daily-csel-box');
  const nameEl = document.getElementById('daily-csel-name');
  const phoneEl = document.getElementById('daily-csel-phone');
  if (box) box.classList.remove('hidden');
  if (nameEl) nameEl.textContent = name;
  if (phoneEl) phoneEl.textContent = phone || 'ไม่มีเบอร์';
  document.getElementById('daily-csearch-res').innerHTML = '';
  document.getElementById('daily-csearch').value = name;
}

function clearDailyCust() {
  state.dailyCust = null;
  const box = document.getElementById('daily-csel-box');
  if (box) box.classList.add('hidden');
  document.getElementById('daily-csearch').value = '';
}

async function addNewDailyCust() {
  const name = prompt('ชื่อลูกค้า:');
  if (!name) return;
  const phone = prompt('เบอร์โทร:') || '';
  const idCard = prompt('เลขบัตรประชาชน (13 หลัก):') || '';
  state.dailyCust = { name, phone, idCard, nationality: 'ไทย' };
  selectDailyCust(name, phone, idCard);
  showToast('เพิ่มลูกค้าใหม่สำเร็จ');
}

// =============================================================
// MONTHLY CHECK-IN (หอพัก)
// =============================================================
async function openMonthlyCheckin() {
  try {
    const rooms = await db.rooms.getByRentalType('monthly');
    const avail = rooms.filter(r => r.status === 'available');
    
    const sel = document.getElementById('monthly-room');
    if (sel) {
      sel.innerHTML = '<option value="">-- เลือกห้องว่าง --</option>' +
        avail.map(r => `<option value="${r.id}" data-rate="${r.rate_monthly}" data-num="${r.room_number}">${r.room_number} - ${r.room_type} (฿${r.rate_monthly}/เดือน)</option>`).join('');
    }
    
    const today = new Date().toISOString().split('T')[0];
    const startDate = document.getElementById('monthly-start');
    if (startDate) startDate.value = today;
    
    clearMonthlyCust();
    monthlyCalcTotal();
    
    document.getElementById('monthly-checkin-popup')?.classList.add('show');
  } catch (e) {
    showToast('เกิดข้อผิดพลาด', 'err');
  }
}

function monthlyRoomChanged() {
  const sel = document.getElementById('monthly-room');
  const opt = sel?.options[sel.selectedIndex];
  if (opt?.dataset.rate) {
    document.getElementById('monthly-rate').value = opt.dataset.rate;
    monthlyCalcTotal();
  }
}

function monthlyCalcTotal() {
  const rate = parseInt(document.getElementById('monthly-rate')?.value) || 0;
  const months = parseInt(document.getElementById('monthly-months')?.value) || 1;
  const elecUnits = parseInt(document.getElementById('monthly-elec-meter')?.value) || 0;
  const waterUnits = parseInt(document.getElementById('monthly-water-meter')?.value) || 0;
  const elecRate = state.settings?.electricRate || 8;
  const waterRate = state.settings?.waterRate || 25;
  
  const roomTotal = rate * months;
  const elecCost = elecUnits * elecRate;
  const waterCost = waterUnits * waterRate;
  const totalRoomCharge = roomTotal + elecCost + waterCost;
  const taxes = TaxCalculator.calculate(roomTotal); // VAT จากค่าห้องเท่านั้น
  
  const grandTotal = taxes.totalIncome + elecCost + waterCost;
  
  const roomTotalEl = document.getElementById('monthly-room-total');
  const grandEl = document.getElementById('monthly-grand-total');
  const detailEl = document.getElementById('monthly-total-detail');
  
  if (roomTotalEl) roomTotalEl.value = roomTotal;
  if (grandEl) grandEl.textContent = `฿${grandTotal.toLocaleString()}`;
  if (detailEl) {
    detailEl.innerHTML = `${months} เดือน × ฿${rate} = ฿${roomTotal.toLocaleString()}<br>` +
      `ไฟ ${elecUnits} หน่วย × ฿${elecRate} = ฿${elecCost.toLocaleString()}<br>` +
      `น้ำ ${waterUnits} หน่วย × ฿${waterRate} = ฿${waterCost.toLocaleString()}<br>` +
      `VAT 7%: ฿${taxes.vatAmount.toLocaleString()} | อบจ. 1%: ฿${taxes.paoTax.toLocaleString()}`;
  }
}

async function saveMonthlyCheckin() {
  const roomId = document.getElementById('monthly-room')?.value;
  const startDate = document.getElementById('monthly-start')?.value;
  const months = parseInt(document.getElementById('monthly-months')?.value) || 1;
  
  if (!roomId || !startDate) {
    showToast('กรุณาเลือกห้องและวันที่เริ่มเช่า', 'err');
    return;
  }
  
  if (!state.monthlyCust) {
    showToast('กรุณาเลือกหรือเพิ่มผู้เช่า', 'err');
    return;
  }
  
  try {
    const room = await db.rooms.getById(parseInt(roomId));
    if (!room) { showToast('ไม่พบห้อง', 'err'); return; }
    
    const rate = parseInt(document.getElementById('monthly-rate')?.value) || room.rate_monthly;
    const elecUnits = parseInt(document.getElementById('monthly-elec-meter')?.value) || 0;
    const waterUnits = parseInt(document.getElementById('monthly-water-meter')?.value) || 0;
    const elecRate = state.settings?.electricRate || 8;
    const waterRate = state.settings?.waterRate || 25;
    
    const leaseStart = new Date(startDate);
    const leaseEnd = new Date(leaseStart);
    leaseEnd.setMonth(leaseEnd.getMonth() + months);
    
    const roomTotal = rate * months;
    const elecCost = elecUnits * elecRate;
    const waterCost = waterUnits * waterRate;
    const taxes = TaxCalculator.calculate(roomTotal);
    
    const rcpId = IDGenerator.receipt();
    
    const tenant = {
      RCP_ID: rcpId,
      BK_ID: IDGenerator.booking(),
      Transaction_Date: new Date().toISOString(),
      Lease_Start: startDate,
      Lease_End: leaseEnd.toISOString().split('T')[0],
      Room_ID: room.room_number,
      Customer_Name: state.monthlyCust.name,
      Customer_Phone: state.monthlyCust.phone || '',
      Citizen_ID_Passport: state.monthlyCust.idCard || '',
      Nationality: state.monthlyCust.nationality || 'ไทย',
      Address_Full: state.monthlyCust.address || '',
      Months: months,
      Room_Rate: rate,
      Total_Room_Charge: roomTotal,
      Elec_Units: elecUnits,
      Elec_Cost: elecCost,
      Water_Units: waterUnits,
      Water_Cost: waterCost,
      VAT_Base: taxes.vatBase,
      VAT_Amount: taxes.vatAmount,
      PAO_Tax_1: taxes.paoTax,
      Net_Revenue: taxes.netRevenue,
      Total_Income: taxes.totalIncome + elecCost + waterCost,
      Payment_Status: 'active',
      Remarks: `มิเตอร์ไฟเริ่มต้น: ${elecUnits}, มิเตอร์น้ำเริ่มต้น: ${waterUnits}`
    };
    
    await db.monthlyTenants.add(tenant);
    await db.rooms.update(room.id, { status: 'occupied' });
    
    await db.masterData.add({
      ...tenant,
      Rental_Type: 'monthly',
      Check_In_Date: startDate,
      Check_Out_Date: leaseEnd.toISOString().split('T')[0],
      Nights: months * 30
    });
    
    showToast(`✅ เช่ารายเดือนสำเร็จ ห้อง ${room.room_number}`);
    clearMonthlyCust();
    closeQuickPopup(null, 'monthly-checkin-popup');
    loadDash();
  } catch (e) {
    showToast('เกิดข้อผิดพลาด: ' + e.message, 'err');
  }
}

// Monthly customer search
async function searchMonthlyCust(query) {
  if (!query || query.length < 2) {
    document.getElementById('monthly-csearch-res').innerHTML = '';
    return;
  }
  
  try {
    const results = await db.masterData.search(query);
    const monthlyOnly = results.filter(r => r.Rental_Type === 'monthly');
    const res = document.getElementById('monthly-csearch-res');
    if (res) {
      res.innerHTML = monthlyOnly.slice(0, 5).map(c => 
        `<div class="sri" onclick="selectMonthlyCust('${c.Customer_Name}', '${c.Customer_Phone}', '${c.Citizen_ID_Passport}')">
          <div class="srn">${c.Customer_Name}</div>
          <div class="srs">${c.Customer_Phone || 'ไม่มีเบอร์'} | ผู้เช่ารายเดือน</div>
        </div>`
      ).join('') || '<div class="empty">ไม่พบ - กด "+ ใหม่"</div>';
    }
  } catch (e) {
    console.error('[MonthlyCust] Search error:', e);
  }
}

function selectMonthlyCust(name, phone, idCard) {
  state.monthlyCust = { name, phone, idCard };
  const box = document.getElementById('monthly-csel-box');
  const nameEl = document.getElementById('monthly-csel-name');
  const phoneEl = document.getElementById('monthly-csel-phone');
  if (box) box.classList.remove('hidden');
  if (nameEl) nameEl.textContent = name;
  if (phoneEl) phoneEl.textContent = phone || 'ไม่มีเบอร์';
  document.getElementById('monthly-csearch-res').innerHTML = '';
  document.getElementById('monthly-csearch').value = name;
}

function clearMonthlyCust() {
  state.monthlyCust = null;
  const box = document.getElementById('monthly-csel-box');
  if (box) box.classList.add('hidden');
  document.getElementById('monthly-csearch').value = '';
}

async function addNewMonthlyCust() {
  const name = prompt('ชื่อผู้เช่า:');
  if (!name) return;
  const phone = prompt('เบอร์โทร:') || '';
  const idCard = prompt('เลขบัตรประชาชน (13 หลัก):') || '';
  state.monthlyCust = { name, phone, idCard, nationality: 'ไทย' };
  selectMonthlyCust(name, phone, idCard);
  showToast('เพิ่มผู้เช่าใหม่สำเร็จ');
}

// =============================================================
// LISTS
// =============================================================
async function loadDailyList() {
  try {
    const guests = await db.dailyGuests.getAll();
    const list = document.getElementById('daily-list');
    if (!list) return;
    
    if (!guests.length) {
      list.innerHTML = '<div class="empty">ไม่มีผู้เข้าพัก</div>';
      return;
    }
    
    list.innerHTML = guests.slice(-50).reverse().map(g => 
      `<div class="cc">
        <div>
          <div class="ccn">${g.Customer_Name}</div>
          <div class="ccm">ห้อง ${g.Room_ID} | ${g.Check_In_Date} → ${g.Check_Out_Date}</div>
        </div>
        <div class="ccb">
          <div class="ccs">฿${g.Total_Income?.toLocaleString() || 0}</div>
          <div class="ccsl">${g.Payment_Status === 'checked_out' ? '✅ เช็คเอาท์แล้ว' : '🏠 พักอยู่'}</div>
        </div>
      </div>`
    ).join('');
  } catch (e) {
    console.error('[DailyList] Error:', e);
  }
}

async function loadMonthlyList() {
  try {
    const tenants = await db.monthlyTenants.getAll();
    const list = document.getElementById('monthly-list');
    if (!list) return;
    
    if (!tenants.length) {
      list.innerHTML = '<div class="empty">ไม่มีผู้เช่า</div>';
      return;
    }
    
    list.innerHTML = tenants.slice(-50).reverse().map(t => 
      `<div class="cc">
        <div>
          <div class="ccn">${t.Customer_Name}</div>
          <div class="ccm">ห้อง ${t.Room_ID} | ${t.Lease_Start} → ${t.Lease_End}</div>
        </div>
        <div class="ccb">
          <div class="ccs">฿${t.Total_Income?.toLocaleString() || 0}</div>
          <div class="ccsl">${t.Payment_Status === 'terminated' ? '✅ ยกเลิกแล้ว' : '🏠 เช่าอยู่'}</div>
        </div>
      </div>`
    ).join('');
  } catch (e) {
    console.error('[MonthlyList] Error:', e);
  }
}

async function loadRooms() {
  try {
    const rooms = await db.rooms.getAll();
    const grid = document.getElementById('rooms-grid');
    if (!grid) return;
    
    const buildings = {};
    rooms.forEach(r => {
      if (!buildings[r.building]) buildings[r.building] = [];
      buildings[r.building].push(r);
    });
    
    let html = '';
    ['A', 'B', 'N'].forEach(b => {
      if (buildings[b]) {
        const typeLabel = b === 'N' ? '(รายเดือน)' : '(รายวัน)';
        html += `<div class="rg-name">ตึก ${b} ${typeLabel}</div><div class="rg">`;
        buildings[b].forEach(r => {
          const statusClass = r.status || 'available';
          const statusText = { 'available': 'ว่าง', 'occupied': 'มีผู้พัก', 'maintenance': 'ซ่อม' }[r.status] || r.status;
          html += `<div class="rc ${statusClass}">
            <div class="rn">${r.room_number}</div>
            <div class="rt">${r.room_type}</div>
            <div class="rp">฿${r.rate_daily}/คืน</div>
            <span class="rbadge">${statusText}</span>
          </div>`;
        });
        html += '</div>';
      }
    });
    
    grid.innerHTML = html;
  } catch (e) {
    console.error('[Rooms] Error:', e);
  }
}

// =============================================================
// REPORTS
// =============================================================
async function loadReports() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const rr4 = await db.dailyGuests.getRR4Report(today);
    
    const rr4Count = document.getElementById('rr4-count');
    const rr4List = document.getElementById('rr4-list');
    
    if (rr4Count) rr4Count.textContent = rr4.length;
    if (rr4List) {
      rr4List.innerHTML = rr4.map(g => 
        `<div class="txi">
          <div>
            <div class="txn">${g.Customer_Name}</div>
            <div class="txm">บัตร: ${g.Citizen_ID_Passport || 'ไม่มี'} | ห้อง ${g.Room_ID}</div>
          </div>
          <div class="txp">${g.Nationality || 'ไทย'}</div>
        </div>`
      ).join('') || '<div class="empty">ไม่มีผู้เข้าพักวันนี้</div>';
    }
  } catch (e) {
    console.error('[Reports] Error:', e);
  }
}

// =============================================================
// SETTINGS
// =============================================================
async function loadSettings() {
  try {
    state.settings = await db.settings.get();
    const elecEl = document.getElementById('set-elec');
    const waterEl = document.getElementById('set-water');
    if (elecEl) elecEl.value = state.settings.electricRate || 8;
    if (waterEl) waterEl.value = state.settings.waterRate || 25;
  } catch (e) {
    console.error('[Settings] Error:', e);
  }
}

async function saveSettings() {
  try {
    const settings = {
      electricRate: parseInt(document.getElementById('set-elec')?.value) || 8,
      waterRate: parseInt(document.getElementById('set-water')?.value) || 25
    };
    await db.settings.update(settings);
    state.settings = { ...state.settings, ...settings };
    showToast('บันทึกการตั้งค่าแล้ว');
  } catch (e) {
    showToast('เกิดข้อผิดพลาด', 'err');
  }
}

// =============================================================
// UTILS
// =============================================================
function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  if (t) {
    t.textContent = msg;
    t.className = 'toast' + (type === 'err' ? ' err' : '');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
}

function closeQuickPopup(e, id) {
  if (!e || e.target.id === id) {
    document.getElementById(id)?.classList.remove('show');
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  showToast(next === 'dark' ? '🌙 โหมดมืด' : '☀️ โหมดสว่าง');
}

// =============================================================
// EXPORT TO WINDOW
// =============================================================
window.login = login;
window.logout = logout;
window.goSec = goSec;
window.closeQuickPopup = closeQuickPopup;
window.toggleTheme = toggleTheme;
window.showToast = showToast;

// Daily
window.openDailyCheckin = openDailyCheckin;
window.saveDailyCheckin = saveDailyCheckin;
window.dailyRoomChanged = dailyRoomChanged;
window.dailyCalcTotal = dailyCalcTotal;
window.searchDailyCust = searchDailyCust;
window.selectDailyCust = selectDailyCust;
window.clearDailyCust = clearDailyCust;
window.addNewDailyCust = addNewDailyCust;

// Monthly
window.openMonthlyCheckin = openMonthlyCheckin;
window.saveMonthlyCheckin = saveMonthlyCheckin;
window.monthlyRoomChanged = monthlyRoomChanged;
window.monthlyCalcTotal = monthlyCalcTotal;
window.searchMonthlyCust = searchMonthlyCust;
window.selectMonthlyCust = selectMonthlyCust;
window.clearMonthlyCust = clearMonthlyCust;
window.addNewMonthlyCust = addNewMonthlyCust;

// Settings
window.loadSettings = loadSettings;
window.saveSettings = saveSettings;

// =============================================================
// INIT
// =============================================================
init();
