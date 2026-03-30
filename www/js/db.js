/**
 * Resort Suite - db.js v4 (localStorage)
 * ไม่ต้องติดตั้ง plugin เพิ่มเติม ทำงานได้ทั้งบน Web และ APK
 */

const DB_KEYS = {
  rooms: 'resort_rooms',
  customers: 'resort_customers',
  bookings: 'resort_bookings',
  transactions: 'resort_transactions',
  settings: 'resort_settings',
  images: 'resort_images',
  employees: 'resort_employees'
};

const imgStorage = {
  save: async (type, id, imageData) => {
    const imgs = JSON.parse(localStorage.getItem(DB_KEYS.images) || '{}');
    const key = `${type}_${id}`;
    imgs[key] = imageData;
    localStorage.setItem(DB_KEYS.images, JSON.stringify(imgs));
  },
  get: async (type, id) => {
    const imgs = JSON.parse(localStorage.getItem(DB_KEYS.images) || '{}');
    return imgs[`${type}_${id}`] || null;
  },
  delete: async (type, id) => {
    const imgs = JSON.parse(localStorage.getItem(DB_KEYS.images) || '{}');
    delete imgs[`${type}_${id}`];
    localStorage.setItem(DB_KEYS.images, JSON.stringify(imgs));
  }
};

function seedDefaultData() {
  if (!localStorage.getItem(DB_KEYS.rooms)) {
    const rooms = [
      {id:1,room_number:'A101',building:'A',floor:1,room_type:'Standard',price_per_night:400,status:'available'},
      {id:2,room_number:'A102',building:'A',floor:1,room_type:'Standard',price_per_night:400,status:'available'},
      {id:3,room_number:'A103',building:'A',floor:1,room_type:'Standard Twin',price_per_night:500,status:'available'},
      {id:4,room_number:'A104',building:'A',floor:1,room_type:'Standard',price_per_night:400,status:'available'},
      {id:5,room_number:'A105',building:'A',floor:1,room_type:'Standard',price_per_night:400,status:'available'},
      {id:6,room_number:'A201',building:'A',floor:2,room_type:'Standard',price_per_night:400,status:'available'},
      {id:7,room_number:'A202',building:'A',floor:2,room_type:'Standard',price_per_night:400,status:'available'},
      {id:8,room_number:'A203',building:'A',floor:2,room_type:'Standard Twin',price_per_night:500,status:'available'},
      {id:9,room_number:'A204',building:'A',floor:2,room_type:'Standard',price_per_night:400,status:'available'},
      {id:10,room_number:'A205',building:'A',floor:2,room_type:'Standard',price_per_night:400,status:'available'},
      {id:11,room_number:'A211',building:'A',floor:2,room_type:'Standard',price_per_night:400,status:'available'},
      {id:12,room_number:'B101',building:'B',floor:1,room_type:'Standard',price_per_night:400,status:'available'},
      {id:13,room_number:'B102',building:'B',floor:1,room_type:'Standard',price_per_night:400,status:'available'},
      {id:14,room_number:'B103',building:'B',floor:1,room_type:'Standard Twin',price_per_night:500,status:'available'},
      {id:15,room_number:'B104',building:'B',floor:1,room_type:'Standard',price_per_night:400,status:'available'},
      {id:16,room_number:'B105',building:'B',floor:1,room_type:'Standard',price_per_night:400,status:'available'},
      {id:17,room_number:'B201',building:'B',floor:2,room_type:'Standard',price_per_night:400,status:'available'},
      {id:18,room_number:'B202',building:'B',floor:2,room_type:'Standard',price_per_night:400,status:'available'},
      {id:19,room_number:'B203',building:'B',floor:2,room_type:'Standard Twin',price_per_night:500,status:'available'},
      {id:20,room_number:'B204',building:'B',floor:2,room_type:'Standard',price_per_night:400,status:'available'},
      {id:21,room_number:'B205',building:'B',floor:2,room_type:'Standard',price_per_night:400,status:'available'},
      {id:22,room_number:'B211',building:'B',floor:2,room_type:'Standard',price_per_night:400,status:'available'},
      {id:23,room_number:'N1',building:'N',floor:1,room_type:'Standard',price_per_night:500,status:'available'},
      {id:24,room_number:'N2',building:'N',floor:1,room_type:'Standard Twin',price_per_night:600,status:'available'},
      {id:25,room_number:'N3',building:'N',floor:1,room_type:'Standard',price_per_night:500,status:'available'},
      {id:26,room_number:'N4',building:'N',floor:1,room_type:'Standard Twin',price_per_night:600,status:'available'},
      {id:27,room_number:'N5',building:'N',floor:1,room_type:'Standard',price_per_night:500,status:'available'},
      {id:28,room_number:'N6',building:'N',floor:1,room_type:'Standard',price_per_night:500,status:'available'},
      {id:29,room_number:'N7',building:'N',floor:1,room_type:'Standard Twin',price_per_night:600,status:'available'},
    ];
    localStorage.setItem(DB_KEYS.rooms, JSON.stringify(rooms));
  }
  if (!localStorage.getItem(DB_KEYS.customers))    localStorage.setItem(DB_KEYS.customers, JSON.stringify([]));
  if (!localStorage.getItem(DB_KEYS.bookings))     localStorage.setItem(DB_KEYS.bookings, JSON.stringify([]));
  if (!localStorage.getItem(DB_KEYS.transactions)) localStorage.setItem(DB_KEYS.transactions, JSON.stringify([]));
  if (!localStorage.getItem(DB_KEYS.settings))     localStorage.setItem(DB_KEYS.settings, JSON.stringify({openingBalance:4037,depositAmount:200,electricRate:8,waterRate:25}));
  if (!localStorage.getItem(DB_KEYS.employees)) {
    const employees = [
      {id:1, username:'admin', password:'admin123', name:'ผู้ดูแลระบบ', role:'admin', phone:'081-234-5678', status:'active', created_at:new Date().toISOString()},
      {id:2, username:'manager', password:'manager123', name:'ผู้จัดการ', role:'manager', phone:'082-345-6789', status:'active', created_at:new Date().toISOString()},
      {id:3, username:'staff', password:'staff123', name:'พนักงาน', role:'staff', phone:'083-456-7890', status:'active', created_at:new Date().toISOString()}
    ];
    localStorage.setItem(DB_KEYS.employees, JSON.stringify(employees));
  }
}

function _get(key) { return JSON.parse(localStorage.getItem(key) || '[]'); }
function _set(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

const db = {
  rooms: {
    getAll: async () => _get(DB_KEYS.rooms),
    getById: async (id) => _get(DB_KEYS.rooms).find(r => r.id == id) || null,
    getByNumber: async (num) => _get(DB_KEYS.rooms).find(r => r.room_number === num) || null,
    getByStatus: async (status) => _get(DB_KEYS.rooms).filter(r => r.status === status),
    update: async (id, updates) => {
      const rows = _get(DB_KEYS.rooms);
      const idx = rows.findIndex(r => r.id == id);
      if (idx !== -1) { rows[idx] = {...rows[idx], ...updates}; _set(DB_KEYS.rooms, rows); }
    },
    importBatch: async (rows) => {
      const existing = _get(DB_KEYS.rooms);
      let success = 0, skip = 0;
      for (const r of rows) {
        if (!r.room_number || !r.building) { skip++; continue; }
        if (!existing.find(e => e.room_number === r.room_number)) {
          existing.push({id: Date.now()+success, room_number:r.room_number, building:r.building, floor:parseInt(r.floor)||1, room_type:r.room_type||'Standard', price_per_night:parseInt(r.price_per_night)||400, status:r.status||'available'});
          success++;
        } else skip++;
      }
      _set(DB_KEYS.rooms, existing);
      return { success, skip };
    }
  },

  customers: {
    getAll: async () => _get(DB_KEYS.customers),
    getById: async (custId) => _get(DB_KEYS.customers).find(c => c.customer_id === custId) || null,
    search: async (query) => {
      const q = query.toLowerCase();
      return _get(DB_KEYS.customers).filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.customer_id && c.customer_id.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.id_card && c.id_card.includes(q))
      );
    },
    add: async (customer) => {
      const rows = _get(DB_KEYS.customers);
      rows.push(customer);
      _set(DB_KEYS.customers, rows);
    },
    updateStats: async (custId, stayInc, spentInc, date) => {
      const rows = _get(DB_KEYS.customers);
      const c = rows.find(c => c.customer_id === custId);
      if (c) { c.total_stays = (c.total_stays||0)+stayInc; c.total_spent = (c.total_spent||0)+spentInc; c.last_stay_date = date; }
      _set(DB_KEYS.customers, rows);
    },
    generateId: async () => {
      const rows = _get(DB_KEYS.customers);
      const max = rows.reduce((m,c) => Math.max(m, parseInt(c.customer_id?.replace('CM','')||0)), 0);
      return `CM${(max+1).toString().padStart(5,'0')}`;
    },
    importBatch: async (rows) => {
      const existing = _get(DB_KEYS.customers);
      let success = 0, skip = 0, errors = [];
      for (const c of rows) {
        if (!c.name) { skip++; continue; }
        if (!existing.find(e => e.customer_id === c.customer_id)) {
          existing.push({...c, total_stays: parseInt(c.total_stays)||0, total_spent: parseInt(c.total_spent)||0});
          success++;
        } else skip++;
      }
      _set(DB_KEYS.customers, existing);
      return { success, skip, errors };
    }
  },

  bookings: {
    getAll: async () => _get(DB_KEYS.bookings),
    getActive: async () => _get(DB_KEYS.bookings).filter(b => b.status === 'checked_in'),
    getByDate: async (date) => _get(DB_KEYS.bookings).filter(b => b.check_in_date === date || b.check_out_date === date),
    getByDateRange: async (start, end) => _get(DB_KEYS.bookings).filter(b => b.check_in_date >= start && b.check_in_date <= end),
    getByCustomer: async (custId) => _get(DB_KEYS.bookings).filter(b => b.customer_id === custId),
    add: async (booking) => {
      const rows = _get(DB_KEYS.bookings);
      rows.push({...booking, slip_image: booking.slip_image || '', created_at: new Date().toISOString()});
      _set(DB_KEYS.bookings, rows);
      if (booking.slip_image) await imgStorage.save('booking', booking.booking_id, booking.slip_image);
    },
    update: async (bookingId, updates) => {
      const rows = _get(DB_KEYS.bookings);
      const idx = rows.findIndex(b => b.booking_id === bookingId);
      if (idx !== -1) {
        rows[idx] = {...rows[idx], ...updates, updated_at: new Date().toISOString()};
        _set(DB_KEYS.bookings, rows);
        if (updates.slip_image) await imgStorage.save('booking', bookingId, updates.slip_image);
      }
    },
    getImage: async (bookingId) => {
      return await imgStorage.get('booking', bookingId);
    },
    delete: async (bookingId) => {
      const rows = _get(DB_KEYS.bookings);
      const filtered = rows.filter(b => b.booking_id !== bookingId);
      _set(DB_KEYS.bookings, filtered);
      await imgStorage.delete('booking', bookingId);
    }
  },

  transactions: {
    getAll: async () => _get(DB_KEYS.transactions),
    getByDate: async (date) => _get(DB_KEYS.transactions).filter(t => t.date === date),
    getByDateRange: async (start, end) => _get(DB_KEYS.transactions).filter(t => t.date >= start && t.date <= end),
    add: async (tx) => {
      const rows = _get(DB_KEYS.transactions);
      const id = Date.now();
      rows.push({...tx, id, slip_image: tx.slip_image || '', created_at: new Date().toISOString()});
      _set(DB_KEYS.transactions, rows);
      if (tx.slip_image) await imgStorage.save('tx', id, tx.slip_image);
      return id;
    },
    update: async (txId, updates) => {
      const rows = _get(DB_KEYS.transactions);
      const idx = rows.findIndex(t => t.id == txId);
      if (idx !== -1) {
        rows[idx] = {...rows[idx], ...updates};
        _set(DB_KEYS.transactions, rows);
      }
    },
    updateImage: async (txId, imageData) => {
      const rows = _get(DB_KEYS.transactions);
      const t = rows.find(t => t.id == txId);
      if (t) {
        t.receipt_image = imageData;
        t.slip_image = imageData;
        _set(DB_KEYS.transactions, rows);
        await imgStorage.save('tx', txId, imageData);
      }
    },
    getImage: async (txId) => {
      return await imgStorage.get('tx', txId);
    },
    delete: async (txId) => {
      const rows = _get(DB_KEYS.transactions);
      const filtered = rows.filter(t => t.id != txId);
      _set(DB_KEYS.transactions, filtered);
      await imgStorage.delete('tx', txId);
    }
  },

  settings: {
    get: async () => {
      const s = localStorage.getItem(DB_KEYS.settings);
      return s ? JSON.parse(s) : {openingBalance:4037,depositAmount:200,electricRate:8,waterRate:25};
    },
    update: async (updates) => {
      const s = JSON.parse(localStorage.getItem(DB_KEYS.settings) || '{}');
      _set(DB_KEYS.settings, {...s, ...updates});
    }
  },

  employees: {
    getAll: async () => _get(DB_KEYS.employees),
    getById: async (id) => _get(DB_KEYS.employees).find(e => e.id === id) || null,
    getByUsername: async (username) => _get(DB_KEYS.employees).find(e => e.username === username) || null,
    add: async (employee) => {
      const rows = _get(DB_KEYS.employees);
      rows.push({...employee, id: Date.now(), created_at: new Date().toISOString()});
      _set(DB_KEYS.employees, rows);
    },
    update: async (id, updates) => {
      const rows = _get(DB_KEYS.employees);
      const idx = rows.findIndex(e => e.id === id);
      if (idx !== -1) { rows[idx] = {...rows[idx], ...updates, updated_at: new Date().toISOString()}; _set(DB_KEYS.employees, rows); }
    },
    delete: async (id) => {
      const rows = _get(DB_KEYS.employees);
      _set(DB_KEYS.employees, rows.filter(e => e.id !== id));
    }
  }
};

const Calculator = {
  calculateNights: (ci, co) => { const n = moment(co).diff(moment(ci), 'days'); return n > 0 ? n : 1; },
  calculateTotal: (roomRate, nights, electric, water, deposit, discount) => {
    const roomTotal = roomRate * nights;
    const subtotal = roomTotal + electric + water;
    const afterDiscount = subtotal - discount;
    const grandTotal = afterDiscount + deposit;
    return { roomTotal, electric, water, subtotal, discount, afterDiscount, deposit, grandTotal };
  },
  generateBookingId: () => `BK${moment().format('YYMMDD')}${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`
};

const CSVImport = {
  parse: (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return { headers: [], rows: [] };
    const raw = lines[0].split(',').map(h => h.trim().replace(/"/g,''));
    const map = {
      'รหัสลูกค้า':'customer_id','รหัส':'customer_id','ชื่อ':'name','ชื่อลูกค้า':'name',
      'เบอร์โทร':'phone','เบอร์':'phone','โทร':'phone','ที่อยู่':'address',
      'เลขบัตร':'id_card','บัตรประชาชน':'id_card','อีเมล':'email','email':'email',
      'หมายเหตุ':'notes','จำนวนครั้ง':'total_stays','ยอดรวม':'total_spent',
      'ห้อง':'room_number','หมายเลขห้อง':'room_number','ตึก':'building','อาคาร':'building',
      'ชั้น':'floor','ประเภท':'room_type','ประเภทห้อง':'room_type',
      'ราคา':'price_per_night','ราคา/คืน':'price_per_night','สถานะ':'status',
    };
    const headers = raw.map(h => map[h] || h.toLowerCase());
    const rows = lines.slice(1).filter(l => l.trim()).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/"/g,''));
      const obj = {};
      headers.forEach((h,i) => { if (vals[i] !== undefined) obj[h] = vals[i]; });
      return obj;
    });
    return { headers, rows };
  },
  detectType: (headers) => {
    const h = headers.join(' ');
    if (h.includes('customer_id') || h.includes('name')) return 'customers';
    if (h.includes('room_number') || h.includes('building')) return 'rooms';
    return 'unknown';
  },
  autoGenerateIds: async (rows) => {
    const existing = await db.customers.getAll();
    let maxNum = existing.reduce((m,c) => Math.max(m, parseInt(c.customer_id?.replace('CM','')||0)), 0);
    return rows.map(r => { if (!r.customer_id) { maxNum++; r.customer_id = `CM${maxNum.toString().padStart(5,'0')}`; } return r; });
  }
};

seedDefaultData();
