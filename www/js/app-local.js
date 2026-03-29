/**
 * Resort Management System - Local Storage Version
 * ระบบจัดการรีสอร์ทแบบครบวงจร - ใช้ localStorage
 */

// Initialize localStorage data
const DB_KEYS = {
    rooms: 'resort_rooms',
    customers: 'resort_customers',
    bookings: 'resort_bookings',
    transactions: 'resort_transactions',
    settings: 'resort_settings'
};

// Default data
const DEFAULT_ROOMS = [
    { id: 1, room_number: 'A101', building: 'A', floor: 1, room_type: 'Standard', price_per_night: 400, status: 'available' },
    { id: 2, room_number: 'A102', building: 'A', floor: 1, room_type: 'Standard', price_per_night: 400, status: 'available' },
    { id: 3, room_number: 'A103', building: 'A', floor: 1, room_type: 'Standard Twin', price_per_night: 500, status: 'available' },
    { id: 4, room_number: 'A104', building: 'A', floor: 1, room_type: 'Standard', price_per_night: 400, status: 'available' },
    { id: 5, room_number: 'A105', building: 'A', floor: 1, room_type: 'Standard', price_per_night: 400, status: 'available' },
    { id: 6, room_number: 'A201', building: 'A', floor: 2, room_type: 'Standard', price_per_night: 400, status: 'available' },
    { id: 7, room_number: 'A202', building: 'A', floor: 2, room_type: 'Standard', price_per_night: 400, status: 'available' },
    { id: 8, room_number: 'A203', building: 'A', floor: 2, room_type: 'Standard Twin', price_per_night: 500, status: 'available' },
    { id: 9, room_number: 'A204', building: 'A', floor: 2, room_type: 'Standard', price_per_night: 400, status: 'available' },
    { id: 10, room_number: 'A205', building: 'A', floor: 2, room_type: 'Standard', price_per_night: 400, status: 'available' },
    { id: 11, room_number: 'B101', building: 'B', floor: 1, room_type: 'Standard', price_per_night: 400, status: 'available' },
    { id: 12, room_number: 'B102', building: 'B', floor: 1, room_type: 'Standard', price_per_night: 400, status: 'available' },
    { id: 13, room_number: 'B103', building: 'B', floor: 1, room_type: 'Standard Twin', price_per_night: 500, status: 'available' },
    { id: 14, room_number: 'B104', building: 'B', floor: 1, room_type: 'Standard', price_per_night: 400, status: 'available' },
    { id: 15, room_number: 'B105', building: 'B', floor: 1, room_type: 'Standard', price_per_night: 400, status: 'available' },
    { id: 16, room_number: 'B201', building: 'B', floor: 2, room_type: 'Standard', price_per_night: 400, status: 'available' },
    { id: 17, room_number: 'B202', building: 'B', floor: 2, room_type: 'Standard', price_per_night: 400, status: 'available' },
    { id: 18, room_number: 'B203', building: 'B', floor: 2, room_type: 'Standard Twin', price_per_night: 500, status: 'available' },
    { id: 19, room_number: 'B204', building: 'B', floor: 2, room_type: 'Standard', price_per_night: 400, status: 'available' },
    { id: 20, room_number: 'B205', building: 'B', floor: 2, room_type: 'Standard', price_per_night: 400, status: 'available' },
    { id: 21, room_number: 'N1', building: 'N', floor: 1, room_type: 'Standard', price_per_night: 500, status: 'available' },
    { id: 22, room_number: 'N2', building: 'N', floor: 1, room_type: 'Standard Twin', price_per_night: 600, status: 'available' },
    { id: 23, room_number: 'N3', building: 'N', floor: 1, room_type: 'Standard', price_per_night: 500, status: 'available' },
    { id: 24, room_number: 'N4', building: 'N', floor: 1, room_type: 'Standard Twin', price_per_night: 600, status: 'available' },
    { id: 25, room_number: 'N5', building: 'N', floor: 1, room_type: 'Standard', price_per_night: 500, status: 'available' },
];

const DEFAULT_CUSTOMERS = [
    { customer_id: 'CM00001', name: 'สมชาย ใจดี', phone: '081-234-5678', address: 'กรุงเทพฯ', total_stays: 5, total_spent: 8000 },
    { customer_id: 'CM00002', name: 'สมหญิง รักเรียน', phone: '082-345-6789', address: 'เชียงใหม่', total_stays: 3, total_spent: 4500 },
    { customer_id: 'CM00003', name: 'John Smith', phone: '089-999-8888', address: 'Bangkok', total_stays: 2, total_spent: 3000 },
    { customer_id: 'CM00004', name: 'วิชัย เก่งกาจ', phone: '083-456-7890', address: 'ภูเก็ต', total_stays: 10, total_spent: 15000 },
    { customer_id: 'CM00005', name: 'มานี มีนา', phone: '084-567-8901', address: 'ชลบุรี', total_stays: 1, total_spent: 1200 },
];

// Initialize data
function initData() {
    if (!localStorage.getItem(DB_KEYS.rooms)) {
        localStorage.setItem(DB_KEYS.rooms, JSON.stringify(DEFAULT_ROOMS));
    }
    if (!localStorage.getItem(DB_KEYS.customers)) {
        localStorage.setItem(DB_KEYS.customers, JSON.stringify(DEFAULT_CUSTOMERS));
    }
    if (!localStorage.getItem(DB_KEYS.bookings)) {
        localStorage.setItem(DB_KEYS.bookings, JSON.stringify([]));
    }
    if (!localStorage.getItem(DB_KEYS.transactions)) {
        localStorage.setItem(DB_KEYS.transactions, JSON.stringify([]));
    }
    if (!localStorage.getItem(DB_KEYS.settings)) {
        localStorage.setItem(DB_KEYS.settings, JSON.stringify({
            openingBalance: 4037,
            depositAmount: 200,
            electricRate: 8,
            waterRate: 25
        }));
    }
}

// Data access functions
const db = {
    get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
    set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    
    rooms: {
        getAll: () => db.get(DB_KEYS.rooms),
        getById: (id) => db.get(DB_KEYS.rooms).find(r => r.id === id),
        getByStatus: (status) => db.get(DB_KEYS.rooms).filter(r => r.status === status),
        getByBuilding: (building) => db.get(DB_KEYS.rooms).filter(r => r.building === building),
        update: (id, updates) => {
            const rooms = db.get(DB_KEYS.rooms);
            const idx = rooms.findIndex(r => r.id === id);
            if (idx !== -1) {
                rooms[idx] = { ...rooms[idx], ...updates };
                db.set(DB_KEYS.rooms, rooms);
                return true;
            }
            return false;
        }
    },
    
    customers: {
        getAll: () => db.get(DB_KEYS.customers),
        getById: (id) => db.get(DB_KEYS.customers).find(c => c.customer_id === id),
        search: (query) => {
            const q = query.toLowerCase();
            return db.get(DB_KEYS.customers).filter(c => 
                c.name.toLowerCase().includes(q) || 
                c.customer_id.toLowerCase().includes(q) ||
                (c.phone && c.phone.includes(q))
            );
        },
        add: (customer) => {
            const customers = db.get(DB_KEYS.customers);
            customers.push(customer);
            db.set(DB_KEYS.customers, customers);
        }
    },
    
    bookings: {
        getAll: () => db.get(DB_KEYS.bookings),
        getActive: () => db.get(DB_KEYS.bookings).filter(b => b.status === 'checked_in'),
        getByDate: (date) => db.get(DB_KEYS.bookings).filter(b => 
            b.check_in_date === date || b.check_out_date === date
        ),
        add: (booking) => {
            const bookings = db.get(DB_KEYS.bookings);
            bookings.push(booking);
            db.set(DB_KEYS.bookings, bookings);
        },
        update: (bookingId, updates) => {
            const bookings = db.get(DB_KEYS.bookings);
            const idx = bookings.findIndex(b => b.booking_id === bookingId);
            if (idx !== -1) {
                bookings[idx] = { ...bookings[idx], ...updates };
                db.set(DB_KEYS.bookings, bookings);
                return true;
            }
            return false;
        }
    },
    
    transactions: {
        getAll: () => db.get(DB_KEYS.transactions),
        getByDate: (date) => db.get(DB_KEYS.transactions).filter(t => t.date === date),
        add: (transaction) => {
            const transactions = db.get(DB_KEYS.transactions);
            transactions.push(transaction);
            db.set(DB_KEYS.transactions, transactions);
        }
    },
    
    settings: {
        get: () => db.get(DB_KEYS.settings),
        update: (updates) => {
            const settings = { ...db.get(DB_KEYS.settings), ...updates };
            db.set(DB_KEYS.settings, settings);
        }
    }
};

// Calculator
const Calculator = {
    calculateNights: (checkIn, checkOut) => {
        const start = moment(checkIn);
        const end = moment(checkOut);
        const nights = end.diff(start, 'days');
        return nights > 0 ? nights : 1;
    },
    
    calculateTotal: (roomRate, nights, electric, water, deposit, discount) => {
        const roomTotal = roomRate * nights;
        const subtotal = roomTotal + electric + water;
        const afterDiscount = subtotal - discount;
        const grandTotal = afterDiscount + deposit;
        
        return {
            roomTotal,
            electric,
            water,
            subtotal,
            discount,
            afterDiscount,
            deposit,
            grandTotal
        };
    },
    
    generateBookingId: () => {
        const now = moment();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `BK${now.format('YYMMDD')}${random}`;
    },
    
    generateCustomerId: () => {
        const customers = db.customers.getAll();
        const maxId = customers.reduce((max, c) => {
            const num = parseInt(c.customer_id.replace('CM', ''));
            return num > max ? num : max;
        }, 0);
        return `CM${(maxId + 1).toString().padStart(5, '0')}`;
    }
};

// Initialize on load
initData();

// Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'success' ? '#1a1a1a' : '#dc2626';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Navigation
let currentSection = 'dashboard';

function switchSection(sectionId) {
    currentSection = sectionId;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) item.classList.add('active');
    });
    loadSectionData(sectionId);
}

function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard': loadDashboard(); break;
        case 'checkin': loadCheckin(); break;
        case 'rooms': loadRooms(); break;
        case 'customers': loadCustomers(); break;
        case 'accounting': loadAccounting(); break;
    }
}

// Dashboard
function loadDashboard() {
    const rooms = db.rooms.getAll();
    const bookings = db.bookings.getActive();
    const today = moment().format('YYYY-MM-DD');
    const todayBookings = db.bookings.getByDate(today);
    const transactions = db.transactions.getByDate(today);
    
    // Room stats
    document.getElementById('dash-total-rooms').textContent = rooms.length;
    document.getElementById('dash-available').textContent = rooms.filter(r => r.status === 'available').length;
    document.getElementById('dash-occupied').textContent = rooms.filter(r => r.status === 'occupied').length;
    document.getElementById('dash-maintenance').textContent = rooms.filter(r => r.status === 'maintenance').length;
    
    // Finance
    const income = transactions.reduce((sum, t) => sum + (t.receipt || 0), 0);
    const expense = transactions.reduce((sum, t) => sum + (t.payment || 0), 0);
    document.getElementById('dash-income').textContent = `฿${income.toLocaleString()}`;
    document.getElementById('dash-expense').textContent = `฿${expense.toLocaleString()}`;
    document.getElementById('dash-balance').textContent = `฿${(income - expense).toLocaleString()}`;
    
    // Activity
    const todayCheckins = todayBookings.filter(b => b.check_in_date === today).length;
    const todayCheckouts = todayBookings.filter(b => b.check_out_date === today).length;
    document.getElementById('dash-checkins').textContent = todayCheckins;
    document.getElementById('dash-checkouts').textContent = todayCheckouts;
    document.getElementById('dash-active').textContent = bookings.length;
    
    // Check-out list
    const checkoutList = document.getElementById('checkout-list');
    const checkoutToday = bookings.filter(b => b.check_out_date === today);
    
    if (checkoutToday.length > 0) {
        checkoutList.innerHTML = checkoutToday.map(c => {
            const customer = db.customers.getById(c.customer_id);
            const room = db.rooms.getById(c.room_id);
            return `
                <div class="flex justify-between items-center p-2 bg-yellow-50 rounded-lg">
                    <div>
                        <p class="font-bold text-sm">${customer?.name || c.customer_id}</p>
                        <p class="text-xs text-gray-500">ห้อง ${room?.room_number || c.room_id}</p>
                    </div>
                    <button onclick="checkout('${c.booking_id}')" class="px-3 py-1 bg-yellow-500 text-white rounded text-xs">เช็คเอาท์</button>
                </div>
            `;
        }).join('');
    } else {
        checkoutList.innerHTML = '<p class="text-gray-400 text-center py-4">ไม่มีรายการ</p>';
    }
}

// Check-in
let selectedCustomer = null;

function loadCheckin() {
    const rooms = db.rooms.getByStatus('available');
    const select = document.getElementById('room-select');
    select.innerHTML = '<option value="">-- เลือกห้องว่าง --</option>' +
        rooms.map(r => `
            <option value="${r.id}" data-price="${r.price_per_night}" data-number="${r.room_number}" data-type="${r.room_type}" data-building="${r.building}">
                ${r.room_number} (${r.building}) - ${r.room_type} - ฿${r.price_per_night}
            </option>
        `).join('');
}

function updateRoomInfo() {
    const select = document.getElementById('room-select');
    const option = select.options[select.selectedIndex];
    if (!option.value) {
        document.getElementById('room-info').innerHTML = '';
        document.getElementById('room-rate').value = '';
        return;
    }
    document.getElementById('room-info').innerHTML = `
        <p>🏠 ห้อง ${option.dataset.number} | ตึก ${option.dataset.building}</p>
        <p>📋 ประเภท: ${option.dataset.type}</p>
        <p>💰 ราคา: ฿${option.dataset.price}/คืน</p>
    `;
    document.getElementById('room-rate').value = option.dataset.price;
    calculateTotal();
}

function calculateNights() {
    const checkIn = document.getElementById('checkin-date').value;
    const checkOut = document.getElementById('checkout-date').value;
    if (!checkIn || !checkOut) return 1;
    const nights = Calculator.calculateNights(checkIn, checkOut);
    document.getElementById('nights').value = nights;
    return nights;
}

function calculateTotal() {
    const nights = calculateNights();
    const roomRate = parseFloat(document.getElementById('room-rate').value) || 0;
    const electricFee = parseFloat(document.getElementById('electric-fee').value) || 0;
    const waterFee = parseFloat(document.getElementById('water-fee').value) || 0;
    const deposit = parseFloat(document.getElementById('deposit').value) || 0;
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    
    const breakdown = Calculator.calculateTotal(roomRate, nights, electricFee, waterFee, deposit, discount);
    
    document.getElementById('room-total').value = breakdown.roomTotal;
    document.getElementById('grand-total').textContent = `฿${breakdown.grandTotal.toLocaleString()}`;
    
    document.getElementById('total-breakdown').innerHTML = `
        <div class="flex justify-between"><span>ค่าห้อง (${nights} คืน × ฿${roomRate})</span><span>฿${breakdown.roomTotal.toLocaleString()}</span></div>
        ${electricFee > 0 ? `<div class="flex justify-between text-gray-400"><span>ค่าไฟ</span><span>฿${electricFee.toLocaleString()}</span></div>` : ''}
        ${waterFee > 0 ? `<div class="flex justify-between text-gray-400"><span>ค่าน้ำ</span><span>฿${waterFee.toLocaleString()}</span></div>` : ''}
        ${discount > 0 ? `<div class="flex justify-between text-green-400"><span>ส่วนลด</span><span>-฿${discount.toLocaleString()}</span></div>` : ''}
        <div class="flex justify-between text-yellow-400"><span>มัดจำ</span><span>฿${deposit.toLocaleString()}</span></div>
    `;
    
    calculateChange();
}

function calculateChange() {
    const grandTotal = parseInt(document.getElementById('grand-total').textContent.replace(/[^0-9]/g, '')) || 0;
    const amountPaid = parseFloat(document.getElementById('amount-paid').value) || 0;
    const change = amountPaid - grandTotal;
    
    const changeEl = document.getElementById('change-amount');
    if (change >= 0) {
        changeEl.textContent = `💰 เงินทอน: ฿${change.toLocaleString()}`;
        changeEl.className = 'text-sm text-green-600 mt-1 font-bold';
    } else {
        changeEl.textContent = `⚠️ ขาดอีก: ฿${Math.abs(change).toLocaleString()}`;
        changeEl.className = 'text-sm text-red-600 mt-1 font-bold';
    }
}

function searchCustomer(query) {
    if (query.length < 2) {
        document.getElementById('customer-results').innerHTML = '';
        return;
    }
    
    const customers = db.customers.search(query);
    const results = document.getElementById('customer-results');
    
    if (customers.length > 0) {
        results.innerHTML = customers.map(c => `
            <div onclick="selectCustomer('${c.customer_id}', '${c.name}', '${c.phone || ''}')" class="p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <p class="font-bold text-sm">${c.name}</p>
                <p class="text-xs text-gray-500">${c.customer_id} | ${c.phone || '-'}</p>
            </div>
        `).join('');
    } else {
        results.innerHTML = '<p class="text-gray-400 text-sm p-2">ไม่พบลูกค้า - กด "+ ใหม่" เพื่อเพิ่ม</p>';
    }
}

function selectCustomer(id, name, phone) {
    selectedCustomer = { id, name, phone };
    document.getElementById('selected-customer').classList.remove('hidden');
    document.getElementById('cust-name').textContent = name;
    document.getElementById('cust-phone').textContent = phone || '-';
    document.getElementById('cust-id').textContent = id;
    document.getElementById('customer-search').value = '';
    document.getElementById('customer-results').innerHTML = '';
}

function clearCustomer() {
    selectedCustomer = null;
    document.getElementById('selected-customer').classList.add('hidden');
}

function openCustomerModal() {
    const name = prompt('ชื่อลูกค้า:');
    if (!name) return;
    
    const phone = prompt('เบอร์โทร:');
    const id = Calculator.generateCustomerId();
    
    const customer = {
        customer_id: id,
        name: name,
        phone: phone || '',
        address: '',
        total_stays: 0,
        total_spent: 0
    };
    
    db.customers.add(customer);
    selectCustomer(id, name, phone || '');
    showToast('เพิ่มลูกค้าสำเร็จ');
}

function submitCheckin() {
    if (!selectedCustomer) {
        showToast('กรุณาเลือกลูกค้า', 'error');
        return;
    }
    
    const roomId = parseInt(document.getElementById('room-select').value);
    if (!roomId) {
        showToast('กรุณาเลือกห้อง', 'error');
        return;
    }
    
    const checkInDate = document.getElementById('checkin-date').value;
    const checkOutDate = document.getElementById('checkout-date').value;
    
    if (!checkInDate || !checkOutDate) {
        showToast('กรุณาระบุวันที่', 'error');
        return;
    }
    
    const grandTotal = parseInt(document.getElementById('grand-total').textContent.replace(/[^0-9]/g, '')) || 0;
    const amountPaid = parseFloat(document.getElementById('amount-paid').value) || 0;
    
    if (amountPaid < grandTotal) {
        showToast('จำนวนเงินไม่พอกับยอดรวม', 'error');
        return;
    }
    
    const booking = {
        booking_id: Calculator.generateBookingId(),
        customer_id: selectedCustomer.id,
        room_id: roomId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        nights: parseInt(document.getElementById('nights').value),
        room_rate: parseFloat(document.getElementById('room-rate').value) || 0,
        room_total: parseFloat(document.getElementById('room-total').value) || 0,
        electric_fee: parseFloat(document.getElementById('electric-fee').value) || 0,
        water_fee: parseFloat(document.getElementById('water-fee').value) || 0,
        discount: parseFloat(document.getElementById('discount').value) || 0,
        deposit: parseFloat(document.getElementById('deposit').value) || 0,
        total_amount: grandTotal,
        amount_paid: amountPaid,
        change_amount: amountPaid - grandTotal,
        payment_method: document.querySelector('input[name="payment-method"]:checked')?.value || 'cash',
        status: 'checked_in',
        notes: document.getElementById('notes').value,
        created_at: new Date().toISOString()
    };
    
    // Update room status
    db.rooms.update(roomId, { status: 'occupied' });
    
    // Add booking
    db.bookings.add(booking);
    
    // Add transaction
    const transaction = {
        id: Date.now(),
        date: checkInDate,
        item_name: `ค่าห้องพัก - ${booking.booking_id}`,
        category: 'income',
        room_number: db.rooms.getById(roomId)?.room_number || '',
        receipt: grandTotal - booking.deposit,
        deposit_cash: booking.deposit,
        notes: booking.notes
    };
    db.transactions.add(transaction);
    
    // Update customer stats
    const customer = db.customers.getById(selectedCustomer.id);
    if (customer) {
        customer.total_stays = (customer.total_stays || 0) + 1;
        customer.total_spent = (customer.total_spent || 0) + grandTotal;
        customer.last_stay_date = checkInDate;
    }
    
    showToast('✅ เช็คอินสำเร็จ!');
    clearCheckinForm();
    loadDashboard();
}

function clearCheckinForm() {
    selectedCustomer = null;
    document.getElementById('customer-search').value = '';
    document.getElementById('selected-customer').classList.add('hidden');
    document.getElementById('room-select').value = '';
    document.getElementById('room-info').innerHTML = '';
    document.getElementById('electric-fee').value = 0;
    document.getElementById('water-fee').value = 0;
    document.getElementById('deposit').value = 200;
    document.getElementById('discount').value = 0;
    document.getElementById('amount-paid').value = '';
    document.getElementById('notes').value = '';
    document.getElementById('grand-total').textContent = '฿0';
    document.getElementById('total-breakdown').innerHTML = '';
    document.getElementById('change-amount').textContent = '';
    
    const today = moment().format('YYYY-MM-DD');
    const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
    document.getElementById('checkin-date').value = today;
    document.getElementById('checkout-date').value = tomorrow;
    document.getElementById('nights').value = 1;
}

// Rooms
let currentRoomFilter = 'all';

function loadRooms() {
    let rooms = db.rooms.getAll();
    if (currentRoomFilter !== 'all') {
        rooms = rooms.filter(r => r.building === currentRoomFilter);
    }
    
    const grid = document.getElementById('rooms-grid');
    grid.innerHTML = rooms.map(r => {
        const statusClass = `status-${r.status}`;
        const statusText = { available: 'ว่าง', occupied: 'มีผู้พัก', maintenance: 'ซ่อมบำรุง', cleaning: 'ทำความสะอาด' }[r.status] || r.status;
        
        return `
            <div class="card p-3 ${statusClass} cursor-pointer hover:shadow-lg transition-shadow" onclick="toggleRoomStatus(${r.id})">
                <p class="font-bold text-lg">${r.room_number}</p>
                <p class="text-xs text-gray-600">${r.room_type}</p>
                <p class="text-sm font-medium mt-1">฿${r.price_per_night}</p>
                <p class="text-xs mt-2 px-2 py-1 rounded bg-white bg-opacity-50 inline-block">${statusText}</p>
            </div>
        `;
    }).join('');
}

function filterRooms(building) {
    currentRoomFilter = building;
    document.querySelectorAll('[data-filter]').forEach(btn => {
        if (btn.dataset.filter === building) {
            btn.classList.remove('bg-gray-100');
            btn.classList.add('bg-gray-900', 'text-white');
        } else {
            btn.classList.remove('bg-gray-900', 'text-white');
            btn.classList.add('bg-gray-100');
        }
    });
    loadRooms();
}

function toggleRoomStatus(roomId) {
    const room = db.rooms.getById(roomId);
    if (!room) return;
    
    const statuses = ['available', 'occupied', 'maintenance', 'cleaning'];
    const currentIdx = statuses.indexOf(room.status);
    const nextStatus = statuses[(currentIdx + 1) % statuses.length];
    
    db.rooms.update(roomId, { status: nextStatus });
    loadRooms();
    showToast(`ห้อง ${room.room_number} เปลี่ยนเป็น ${nextStatus}`);
}

// Customers
function loadCustomers() {
    const customers = db.customers.getAll();
    const list = document.getElementById('customer-list');
    
    list.innerHTML = customers.map(c => `
        <div class="card p-3 cursor-pointer hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-bold">${c.name}</p>
                    <p class="text-sm text-gray-500">${c.customer_id} | ${c.phone || '-'}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs text-gray-500">พักแล้ว</p>
                    <p class="font-bold">${c.total_stays || 0} ครั้ง</p>
                </div>
            </div>
        </div>
    `).join('');
}

function searchCustomerList() {
    const query = document.getElementById('customer-list-search').value;
    if (!query) {
        loadCustomers();
        return;
    }
    
    const customers = db.customers.search(query);
    const list = document.getElementById('customer-list');
    
    list.innerHTML = customers.map(c => `
        <div class="card p-3 cursor-pointer hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-bold">${c.name}</p>
                    <p class="text-sm text-gray-500">${c.customer_id} | ${c.phone || '-'}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs text-gray-500">พักแล้ว</p>
                    <p class="font-bold">${c.total_stays || 0} ครั้ง</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Accounting
function loadAccounting() {
    const date = document.getElementById('accounting-date').value;
    const transactions = db.transactions.getByDate(date);
    const settings = db.settings.get();
    
    const income = transactions.reduce((sum, t) => sum + (t.receipt || 0), 0);
    const expense = transactions.reduce((sum, t) => sum + (t.payment || 0), 0);
    
    document.getElementById('acc-opening').textContent = `฿${settings.openingBalance.toLocaleString()}`;
    document.getElementById('acc-income').textContent = `฿${income.toLocaleString()}`;
    document.getElementById('acc-expense').textContent = `฿${expense.toLocaleString()}`;
    document.getElementById('acc-balance').textContent = `฿${(settings.openingBalance + income - expense).toLocaleString()}`;
    
    const list = document.getElementById('transaction-list');
    if (transactions.length === 0) {
        list.innerHTML = '<div class="text-center py-4 text-gray-400">ไม่มีรายการ</div>';
        return;
    }
    
    let balance = settings.openingBalance;
    list.innerHTML = transactions.map(t => {
        balance = balance + (t.receipt || 0) - (t.payment || 0);
        return `
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <div>
                    <p class="font-bold text-sm">${t.item_name}</p>
                    <p class="text-xs text-gray-500">${t.room_number || '-'} | ${t.notes || '-'}</p>
                </div>
                <div class="text-right">
                    ${t.receipt > 0 ? `<p class="text-green-600 font-bold">+฿${t.receipt.toLocaleString()}</p>` : ''}
                    ${t.payment > 0 ? `<p class="text-red-600 font-bold">-฿${t.payment.toLocaleString()}</p>` : ''}
                    <p class="text-xs text-gray-500">คงเหลือ: ฿${balance.toLocaleString()}</p>
                </div>
            </div>
        `;
    }).join('');
}

function openTransactionModal() {
    const item = prompt('ชื่อรายการ:');
    if (!item) return;
    
    const isIncome = confirm('เป็นรายรับ? (กด Cancel สำหรับรายจ่าย)');
    const amount = parseFloat(prompt('จำนวนเงิน:')) || 0;
    
    const transaction = {
        id: Date.now(),
        date: document.getElementById('accounting-date').value,
        item_name: item,
        category: isIncome ? 'income' : 'expense',
        receipt: isIncome ? amount : 0,
        payment: isIncome ? 0 : amount,
        notes: ''
    };
    
    db.transactions.add(transaction);
    showToast('บันทึกรายการสำเร็จ');
    loadAccounting();
}

function exportAccounting() {
    const date = document.getElementById('accounting-date').value;
    const transactions = db.transactions.getByDate(date);
    const settings = db.settings.get();
    
    let csv = 'วันที่,รายการ,ห้อง,จ่าย,รับ,คงเหลือ,หมายเหตุ\n';
    let balance = settings.openingBalance;
    
    transactions.forEach(t => {
        balance = balance + (t.receipt || 0) - (t.payment || 0);
        csv += `${t.date},${t.item_name},${t.room_number || '-'},${t.payment || '-'},${t.receipt || '-'},${balance},${t.notes || '-'}\n`;
    });
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `accounting-${date}.csv`;
    link.click();
}

// Checkout
function checkout(bookingId) {
    if (!confirm('ยืนยันการเช็คเอาท์?')) return;
    
    const lateFee = parseFloat(prompt('ค่าปรับเช็คเอาท์สาย (ถ้ามี):', '0')) || 0;
    const damageFee = parseFloat(prompt('ค่าปรับทรัพย์สิน (ถ้ามี):', '0')) || 0;
    
    const booking = db.bookings.getAll().find(b => b.booking_id === bookingId);
    if (!booking) {
        showToast('ไม่พบการจอง', 'error');
        return;
    }
    
    // Update booking
    db.bookings.update(bookingId, { status: 'checked_out' });
    
    // Update room
    db.rooms.update(booking.room_id, { status: 'available' });
    
    // Add late fee transaction
    if (lateFee > 0) {
        db.transactions.add({
            id: Date.now(),
            date: moment().format('YYYY-MM-DD'),
            item_name: `ค่าปรับเช็คเอาท์สาย - ${bookingId}`,
            category: 'income',
            receipt: lateFee,
            notes: ''
        });
    }
    
    // Add damage fee transaction
    if (damageFee > 0) {
        db.transactions.add({
            id: Date.now() + 1,
            date: moment().format('YYYY-MM-DD'),
            item_name: `ค่าปรับทรัพย์สิน - ${bookingId}`,
            category: 'income',
            receipt: damageFee,
            notes: ''
        });
    }
    
    showToast('✅ เช็คเอาท์สำเร็จ');
    loadDashboard();
}

// Reports
function generateReport(type) {
    if (type === 'daily') {
        alert('รายงานรายวัน: ใช้หน้าบัญชี');
    }
}

function generateMonthlyReport() {
    const year = document.getElementById('report-year').value;
    const month = document.getElementById('report-month').value;
    
    const startDate = `${year}-${month}-01`;
    const endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');
    
    const allTransactions = db.transactions.getAll();
    const monthTransactions = allTransactions.filter(t => 
        t.date >= startDate && t.date <= endDate
    );
    
    const allBookings = db.bookings.getAll();
    const monthBookings = allBookings.filter(b => 
        b.check_in_date >= startDate && b.check_in_date <= endDate
    );
    
    const income = monthTransactions.reduce((sum, t) => sum + (t.receipt || 0), 0);
    const expense = monthTransactions.reduce((sum, t) => sum + (t.payment || 0), 0);
    const roomRevenue = monthBookings.reduce((sum, b) => sum + b.total_amount, 0);
    
    const resultDiv = document.getElementById('report-result');
    const contentDiv = document.getElementById('report-content');
    
    resultDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
        <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
                <div class="p-3 bg-green-50 rounded-lg">
                    <p class="text-xs text-green-600">รายรับรวม</p>
                    <p class="text-lg font-bold text-green-700">฿${income.toLocaleString()}</p>
                </div>
                <div class="p-3 bg-red-50 rounded-lg">
                    <p class="text-xs text-red-600">รายจ่ายรวม</p>
                    <p class="text-lg font-bold text-red-700">฿${expense.toLocaleString()}</p>
                </div>
            </div>
            <div class="p-3 bg-blue-50 rounded-lg">
                <p class="text-xs text-blue-600">กำไรสุทธิ</p>
                <p class="text-xl font-bold text-blue-700">฿${(income - expense).toLocaleString()}</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div class="p-3 bg-gray-50 rounded-lg">
                    <p class="text-xs text-gray-600">จำนวนการจอง</p>
                    <p class="font-bold">${monthBookings.length} ราย</p>
                </div>
                <div class="p-3 bg-gray-50 rounded-lg">
                    <p class="text-xs text-gray-600">รายได้จากห้องพัก</p>
                    <p class="font-bold">฿${roomRevenue.toLocaleString()}</p>
                </div>
            </div>
        </div>
    `;
}

function exportData(type) {
    let data, filename, csv;
    
    if (type === 'transactions') {
        data = db.transactions.getAll();
        filename = 'transactions.csv';
        csv = 'วันที่,รายการ,ห้อง,จ่าย,รับ,หมายเหตุ\n';
        data.forEach(t => {
            csv += `${t.date},${t.item_name},${t.room_number || '-'},${t.payment || '-'},${t.receipt || '-'},${t.notes || '-'}\n`;
        });
    } else if (type === 'customers') {
        data = db.customers.getAll();
        filename = 'customers.csv';
        csv = 'รหัสลูกค้า,ชื่อ,เบอร์โทร,ที่อยู่,จำนวนครั้ง,ยอดรวม\n';
        data.forEach(c => {
            csv += `${c.customer_id},${c.name},${c.phone || '-'},${c.address || '-'},${c.total_stays || 0},${c.total_spent || 0}\n`;
        });
    } else if (type === 'rooms') {
        data = db.rooms.getAll();
        filename = 'rooms.csv';
        csv = 'ห้อง,ตึก,ชั้น,ประเภท,ราคา,สถานะ\n';
        data.forEach(r => {
            csv += `${r.room_number},${r.building},${r.floor},${r.room_type},${r.price_per_night},${r.status}\n`;
        });
    }
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    showToast(`Export ${type} สำเร็จ`);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const today = moment().format('YYYY-MM-DD');
    const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
    
    document.getElementById('checkin-date').value = today;
    document.getElementById('checkout-date').value = tomorrow;
    document.getElementById('accounting-date').value = today;
    
    loadDashboard();
});
