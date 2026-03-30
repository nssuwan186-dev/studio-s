/**
 * VIPAT Hotel Manager v4.1
 * รวม: SQLite + OCR + Auto-complete + 51 ห้อง + Import CSV + รูปใบเสร็จ + Settings
 */

let selCust = null;
let curSec = 'dashboard';
let curFilter = 'all';
let curRoomId = null;
let histData = null;
let appSettings = null;

// =============================================================
// NAVIGATION
// =============================================================
function goSec(id) {
  curSec = id;
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nb').forEach(b => b.classList.toggle('active', b.dataset.s === id));
  document.querySelector('.body').scrollTop = 0;
  if (id === 'dashboard') loadDash();
  else if (id === 'checkin') loadCIRooms();
  else if (id === 'rooms') loadRooms();
  else if (id === 'customers') loadCusts();
  else if (id === 'accounting') loadAcc();
  else if (id === 'settings') loadSettings();
}

// =============================================================
// SETTINGS
// =============================================================
async function loadSettings() {
  appSettings = await db.settings.get();
  document.getElementById('set-open').value = appSettings.openingBalance || 0;
  document.getElementById('set-dep').value = appSettings.depositAmount || 200;
  document.getElementById('set-elec').value = appSettings.electricRate || 8;
  document.getElementById('set-water').value = appSettings.waterRate || 25;
  const rooms = await db.rooms.getAll();
  const aCount = rooms.filter(r => r.building === 'A').length;
  const bCount = rooms.filter(r => r.building === 'B').length;
  const nCount = rooms.filter(r => r.building === 'N').length;
  document.getElementById('set-count-a').value = aCount;
  document.getElementById('set-count-b').value = bCount;
  document.getElementById('set-count-n').value = nCount;
}

async function saveSettings() {
  const settings = {
    openingBalance: parseInt(document.getElementById('set-open').value) || 0,
    depositAmount: parseInt(document.getElementById('set-dep').value) || 200,
    electricRate: parseInt(document.getElementById('set-elec').value) || 8,
    waterRate: parseInt(document.getElementById('set-water').value) || 25
  };
  await db.settings.update(settings);
  appSettings = settings;
  showToast('บันทึกการตั้งค่าแล้ว');
  loadDash();
}

async function regenRooms() {
  if (!confirm('สร้างห้องใหม่ทั้งหมด? ข้อมูลการจองจะถูกลบ')) return;
  const a = parseInt(document.getElementById('set-count-a').value) || 11;
  const b = parseInt(document.getElementById('set-count-b').value) || 11;
  const n = parseInt(document.getElementById('set-count-n').value) || 7;
  const rooms = [];
  let id = 1;
  for (let i = 1; i <= a; i++) {
    const floor = i <= 5 ? 1 : 2;
    rooms.push({ id: id++, room_number: `A10${i}`, building: 'A', floor, room_type: i === 3 || i === 8 ? 'Standard Twin' : 'Standard', price_per_night: i === 3 || i === 8 ? 500 : 400, status: 'available' });
  }
  for (let i = 1; i <= b; i++) {
    const floor = i <= 5 ? 1 : 2;
    rooms.push({ id: id++, room_number: `B10${i}`, building: 'B', floor, room_type: i === 3 || i === 8 || i === 19 ? 'Standard Twin' : 'Standard', price_per_night: i === 3 || i === 8 || i === 19 ? 500 : 400, status: 'available' });
  }
  for (let i = 1; i <= n; i++) {
    rooms.push({ id: id++, room_number: `N${i}`, building: 'N', floor: 1, room_type: i === 2 || i === 4 || i === 7 ? 'Standard Twin' : 'Standard', price_per_night: i === 2 || i === 4 || i === 7 ? 600 : 500, status: 'available' });
  }
  localStorage.setItem('resort_rooms', JSON.stringify(rooms));
  localStorage.setItem('resort_bookings', JSON.stringify([]));
  localStorage.setItem('resort_transactions', JSON.stringify([]));
  showToast(`สร้างห้องใหม่ ${rooms.length} ห้อง`);
  loadSettings();
  loadDash();
}

async function clearAllData() {
  if (!confirm('⚠️ ล้างข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถยกเลิกได้')) return;
  localStorage.clear();
  seedDefaultData();
  location.reload();
}

function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type === 'err' ? ' err' : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// =============================================================
// DASHBOARD
// =============================================================
async function loadDash() {
  appSettings = await db.settings.get();
  const [rooms, active] = await Promise.all([db.rooms.getAll(), db.bookings.getActive()]);
  const today = moment().format('YYYY-MM-DD');
  const [todayBk, todayTx] = await Promise.all([db.bookings.getByDate(today), db.transactions.getByDate(today)]);

  document.getElementById('dash-total').textContent = rooms.length;
  document.getElementById('dash-avail').textContent = rooms.filter(r => r.status === 'available').length;
  document.getElementById('dash-occ').textContent = rooms.filter(r => r.status === 'occupied').length;
  document.getElementById('dash-maint').textContent = rooms.filter(r => r.status === 'maintenance').length;

  const inc = todayTx.reduce((s, t) => s + (t.receipt || 0), 0);
  const exp = todayTx.reduce((s, t) => s + (t.payment || 0), 0);
  const op = appSettings?.openingBalance || 0;
  document.getElementById('dash-income').textContent = `฿${inc.toLocaleString()}`;
  document.getElementById('dash-expense').textContent = `฿${exp.toLocaleString()}`;
  document.getElementById('dash-balance').textContent = `฿${(op + inc - exp).toLocaleString()}`;
  document.getElementById('dash-ci').textContent = todayBk.filter(b => b.check_in_date === today).length;
  document.getElementById('dash-co').textContent = todayBk.filter(b => b.check_out_date === today).length;
  document.getElementById('dash-act').textContent = active.length;

  const coToday = active.filter(b => b.check_out_date === today);
  const list = document.getElementById('dash-colist');
  if (coToday.length) {
    const items = await Promise.all(coToday.map(async b => {
      const [c, r] = await Promise.all([db.customers.getById(b.customer_id), db.rooms.getById(b.room_id)]);
      return `<div class="coi"><div><div class="con">${c?.name || b.customer_id}</div><div class="cor">ห้อง ${r?.room_number || b.room_id}</div></div><button class="cobtn" onclick="doCheckout('${b.booking_id}')">เช็คเอาท์</button></div>`;
    }));
    list.innerHTML = items.join('');
  } else list.innerHTML = '<div class="empty">ไม่มีรายการเช็คเอาท์วันนี้</div>';
}

// =============================================================
// OCR - สแกนบัตรประชาชน
// =============================================================
let currentOCRImage = null;

async function handleOCR(input) {
  const file = input.files[0];
  if (!file) return;
  const box = document.getElementById('ocr-box');
  const status = document.getElementById('ocr-status');
  box.classList.add('scanning');
  status.style.display = 'block';
  status.className = 'ocr-status wait';
  
  const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  
  if (isPDF) {
    status.textContent = '⏳ กำลังอ่าน PDF...';
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        status.textContent = `⏳ กำลังอ่านหน้า ${i}/${pdf.numPages}...`;
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      status.textContent = '⏳ กำลังดึงข้อมูลจาก PDF...';
      parseIDCard(fullText);
      status.className = 'ocr-status ok';
      status.innerHTML = `✅ อ่าน PDF สำเร็จ!<br><small>${pdf.numPages} หน้า</small><br><small>ตรวจสอบข้อมูลด้านล่าง</small>`;
    } catch (err) {
      status.className = 'ocr-status err';
      status.innerHTML = `❌ อ่าน PDF ไม่สำเร็จ<br><small>${err.message}</small>`;
    }
    box.classList.remove('scanning');
    return;
  }
  
  status.textContent = '⏳ กำลังสแกนบัตร... รอสักครู่';

  const reader = new FileReader();
  reader.onload = async e => {
    currentOCRImage = e.target.result;
    try {
      if (typeof Tesseract !== 'undefined') {
        status.textContent = '⏳ กำลังประมวลผล OCR...';
        const result = await Tesseract.recognize(file, 'tha+eng', { logger: m => console.log(m) });
        const text = result.data.text;
        parseIDCard(text);
        status.className = 'ocr-status ok';
        status.innerHTML = `✅ สแกนสำเร็จ!<br><small>ตรวจสอบข้อมูลด้านล่าง</small><br><img src="${e.target.result}" style="max-width:120px;border-radius:6px;margin-top:6px;border:2px solid var(--accent)">`;
      } else {
        status.className = 'ocr-status wait';
        status.innerHTML = `⚠️ OCR ไม่พร้อมใช้งาน<br>กรุณากรอกข้อมูลด้วยตนเอง<br><img src="${e.target.result}" style="max-width:100%;border-radius:8px;margin-top:6px">`;
      }
    } catch (err) {
      status.className = 'ocr-status err';
      status.innerHTML = `❌ สแกนไม่สำเร็จ<br><img src="${e.target.result}" style="max-width:100%;border-radius:8px;margin-top:6px">`;
    }
    box.classList.remove('scanning');
  };
  reader.readAsDataURL(file);
}

function parseIDCard(text) {
  const cleanText = text.replace(/\n/g, ' ').trim();
  
  const idMatch = cleanText.match(/(\d[\d\s-]{12,17}\d)/);
  if (idMatch) {
    const idNum = idMatch[0].replace(/[\s-]/g, '');
    if (idNum.length >= 13) {
      findCustByIdCard(idNum);
    }
  }
  
  const namePatterns = [
    /(?:นาย|นาง|นางสาว|Mr\.|Mrs\.|Miss\.?|Ms\.?)\s+([ก-๏\s]+)/i,
    /ชื่อ\s*[:\-]?\s*([ก-๏\s]+)/i,
    /Name\s*[:\-]?\s*([ก-๏\s]+)/i
  ];
  
  for (const pattern of namePatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim().split(' ').slice(0, 3).join(' ');
      if (name.length > 2) {
        document.getElementById('csearch').value = name;
        searchCust(name);
        break;
      }
    }
  }
  
  const addrMatch = cleanText.match(/(?:ที่อยู่|Address)[:\-]?\s*([ก-๏\d\s\/\-]+)/i);
  if (addrMatch) {
    console.log('Address found:', addrMatch[1]);
  }
}

async function findCustByIdCard(idCard) {
  const customers = await db.customers.search(idCard);
  if (customers.length > 0) {
    const c = customers[0];
    selectCust(c.customer_id, c.name, c.phone || '');
    showToast(`✅ พบลูกค้า: ${c.name}`);
  } else {
    const name = document.getElementById('csearch').value;
    if (confirm(`ไม่พบลูกค้าเลขบัตร ${idCard}\nต้องการสร้างลูกค้าใหม่หรือไม่?`)) {
      const newName = prompt('ชื่อลูกค้า:', name || '');
      if (newName) {
        const phone = prompt('เบอร์โทร:', '') || '';
        const id = await db.customers.generateId();
        await db.customers.add({ customer_id: id, name: newName, phone, address: '', id_card: idCard });
        selectCust(id, newName, phone);
        showToast('เพิ่มลูกค้าใหม่สำเร็จ');
      }
    }
  }
}

// =============================================================
// CHECK-IN
// =============================================================
async function loadCIRooms() {
  const rooms = await db.rooms.getByStatus('available');
  const sel = document.getElementById('rsel');
  sel.innerHTML = '<option value="">-- เลือกห้องว่าง --</option>' +
    rooms.map(r => `<option value="${r.id}" data-p="${r.price_per_night}" data-n="${r.room_number}" data-t="${r.room_type}" data-b="${r.building}">${r.room_number} (${r.building}) - ${r.room_type} - ฿${r.price_per_night}</option>`).join('');
}

function updateRoomInfo() {
  const sel = document.getElementById('rsel');
  const opt = sel.options[sel.selectedIndex];
  const box = document.getElementById('rinfo');
  if (!opt.value) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = `🏠 ${opt.dataset.n} | ตึก ${opt.dataset.b} | ${opt.dataset.t} | <strong>฿${opt.dataset.p}/คืน</strong>`;
  document.getElementById('rrate').value = opt.dataset.p;
  calcTotal();
}

function calcNights() {
  const ci = document.getElementById('ci-date').value;
  const co = document.getElementById('co-date').value;
  if (!ci || !co) return 1;
  const n = Calculator.calculateNights(ci, co);
  document.getElementById('nights').value = n;
  return n;
}

function calcTotal() {
  const nights = calcNights();
  const rate = parseFloat(document.getElementById('rrate').value) || 0;
  const ef = parseFloat(document.getElementById('efee').value) || 0;
  const wf = parseFloat(document.getElementById('wfee').value) || 0;
  const dep = parseFloat(document.getElementById('dep').value) || 0;
  const dis = parseFloat(document.getElementById('disc').value) || 0;
  const b = Calculator.calculateTotal(rate, nights, ef, wf, dep, dis);
  document.getElementById('rtotal').value = b.roomTotal;
  document.getElementById('gtotal').textContent = `฿${b.grandTotal.toLocaleString()}`;
  let bd = `<div class="bdr"><span>ห้อง (${nights}คืน×฿${rate})</span><span>฿${b.roomTotal.toLocaleString()}</span></div>`;
  if (ef > 0) bd += `<div class="bdr"><span>ค่าไฟ</span><span>฿${ef.toLocaleString()}</span></div>`;
  if (wf > 0) bd += `<div class="bdr"><span>ค่าน้ำ</span><span>฿${wf.toLocaleString()}</span></div>`;
  if (dis > 0) bd += `<div class="bdr"><span>ส่วนลด</span><span>-฿${dis.toLocaleString()}</span></div>`;
  bd += `<div class="bdr"><span>มัดจำ</span><span>฿${dep.toLocaleString()}</span></div>`;
  document.getElementById('tbd').innerHTML = bd;
  calcChange();
}

function calcChange() {
  const total = parseInt(document.getElementById('gtotal').textContent.replace(/[^0-9]/g, '')) || 0;
  const paid = parseFloat(document.getElementById('paid').value) || 0;
  const el = document.getElementById('chg-disp');
  if (!paid) { el.innerHTML = ''; return; }
  const change = paid - total;
  el.innerHTML = change >= 0
    ? `<div class="chg chg-p">💰 เงินทอน: ฿${change.toLocaleString()}</div>`
    : `<div class="chg chg-n">⚠️ ขาดอีก: ฿${Math.abs(change).toLocaleString()}</div>`;
}

async function searchCust(q) {
  const res = document.getElementById('csearch-res');
  if (q.length < 2) { res.innerHTML = ''; return; }
  const custs = await db.customers.search(q);
  if (!custs.length) {
    res.innerHTML = '<div class="sri"><div class="srn" style="color:var(--muted)">ไม่พบ — กด "+ ใหม่"</div></div>';
    return;
  }
  res.innerHTML = custs.map(c => `
    <div class="sri" onclick="selectCust('${c.customer_id}','${c.name.replace(/'/g,"\\'")}','${c.phone||''}')">
      <div class="srn">${c.name}</div>
      <div class="srs">${c.customer_id} | ${c.phone || '-'} ${c.id_card ? '| บัตร:'+c.id_card : ''}</div>
    </div>`).join('');
}

async function selectCust(id, name, phone) {
  selCust = { id, name, phone };
  document.getElementById('csel-box').classList.remove('hidden');
  document.getElementById('csel-name').textContent = name;
  document.getElementById('csel-phone').textContent = phone || '-';
  document.getElementById('csel-id').textContent = id;
  document.getElementById('csearch').value = '';
  document.getElementById('csearch-res').innerHTML = '';
  // โหลดประวัติ
  await loadCustHistory(id);
}

async function loadCustHistory(custId) {
  const bookings = await db.bookings.getAll();
  const prev = bookings.filter(b => b.customer_id === custId && b.status === 'checked_out');
  const histBox = document.getElementById('hist-box');
  const histContent = document.getElementById('hist-content');
  if (prev.length > 0) {
    const last = prev[prev.length - 1];
    const room = await db.rooms.getById(last.room_id);
    histData = last;
    histContent.innerHTML = `
      <div class="hist-row">📅 เข้าพักล่าสุด: ${last.check_in_date}</div>
      <div class="hist-row">🏠 ห้องที่พัก: ${room?.room_number || last.room_id}</div>
      <div class="hist-row">💰 ยอดชำระ: ฿${(last.total_amount || 0).toLocaleString()}</div>
      <div class="hist-row">💳 วิธีชำระ: ${last.payment_method || 'cash'}</div>
    `;
    histBox.classList.add('show');
  } else {
    histBox.classList.remove('show');
    histData = null;
  }
}

function useHistory() {
  if (!histData) return;
  document.getElementById('dep').value = histData.deposit || 200;
  const rm = document.getElementById('rsel');
  if (histData.payment_method === 'transfer') document.getElementById('pay-transfer').click();
  else if (histData.payment_method === 'qrcode') document.getElementById('pay-qr').click();
  showToast('ใช้ข้อมูลเดิมแล้ว');
}

function clearCust() {
  selCust = null;
  document.getElementById('csel-box').classList.add('hidden');
  document.getElementById('hist-box').classList.remove('show');
  histData = null;
}

async function addNewCust() {
  const name = prompt('ชื่อลูกค้า:');
  if (!name) return;
  const phone = prompt('เบอร์โทร:') || '';
  const idCard = prompt('เลขบัตรประชาชน (ถ้ามี):') || '';
  const id = await db.customers.generateId();
  await db.customers.add({ customer_id: id, name, phone, address: '', id_card: idCard });
  selectCust(id, name, phone);
  showToast('เพิ่มลูกค้าสำเร็จ');
}

function selPay(el) {
  document.querySelectorAll('.po').forEach(o => o.classList.remove('checked'));
  el.classList.add('checked');
  el.querySelector('input').checked = true;
}

async function submitCI() {
  if (!selCust) { showToast('กรุณาเลือกลูกค้า', 'err'); return; }
  const roomId = parseInt(document.getElementById('rsel').value);
  if (!roomId) { showToast('กรุณาเลือกห้อง', 'err'); return; }
  const ci = document.getElementById('ci-date').value;
  const co = document.getElementById('co-date').value;
  if (!ci || !co) { showToast('กรุณาระบุวันที่', 'err'); return; }
  const total = parseInt(document.getElementById('gtotal').textContent.replace(/[^0-9]/g, '')) || 0;
  const paid = parseFloat(document.getElementById('paid').value) || 0;
  if (paid < total) { showToast('จำนวนเงินไม่พอ', 'err'); return; }
  const room = await db.rooms.getById(roomId);
  const paymentMethod = document.querySelector('input[name="pm"]:checked')?.value || 'cash';
  const bk = {
    booking_id: Calculator.generateBookingId(),
    customer_id: selCust.id,
    customer_name: selCust.name,
    room_id: roomId,
    room_number: room?.room_number || '',
    building: room?.building || '',
    check_in_date: ci, check_out_date: co,
    nights: parseInt(document.getElementById('nights').value),
    room_rate: parseFloat(document.getElementById('rrate').value) || 0,
    room_total: parseFloat(document.getElementById('rtotal').value) || 0,
    electric_fee: parseFloat(document.getElementById('efee').value) || 0,
    water_fee: parseFloat(document.getElementById('wfee').value) || 0,
    discount: parseFloat(document.getElementById('disc').value) || 0,
    deposit: parseFloat(document.getElementById('dep').value) || 0,
    total_amount: total, amount_paid: paid, change_amount: paid - total,
    payment_method: paymentMethod,
    status: 'checked_in', notes: document.getElementById('notes').value,
    created_at: new Date().toISOString()
  };
  await db.rooms.update(roomId, { status: 'occupied' });
  await db.bookings.add(bk);
  await db.transactions.add({
    date: ci,
    booking_id: bk.booking_id,
    item_name: `ค่าห้องพัก - ${room?.room_number || ''}`,
    category: 'income',
    room_number: room?.room_number || '',
    room_id: roomId,
    customer_id: selCust.id,
    customer_name: selCust.name,
    receipt: total - bk.deposit,
    deposit_cash: bk.deposit,
    payment_method: paymentMethod,
    notes: bk.notes
  });
  await db.customers.updateStats(selCust.id, 1, total, ci);
  showToast('✅ เช็คอินสำเร็จ!');
  clearForm();
  loadDash();
}

function clearForm() {
  selCust = null; histData = null;
  document.getElementById('csearch').value = '';
  document.getElementById('csel-box').classList.add('hidden');
  document.getElementById('hist-box').classList.remove('show');
  document.getElementById('csearch-res').innerHTML = '';
  document.getElementById('rsel').value = '';
  document.getElementById('rinfo').style.display = 'none';
  document.getElementById('efee').value = 0;
  document.getElementById('wfee').value = 0;
  document.getElementById('dep').value = appSettings?.depositAmount || 200;
  document.getElementById('disc').value = 0;
  document.getElementById('paid').value = '';
  document.getElementById('notes').value = '';
  document.getElementById('gtotal').textContent = '฿0';
  document.getElementById('tbd').innerHTML = '';
  document.getElementById('chg-disp').innerHTML = '';
  document.getElementById('ocr-status').style.display = 'none';
  document.getElementById('ocr-status').innerHTML = '';
  document.getElementById('ocr-input').value = '';
  currentOCRImage = null;
  const today = moment().format('YYYY-MM-DD');
  document.getElementById('ci-date').value = today;
  document.getElementById('co-date').value = moment().add(1, 'day').format('YYYY-MM-DD');
  document.getElementById('nights').value = 1;
  document.querySelectorAll('.po').forEach(o => o.classList.remove('checked'));
  document.getElementById('pay-cash').classList.add('checked');
}

// =============================================================
// ROOMS - 51 ห้อง (A101-A211, B101-B211, N1-N7)
// =============================================================
async function loadRooms() {
  let rooms = await db.rooms.getAll();
  const statusMap = { available: 'ว่าง', occupied: 'มีผู้พัก', maintenance: 'ซ่อม', cleaning: 'ทำความสะอาด' };
  let html = '';

  if (curFilter === 'all') {
    // แสดงแยกตึก
    const buildings = ['A', 'B', 'N'];
    for (const b of buildings) {
      const bRooms = rooms.filter(r => r.building === b);
      if (!bRooms.length) continue;
      html += `<div class="rg-name">🏢 ตึก ${b}</div><div class="rg">`;
      html += bRooms.map(r => roomCard(r, statusMap)).join('');
      html += '</div>';
    }
  } else if (['A','B','N'].includes(curFilter)) {
    const filtered = rooms.filter(r => r.building === curFilter);
    html = `<div class="rg">${filtered.map(r => roomCard(r, statusMap)).join('')}</div>`;
  } else {
    const filtered = rooms.filter(r => r.status === curFilter);
    html = `<div class="rg">${filtered.map(r => roomCard(r, statusMap)).join('')}</div>`;
  }
  document.getElementById('rooms-grid').innerHTML = html || '<div class="empty">ไม่พบห้อง</div>';
}

function roomCard(r, statusMap) {
  return `<div class="rc ${r.status}" onclick="openRoomSheet(${r.id})">
    <div class="rn">${r.room_number}</div>
    <div class="rt">${r.room_type}</div>
    <div class="rp">฿${r.price_per_night}/คืน</div>
    <span class="rbadge">${statusMap[r.status] || r.status}</span>
  </div>`;
}

function filterRooms(f) {
  curFilter = f;
  document.querySelectorAll('.fc').forEach(c => c.classList.toggle('active', c.dataset.f === f));
  loadRooms();
}

async function openRoomSheet(roomId) {
  curRoomId = roomId;
  const room = await db.rooms.getById(roomId);
  if (!room) return;
  const statusMap = { available: '✅ ว่าง', occupied: '🟡 มีผู้พัก', maintenance: '🔴 ซ่อมบำรุง', cleaning: '🔵 ทำความสะอาด' };
  const typeEmoji = { 'Standard': '🛏️', 'Standard Twin': '🛏️🛏️', 'Deluxe': '⭐', 'Suite': '👑' };
  document.getElementById('sheet-title').textContent = `${typeEmoji[room.room_type] || '🏠'} ห้อง ${room.room_number}`;
  let body = `
    <div class="drow2"><span class="dlbl">ตึก</span><span class="dval">${room.building}</span></div>
    <div class="drow2"><span class="dlbl">ชั้น</span><span class="dval">${room.floor}</span></div>
    <div class="drow2"><span class="dlbl">ประเภท</span><span class="dval">${room.room_type}</span></div>
    <div class="drow2"><span class="dlbl">ราคา/คืน</span><span class="dval">฿${room.price_per_night.toLocaleString()}</span></div>
    <div class="drow2"><span class="dlbl">สถานะ</span><span class="dval">${statusMap[room.status] || room.status}</span></div>
  `;
  if (room.status === 'occupied') {
    const active = await db.bookings.getActive();
    const bk = active.find(b => b.room_id == roomId);
    if (bk) {
      const cust = await db.customers.getById(bk.customer_id);
      const nightsLeft = moment(bk.check_out_date).diff(moment(), 'days');
      body += `
        <div style="background:var(--primary);color:#fff;border-radius:var(--rs);padding:14px;margin-top:10px;">
          <div style="font-weight:700;font-size:15px;margin-bottom:8px;">👤 ${cust?.name || bk.customer_name || bk.customer_id}</div>
          <div style="font-size:12px;opacity:.8">📱 ${cust?.phone || '-'} | ${bk.booking_id}</div>
          <div style="font-size:12px;opacity:.8;margin-top:4px">📅 ${bk.check_in_date} → ${bk.check_out_date} (${nightsLeft} คืน)</div>
          <div style="font-size:14px;font-weight:700;margin-top:6px">💰 ฿${(bk.total_amount||0).toLocaleString()} | ${bk.payment_method === 'cash' ? '💵' : bk.payment_method === 'transfer' ? '📱' : '🔳'} ${bk.payment_method}</div>
          ${bk.notes ? `<div style="font-size:11px;margin-top:6px;opacity:.8">📝 ${bk.notes}</div>` : ''}
        </div>`;
      document.getElementById('sheet-btns').innerHTML = `
        <button onclick="editBooking('${bk.booking_id}')" class="btn bs bsm">✏️ แก้ไข</button>
        <button onclick="doCheckout('${bk.booking_id}')" class="btn bd bsm">🚪 เช็คเอาท์</button>
        <button onclick="viewBookingSlip('${bk.booking_id}')" class="btn bs bsm" style="grid-column:span 2">🧾 ดูสลิป</button>`;
    }
  } else {
    document.getElementById('sheet-btns').innerHTML = `
      <button onclick="setRoomMaint(${roomId})" class="btn bs bsm">🔧 ซ่อม/ทำความสะอาด</button>
      <button onclick="goSec('checkin');setTimeout(loadCIRooms,100)" class="btn bp bsm">📝 เช็คอิน</button>`;
  }
  document.getElementById('sheet-body').innerHTML = body;
  document.getElementById('room-sheet').classList.add('show');
}

async function viewBookingSlip(bookingId) {
  const slip = await db.bookings.getImage(bookingId);
  if (slip) {
    viewImg(slip, 'slip-booking-' + bookingId);
  } else {
    showToast('ไม่มีสลิป', 'err');
  }
}

function closeSheet(e) {
  if (e.target.id === 'room-sheet') document.getElementById('room-sheet').classList.remove('show');
}

async function setRoomMaint(roomId) {
  const room = await db.rooms.getById(roomId);
  if (!room) return;
  const statuses = ['available', 'maintenance', 'cleaning'];
  const next = statuses[(statuses.indexOf(room.status) + 1) % statuses.length];
  await db.rooms.update(roomId, { status: next });
  document.getElementById('room-sheet').classList.remove('show');
  loadRooms();
  showToast(`ห้อง ${room.room_number} → ${next}`);
}

async function doCheckout(bookingId) {
  if (!confirm('ยืนยันการเช็คเอาท์?')) return;
  const lateFee = parseFloat(prompt('ค่าปรับเช็คเอาท์สาย:', '0')) || 0;
  const dmg = parseFloat(prompt('ค่าปรับทรัพย์สิน:', '0')) || 0;
  const extraCharge = parseFloat(prompt('ค่าใช้จ่ายเพิ่มเติม:', '0')) || 0;
  const all = await db.bookings.getAll();
  const bk = all.find(b => b.booking_id === bookingId);
  if (!bk) { showToast('ไม่พบการจอง', 'err'); return; }
  await db.bookings.update(bookingId, { 
    status: 'checked_out', 
    check_out_time: new Date().toISOString(),
    late_fee: lateFee,
    damage_fee: dmg,
    extra_charge: extraCharge
  });
  await db.rooms.update(bk.room_id, { status: 'available' });
  const today = moment().format('YYYY-MM-DD');
  if (lateFee > 0) {
    await db.transactions.add({ 
      date: today, 
      booking_id: bookingId,
      item_name: `ค่าปรับสาย - ${bk.room_number}`, 
      category: 'income', 
      room_number: bk.room_number,
      receipt: lateFee, 
      notes: '' 
    });
  }
  if (dmg > 0) {
    await db.transactions.add({ 
      date: today, 
      booking_id: bookingId,
      item_name: `ค่าปรับทรัพย์สิน - ${bk.room_number}`, 
      category: 'income', 
      room_number: bk.room_number,
      receipt: dmg, 
      notes: '' 
    });
  }
  if (extraCharge > 0) {
    await db.transactions.add({ 
      date: today, 
      booking_id: bookingId,
      item_name: `ค่าใช้จ่ายเพิ่มเติม - ${bk.room_number}`, 
      category: 'income', 
      room_number: bk.room_number,
      receipt: extraCharge, 
      notes: '' 
    });
  }
  document.getElementById('room-sheet').classList.remove('show');
  showToast('✅ เช็คเอาท์สำเร็จ');
  loadDash();
  if (curSec === 'rooms') loadRooms();
}

async function editBooking(bookingId) {
  const all = await db.bookings.getAll();
  const bk = all.find(b => b.booking_id === bookingId);
  if (!bk) { showToast('ไม่พบการจอง', 'err'); return; }
  
  const newCI = prompt('เช็คอินใหม่ (YYYY-MM-DD):', bk.check_in_date);
  if (!newCI) return;
  const newCO = prompt('เช็คเอาท์ใหม่ (YYYY-MM-DD):', bk.check_out_date);
  if (!newCO) return;
  const newRate = parseFloat(prompt('ราคาใหม่/คืน:', bk.room_rate)) || bk.room_rate;
  const newNotes = prompt('หมายเหตุ:', bk.notes || '') || '';
  
  const nights = Calculator.calculateNights(newCI, newCO);
  const newTotal = newRate * nights;
  
  await db.bookings.update(bookingId, {
    check_in_date: newCI,
    check_out_date: newCO,
    nights: nights,
    room_rate: newRate,
    room_total: newTotal,
    total_amount: newTotal + (bk.electric_fee || 0) + (bk.water_fee || 0) - (bk.discount || 0),
    notes: newNotes
  });
  
  document.getElementById('room-sheet').classList.remove('show');
  showToast('แก้ไขการจองแล้ว');
  loadRooms();
}

// =============================================================
// CUSTOMERS
// =============================================================
async function loadCusts() {
  const custs = await db.customers.getAll();
  const list = document.getElementById('cust-list');
  if (!custs.length) { list.innerHTML = '<div class="empty">ไม่มีข้อมูลลูกค้า<br><small>นำเข้าจากเมนู Import</small></div>'; return; }
  list.innerHTML = custs.map(c => `
    <div class="cc">
      <div>
        <div class="ccn">${c.name}</div>
        <div class="ccm">${c.customer_id} | ${c.phone || '-'}</div>
        ${c.id_card ? `<div class="ccm">บัตร: ${c.id_card}</div>` : ''}
      </div>
      <div class="ccb">
        <div class="ccs">${c.total_stays || 0}</div>
        <div class="ccsl">ครั้ง</div>
        <div style="margin-top:6px;display:flex;gap:4px">
          <button onclick="editCust('${c.customer_id}')" style="background:var(--info);color:#fff;border:none;border-radius:4px;padding:3px 8px;font-size:10px;cursor:pointer">✏️</button>
          <button onclick="deleteCust('${c.customer_id}')" style="background:var(--danger);color:#fff;border:none;border-radius:4px;padding:3px 8px;font-size:10px;cursor:pointer">🗑️</button>
        </div>
      </div>
    </div>`).join('');
}

async function searchCustList() {
  const q = document.getElementById('cl-search').value;
  const custs = q ? await db.customers.search(q) : await db.customers.getAll();
  const list = document.getElementById('cust-list');
  if (!custs.length) { list.innerHTML = '<div class="empty">ไม่พบลูกค้า</div>'; return; }
  list.innerHTML = custs.map(c => `
    <div class="cc">
      <div>
        <div class="ccn">${c.name}</div>
        <div class="ccm">${c.customer_id} | ${c.phone || '-'}</div>
        ${c.id_card ? `<div class="ccm">บัตร: ${c.id_card}</div>` : ''}
      </div>
      <div class="ccb">
        <div class="ccs">${c.total_stays || 0}</div>
        <div class="ccsl">ครั้ง</div>
        <div style="margin-top:6px;display:flex;gap:4px">
          <button onclick="editCust('${c.customer_id}')" style="background:var(--info);color:#fff;border:none;border-radius:4px;padding:3px 8px;font-size:10px;cursor:pointer">✏️</button>
          <button onclick="deleteCust('${c.customer_id}')" style="background:var(--danger);color:#fff;border:none;border-radius:4px;padding:3px 8px;font-size:10px;cursor:pointer">🗑️</button>
        </div>
      </div>
    </div>`).join('');
}

async function editCust(custId) {
  const custs = await db.customers.getAll();
  const c = custs.find(x => x.customer_id === custId);
  if (!c) return;
  const name = prompt('ชื่อลูกค้า:', c.name);
  if (!name) return;
  const phone = prompt('เบอร์โทร:', c.phone || '') || '';
  const idCard = prompt('เลขบัตรประชาชน:', c.id_card || '') || '';
  const all = await db.customers.getAll();
  const idx = all.findIndex(x => x.customer_id === custId);
  if (idx !== -1) {
    all[idx] = { ...all[idx], name, phone, id_card: idCard };
    localStorage.setItem('resort_customers', JSON.stringify(all));
    showToast('แก้ไขลูกค้าแล้ว');
    loadCusts();
  }
}

async function deleteCust(custId) {
  if (!confirm('ลบลูกค้า?')) return;
  const all = await db.customers.getAll();
  const filtered = all.filter(c => c.customer_id !== custId);
  localStorage.setItem('resort_customers', JSON.stringify(filtered));
  showToast('ลบลูกค้าแล้ว');
  loadCusts();
}

// =============================================================
// ACCOUNTING + RECEIPT IMAGES
// =============================================================
async function loadAcc() {
  const date = document.getElementById('acc-date').value;
  const txs = await db.transactions.getByDate(date);
  const settings = await db.settings.get();
  const inc = txs.reduce((s, t) => s + (t.receipt || 0), 0);
  const exp = txs.reduce((s, t) => s + (t.payment || 0), 0);
  const op = settings.openingBalance || 0;
  document.getElementById('acc-open').textContent = `฿${op.toLocaleString()}`;
  document.getElementById('acc-in').textContent = `฿${inc.toLocaleString()}`;
  document.getElementById('acc-out').textContent = `฿${exp.toLocaleString()}`;
  document.getElementById('acc-bal').textContent = `฿${(op + inc - exp).toLocaleString()}`;
  const list = document.getElementById('tx-list');
  if (!txs.length) { list.innerHTML = '<div class="empty">ไม่มีรายการ</div>'; return; }
  let bal = op;
  list.innerHTML = await Promise.all(txs.map(async t => {
    bal += (t.receipt || 0) - (t.payment || 0);
    const slipImg = await db.transactions.getImage(t.id);
    const hasImg = slipImg && slipImg.length > 10;
    const pmIcon = t.payment_method === 'cash' ? '💵' : t.payment_method === 'transfer' ? '📱' : t.payment_method === 'qrcode' ? '🔳' : '';
    return `<div class="txi" id="tx-${t.id}">
      <div style="flex:1">
        <div class="txn">${t.item_name} ${pmIcon}</div>
        <div class="txm">${t.room_number || '-'} ${t.customer_name ? '· ' + t.customer_name : ''} ${t.notes ? '· ' + t.notes : ''}</div>
        ${hasImg ? `<img src="${slipImg}" style="height:44px;border-radius:6px;border:1px solid var(--border);margin-top:5px;cursor:pointer" onclick="viewTxImg('${t.id}')">` : ''}
      </div>
      <div style="text-align:right;min-width:88px">
        ${t.receipt > 0 ? `<div class="txp">+฿${t.receipt.toLocaleString()}</div>` : ''}
        ${t.payment > 0 ? `<div class="txng">-฿${t.payment.toLocaleString()}</div>` : ''}
        <div class="txb">฿${bal.toLocaleString()}</div>
        <div style="display:flex;gap:3px;margin-top:3px">
          <button onclick="attachImg(${t.id})" style="background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:3px 7px;font-size:10px;cursor:pointer">📎${hasImg ? '' : '-slip'}</button>
          <button onclick="deleteTx(${t.id})" style="background:var(--danger-light);border:1px solid var(--danger);border-radius:5px;padding:3px 6px;font-size:10px;cursor:pointer">🗑️</button>
        </div>
      </div>
    </div>`;
  }));
}

async function viewTxImg(txId) {
  const img = await db.transactions.getImage(txId);
  if (img) viewImg(img);
}

async function deleteTx(txId) {
  if (!confirm('ลบรายการนี้?')) return;
  await db.transactions.delete(txId);
  showToast('ลบรายการแล้ว');
  loadAcc();
}

async function addTx() {
  const item = prompt('ชื่อรายการ:');
  if (!item) return;
  const isInc = confirm('เป็นรายรับ? (Cancel = รายจ่าย)');
  const amt = parseFloat(prompt('จำนวนเงิน:')) || 0;
  const roomNum = isInc ? prompt('หมายเลขห้อง (ถ้ามี):') || '' : '';
  const notes = prompt('หมายเหตุ:') || '';
  await db.transactions.add({
    date: document.getElementById('acc-date').value,
    item_name: item, 
    category: isInc ? 'income' : 'expense',
    room_number: roomNum,
    receipt: isInc ? amt : 0, 
    payment: isInc ? 0 : amt, 
    notes: notes
  });
  showToast('บันทึกสำเร็จ');
  loadAcc();
}

function attachImg(txId) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment';
  inp.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      await db.transactions.updateImage(txId, ev.target.result);
      showToast('📎 แนบรูปแล้ว');
      loadAcc();
    };
    reader.readAsDataURL(file);
  };
  inp.click();
}

function viewImg(imgSrc, filename = 'slip') {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;';
  ov.onclick = (e) => { if (e.target === ov) document.body.removeChild(ov); };
  
  const bi = document.createElement('img');
  bi.src = imgSrc;
  bi.style.cssText = 'max-width:95vw;max-height:75vh;border-radius:12px;object-fit:contain;';
  
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:12px;margin-top:16px;';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕ ปิด';
  closeBtn.style.cssText = 'background:white;color:#333;border:none;border-radius:8px;padding:10px 20px;font-size:14px;cursor:pointer;';
  closeBtn.onclick = () => document.body.removeChild(ov);
  
  const saveBtn = document.createElement('button');
  saveBtn.textContent = '💾 บันทึกรูป';
  saveBtn.style.cssText = 'background:#52B788;color:white;border:none;border-radius:8px;padding:10px 20px;font-size:14px;cursor:pointer;';
  saveBtn.onclick = () => {
    if (window.AndroidDownload) {
      window.AndroidDownload.saveImage(imgSrc, filename);
    } else {
      const a = document.createElement('a');
      a.href = imgSrc;
      a.download = filename + '.jpg';
      a.click();
    }
  };
  
  btnRow.appendChild(saveBtn);
  btnRow.appendChild(closeBtn);
  ov.appendChild(bi);
  ov.appendChild(btnRow);
  document.body.appendChild(ov);
}

function viewTxImg(txId) {
  const el = document.getElementById(`tx-${txId}`);
  const img = el?.querySelector('img');
  if (!img) return;
  viewImg(img.src, 'slip-tx-' + txId);
}

async function expAcc() {
  const date = document.getElementById('acc-date').value;
  const [txs, s] = await Promise.all([db.transactions.getByDate(date), db.settings.get()]);
  let csv = 'วันที่,รายการ,ห้อง,จ่าย,รับ,คงเหลือ\n';
  let bal = s.openingBalance || 0;
  txs.forEach(t => { bal += (t.receipt || 0) - (t.payment || 0); csv += `${t.date},${t.item_name},${t.room_number || '-'},${t.payment || '-'},${t.receipt || '-'},${bal}\n`; });
  dlCSV(csv, `acc-${date}.csv`);
}

// =============================================================
// REPORTS
// =============================================================
async function genMonthly() {
  const y = document.getElementById('r-year').value;
  const m = document.getElementById('r-month').value;
  const start = `${y}-${m}-01`;
  const end = moment(start).endOf('month').format('YYYY-MM-DD');
  const [txs, bks] = await Promise.all([db.transactions.getByDateRange(start, end), db.bookings.getByDateRange(start, end)]);
  const inc = txs.reduce((s, t) => s + (t.receipt || 0), 0);
  const exp = txs.reduce((s, t) => s + (t.payment || 0), 0);
  const rev = bks.reduce((s, b) => s + (b.total_amount || 0), 0);
  document.getElementById('r-result').style.display = 'block';
  document.getElementById('r-content').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      <div class="ab g"><div class="abl">รายรับรวม</div><div class="aba">฿${inc.toLocaleString()}</div></div>
      <div class="ab r"><div class="abl">รายจ่ายรวม</div><div class="aba">฿${exp.toLocaleString()}</div></div>
    </div>
    <div class="ab b" style="margin-bottom:8px"><div class="abl">กำไรสุทธิ</div><div class="aba">฿${(inc-exp).toLocaleString()}</div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div class="ab"><div class="abl">จำนวนจอง</div><div class="aba" style="color:var(--text)">${bks.length} ราย</div></div>
      <div class="ab g"><div class="abl">รายได้ห้อง</div><div class="aba">฿${rev.toLocaleString()}</div></div>
    </div>`;
}

async function expData(type) {
  let data, name, csv;
  if (type === 'transactions') {
    data = await db.transactions.getAll(); name = 'transactions.csv';
    csv = 'วันที่,รายการ,ห้อง,จ่าย,รับ\n';
    data.forEach(t => { csv += `${t.date},${t.item_name},${t.room_number||'-'},${t.payment||'-'},${t.receipt||'-'}\n`; });
  } else if (type === 'customers') {
    data = await db.customers.getAll(); name = 'customers.csv';
    csv = 'รหัสลูกค้า,ชื่อ,เบอร์โทร,ที่อยู่,เลขบัตร,จำนวนครั้ง,ยอดรวม\n';
    data.forEach(c => { csv += `${c.customer_id},${c.name},${c.phone||''},${c.address||''},${c.id_card||''},${c.total_stays||0},${c.total_spent||0}\n`; });
  } else if (type === 'bookings') {
    data = await db.bookings.getAll(); name = 'bookings.csv';
    csv = 'เลขจอง,ลูกค้า,ห้อง,เช็คอิน,เช็คเอาท์,ยอด,สถานะ\n';
    data.forEach(b => { csv += `${b.booking_id},${b.customer_id},${b.room_id},${b.check_in_date},${b.check_out_date},${b.total_amount||0},${b.status}\n`; });
  }
  dlCSV(csv, name);
  showToast('Export สำเร็จ');
}

// =============================================================
// IMPORT CSV
// =============================================================
let parsedCSV = null, csvType = '';

function handleCSV(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => previewCSV(ev.target.result);
  reader.readAsText(file, 'UTF-8');
}

function previewCSV(text) {
  const { headers, rows } = CSVImport.parse(text);
  if (!rows.length) { showToast('ไม่พบข้อมูลใน CSV', 'err'); return; }
  csvType = CSVImport.detectType(headers);
  parsedCSV = rows;
  const typeLabel = csvType === 'customers' ? '👥 ลูกค้า' : csvType === 'rooms' ? '🏠 ห้องพัก' : '❓ ไม่ทราบ';
  const prev = document.getElementById('imp-preview');
  prev.style.display = 'block';
  prev.innerHTML = `
    <div class="card">
      <div class="ctitle">📋 ตรวจสอบ</div>
      <div class="fr b" style="margin-bottom:7px"><span class="fl">ประเภท</span><span class="fa" style="font-size:13px">${typeLabel}</span></div>
      <div class="fr g" style="margin-bottom:10px"><span class="fl">จำนวน</span><span class="fa">${rows.length} รายการ</span></div>
      <div style="overflow-x:auto;margin-bottom:12px">
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <tr>${headers.map(h=>`<th style="background:var(--primary);color:#fff;padding:5px 7px;white-space:nowrap">${h}</th>`).join('')}</tr>
          ${rows.slice(0,4).map(r=>`<tr>${headers.map(h=>`<td style="padding:5px 7px;border-bottom:1px solid var(--border);white-space:nowrap">${r[h]||'-'}</td>`).join('')}</tr>`).join('')}
          ${rows.length>4?`<tr><td colspan="${headers.length}" style="text-align:center;padding:7px;color:var(--muted)">...อีก ${rows.length-4} รายการ</td></tr>`:''}
        </table>
      </div>
      <div class="brow">
        <button onclick="cancelImp()" class="btn bs bsm">ยกเลิก</button>
        <button onclick="confirmImp()" class="btn bp bsm">✅ นำเข้า ${rows.length} รายการ</button>
      </div>
    </div>`;
}

async function confirmImp() {
  if (!parsedCSV) return;
  if (csvType === 'customers') {
    const rows = await CSVImport.autoGenerateIds(parsedCSV);
    const r = await db.customers.importBatch(rows);
    showToast(`✅ นำเข้าลูกค้า ${r.success} ราย`);
  } else if (csvType === 'rooms') {
    const r = await db.rooms.importBatch(parsedCSV);
    showToast(`✅ นำเข้าห้อง ${r.success} ห้อง`);
  } else { showToast('ไม่รู้จักประเภทไฟล์', 'err'); }
  cancelImp();
}

function cancelImp() {
  parsedCSV = null;
  document.getElementById('imp-preview').style.display = 'none';
  document.getElementById('imp-preview').innerHTML = '';
  document.getElementById('csv-inp').value = '';
}

function dlTemplate(type) {
  let csv, name;
  if (type === 'customers') {
    csv = 'รหัสลูกค้า,ชื่อ,เบอร์โทร,ที่อยู่,เลขบัตร\n,สมชาย ใจดี,081-234-5678,กรุงเทพฯ,1234567890123\n';
    name = 'template-customers.csv';
  } else {
    csv = 'ห้อง,ตึก,ชั้น,ประเภท,ราคา,สถานะ\nC101,C,1,Standard,400,available\n';
    name = 'template-rooms.csv';
  }
  dlCSV(csv, name);
  showToast('ดาวน์โหลด Template แล้ว');
}

// JSON Backup
async function expJSON() {
  const [custs, bks, txs, rooms, settings] = await Promise.all([
    db.customers.getAll(), db.bookings.getAll(), db.transactions.getAll(),
    db.rooms.getAll(), db.settings.get()
  ]);
  const data = { customers: custs, bookings: bks, transactions: txs, rooms, settings, exportDate: new Date().toISOString(), version: '4.0' };
  const jsonStr = JSON.stringify(data, null, 2);
  const filename = `vipat-backup-${moment().format('YYYYMMDD')}.json`;
  
  if (window.AndroidDownload) {
    window.AndroidDownload.downloadFile(jsonStr, filename, 'application/json');
  } else {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }
  showToast('📤 Export JSON สำเร็จ');
}

function impJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!confirm(`นำเข้าข้อมูลจาก ${file.name}?\nลูกค้า ${data.customers?.length||0} รายการ\nจอง ${data.bookings?.length||0} รายการ`)) return;
      // Import customers
      if (data.customers?.length) await db.customers.importBatch(data.customers);
      // Import transactions
      if (data.transactions?.length) {
        for (const t of data.transactions) {
          await db.transactions.add(t);
        }
      }
      showToast(`✅ Import JSON สำเร็จ`);
      loadDash();
    } catch (err) {
      showToast('ไฟล์ไม่ถูกต้อง', 'err');
    }
  };
  reader.readAsText(file);
}

// =============================================================
// UTILS
// =============================================================
function dlCSV(csv, filename) {
  if (window.AndroidDownload) {
    window.AndroidDownload.downloadFile('\uFEFF' + csv, filename, 'text/csv;charset=utf-8');
  } else {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }
}

// =============================================================
// APP INIT
// =============================================================
async function appInit() {
  appSettings = await db.settings.get();
  const today = moment().format('YYYY-MM-DD');
  document.getElementById('ci-date').value = today;
  document.getElementById('co-date').value = moment().add(1, 'day').format('YYYY-MM-DD');
  document.getElementById('acc-date').value = today;
  document.getElementById('dep').value = appSettings?.depositAmount || 200;
  await loadDash();
}
