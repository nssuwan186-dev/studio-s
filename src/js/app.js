/**
 * VIPAT Hotel Manager v5.0
 * Main Application Logic
 * 
 * @module app
 * @description Hotel management system with check-in/out, accounting, and reporting
 */

import { db } from './db.js';

// =============================================================
// GLOBAL STATE
// =============================================================
const state = {
  selectedCustomer: null,
  currentSection: 'login',
  currentFilter: 'all',
  currentRoomId: null,
  historyData: null,
  settings: null,
  currentUser: null,
  isOnline: navigator.onLine,
  revenueChart: null,
  financeChart: null
};

// =============================================================
// NETWORK & CONNECTIVITY
// =============================================================
window.addEventListener('online', () => { state.isOnline = true; updateNetworkStatus(); });
window.addEventListener('offline', () => { state.isOnline = false; updateNetworkStatus(); });

/**
 * Update network status display in header
 */
function updateNetworkStatus() {
  const status = document.getElementById('online-status');
  if (status) {
    status.innerHTML = state.isOnline ? '<span class="pulse"></span>ออนไลน์' : '⚠️ ออฟไลน์';
  }
}

/**
 * Check network connectivity and sync if needed
 */
async function checkNetwork() {
  const wasOnline = state.isOnline;
  state.isOnline = navigator.onLine;
  updateNetworkStatus();
  
  if (state.isOnline && !wasOnline && state.settings?.syncEnabled) {
    showToast('🔄 กำลัง sync ข้อมูล...');
    // Sync logic here
  }
}

// =============================================================
// THEME MANAGEMENT
// =============================================================

/**
 * Initialize theme based on system preference or saved setting
 */
function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  showToast(next === 'dark' ? '🌙 โหมดมืด' : '☀️ โหมดสว่าง');
}

// =============================================================
// AUTH & LOGIN
// =============================================================

/**
 * Handle user login
 */
async function login() {
  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;
  
  if (!username || !password) {
    showToast('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', 'err');
    return;
  }

  const emp = await db.employees.getByUsername(username);
  if (!emp) {
    showToast('ไม่พบผู้ใช้', 'err');
    return;
  }
  if (emp.password !== password) {
    showToast('รหัสผ่านไม่ถูกต้อง', 'err');
    return;
  }
  if (emp.status !== 'active') {
    showToast('บัญชีถูกระงับ', 'err');
    return;
  }

  state.currentUser = emp;
  localStorage.setItem('currentUser', JSON.stringify(emp));
  
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  
  updateNavForRole();
  updateUserDisplay();
  goSec('dashboard');
  showToast(`ยินดีต้อนรับ ${emp.name}`);
}

/**
 * Handle user logout
 */
function logout() {
  state.currentUser = null;
  localStorage.removeItem('currentUser');
  updateNavForRole();
  updateUserDisplay();
  goSec('login');
  showToast('ออกจากระบบแล้ว');
}

/**
 * Update navigation visibility based on user role
 */
function updateNavForRole() {
  document.querySelectorAll('.nb').forEach(btn => {
    const sec = btn.dataset.s;
    if (sec === 'employees') {
      btn.style.display = (state.currentUser && (state.currentUser.role === 'admin' || state.currentUser.role === 'manager')) ? '' : 'none';
    } else if (sec === 'settings') {
      btn.style.display = (state.currentUser && state.currentUser.role === 'admin') ? '' : 'none';
    } else {
      btn.style.display = state.currentUser ? '' : 'none';
    }
  });
}

/**
 * Update user display in header
 */
function updateUserDisplay() {
  const hdrUser = document.getElementById('hdr-user');
  const userName = document.getElementById('user-name');
  if (state.currentUser) {
    hdrUser.style.display = 'flex';
    userName.textContent = state.currentUser.name;
  } else {
    hdrUser.style.display = 'none';
  }
}

/**
 * Check if user is already logged in
 */
function checkLogin() {
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
}

// =============================================================
// NAVIGATION
// =============================================================

/**
 * Navigate to a section
 * @param {string} id - Section ID to navigate to
 */
function goSec(id) {
  state.currentSection = id;
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nb').forEach(b => b.classList.toggle('active', b.dataset.s === id));
  document.querySelector('.body').scrollTop = 0;
  
  // Load section data
  const sectionLoaders = {
    'dashboard': loadDash,
    'checkin': loadCIRooms,
    'rooms': loadRooms,
    'customers': loadCusts,
    'accounting': loadAcc,
    'settings': loadSettings,
    'employees': loadEmployees
  };
  
  if (sectionLoaders[id]) {
    sectionLoaders[id]();
  }
}

/**
 * Close quick action popup
 * @param {Event} e - Click event
 * @param {string} id - Popup ID
 */
function closeQuickPopup(e, id) {
  if (!e || e.target.id === id) {
    document.getElementById(id).classList.remove('show');
  }
}

// =============================================================
// QUICK ACTIONS
// =============================================================

/**
 * Open quick guest addition popup
 */
async function openQuickGuest() {
  document.getElementById('qg-name').value = '';
  document.getElementById('qg-phone').value = '';
  document.getElementById('qg-idcard').value = '';
  document.getElementById('qg-address').value = '';
  document.getElementById('quick-guest-popup').classList.add('show');
}

/**
 * Save quick guest
 */
async function saveQuickGuest() {
  const name = document.getElementById('qg-name').value.trim();
  if (!name) { showToast('กรุณากรอกชื่อ', 'err'); return; }

  const phone = document.getElementById('qg-phone').value.trim();
  const id_card = document.getElementById('qg-idcard').value.trim();
  const address = document.getElementById('qg-address').value.trim();
  const customer_id = 'C' + Date.now();

  await db.customers.add({ customer_id, name, phone, id_card, address, total_stays: 0, total_spent: 0 });
  showToast('✅ เพิ่มผู้เข้าพักสำเร็จ');
  closeQuickPopup(null, 'quick-guest-popup');
  loadDash();
}

/**
 * Open quick income popup
 */
async function openQuickIncome() {
  const rooms = await db.rooms.getAll();
  const occ = rooms.filter(r => r.status === 'occupied');
  let html = '<option value="">-- เลือกห้อง (ถ้ามี) --</option>';
  occ.forEach(r => { html += `<option value="${r.room_number}">${r.room_number}</option>`; });
  document.getElementById('qi-room').innerHTML = html;
  document.getElementById('qi-date').value = moment().format('YYYY-MM-DD');
  document.getElementById('qi-item').value = '';
  document.getElementById('qi-amount').value = '';
  document.getElementById('qi-note').value = '';
  document.getElementById('quick-income-popup').classList.add('show');
}

/**
 * Save quick income
 */
async function saveQuickIncome() {
  const date = document.getElementById('qi-date').value;
  const item_name = document.getElementById('qi-item').value.trim();
  const receipt = parseInt(document.getElementById('qi-amount').value) || 0;
  const room_number = document.getElementById('qi-room').value;
  const note = document.getElementById('qi-note').value.trim();

  if (!item_name || receipt <= 0) { showToast('กรุณากรอกรายการและจำนวนเงิน', 'err'); return; }

  await db.transactions.add({ date, item_name, receipt, payment: 0, room_number, note, type: 'income' });
  showToast('✅ เพิ่มรายรับสำเร็จ');
  closeQuickPopup(null, 'quick-income-popup');
  loadDash();
}

/**
 * Open quick expense popup
 */
async function openQuickExpense() {
  document.getElementById('qe-date').value = moment().format('YYYY-MM-DD');
  document.getElementById('qe-item').value = '';
  document.getElementById('qe-amount').value = '';
  document.getElementById('qe-category').value = '';
  document.getElementById('qe-note').value = '';
  document.getElementById('quick-expense-popup').classList.add('show');
}

/**
 * Save quick expense
 */
async function saveQuickExpense() {
  const date = document.getElementById('qe-date').value;
  const item_name = document.getElementById('qe-item').value.trim();
  const payment = parseInt(document.getElementById('qe-amount').value) || 0;
  const category = document.getElementById('qe-category').value;
  const note = document.getElementById('qe-note').value.trim();

  if (!item_name || payment <= 0) { showToast('กรุณากรอกรายการและจำนวนเงิน', 'err'); return; }

  const fullNote = category ? `${category}${note ? ' - ' + note : ''}` : note;
  await db.transactions.add({ date, item_name, payment, receipt: 0, room_number: '', note: fullNote, type: 'expense' });
  showToast('✅ เพิ่มรายจ่ายสำเร็จ');
  closeQuickPopup(null, 'quick-expense-popup');
  loadDash();
}

/**
 * Open quick check-in popup
 */
async function openQuickCheckin() {
  const rooms = await db.rooms.getAll();
  const avail = rooms.filter(r => r.status === 'available');
  let html = '<option value="">-- เลือกห้อง --</option>';
  avail.forEach(r => { html += `<option value="${r.room_number}">${r.room_number} - ${r.room_type} (฿${r.price_per_night})</option>`; });
  document.getElementById('qci-room').innerHTML = html;
  document.getElementById('qci-date').value = moment().format('YYYY-MM-DD');
  document.getElementById('qco-date').value = moment().add(1, 'day').format('YYYY-MM-DD');
  document.getElementById('qci-name').value = '';
  document.getElementById('qci-phone').value = '';
  document.getElementById('qci-deposit').value = state.settings?.depositAmount || 200;
  document.getElementById('quick-checkin-popup').classList.add('show');
}

/**
 * Select payment method for quick check-in
 * @param {HTMLElement} el - Selected element
 */
function selQCI(el) {
  document.querySelectorAll('#quick-checkin-popup .po').forEach(p => p.classList.remove('checked'));
  el.classList.add('checked');
}

/**
 * Save quick check-in
 */
async function saveQuickCheckin() {
  const room_number = document.getElementById('qci-room').value;
  const check_in_date = document.getElementById('qci-date').value;
  const check_out_date = document.getElementById('qco-date').value;
  const name = document.getElementById('qci-name').value.trim();
  const phone = document.getElementById('qci-phone').value.trim();
  const deposit = parseInt(document.getElementById('qci-deposit').value) || 0;
  const payMethod = document.querySelector('input[name="qci-pay"]:checked').value;

  if (!room_number || !check_in_date || !check_out_date) { showToast('กรุณากรอกข้อมูลให้ครบ', 'err'); return; }

  const room = await db.rooms.getByNumber(room_number);
  if (!room) { showToast('ไม่พบห้อง', 'err'); return; }

  const nights = moment(check_out_date).diff(moment(check_in_date), 'days');
  const total = room.price_per_night * (nights > 0 ? nights : 1);

  let customer_id = '';
  if (name) {
    customer_id = 'C' + Date.now();
    await db.customers.add({ customer_id, name, phone, total_stays: 1, total_spent: total });
  }

  const booking_id = 'B' + Date.now();
  await db.bookings.add({
    booking_id, customer_id, room_id: room.id,
    check_in_date, check_out_date, total_amount: total,
    deposit, status: 'checked_in'
  });

  await db.rooms.update(room.id, { status: 'occupied' });

  if (deposit > 0) {
    await db.transactions.add({
      date: check_in_date,
      item_name: `เงินมัดจำ ห้อง ${room_number}`,
      receipt: deposit, payment: 0,
      room_number, note: payMethod,
      type: 'income'
    });
  }

  showToast(`✅ เช็คอินสำเร็จ ห้อง ${room_number}`);
  closeQuickPopup(null, 'quick-checkin-popup');
  loadDash();
}

// =============================================================
// DASHBOARD
// =============================================================

/**
 * Load dashboard data
 */
async function loadDash() {
  state.settings = await db.settings.get();
  const [rooms, active] = await Promise.all([db.rooms.getAll(), db.bookings.getActive()]);
  const today = moment().format('YYYY-MM-DD');
  const [todayBk, todayTx] = await Promise.all([db.bookings.getByDate(today), db.transactions.getByDate(today)]);

  // Room stats
  document.getElementById('dash-total').textContent = rooms.length;
  document.getElementById('dash-avail').textContent = rooms.filter(r => r.status === 'available').length;
  document.getElementById('dash-occ').textContent = rooms.filter(r => r.status === 'occupied').length;
  document.getElementById('dash-maint').textContent = rooms.filter(r => r.status === 'maintenance').length;

  // Finance
  const inc = todayTx.reduce((s, t) => s + (t.receipt || 0), 0);
  const exp = todayTx.reduce((s, t) => s + (t.payment || 0), 0);
  const op = state.settings?.openingBalance || 0;
  document.getElementById('dash-income').textContent = `฿${inc.toLocaleString()}`;
  document.getElementById('dash-expense').textContent = `฿${exp.toLocaleString()}`;
  document.getElementById('dash-balance').textContent = `฿${(op + inc - exp).toLocaleString()}`;
  
  // Activity
  document.getElementById('dash-ci').textContent = todayBk.filter(b => b.check_in_date === today).length;
  document.getElementById('dash-co').textContent = todayBk.filter(b => b.check_out_date === today).length;
  document.getElementById('dash-act').textContent = active.length;

  // Checkout today
  const coToday = active.filter(b => b.check_out_date === today);
  const list = document.getElementById('dash-colist');
  if (coToday.length) {
    const items = await Promise.all(coToday.map(async b => {
      const [c, r] = await Promise.all([db.customers.getById(b.customer_id), db.rooms.getById(b.room_id)]);
      return `<div class="coi"><div><div class="con">${c?.name || b.customer_id}</div><div class="cor">ห้อง ${r?.room_number || b.room_id}</div></div><button class="cobtn" onclick="doCheckout('${b.booking_id}')">เช็คเอาท์</button></div>`;
    }));
    list.innerHTML = items.join('');
  } else {
    list.innerHTML = '<div class="empty">ไม่มีรายการเช็คเอาท์วันนี้</div>';
  }

  // Revenue chart (7 days)
  await renderRevenueChart();
}

/**
 * Render revenue chart for last 7 days
 */
async function renderRevenueChart() {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;
  
  const today = moment();
  const labels = [];
  const incomeData = [];
  const expenseData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = today.clone().subtract(i, 'days').format('YYYY-MM-DD');
    labels.push(moment(date).format('DD/MM'));
    
    const txs = await db.transactions.getByDate(date);
    incomeData.push(txs.filter(t => t.type === 'income').reduce((s, t) => s + (t.receipt || 0), 0));
    expenseData.push(txs.filter(t => t.type === 'expense').reduce((s, t) => s + (t.payment || 0), 0));
  }

  if (state.revenueChart) state.revenueChart.destroy();
  
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#E8F5E9' : '#1A2E24';
  
  state.revenueChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'รายรับ', data: incomeData, backgroundColor: '#52B788', borderRadius: 4 },
        { label: 'รายจ่าย', data: expenseData, backgroundColor: '#E63946', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: textColor } } },
      scales: {
        y: { ticks: { color: textColor }, grid: { color: isDark ? '#2A3D34' : '#E2EBE6' } },
        x: { ticks: { color: textColor }, grid: { display: false } }
      }
    }
  });
}

// =============================================================
// SETTINGS
// =============================================================

/**
 * Load settings page
 */
async function loadSettings() {
  state.settings = await db.settings.get();
  document.getElementById('set-open').value = state.settings.openingBalance || 0;
  document.getElementById('set-dep').value = state.settings.depositAmount || 200;
  document.getElementById('set-elec').value = state.settings.electricRate || 8;
  document.getElementById('set-water').value = state.settings.waterRate || 25;
  
  const rooms = await db.rooms.getAll();
  const aCount = rooms.filter(r => r.building === 'A').length;
  const bCount = rooms.filter(r => r.building === 'B').length;
  const nCount = rooms.filter(r => r.building === 'N').length;
  document.getElementById('set-count-a').value = aCount;
  document.getElementById('set-count-b').value = bCount;
  document.getElementById('set-count-n').value = nCount;
}

/**
 * Save settings
 */
async function saveSettings() {
  const settings = {
    openingBalance: parseInt(document.getElementById('set-open').value) || 0,
    depositAmount: parseInt(document.getElementById('set-dep').value) || 200,
    electricRate: parseInt(document.getElementById('set-elec').value) || 8,
    waterRate: parseInt(document.getElementById('set-water').value) || 25
  };
  await db.settings.update(settings);
  state.settings = settings;
  showToast('บันทึกการตั้งค่าแล้ว');
  loadDash();
}

/**
 * Regenerate rooms
 */
async function regenRooms() {
  if (!confirm('สร้างห้องใหม่ทั้งหมด? ข้อมูลการจองจะถูกลบ')) return;
  const a = parseInt(document.getElementById('set-count-a').value) || 11;
  const b = parseInt(document.getElementById('set-count-b').value) || 11;
  const n = parseInt(document.getElementById('set-count-n').value) || 7;
  
  const rooms = [];
  let id = 1;
  
  for (let i = 1; i <= a; i++) {
    const floor = i <= 5 ? 1 : 2;
    rooms.push({
      id: id++,
      room_number: `A10${i}`,
      building: 'A',
      floor,
      room_type: i === 3 || i === 8 ? 'Standard Twin' : 'Standard',
      price_per_night: i === 3 || i === 8 ? 500 : 400,
      status: 'available'
    });
  }
  
  for (let i = 1; i <= b; i++) {
    const floor = i <= 5 ? 1 : 2;
    rooms.push({
      id: id++,
      room_number: `B10${i}`,
      building: 'B',
      floor,
      room_type: i === 3 || i === 8 || i === 11 ? 'Standard Twin' : 'Standard',
      price_per_night: i === 3 || i === 8 || i === 11 ? 500 : 400,
      status: 'available'
    });
  }
  
  for (let i = 1; i <= n; i++) {
    rooms.push({
      id: id++,
      room_number: `N${i}`,
      building: 'N',
      floor: 1,
      room_type: i === 2 || i === 4 || i === 7 ? 'Standard Twin' : 'Standard',
      price_per_night: i === 2 || i === 4 || i === 7 ? 600 : 500,
      status: 'available'
    });
  }
  
  await db.rooms.bulkAdd(rooms);
  showToast(`สร้างห้องใหม่ ${rooms.length} ห้อง`);
  loadSettings();
  loadDash();
}

/**
 * Clear all data
 */
async function clearAllData() {
  if (!confirm('⚠️ ล้างข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถยกเลิกได้')) return;
  await db.clear();
  location.reload();
}

/**
 * Export data to JSON
 */
async function exportData() {
  const data = await db.export();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resort-backup-${moment().format('YYYYMMDD-HHmmss')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 สำรองข้อมูลสำเร็จ');
}

/**
 * Import data from JSON
 * @param {HTMLInputElement} input - File input
 */
async function importData(input) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      await db.import(e.target.result);
      showToast('📤 กู้ข้อมูลสำเร็จ');
      loadDash();
    } catch (err) {
      showToast('❌ ไฟล์ไม่ถูกต้อง', 'err');
    }
  };
  reader.readAsText(file);
}

// =============================================================
// UTILS
// =============================================================

/**
 * Show toast notification
 * @param {string} msg - Message to show
 * @param {string} type - Type: 'ok' or 'err'
 */
function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type === 'err' ? ' err' : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// =============================================================
// EMPLOYEE MANAGEMENT
// =============================================================

/**
 * Load employees list
 */
async function loadEmployees() {
  const emps = await db.employees.getAll();
  const list = document.getElementById('emp-list');
  if (!emps.length) { list.innerHTML = '<div class="empty">ไม่มีพนักงาน</div>'; return; }
  
  list.innerHTML = emps.map(e => {
    const roleLabel = e.role === 'admin' ? 'ผู้ดูแลระบบ' : e.role === 'manager' ? 'ผู้จัดการ' : 'พนักงาน';
    const roleColor = e.role === 'admin' ? 'var(--danger)' : e.role === 'manager' ? 'var(--warning)' : 'var(--info)';
    return `<div class="cc">
      <div>
        <div class="ccn">${e.name}</div>
        <div class="ccm">${e.username} | ${e.phone || '-'}</div>
        <div style="color:${roleColor};font-size:11px;font-weight:600">${roleLabel}</div>
      </div>
      <div class="ccb">
        <div style="font-size:11px;color:${e.status==='active'?'#2D6A4F':'#E63946'}">${e.status==='active'?'✅ ใช้งาน':'❌ ระงับ'}</div>
      </div>
    </div>`;
  }).join('');
}

/**
 * Add new employee
 */
async function addEmployee() {
  const username = document.getElementById('emp-username').value.trim();
  const name = document.getElementById('emp-name').value.trim();
  const password = document.getElementById('emp-password').value;
  const phone = document.getElementById('emp-phone').value.trim();
  const role = document.getElementById('emp-role').value;
  
  if (!username || !name || !password || !role) { showToast('กรุณากรอกข้อมูลให้ครบ', 'err'); return; }
  
  const exist = await db.employees.getByUsername(username);
  if (exist) { showToast('ชื่อผู้ใช้นี้มีอยู่แล้ว', 'err'); return; }
  
  await db.employees.add({ username, name, password, phone, role, status: 'active' });
  showToast('เพิ่มพนักงานสำเร็จ');
  
  document.getElementById('emp-username').value = '';
  document.getElementById('emp-name').value = '';
  document.getElementById('emp-password').value = '';
  document.getElementById('emp-phone').value = '';
  document.getElementById('emp-role').value = '';
  
  loadEmployees();
}

// =============================================================
// STUB FUNCTIONS (to be implemented)
// =============================================================

async function loadCIRooms() { showToast('โหลดหน้าเช็คอิน'); }
async function loadRooms() { showToast('โหลดหน้าห้องพัก'); }
async function loadCusts() { showToast('โหลดหน้าลูกค้า'); }
async function loadAcc() { showToast('โหลดหน้าบัญชี'); }
function doCheckout() { showToast('เช็คเอาท์สำเร็จ'); }
function searchCust() {}
function addNewCust() {}
function clearCust() {}
function useHistory() {}
function updateRoomInfo() {}
function calcTotal() {}
function selPay() {}
function previewSlip() {}
function doCheckin() { showToast('เช็คอินสำเร็จ'); }
function openRoomFilter() {}
function filterRoom() {}
function handleOCR() {}
function closeRoomModal() {}

// =============================================================
// EXPORT TO WINDOW
// =============================================================
Object.assign(window, {
  login, logout, goSec, closeQuickPopup,
  openQuickGuest, saveQuickGuest,
  openQuickIncome, saveQuickIncome,
  openQuickExpense, saveQuickExpense,
  openQuickCheckin, selQCI, saveQuickCheckin,
  toggleTheme, checkNetwork,
  loadSettings, saveSettings, regenRooms, clearAllData, exportData, importData,
  loadEmployees, addEmployee,
  showToast,
  doCheckout, searchCust, addNewCust, clearCust, useHistory,
  updateRoomInfo, calcTotal, selPay, previewSlip, doCheckin,
  openRoomFilter, filterRoom, handleOCR, closeRoomModal,
  loadCIRooms, loadRooms, loadCusts, loadAcc
});

// =============================================================
// INITIALIZATION
// =============================================================
initTheme();
updateNetworkStatus();
checkLogin();
