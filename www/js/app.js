/**
 * Resort Management System - App Logic (SQLite Version)
 * ทุกฟังก์ชันเป็น async/await รองรับ SQLite จริง
 */

let selectedCustomer = null;
let currentSection = 'dashboard';
let currentRoomFilter = 'all';

// Toast
function showToast(msg, type='success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type==='error' ? ' error' : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// Navigation
function switchSection(id) {
  currentSection = id;
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.section===id));
  document.querySelector('.app-body').scrollTop = 0;
  loadSectionData(id);
}

function loadSectionData(id) {
  switch(id) {
    case 'dashboard': loadDashboard(); break;
    case 'checkin': loadCheckin(); break;
    case 'rooms': loadRooms(); break;
    case 'customers': loadCustomers(); break;
    case 'accounting': loadAccounting(); break;
  }
}

// ============================================================
// DASHBOARD
// ============================================================
async function loadDashboard() {
  const [rooms, activeBookings, settings] = await Promise.all([
    db.rooms.getAll(),
    db.bookings.getActive(),
    db.settings.get()
  ]);
  const today = moment().format('YYYY-MM-DD');
  const [todayBookings, todayTx] = await Promise.all([
    db.bookings.getByDate(today),
    db.transactions.getByDate(today)
  ]);

  document.getElementById('dash-total-rooms').textContent = rooms.length;
  document.getElementById('dash-available').textContent = rooms.filter(r=>r.status==='available').length;
  document.getElementById('dash-occupied').textContent = rooms.filter(r=>r.status==='occupied').length;
  document.getElementById('dash-maintenance').textContent = rooms.filter(r=>r.status==='maintenance').length;

  const income = todayTx.reduce((s,t) => s+(t.receipt||0), 0);
  const expense = todayTx.reduce((s,t) => s+(t.payment||0), 0);
  const opening = settings.openingBalance || 0;
  document.getElementById('dash-income').textContent = `฿${income.toLocaleString()}`;
  document.getElementById('dash-expense').textContent = `฿${expense.toLocaleString()}`;
  document.getElementById('dash-balance').textContent = `฿${(opening+income-expense).toLocaleString()}`;

  document.getElementById('dash-checkins').textContent = todayBookings.filter(b=>b.check_in_date===today).length;
  document.getElementById('dash-checkouts').textContent = todayBookings.filter(b=>b.check_out_date===today).length;
  document.getElementById('dash-active').textContent = activeBookings.length;

  const checkoutToday = activeBookings.filter(b => b.check_out_date===today);
  const list = document.getElementById('checkout-list');
  if (checkoutToday.length > 0) {
    const items = await Promise.all(checkoutToday.map(async c => {
      const customer = await db.customers.getById(c.customer_id);
      const room = await db.rooms.getById(c.room_id);
      return `<div class="checkout-item">
        <div>
          <div class="checkout-name">${customer?.name||c.customer_id}</div>
          <div class="checkout-room">ห้อง ${room?.room_number||c.room_id}</div>
        </div>
        <button class="btn-checkout" onclick="checkout('${c.booking_id}')">เช็คเอาท์</button>
      </div>`;
    }));
    list.innerHTML = items.join('');
  } else {
    list.innerHTML = '<div class="empty">ไม่มีรายการเช็คเอาท์วันนี้</div>';
  }
}

// ============================================================
// CHECK-IN
// ============================================================
async function loadCheckin() {
  const rooms = await db.rooms.getByStatus('available');
  const select = document.getElementById('room-select');
  select.innerHTML = '<option value="">-- เลือกห้องว่าง --</option>' +
    rooms.map(r => `<option value="${r.id}" data-price="${r.price_per_night}" data-number="${r.room_number}" data-type="${r.room_type}" data-building="${r.building}">
      ${r.room_number} (${r.building}) - ${r.room_type} - ฿${r.price_per_night}
    </option>`).join('');
}

function updateRoomInfo() {
  const select = document.getElementById('room-select');
  const opt = select.options[select.selectedIndex];
  const infoBox = document.getElementById('room-info');
  if (!opt.value) { infoBox.style.display='none'; return; }
  infoBox.style.display = 'block';
  infoBox.innerHTML = `🏠 ห้อง ${opt.dataset.number} &nbsp;|&nbsp; ตึก ${opt.dataset.building} &nbsp;|&nbsp; ${opt.dataset.type} &nbsp;|&nbsp; <strong>฿${opt.dataset.price}/คืน</strong>`;
  document.getElementById('room-rate').value = opt.dataset.price;
  calculateTotal();
}

function calculateNightsVal() {
  const ci = document.getElementById('checkin-date').value;
  const co = document.getElementById('checkout-date').value;
  if (!ci||!co) return 1;
  const n = Calculator.calculateNights(ci, co);
  document.getElementById('nights').value = n;
  return n;
}

function calculateTotal() {
  const nights = calculateNightsVal();
  const roomRate = parseFloat(document.getElementById('room-rate').value)||0;
  const electric = parseFloat(document.getElementById('electric-fee').value)||0;
  const water = parseFloat(document.getElementById('water-fee').value)||0;
  const deposit = parseFloat(document.getElementById('deposit').value)||0;
  const discount = parseFloat(document.getElementById('discount').value)||0;

  const b = Calculator.calculateTotal(roomRate, nights, electric, water, deposit, discount);
  document.getElementById('room-total').value = b.roomTotal;
  document.getElementById('grand-total').textContent = `฿${b.grandTotal.toLocaleString()}`;

  let breakdown = `<div class="breakdown-row"><span>ค่าห้อง (${nights} คืน × ฿${roomRate})</span><span>฿${b.roomTotal.toLocaleString()}</span></div>`;
  if (electric>0) breakdown += `<div class="breakdown-row"><span>ค่าไฟ</span><span>฿${electric.toLocaleString()}</span></div>`;
  if (water>0) breakdown += `<div class="breakdown-row"><span>ค่าน้ำ</span><span>฿${water.toLocaleString()}</span></div>`;
  if (discount>0) breakdown += `<div class="breakdown-row"><span>ส่วนลด</span><span>-฿${discount.toLocaleString()}</span></div>`;
  breakdown += `<div class="breakdown-row"><span>มัดจำ</span><span>฿${deposit.toLocaleString()}</span></div>`;
  document.getElementById('total-breakdown').innerHTML = breakdown;
  calculateChange();
}

function calculateChange() {
  const total = parseInt(document.getElementById('grand-total').textContent.replace(/[^0-9]/g,''))||0;
  const paid = parseFloat(document.getElementById('amount-paid').value)||0;
  const el = document.getElementById('change-amount');
  if (!paid) { el.innerHTML=''; return; }
  const change = paid - total;
  if (change >= 0) {
    el.innerHTML = `<div class="change-display change-pos">💰 เงินทอน: ฿${change.toLocaleString()}</div>`;
  } else {
    el.innerHTML = `<div class="change-display change-neg">⚠️ ขาดอีก: ฿${Math.abs(change).toLocaleString()}</div>`;
  }
}

async function searchCustomer(query) {
  const results = document.getElementById('customer-results');
  if (query.length < 2) { results.innerHTML=''; return; }
  const customers = await db.customers.search(query);
  if (!customers.length) {
    results.innerHTML = '<div class="search-item"><div class="search-item-name" style="color:var(--text-muted)">ไม่พบลูกค้า — กด "+ ใหม่"</div></div>';
    return;
  }
  results.innerHTML = customers.map(c => `
    <div class="search-item" onclick="selectCustomer('${c.customer_id}','${c.name}','${c.phone||''}')">
      <div class="search-item-name">${c.name}</div>
      <div class="search-item-sub">${c.customer_id} | ${c.phone||'-'}</div>
    </div>
  `).join('');
}

function selectCustomer(id, name, phone) {
  selectedCustomer = { id, name, phone };
  document.getElementById('selected-customer').classList.remove('hidden');
  document.getElementById('cust-name').textContent = name;
  document.getElementById('cust-phone').textContent = phone||'-';
  document.getElementById('cust-id').textContent = id;
  document.getElementById('customer-search').value = '';
  document.getElementById('customer-results').innerHTML = '';
}

function clearCustomer() {
  selectedCustomer = null;
  document.getElementById('selected-customer').classList.add('hidden');
}

async function openCustomerModal() {
  const name = prompt('ชื่อลูกค้า:');
  if (!name) return;
  const phone = prompt('เบอร์โทร:');
  const id = await db.customers.generateId();
  await db.customers.add({ customer_id:id, name, phone:phone||'', address:'' });
  selectCustomer(id, name, phone||'');
  showToast('เพิ่มลูกค้าสำเร็จ');
}

function selectPay(el, val) {
  document.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('checked'));
  el.classList.add('checked');
  el.querySelector('input').checked = true;
}

async function submitCheckin() {
  if (!selectedCustomer) { showToast('กรุณาเลือกลูกค้า','error'); return; }
  const roomId = parseInt(document.getElementById('room-select').value);
  if (!roomId) { showToast('กรุณาเลือกห้อง','error'); return; }
  const checkInDate = document.getElementById('checkin-date').value;
  const checkOutDate = document.getElementById('checkout-date').value;
  if (!checkInDate||!checkOutDate) { showToast('กรุณาระบุวันที่','error'); return; }

  const grandTotal = parseInt(document.getElementById('grand-total').textContent.replace(/[^0-9]/g,''))||0;
  const amountPaid = parseFloat(document.getElementById('amount-paid').value)||0;
  if (amountPaid < grandTotal) { showToast('จำนวนเงินไม่พอ','error'); return; }

  const room = await db.rooms.getById(roomId);
  const booking = {
    booking_id: Calculator.generateBookingId(),
    customer_id: selectedCustomer.id,
    room_id: roomId,
    check_in_date: checkInDate,
    check_out_date: checkOutDate,
    nights: parseInt(document.getElementById('nights').value),
    room_rate: parseFloat(document.getElementById('room-rate').value)||0,
    room_total: parseFloat(document.getElementById('room-total').value)||0,
    electric_fee: parseFloat(document.getElementById('electric-fee').value)||0,
    water_fee: parseFloat(document.getElementById('water-fee').value)||0,
    discount: parseFloat(document.getElementById('discount').value)||0,
    deposit: parseFloat(document.getElementById('deposit').value)||0,
    total_amount: grandTotal,
    amount_paid: amountPaid,
    change_amount: amountPaid - grandTotal,
    payment_method: document.querySelector('input[name="payment-method"]:checked')?.value||'cash',
    status: 'checked_in',
    notes: document.getElementById('notes').value,
    created_at: new Date().toISOString()
  };

  await db.rooms.update(roomId, { status: 'occupied' });
  await db.bookings.add(booking);
  await db.transactions.add({
    date: checkInDate,
    item_name: `ค่าห้องพัก - ${booking.booking_id}`,
    category: 'income',
    room_number: room?.room_number||'',
    receipt: grandTotal - booking.deposit,
    deposit_cash: booking.deposit,
    notes: booking.notes
  });
  await db.customers.updateStats(selectedCustomer.id, 1, grandTotal, checkInDate);

  showToast('✅ เช็คอินสำเร็จ!');
  clearCheckinForm();
  loadDashboard();
}

function clearCheckinForm() {
  selectedCustomer = null;
  document.getElementById('customer-search').value = '';
  document.getElementById('selected-customer').classList.add('hidden');
  document.getElementById('room-select').value = '';
  document.getElementById('room-info').style.display = 'none';
  document.getElementById('electric-fee').value = 0;
  document.getElementById('water-fee').value = 0;
  document.getElementById('deposit').value = 200;
  document.getElementById('discount').value = 0;
  document.getElementById('amount-paid').value = '';
  document.getElementById('notes').value = '';
  document.getElementById('grand-total').textContent = '฿0';
  document.getElementById('total-breakdown').innerHTML = '';
  document.getElementById('change-amount').innerHTML = '';
  const today = moment().format('YYYY-MM-DD');
  document.getElementById('checkin-date').value = today;
  document.getElementById('checkout-date').value = moment().add(1,'day').format('YYYY-MM-DD');
  document.getElementById('nights').value = 1;
}

// ============================================================
// ROOMS
// ============================================================
async function loadRooms() {
  let rooms = await db.rooms.getAll();
  if (currentRoomFilter !== 'all') rooms = rooms.filter(r => r.building===currentRoomFilter);
  const statusMap = { available:'ว่าง', occupied:'มีผู้พัก', maintenance:'ซ่อมบำรุง', cleaning:'ทำความสะอาด' };
  document.getElementById('rooms-grid').innerHTML = rooms.map(r => `
    <div class="room-card ${r.status}" onclick="toggleRoomStatus(${r.id})">
      <div class="room-num">${r.room_number}</div>
      <div class="room-type">${r.room_type}</div>
      <div class="room-price">฿${r.price_per_night}/คืน</div>
      <span class="room-badge">${statusMap[r.status]||r.status}</span>
    </div>
  `).join('');
}

function filterRooms(building) {
  currentRoomFilter = building;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.filter===building));
  loadRooms();
}

async function toggleRoomStatus(roomId) {
  const room = await db.rooms.getById(roomId);
  if (!room) return;
  const statuses = ['available','occupied','maintenance','cleaning'];
  const next = statuses[(statuses.indexOf(room.status)+1) % statuses.length];
  await db.rooms.update(roomId, { status: next });
  loadRooms();
  showToast(`ห้อง ${room.room_number} → ${next}`);
}

// ============================================================
// CUSTOMERS
// ============================================================
async function loadCustomers() {
  const customers = await db.customers.getAll();
  const list = document.getElementById('customer-list');
  if (!customers.length) { list.innerHTML='<div class="empty">ไม่มีข้อมูลลูกค้า</div>'; return; }
  list.innerHTML = customers.map(c => `
    <div class="customer-card">
      <div>
        <div class="cust-name">${c.name}</div>
        <div class="cust-meta">${c.customer_id} | ${c.phone||'-'}</div>
      </div>
      <div class="cust-badge">
        <div class="cust-stays">${c.total_stays||0}</div>
        <div class="cust-stays-label">ครั้ง</div>
      </div>
    </div>
  `).join('');
}

async function searchCustomerList() {
  const query = document.getElementById('customer-list-search').value;
  const customers = query ? await db.customers.search(query) : await db.customers.getAll();
  const list = document.getElementById('customer-list');
  if (!customers.length) { list.innerHTML='<div class="empty">ไม่พบลูกค้า</div>'; return; }
  list.innerHTML = customers.map(c => `
    <div class="customer-card">
      <div>
        <div class="cust-name">${c.name}</div>
        <div class="cust-meta">${c.customer_id} | ${c.phone||'-'}</div>
      </div>
      <div class="cust-badge">
        <div class="cust-stays">${c.total_stays||0}</div>
        <div class="cust-stays-label">ครั้ง</div>
      </div>
    </div>
  `).join('');
}

// ============================================================
// ACCOUNTING
// ============================================================
async function loadAccounting() {
  const date = document.getElementById('accounting-date').value;
  const [transactions, settings] = await Promise.all([
    db.transactions.getByDate(date),
    db.settings.get()
  ]);
  const income = transactions.reduce((s,t) => s+(t.receipt||0), 0);
  const expense = transactions.reduce((s,t) => s+(t.payment||0), 0);
  const opening = settings.openingBalance || 0;

  document.getElementById('acc-opening').textContent = `฿${opening.toLocaleString()}`;
  document.getElementById('acc-income').textContent = `฿${income.toLocaleString()}`;
  document.getElementById('acc-expense').textContent = `฿${expense.toLocaleString()}`;
  document.getElementById('acc-balance').textContent = `฿${(opening+income-expense).toLocaleString()}`;

  const list = document.getElementById('transaction-list');
  if (!transactions.length) { list.innerHTML='<div class="empty">ไม่มีรายการ</div>'; return; }
  let balance = opening;
  list.innerHTML = transactions.map(t => {
    balance += (t.receipt||0) - (t.payment||0);
    return `<div class="tx-item">
      <div>
        <div class="tx-name">${t.item_name}</div>
        <div class="tx-meta">${t.room_number||'-'} ${t.notes?'· '+t.notes:''}</div>
      </div>
      <div style="text-align:right;">
        ${t.receipt>0?`<div class="tx-amount-pos">+฿${t.receipt.toLocaleString()}</div>`:''}
        ${t.payment>0?`<div class="tx-amount-neg">-฿${t.payment.toLocaleString()}</div>`:''}
        <div class="tx-balance">คงเหลือ ฿${balance.toLocaleString()}</div>
      </div>
    </div>`;
  }).join('');
}

async function openTransactionModal() {
  const item = prompt('ชื่อรายการ:');
  if (!item) return;
  const isIncome = confirm('เป็นรายรับ? (Cancel = รายจ่าย)');
  const amount = parseFloat(prompt('จำนวนเงิน:'))||0;
  await db.transactions.add({
    date: document.getElementById('accounting-date').value,
    item_name: item,
    category: isIncome ? 'income' : 'expense',
    receipt: isIncome ? amount : 0,
    payment: isIncome ? 0 : amount,
    notes: ''
  });
  showToast('บันทึกรายการสำเร็จ');
  loadAccounting();
}

async function exportAccounting() {
  const date = document.getElementById('accounting-date').value;
  const [transactions, settings] = await Promise.all([db.transactions.getByDate(date), db.settings.get()]);
  let csv = 'วันที่,รายการ,ห้อง,จ่าย,รับ,คงเหลือ,หมายเหตุ\n';
  let balance = settings.openingBalance||0;
  transactions.forEach(t => {
    balance += (t.receipt||0) - (t.payment||0);
    csv += `${t.date},${t.item_name},${t.room_number||'-'},${t.payment||'-'},${t.receipt||'-'},${balance},${t.notes||'-'}\n`;
  });
  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `accounting-${date}.csv`;
  link.click();
}

// ============================================================
// CHECKOUT
// ============================================================
async function checkout(bookingId) {
  if (!confirm('ยืนยันการเช็คเอาท์?')) return;
  const lateFee = parseFloat(prompt('ค่าปรับเช็คเอาท์สาย (ถ้ามี):', '0'))||0;
  const damageFee = parseFloat(prompt('ค่าปรับทรัพย์สิน (ถ้ามี):', '0'))||0;

  const bookings = await db.bookings.getAll();
  const booking = bookings.find(b => b.booking_id===bookingId);
  if (!booking) { showToast('ไม่พบการจอง','error'); return; }

  await db.bookings.update(bookingId, { status: 'checked_out' });
  await db.rooms.update(booking.room_id, { status: 'available' });

  const today = moment().format('YYYY-MM-DD');
  if (lateFee>0) await db.transactions.add({ date:today, item_name:`ค่าปรับเช็คเอาท์สาย - ${bookingId}`, category:'income', receipt:lateFee, notes:'' });
  if (damageFee>0) await db.transactions.add({ date:today, item_name:`ค่าปรับทรัพย์สิน - ${bookingId}`, category:'income', receipt:damageFee, notes:'' });

  showToast('✅ เช็คเอาท์สำเร็จ');
  loadDashboard();
}

// ============================================================
// REPORTS
// ============================================================
async function generateMonthlyReport() {
  const year = document.getElementById('report-year').value;
  const month = document.getElementById('report-month').value;
  const startDate = `${year}-${month}-01`;
  const endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');

  const [allTx, allBk] = await Promise.all([
    db.transactions.getByDateRange(startDate, endDate),
    db.bookings.getByDateRange(startDate, endDate)
  ]);

  const income = allTx.reduce((s,t) => s+(t.receipt||0), 0);
  const expense = allTx.reduce((s,t) => s+(t.payment||0), 0);
  const roomRev = allBk.reduce((s,b) => s+(b.total_amount||0), 0);

  document.getElementById('report-result').style.display = 'block';
  document.getElementById('report-content').innerHTML = `
    <div class="result-grid">
      <div class="result-box green"><div class="result-label">รายรับรวม</div><div class="result-amount">฿${income.toLocaleString()}</div></div>
      <div class="result-box red"><div class="result-label">รายจ่ายรวม</div><div class="result-amount">฿${expense.toLocaleString()}</div></div>
      <div class="result-box blue"><div class="result-label">กำไรสุทธิ</div><div class="result-amount">฿${(income-expense).toLocaleString()}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
      <div class="acc-box"><div class="acc-label">จำนวนการจอง</div><div class="acc-amount" style="color:var(--text)">${allBk.length} ราย</div></div>
      <div class="acc-box green"><div class="acc-label">รายได้ห้องพัก</div><div class="acc-amount">฿${roomRev.toLocaleString()}</div></div>
    </div>`;
}

function generateReport(type) {
  if (type==='daily') switchSection('accounting');
}

async function exportData(type) {
  let data, filename, csv;
  if (type==='transactions') {
    data = await db.transactions.getAll();
    filename = 'transactions.csv';
    csv = 'วันที่,รายการ,ห้อง,จ่าย,รับ,หมายเหตุ\n';
    data.forEach(t => { csv += `${t.date},${t.item_name},${t.room_number||'-'},${t.payment||'-'},${t.receipt||'-'},${t.notes||'-'}\n`; });
  } else if (type==='customers') {
    data = await db.customers.getAll();
    filename = 'customers.csv';
    csv = 'รหัส,ชื่อ,เบอร์,ที่อยู่,จำนวนครั้ง,ยอดรวม\n';
    data.forEach(c => { csv += `${c.customer_id},${c.name},${c.phone||'-'},${c.address||'-'},${c.total_stays||0},${c.total_spent||0}\n`; });
  } else if (type==='rooms') {
    data = await db.rooms.getAll();
    filename = 'rooms.csv';
    csv = 'ห้อง,ตึก,ชั้น,ประเภท,ราคา,สถานะ\n';
    data.forEach(r => { csv += `${r.room_number},${r.building},${r.floor},${r.room_type},${r.price_per_night},${r.status}\n`; });
  }
  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  showToast(`Export สำเร็จ`);
}

// ============================================================
// APP INIT
// ============================================================
async function appInit() {
  const today = moment().format('YYYY-MM-DD');
  document.getElementById('checkin-date').value = today;
  document.getElementById('checkout-date').value = moment().add(1,'day').format('YYYY-MM-DD');
  document.getElementById('accounting-date').value = today;
  await loadDashboard();
}
