/**
 * VIPAT Hotel Manager v5.1
 * Main Application - Working Implementation
 */

import { db } from './db.js';

// =============================================================
// GLOBAL STATE
// =============================================================
let state = {
  currentUser: null,
  currentSection: 'login',
  currentFilter: 'all',
  settings: null
};

// =============================================================
// INITIALIZATION
// =============================================================
async function init() {
  console.log('[App] Initializing...');
  
  // Load settings
  try {
    state.settings = await db.settings.get();
    console.log('[App] Settings loaded:', state.settings);
  } catch (e) {
    console.error('[App] Failed to load settings:', e);
    state.settings = { openingBalance: 4037, depositAmount: 200, electricRate: 8, waterRate: 25 };
  }
  
  // Check login
  const saved = localStorage.getItem('currentUser');
  if (saved) {
    try {
      state.currentUser = JSON.parse(saved);
      console.log('[App] User logged in:', state.currentUser.name);
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
  
  // Hide all sections
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('active'));
  
  // Show target section
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    console.log('[Nav] Navigated to:', id);
  }
  
  // Update nav buttons
  document.querySelectorAll('.nb').forEach(b => {
    b.classList.toggle('active', b.dataset.s === id);
  });
  
  // Scroll to top
  const body = document.querySelector('.body');
  if (body) body.scrollTop = 0;
  
  // Load section data
  switch(id) {
    case 'dashboard': loadDash(); break;
    case 'checkin': loadCIRooms(); break;
    case 'rooms': loadRooms(); break;
    case 'customers': loadCusts(); break;
    case 'accounting': loadAcc(); break;
    case 'settings': loadSettings(); break;
    case 'employees': loadEmployees(); break;
  }
}

// =============================================================
// AUTH
// =============================================================
async function login() {
  const usernameEl = document.getElementById('login-user');
  const passwordEl = document.getElementById('login-pass');
  
  if (!usernameEl || !passwordEl) {
    console.error('[Auth] Login elements not found');
    return;
  }
  
  const username = usernameEl.value.trim();
  const password = passwordEl.value;
  
  if (!username || !password) {
    showToast('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', 'err');
    return;
  }

  try {
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
    
    usernameEl.value = '';
    passwordEl.value = '';
    
    updateNavForRole();
    updateUserDisplay();
    goSec('dashboard');
    showToast(`ยินดีต้อนรับ ${emp.name}`);
    console.log('[Auth] Login successful:', emp.name);
  } catch (e) {
    console.error('[Auth] Login error:', e);
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
    } else if (sec === 'employees') {
      btn.style.display = (state.currentUser.role === 'admin' || state.currentUser.role === 'manager') ? '' : 'none';
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
  console.log('[Dash] Loading dashboard...');
  
  try {
    const [rooms, active] = await Promise.all([
      db.rooms.getAll(),
      db.bookings.getActive()
    ]);
    
    const today = new Date().toISOString().split('T')[0];
    const [todayBk, todayTx] = await Promise.all([
      db.bookings.getByDate(today),
      db.transactions.getByDate(today)
    ]);

    // Room stats
    const totalEl = document.getElementById('dash-total');
    const availEl = document.getElementById('dash-avail');
    const occEl = document.getElementById('dash-occ');
    const maintEl = document.getElementById('dash-maint');
    
    if (totalEl) totalEl.textContent = rooms.length;
    if (availEl) availEl.textContent = rooms.filter(r => r.status === 'available').length;
    if (occEl) occEl.textContent = rooms.filter(r => r.status === 'occupied').length;
    if (maintEl) maintEl.textContent = rooms.filter(r => r.status === 'maintenance').length;

    // Finance
    const inc = todayTx.reduce((s, t) => s + (t.receipt || 0), 0);
    const exp = todayTx.reduce((s, t) => s + (t.payment || 0), 0);
    const op = state.settings?.openingBalance || 0;
    
    const incEl = document.getElementById('dash-income');
    const expEl = document.getElementById('dash-expense');
    const balEl = document.getElementById('dash-balance');
    
    if (incEl) incEl.textContent = `฿${inc.toLocaleString()}`;
    if (expEl) expEl.textContent = `฿${exp.toLocaleString()}`;
    if (balEl) balEl.textContent = `฿${(op + inc - exp).toLocaleString()}`;
    
    // Activity
    const ciEl = document.getElementById('dash-ci');
    const coEl = document.getElementById('dash-co');
    const actEl = document.getElementById('dash-act');
    
    if (ciEl) ciEl.textContent = todayBk.filter(b => b.check_in_date === today).length;
    if (coEl) coEl.textContent = todayBk.filter(b => b.check_out_date === today).length;
    if (actEl) actEl.textContent = active.length;

    // Checkout today
    const coToday = active.filter(b => b.check_out_date === today);
    const list = document.getElementById('dash-colist');
    
    if (list) {
      if (coToday.length) {
        const items = await Promise.all(coToday.map(async b => {
          const [c, r] = await Promise.all([
            db.customers.getById(b.customer_id),
            db.rooms.getById(b.room_id)
          ]);
          const name = c?.name || b.customer_id;
          const room = r?.room_number || b.room_id;
          return `<div class="coi">
            <div>
              <div class="con">${name}</div>
              <div class="cor">ห้อง ${room}</div>
            </div>
            <button class="cobtn" onclick="doCheckout('${b.booking_id}')">เช็คเอาท์</button>
          </div>`;
        }));
        list.innerHTML = items.join('');
      } else {
        list.innerHTML = '<div class="empty">ไม่มีรายการเช็คเอาท์วันนี้</div>';
      }
    }
    
    console.log('[Dash] Loaded successfully');
  } catch (e) {
    console.error('[Dash] Error:', e);
    showToast('เกิดข้อผิดพลาดในการโหลดแดชบอร์ด', 'err');
  }
}

// =============================================================
// ROOMS
// =============================================================
async function loadRooms() {
  console.log('[Rooms] Loading rooms...');
  
  try {
    const rooms = await db.rooms.getAll();
    const grid = document.getElementById('rooms-grid');
    
    if (!grid) {
      console.error('[Rooms] Grid element not found');
      return;
    }
    
    // Filter
    const filtered = state.currentFilter === 'all' 
      ? rooms 
      : rooms.filter(r => r.status === state.currentFilter);
    
    // Group by building
    const buildings = {};
    filtered.forEach(r => {
      if (!buildings[r.building]) buildings[r.building] = [];
      buildings[r.building].push(r);
    });
    
    let html = '';
    ['A', 'B', 'N'].forEach(b => {
      if (buildings[b]) {
        html += `<div class="rg-name">ตึก ${b}</div><div class="rg">`;
        buildings[b].forEach(r => {
          const statusClass = r.status || 'available';
          const statusText = {
            'available': 'ว่าง',
            'occupied': 'มีผู้พัก',
            'maintenance': 'ซ่อม',
            'cleaning': 'ทำความสะอาด'
          }[r.status] || r.status;
          
          html += `<div class="rc ${statusClass}" onclick="openRoomDetail('${r.id}')">
            <div class="rn">${r.room_number}</div>
            <div class="rt">${r.room_type}</div>
            <div class="rp">฿${r.price_per_night}</div>
            <span class="rbadge">${statusText}</span>
          </div>`;
        });
        html += '</div>';
      }
    });
    
    grid.innerHTML = html;
    console.log('[Rooms] Loaded:', rooms.length, 'rooms');
  } catch (e) {
    console.error('[Rooms] Error:', e);
    showToast('เกิดข้อผิดพลาดในการโหลดห้อง', 'err');
  }
}

function filterRoom(status, el) {
  state.currentFilter = status;
  
  // Update buttons
  document.querySelectorAll('#room-filter .fc').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  
  loadRooms();
}

async function openRoomDetail(roomId) {
  console.log('[Rooms] Opening room:', roomId);
  const room = await db.rooms.getById(parseInt(roomId));
  if (!room) return;
  
  const overlay = document.getElementById('room-overlay');
  const title = document.getElementById('room-detail-title');
  const content = document.getElementById('room-detail-content');
  
  if (title) title.textContent = `ห้อง ${room.room_number}`;
  
  const statusText = {
    'available': 'ว่าง',
    'occupied': 'มีผู้พัก',
    'maintenance': 'ซ่อม',
    'cleaning': 'ทำความสะอาด'
  }[room.status] || room.status;
  
  if (content) {
    content.innerHTML = `
      <div class="drow2"><span class="dlbl">ตึก</span><span class="dval">${room.building}</span></div>
      <div class="drow2"><span class="dlbl">ชั้น</span><span class="dval">${room.floor}</span></div>
      <div class="drow2"><span class="dlbl">ประเภท</span><span class="dval">${room.room_type}</span></div>
      <div class="drow2"><span class="dlbl">ราคา/คืน</span><span class="dval">฿${room.price_per_night}</span></div>
      <div class="drow2"><span class="dlbl">สถานะ</span><span class="dval">${statusText}</span></div>
      <div class="sheet-btns">
        ${room.status === 'available' ? `<button class="btn bp" onclick="goSec('checkin')">เช็คอิน</button>` : ''}
        ${room.status === 'occupied' ? `<button class="btn bd" onclick="doCheckout()">เช็คเอาท์</button>` : ''}
        <button class="btn bs" onclick="closeRoomModal()">ปิด</button>
      </div>
    `;
  }
  
  if (overlay) overlay.classList.add('show');
}

function closeRoomModal(e) {
  if (!e || e.target.id === 'room-overlay') {
    const overlay = document.getElementById('room-overlay');
    if (overlay) overlay.classList.remove('show');
  }
}

// =============================================================
// CHECK-IN
// =============================================================
async function loadCIRooms() {
  console.log('[CheckIn] Loading available rooms...');
  
  try {
    const rooms = await db.rooms.getByStatus('available');
    const sel = document.getElementById('rsel');
    
    if (!sel) {
      console.error('[CheckIn] Room select not found');
      return;
    }
    
    sel.innerHTML = '<option value="">-- เลือกห้องว่าง --</option>' +
      rooms.map(r => `<option value="${r.id}" data-p="${r.price_per_night}" data-n="${r.room_number}" data-t="${r.room_type}">${r.room_number} - ${r.room_type} (฿${r.price_per_night})</option>`).join('');
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    const ciDate = document.getElementById('ci-date');
    const coDate = document.getElementById('co-date');
    if (ciDate) ciDate.value = today;
    if (coDate) coDate.value = tomorrow;
    
    console.log('[CheckIn] Loaded:', rooms.length, 'rooms');
  } catch (e) {
    console.error('[CheckIn] Error:', e);
  }
}

function updateRoomInfo() {
  const sel = document.getElementById('rsel');
  const opt = sel.options[sel.selectedIndex];
  const info = document.getElementById('rinfo');
  
  if (!opt.value) {
    if (info) info.style.display = 'none';
    return;
  }
  
  const price = opt.dataset.p;
  const number = opt.dataset.n;
  const type = opt.dataset.t;
  
  if (info) {
    info.style.display = 'block';
    info.innerHTML = `<strong>ห้อง ${number}</strong><br>${type}<br>ราคา: ฿${price}/คืน`;
  }
  
  document.getElementById('rrate').value = price;
  calcTotal();
}

function calcTotal() {
  const ciDate = document.getElementById('ci-date')?.value;
  const coDate = document.getElementById('co-date')?.value;
  const rate = parseInt(document.getElementById('rrate')?.value) || 0;
  const efee = parseInt(document.getElementById('efee')?.value) || 0;
  const wfee = parseInt(document.getElementById('wfee')?.value) || 0;
  const dep = parseInt(document.getElementById('dep')?.value) || 0;
  const disc = parseInt(document.getElementById('disc')?.value) || 0;
  
  if (!ciDate || !coDate) return;
  
  const ci = new Date(ciDate);
  const co = new Date(coDate);
  const nights = Math.max(1, Math.ceil((co - ci) / 86400000));
  
  const roomTotal = rate * nights;
  const subtotal = roomTotal + efee + wfee;
  const grandTotal = subtotal - disc + dep;
  
  const nightsEl = document.getElementById('nights');
  const rtotalEl = document.getElementById('rtotal');
  const grandEl = document.getElementById('grand-total');
  
  if (nightsEl) nightsEl.value = nights;
  if (rtotalEl) rtotalEl.value = roomTotal;
  if (grandEl) grandEl.textContent = `฿${grandTotal.toLocaleString()}`;
  
  // Summary
  const sumRoom = document.getElementById('sum-room');
  const sumElec = document.getElementById('sum-elec');
  const sumWater = document.getElementById('sum-water');
  const sumDisc = document.getElementById('sum-disc');
  const sumDep = document.getElementById('sum-dep');
  
  if (sumRoom) sumRoom.textContent = `฿${roomTotal.toLocaleString()}`;
  if (sumElec) sumElec.textContent = `฿${efee.toLocaleString()}`;
  if (sumWater) sumWater.textContent = `฿${wfee.toLocaleString()}`;
  if (sumDisc) sumDisc.textContent = `-฿${disc.toLocaleString()}`;
  if (sumDep) sumDep.textContent = `฿${dep.toLocaleString()}`;
}

async function doCheckin() {
  const roomId = document.getElementById('rsel')?.value;
  const ciDate = document.getElementById('ci-date')?.value;
  const coDate = document.getElementById('co-date')?.value;
  
  if (!roomId || !ciDate || !coDate) {
    showToast('กรุณาเลือกห้องและวันที่', 'err');
    return;
  }
  
  try {
    const room = await db.rooms.getById(parseInt(roomId));
    if (!room) {
      showToast('ไม่พบห้อง', 'err');
      return;
    }
    
    const rate = parseInt(document.getElementById('rrate')?.value) || room.price_per_night;
    const efee = parseInt(document.getElementById('efee')?.value) || 0;
    const wfee = parseInt(document.getElementById('wfee')?.value) || 0;
    const dep = parseInt(document.getElementById('dep')?.value) || 0;
    const disc = parseInt(document.getElementById('disc')?.value) || 0;
    
    const ci = new Date(ciDate);
    const co = new Date(coDate);
    const nights = Math.max(1, Math.ceil((co - ci) / 86400000));
    const total = (rate * nights) + efee + wfee - disc;
    
    const bookingId = 'B' + Date.now();
    await db.bookings.add({
      booking_id: bookingId,
      customer_id: selCust?.customer_id || 'WALK-IN',
      room_id: room.id,
      check_in_date: ciDate,
      check_out_date: coDate,
      total_amount: total,
      deposit: dep,
      status: 'checked_in'
    });
    
    await db.rooms.update(room.id, { status: 'occupied' });
    
    if (dep > 0) {
      await db.transactions.add({
        date: ciDate,
        item_name: `เงินมัดจำ ห้อง ${room.room_number}`,
        receipt: dep,
        payment: 0,
        room_number: room.room_number,
        note: 'deposit',
        type: 'income'
      });
    }
    
    showToast(`✅ เช็คอินสำเร็จ ห้อง ${room.room_number}`);
    clearCust();
    goSec('dashboard');
  } catch (e) {
    console.error('[CheckIn] Error:', e);
    showToast('เกิดข้อผิดพลาด: ' + e.message, 'err');
  }
}

// =============================================================
// CUSTOMERS
// =============================================================
let selCust = null;

async function searchCust(query) {
  if (!query || query.length < 2) {
    document.getElementById('csearch-res').innerHTML = '';
    return;
  }
  
  try {
    const results = await db.customers.search(query);
    const res = document.getElementById('csearch-res');
    
    if (res) {
      res.innerHTML = results.slice(0, 5).map(c => 
        `<div class="sri" onclick="selectCust('${c.customer_id}', '${c.name}', '${c.phone || ''}')">
          <div class="srn">${c.name}</div>
          <div class="srs">${c.phone || 'ไม่มีเบอร์'} | ${c.customer_id}</div>
        </div>`
      ).join('') || '<div class="empty">ไม่พบผลลัพธ์</div>';
    }
  } catch (e) {
    console.error('[Cust] Search error:', e);
  }
}

function selectCust(id, name, phone) {
  selCust = { customer_id: id, name, phone };
  
  const box = document.getElementById('csel-box');
  const nameEl = document.getElementById('csel-name');
  const phoneEl = document.getElementById('csel-phone');
  
  if (box) box.classList.remove('hidden');
  if (nameEl) nameEl.textContent = name;
  if (phoneEl) phoneEl.textContent = phone || 'ไม่มีเบอร์';
  
  document.getElementById('csearch-res').innerHTML = '';
  document.getElementById('csearch').value = name;
}

function clearCust() {
  selCust = null;
  const box = document.getElementById('csel-box');
  if (box) box.classList.add('hidden');
  document.getElementById('csearch').value = '';
}

async function addNewCust() {
  const name = prompt('ชื่อลูกค้า:');
  if (!name) return;
  
  const phone = prompt('เบอร์โทร:') || '';
  const id = 'C' + Date.now();
  
  await db.customers.add({
    customer_id: id,
    name,
    phone,
    total_stays: 0,
    total_spent: 0
  });
  
  selectCust(id, name, phone);
  showToast('เพิ่มลูกค้าใหม่สำเร็จ');
}

async function loadCusts(query = '') {
  console.log('[Custs] Loading customers...');
  
  try {
    const customers = query ? await db.customers.search(query) : await db.customers.getAll();
    const list = document.getElementById('cust-list');
    
    if (!list) return;
    
    if (!customers.length) {
      list.innerHTML = '<div class="empty">ไม่มีลูกค้า</div>';
      return;
    }
    
    list.innerHTML = customers.slice(0, 50).map(c => 
      `<div class="cc">
        <div>
          <div class="ccn">${c.name}</div>
          <div class="ccm">${c.phone || '-'} | ${c.customer_id}</div>
        </div>
        <div class="ccb">
          <div class="ccs">${c.total_stays || 0}</div>
          <div class="ccsl">ครั้ง</div>
        </div>
      </div>`
    ).join('');
    
    console.log('[Custs] Loaded:', customers.length, 'customers');
  } catch (e) {
    console.error('[Custs] Error:', e);
  }
}

// =============================================================
// ACCOUNTING
// =============================================================
async function loadAcc() {
  console.log('[Acc] Loading accounting...');
  
  try {
    const txs = await db.transactions.getAll();
    const today = new Date().toISOString().split('T')[0];
    
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + (t.receipt || 0), 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + (t.payment || 0), 0);
    
    const incEl = document.getElementById('acc-income');
    const expEl = document.getElementById('acc-expense');
    const balEl = document.getElementById('acc-balance');
    
    if (incEl) incEl.textContent = `฿${income.toLocaleString()}`;
    if (expEl) expEl.textContent = `฿${expense.toLocaleString()}`;
    if (balEl) balEl.textContent = `฿${(income - expense).toLocaleString()}`;
    
    // Transaction list
    const list = document.getElementById('tx-list');
    if (list) {
      list.innerHTML = txs.slice(-20).reverse().map(t => 
        `<div class="txi">
          <div>
            <div class="txn">${t.item_name}</div>
            <div class="txm">${t.date} | ${t.room_number || '-'}</div>
          </div>
          <div class="${t.type === 'income' ? 'txp' : 'txng'}">
            ${t.type === 'income' ? '+' : '-'}฿${(t.receipt || t.payment || 0).toLocaleString()}
          </div>
        </div>`
      ).join('') || '<div class="empty">ไม่มีรายการ</div>';
    }
    
    console.log('[Acc] Loaded successfully');
  } catch (e) {
    console.error('[Acc] Error:', e);
  }
}

// =============================================================
// SETTINGS
// =============================================================
async function loadSettings() {
  console.log('[Settings] Loading settings...');
  
  try {
    state.settings = await db.settings.get();
    
    const openEl = document.getElementById('set-open');
    const depEl = document.getElementById('set-dep');
    const elecEl = document.getElementById('set-elec');
    const waterEl = document.getElementById('set-water');
    
    if (openEl) openEl.value = state.settings.openingBalance || 0;
    if (depEl) depEl.value = state.settings.depositAmount || 200;
    if (elecEl) elecEl.value = state.settings.electricRate || 8;
    if (waterEl) waterEl.value = state.settings.waterRate || 25;
    
    console.log('[Settings] Loaded:', state.settings);
  } catch (e) {
    console.error('[Settings] Error:', e);
  }
}

async function saveSettings() {
  try {
    const settings = {
      openingBalance: parseInt(document.getElementById('set-open')?.value) || 0,
      depositAmount: parseInt(document.getElementById('set-dep')?.value) || 200,
      electricRate: parseInt(document.getElementById('set-elec')?.value) || 8,
      waterRate: parseInt(document.getElementById('set-water')?.value) || 25
    };
    
    await db.settings.update(settings);
    state.settings = settings;
    showToast('บันทึกการตั้งค่าแล้ว');
    console.log('[Settings] Saved:', settings);
  } catch (e) {
    console.error('[Settings] Error:', e);
    showToast('เกิดข้อผิดพลาด', 'err');
  }
}

// =============================================================
// EMPLOYEES
// =============================================================
async function loadEmployees() {
  console.log('[Emp] Loading employees...');
  
  try {
    const emps = await db.employees.getAll();
    const list = document.getElementById('emp-list');
    
    if (!list) return;
    
    if (!emps.length) {
      list.innerHTML = '<div class="empty">ไม่มีพนักงาน</div>';
      return;
    }
    
    list.innerHTML = emps.map(e => {
      const roleLabel = { admin: 'ผู้ดูแลระบบ', manager: 'ผู้จัดการ', staff: 'พนักงาน' }[e.role] || e.role;
      return `<div class="cc">
        <div>
          <div class="ccn">${e.name}</div>
          <div class="ccm">${e.username} | ${e.phone || '-'}</div>
          <div style="font-size:11px;font-weight:600">${roleLabel}</div>
        </div>
        <div class="ccb">
          <div style="font-size:11px;color:${e.status==='active'?'#2D6A4F':'#E63946'}">
            ${e.status==='active'?'✅ ใช้งาน':'❌ ระงับ'}
          </div>
        </div>
      </div>`;
    }).join('');
    
    console.log('[Emp] Loaded:', emps.length, 'employees');
  } catch (e) {
    console.error('[Emp] Error:', e);
  }
}

async function addEmployee() {
  const username = document.getElementById('emp-username')?.value.trim();
  const name = document.getElementById('emp-name')?.value.trim();
  const password = document.getElementById('emp-password')?.value;
  const phone = document.getElementById('emp-phone')?.value.trim();
  const role = document.getElementById('emp-role')?.value;
  
  if (!username || !name || !password || !role) {
    showToast('กรุณากรอกข้อมูลให้ครบ', 'err');
    return;
  }
  
  try {
    const exist = await db.employees.getByUsername(username);
    if (exist) {
      showToast('ชื่อผู้ใช้นี้มีอยู่แล้ว', 'err');
      return;
    }
    
    await db.employees.add({ username, name, password, phone, role, status: 'active' });
    showToast('เพิ่มพนักงานสำเร็จ');
    
    document.getElementById('emp-username').value = '';
    document.getElementById('emp-name').value = '';
    document.getElementById('emp-password').value = '';
    document.getElementById('emp-phone').value = '';
    
    loadEmployees();
  } catch (e) {
    console.error('[Emp] Error:', e);
    showToast('เกิดข้อผิดพลาด', 'err');
  }
}

// =============================================================
// QUICK ACTIONS
// =============================================================
function closeQuickPopup(e, id) {
  if (!e || e.target.id === id) {
    document.getElementById(id)?.classList.remove('show');
  }
}

async function openQuickCheckin() {
  const rooms = await db.rooms.getByStatus('available');
  const sel = document.getElementById('qci-room');
  if (sel) {
    sel.innerHTML = '<option value="">-- เลือกห้อง --</option>' +
      rooms.map(r => `<option value="${r.room_number}">${r.room_number} - ${r.room_type} (฿${r.price_per_night})</option>`).join('');
  }
  document.getElementById('quick-checkin-popup')?.classList.add('show');
}

async function saveQuickCheckin() {
  const room_number = document.getElementById('qci-room')?.value;
  const check_in_date = document.getElementById('qci-date')?.value;
  const check_out_date = document.getElementById('qco-date')?.value;
  
  if (!room_number || !check_in_date || !check_out_date) {
    showToast('กรุณากรอกข้อมูลให้ครบ', 'err');
    return;
  }
  
  try {
    const room = await db.rooms.getByNumber(room_number);
    if (!room) {
      showToast('ไม่พบห้อง', 'err');
      return;
    }
    
    const ci = new Date(check_in_date);
    const co = new Date(check_out_date);
    const nights = Math.max(1, Math.ceil((co - ci) / 86400000));
    const total = room.price_per_night * nights;
    
    const booking_id = 'B' + Date.now();
    await db.bookings.add({
      booking_id,
      customer_id: 'WALK-IN',
      room_id: room.id,
      check_in_date,
      check_out_date,
      total_amount: total,
      deposit: 0,
      status: 'checked_in'
    });
    
    await db.rooms.update(room.id, { status: 'occupied' });
    
    showToast(`✅ เช็คอินสำเร็จ ห้อง ${room_number}`);
    closeQuickPopup(null, 'quick-checkin-popup');
    loadDash();
  } catch (e) {
    console.error('[QuickCI] Error:', e);
    showToast('เกิดข้อผิดพลาด', 'err');
  }
}

function openQuickGuest() {
  document.getElementById('qg-name').value = '';
  document.getElementById('qg-phone').value = '';
  document.getElementById('qg-idcard').value = '';
  document.getElementById('qg-address').value = '';
  document.getElementById('quick-guest-popup')?.classList.add('show');
}

async function saveQuickGuest() {
  const name = document.getElementById('qg-name')?.value.trim();
  if (!name) {
    showToast('กรุณากรอกชื่อ', 'err');
    return;
  }
  
  try {
    const phone = document.getElementById('qg-phone')?.value.trim() || '';
    const id_card = document.getElementById('qg-idcard')?.value.trim() || '';
    const address = document.getElementById('qg-address')?.value.trim() || '';
    const customer_id = 'C' + Date.now();
    
    await db.customers.add({ customer_id, name, phone, id_card, address, total_stays: 0, total_spent: 0 });
    showToast('✅ เพิ่มผู้เข้าพักสำเร็จ');
    closeQuickPopup(null, 'quick-guest-popup');
    loadDash();
  } catch (e) {
    console.error('[QuickGuest] Error:', e);
    showToast('เกิดข้อผิดพลาด', 'err');
  }
}

async function openQuickIncome() {
  document.getElementById('qi-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('qi-item').value = '';
  document.getElementById('qi-amount').value = '';
  document.getElementById('qi-note').value = '';
  document.getElementById('quick-income-popup')?.classList.add('show');
}

async function saveQuickIncome() {
  const date = document.getElementById('qi-date')?.value;
  const item_name = document.getElementById('qi-item')?.value.trim();
  const receipt = parseInt(document.getElementById('qi-amount')?.value) || 0;
  
  if (!item_name || receipt <= 0) {
    showToast('กรุณากรอกรายการและจำนวนเงิน', 'err');
    return;
  }
  
  try {
    await db.transactions.add({ date, item_name, receipt, payment: 0, room_number: '', note: '', type: 'income' });
    showToast('✅ เพิ่มรายรับสำเร็จ');
    closeQuickPopup(null, 'quick-income-popup');
    loadDash();
  } catch (e) {
    console.error('[QuickIncome] Error:', e);
    showToast('เกิดข้อผิดพลาด', 'err');
  }
}

async function openQuickExpense() {
  document.getElementById('qe-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('qe-item').value = '';
  document.getElementById('qe-amount').value = '';
  document.getElementById('qe-category').value = '';
  document.getElementById('qe-note').value = '';
  document.getElementById('quick-expense-popup')?.classList.add('show');
}

async function saveQuickExpense() {
  const date = document.getElementById('qe-date')?.value;
  const item_name = document.getElementById('qe-item')?.value.trim();
  const payment = parseInt(document.getElementById('qe-amount')?.value) || 0;
  const category = document.getElementById('qe-category')?.value;
  const note = document.getElementById('qe-note')?.value.trim();
  
  if (!item_name || payment <= 0) {
    showToast('กรุณากรอกรายการและจำนวนเงิน', 'err');
    return;
  }
  
  try {
    const fullNote = category ? `${category}${note ? ' - ' + note : ''}` : note;
    await db.transactions.add({ date, item_name, payment, receipt: 0, room_number: '', note: fullNote, type: 'expense' });
    showToast('✅ เพิ่มรายจ่ายสำเร็จ');
    closeQuickPopup(null, 'quick-expense-popup');
    loadDash();
  } catch (e) {
    console.error('[QuickExpense] Error:', e);
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

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  showToast(next === 'dark' ? '🌙 โหมดมืด' : '☀️ โหมดสว่าง');
}

function checkNetwork() {
  const online = navigator.onLine;
  showToast(online ? '📶 ออนไลน์' : '⚠️ ออฟไลน์');
}

function selPay(el) {
  document.querySelectorAll('#checkin .po').forEach(p => p.classList.remove('checked'));
  el.classList.add('checked');
}

function selQCI(el) {
  document.querySelectorAll('#quick-checkin-popup .po').forEach(p => p.classList.remove('checked'));
  el.classList.add('checked');
}

function openRoomFilter() {
  showToast('ใช้ตัวกรองด้านบนเพื่อกรองห้อง');
}

function useHistory() {
  if (state.historyData) {
    showToast('ใช้ข้อมูลประวัติแล้ว');
    document.getElementById('hist-box')?.classList.remove('show');
  }
}

async function exportData() {
  try {
    const data = await db.export();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resort-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 สำรองข้อมูลสำเร็จ');
  } catch (e) {
    console.error('[Export] Error:', e);
    showToast('เกิดข้อผิดพลาด', 'err');
  }
}

async function importData(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      await db.import(e.target.result);
      showToast('📤 กู้ข้อมูลสำเร็จ');
      goSec('dashboard');
    } catch (err) {
      showToast('❌ ไฟล์ไม่ถูกต้อง', 'err');
    }
  };
  reader.readAsText(file);
}

async function clearAllData() {
  if (!confirm('⚠️ ล้างข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถยกเลิกได้')) return;
  try {
    await db.clear();
    showToast('ล้างข้อมูลแล้ว');
    goSec('dashboard');
  } catch (e) {
    console.error('[Clear] Error:', e);
    showToast('เกิดข้อผิดพลาด', 'err');
  }
}

async function regenRooms() {
  if (!confirm('สร้างห้องใหม่ทั้งหมด? ข้อมูลการจองจะถูกลบ')) return;
  try {
    const a = parseInt(document.getElementById('set-count-a')?.value) || 11;
    const b = parseInt(document.getElementById('set-count-b')?.value) || 11;
    const n = parseInt(document.getElementById('set-count-n')?.value) || 7;

    const rooms = [];
    let id = 1;

    for (let i = 1; i <= a; i++) {
      const floor = i <= 5 ? 1 : 2;
      rooms.push({ id: id++, room_number: `A10${i}`, building: 'A', floor, room_type: i === 3 || i === 8 ? 'Standard Twin' : 'Standard', price_per_night: i === 3 || i === 8 ? 500 : 400, status: 'available' });
    }
    for (let i = 1; i <= b; i++) {
      const floor = i <= 5 ? 1 : 2;
      rooms.push({ id: id++, room_number: `B10${i}`, building: 'B', floor, room_type: i === 3 || i === 8 || i === 11 ? 'Standard Twin' : 'Standard', price_per_night: i === 3 || i === 8 || i === 11 ? 500 : 400, status: 'available' });
    }
    for (let i = 1; i <= n; i++) {
      rooms.push({ id: id++, room_number: `N${i}`, building: 'N', floor: 1, room_type: i === 2 || i === 4 || i === 7 ? 'Standard Twin' : 'Standard', price_per_night: i === 2 || i === 4 || i === 7 ? 600 : 500, status: 'available' });
    }

    await db.rooms.bulkAdd(rooms);
    showToast(`สร้างห้องใหม่ ${rooms.length} ห้อง`);
    loadSettings();
    goSec('dashboard');
  } catch (e) {
    console.error('[Regen] Error:', e);
    showToast('เกิดข้อผิดพลาด', 'err');
  }
}

// =============================================================
// EXPORT TO WINDOW
// =============================================================
window.login = login;
window.logout = logout;
window.goSec = goSec;
window.closeQuickPopup = closeQuickPopup;
window.openQuickCheckin = openQuickCheckin;
window.saveQuickCheckin = saveQuickCheckin;
window.openQuickGuest = openQuickGuest;
window.saveQuickGuest = saveQuickGuest;
window.openQuickIncome = openQuickIncome;
window.saveQuickIncome = saveQuickIncome;
window.openQuickExpense = openQuickExpense;
window.saveQuickExpense = saveQuickExpense;
window.toggleTheme = toggleTheme;
window.checkNetwork = checkNetwork;
window.loadSettings = loadSettings;
window.saveSettings = saveSettings;
window.loadEmployees = loadEmployees;
window.addEmployee = addEmployee;
window.filterRoom = filterRoom;
window.openRoomDetail = openRoomDetail;
window.closeRoomModal = closeRoomModal;
window.searchCust = searchCust;
window.selectCust = selectCust;
window.clearCust = clearCust;
window.addNewCust = addNewCust;
window.updateRoomInfo = updateRoomInfo;
window.calcTotal = calcTotal;
window.doCheckin = doCheckin;
window.loadCusts = loadCusts;
window.showToast = showToast;
window.selPay = selPay;
window.selQCI = selQCI;
window.openRoomFilter = openRoomFilter;
window.useHistory = useHistory;
window.exportData = exportData;
window.importData = importData;
window.clearAllData = clearAllData;
window.regenRooms = regenRooms;

// =============================================================
// INIT
// =============================================================
init();
