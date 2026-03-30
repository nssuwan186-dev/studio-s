/**
 * Resort Management System - SQLite Version
 * ระบบจัดการรีสอร์ท - ฐานข้อมูล SQLite จริง
 */

let sqlitePlugin = null;
let dbConnection = null;
let isNative = false;

// ตรวจสอบว่ารันบน Capacitor (APK) หรือ Browser
async function initDatabase() {
  try {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      // === โหมด APK: ใช้ SQLite จริง ===
      isNative = true;
      const { CapacitorSQLite, SQLiteConnection } = window.CapacitorSQLite;
      sqlitePlugin = new SQLiteConnection(CapacitorSQLite);

      const ret = await sqlitePlugin.checkConnectionsConsistency();
      const isConn = (await sqlitePlugin.isConnection('resort_db', false)).result;

      if (ret.result && isConn) {
        dbConnection = await sqlitePlugin.retrieveConnection('resort_db', false);
      } else {
        dbConnection = await sqlitePlugin.createConnection(
          'resort_db', false, 'no-encryption', 1, false
        );
      }

      await dbConnection.open();
      await createTables();
      await seedDefaultData();
      console.log('✅ SQLite เปิดใช้งานแล้ว (Native)');
    } else {
      // === โหมด Browser: ใช้ localStorage เป็น fallback ===
      isNative = false;
      await seedDefaultDataLocal();
      console.log('✅ localStorage mode (Browser preview)');
    }
  } catch (err) {
    console.error('Database init error:', err);
    isNative = false;
    await seedDefaultDataLocal();
  }
}

// สร้างตาราง SQL
async function createTables() {
  const sql = `
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT NOT NULL UNIQUE,
      building TEXT NOT NULL,
      floor INTEGER DEFAULT 1,
      room_type TEXT DEFAULT 'Standard',
      price_per_night INTEGER DEFAULT 400,
      status TEXT DEFAULT 'available'
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      total_stays INTEGER DEFAULT 0,
      total_spent INTEGER DEFAULT 0,
      last_stay_date TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL,
      room_id INTEGER NOT NULL,
      check_in_date TEXT NOT NULL,
      check_out_date TEXT NOT NULL,
      nights INTEGER DEFAULT 1,
      room_rate INTEGER DEFAULT 0,
      room_total INTEGER DEFAULT 0,
      electric_fee INTEGER DEFAULT 0,
      water_fee INTEGER DEFAULT 0,
      discount INTEGER DEFAULT 0,
      deposit INTEGER DEFAULT 0,
      total_amount INTEGER DEFAULT 0,
      amount_paid INTEGER DEFAULT 0,
      change_amount INTEGER DEFAULT 0,
      payment_method TEXT DEFAULT 'cash',
      status TEXT DEFAULT 'checked_in',
      notes TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      item_name TEXT NOT NULL,
      category TEXT DEFAULT 'income',
      room_number TEXT,
      receipt INTEGER DEFAULT 0,
      payment INTEGER DEFAULT 0,
      deposit_cash INTEGER DEFAULT 0,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `;

  await dbConnection.execute(sql);
}

// ข้อมูลเริ่มต้น
async function seedDefaultData() {
  // ตรวจสอบว่ามีข้อมูลห้องแล้วหรือยัง
  const result = await dbConnection.query('SELECT COUNT(*) as cnt FROM rooms');
  if (result.values[0].cnt > 0) return;

  const rooms = [
    ['A101','A',1,'Standard',400],['A102','A',1,'Standard',400],
    ['A103','A',1,'Standard Twin',500],['A104','A',1,'Standard',400],
    ['A105','A',1,'Standard',400],['A201','A',2,'Standard',400],
    ['A202','A',2,'Standard',400],['A203','A',2,'Standard Twin',500],
    ['A204','A',2,'Standard',400],['A205','A',2,'Standard',400],
    ['B101','B',1,'Standard',400],['B102','B',1,'Standard',400],
    ['B103','B',1,'Standard Twin',500],['B104','B',1,'Standard',400],
    ['B105','B',1,'Standard',400],['B201','B',2,'Standard',400],
    ['B202','B',2,'Standard',400],['B203','B',2,'Standard Twin',500],
    ['B204','B',2,'Standard',400],['B205','B',2,'Standard',400],
    ['N1','N',1,'Standard',500],['N2','N',1,'Standard Twin',600],
    ['N3','N',1,'Standard',500],['N4','N',1,'Standard Twin',600],
    ['N5','N',1,'Standard',500],
  ];

  for (const r of rooms) {
    await dbConnection.run(
      `INSERT OR IGNORE INTO rooms (room_number,building,floor,room_type,price_per_night,status) VALUES (?,?,?,?,?,'available')`,
      r
    );
  }

  const customers = [
    ['CM00001','สมชาย ใจดี','081-234-5678','กรุงเทพฯ',5,8000],
    ['CM00002','สมหญิง รักเรียน','082-345-6789','เชียงใหม่',3,4500],
    ['CM00003','John Smith','089-999-8888','Bangkok',2,3000],
    ['CM00004','วิชัย เก่งกาจ','083-456-7890','ภูเก็ต',10,15000],
    ['CM00005','มานี มีนา','084-567-8901','ชลบุรี',1,1200],
  ];

  for (const c of customers) {
    await dbConnection.run(
      `INSERT OR IGNORE INTO customers (customer_id,name,phone,address,total_stays,total_spent) VALUES (?,?,?,?,?,?)`,
      c
    );
  }

  // Settings
  const defaults = [
    ['openingBalance','4037'],
    ['depositAmount','200'],
    ['electricRate','8'],
    ['waterRate','25'],
  ];
  for (const s of defaults) {
    await dbConnection.run(`INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)`, s);
  }
}

// ============================================================
// DATABASE API - ใช้ SQLite (Native) หรือ localStorage (Browser)
// ============================================================

const db = {
  // ROOMS
  rooms: {
    getAll: async () => {
      if (isNative) {
        const r = await dbConnection.query('SELECT * FROM rooms ORDER BY building, room_number');
        return r.values || [];
      }
      return JSON.parse(localStorage.getItem('resort_rooms') || '[]');
    },
    getById: async (id) => {
      if (isNative) {
        const r = await dbConnection.query('SELECT * FROM rooms WHERE id=?', [id]);
        return r.values?.[0] || null;
      }
      return JSON.parse(localStorage.getItem('resort_rooms') || '[]').find(r => r.id === id);
    },
    getByStatus: async (status) => {
      if (isNative) {
        const r = await dbConnection.query('SELECT * FROM rooms WHERE status=? ORDER BY building, room_number', [status]);
        return r.values || [];
      }
      return JSON.parse(localStorage.getItem('resort_rooms') || '[]').filter(r => r.status === status);
    },
    getByBuilding: async (building) => {
      if (isNative) {
        const r = await dbConnection.query('SELECT * FROM rooms WHERE building=? ORDER BY room_number', [building]);
        return r.values || [];
      }
      return JSON.parse(localStorage.getItem('resort_rooms') || '[]').filter(r => r.building === building);
    },
    update: async (id, updates) => {
      if (isNative) {
        const sets = Object.keys(updates).map(k => `${k}=?`).join(',');
        await dbConnection.run(`UPDATE rooms SET ${sets} WHERE id=?`, [...Object.values(updates), id]);
        return true;
      }
      const rooms = JSON.parse(localStorage.getItem('resort_rooms') || '[]');
      const idx = rooms.findIndex(r => r.id === id);
      if (idx !== -1) { rooms[idx] = {...rooms[idx], ...updates}; localStorage.setItem('resort_rooms', JSON.stringify(rooms)); }
      return true;
    }
  },

  // CUSTOMERS
  customers: {
    getAll: async () => {
      if (isNative) {
        const r = await dbConnection.query('SELECT * FROM customers ORDER BY name');
        return r.values || [];
      }
      return JSON.parse(localStorage.getItem('resort_customers') || '[]');
    },
    getById: async (custId) => {
      if (isNative) {
        const r = await dbConnection.query('SELECT * FROM customers WHERE customer_id=?', [custId]);
        return r.values?.[0] || null;
      }
      return JSON.parse(localStorage.getItem('resort_customers') || '[]').find(c => c.customer_id === custId);
    },
    search: async (query) => {
      if (isNative) {
        const q = `%${query}%`;
        const r = await dbConnection.query(
          'SELECT * FROM customers WHERE name LIKE ? OR customer_id LIKE ? OR phone LIKE ? ORDER BY name',
          [q, q, q]
        );
        return r.values || [];
      }
      const q = query.toLowerCase();
      return JSON.parse(localStorage.getItem('resort_customers') || '[]').filter(c =>
        c.name.toLowerCase().includes(q) || c.customer_id.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
      );
    },
    add: async (customer) => {
      if (isNative) {
        await dbConnection.run(
          `INSERT INTO customers (customer_id,name,phone,address,total_stays,total_spent) VALUES (?,?,?,?,?,?)`,
          [customer.customer_id, customer.name, customer.phone||'', customer.address||'', 0, 0]
        );
      } else {
        const customers = JSON.parse(localStorage.getItem('resort_customers') || '[]');
        customers.push(customer);
        localStorage.setItem('resort_customers', JSON.stringify(customers));
      }
    },
    updateStats: async (custId, stayInc, spentInc, date) => {
      if (isNative) {
        await dbConnection.run(
          `UPDATE customers SET total_stays=total_stays+?, total_spent=total_spent+?, last_stay_date=? WHERE customer_id=?`,
          [stayInc, spentInc, date, custId]
        );
      } else {
        const customers = JSON.parse(localStorage.getItem('resort_customers') || '[]');
        const c = customers.find(c => c.customer_id === custId);
        if (c) { c.total_stays=(c.total_stays||0)+stayInc; c.total_spent=(c.total_spent||0)+spentInc; c.last_stay_date=date; }
        localStorage.setItem('resort_customers', JSON.stringify(customers));
      }
    },
    generateId: async () => {
      if (isNative) {
        const r = await dbConnection.query('SELECT customer_id FROM customers ORDER BY customer_id DESC LIMIT 1');
        const last = r.values?.[0]?.customer_id || 'CM00000';
        const num = parseInt(last.replace('CM','')) + 1;
        return `CM${num.toString().padStart(5,'0')}`;
      }
      const customers = JSON.parse(localStorage.getItem('resort_customers') || '[]');
      const max = customers.reduce((m,c) => Math.max(m, parseInt(c.customer_id.replace('CM',''))), 0);
      return `CM${(max+1).toString().padStart(5,'0')}`;
    }
  },

  // BOOKINGS
  bookings: {
    getAll: async () => {
      if (isNative) {
        const r = await dbConnection.query('SELECT * FROM bookings ORDER BY created_at DESC');
        return r.values || [];
      }
      return JSON.parse(localStorage.getItem('resort_bookings') || '[]');
    },
    getActive: async () => {
      if (isNative) {
        const r = await dbConnection.query(`SELECT * FROM bookings WHERE status='checked_in'`);
        return r.values || [];
      }
      return JSON.parse(localStorage.getItem('resort_bookings') || '[]').filter(b => b.status === 'checked_in');
    },
    getByDate: async (date) => {
      if (isNative) {
        const r = await dbConnection.query(
          `SELECT * FROM bookings WHERE check_in_date=? OR check_out_date=?`, [date, date]
        );
        return r.values || [];
      }
      return JSON.parse(localStorage.getItem('resort_bookings') || '[]').filter(b =>
        b.check_in_date === date || b.check_out_date === date
      );
    },
    getByDateRange: async (start, end) => {
      if (isNative) {
        const r = await dbConnection.query(
          `SELECT * FROM bookings WHERE check_in_date >= ? AND check_in_date <= ?`, [start, end]
        );
        return r.values || [];
      }
      return JSON.parse(localStorage.getItem('resort_bookings') || '[]').filter(b =>
        b.check_in_date >= start && b.check_in_date <= end
      );
    },
    add: async (booking) => {
      if (isNative) {
        await dbConnection.run(
          `INSERT INTO bookings (booking_id,customer_id,room_id,check_in_date,check_out_date,nights,
           room_rate,room_total,electric_fee,water_fee,discount,deposit,total_amount,amount_paid,
           change_amount,payment_method,status,notes,created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [booking.booking_id, booking.customer_id, booking.room_id,
           booking.check_in_date, booking.check_out_date, booking.nights,
           booking.room_rate, booking.room_total, booking.electric_fee,
           booking.water_fee, booking.discount, booking.deposit,
           booking.total_amount, booking.amount_paid, booking.change_amount,
           booking.payment_method, booking.status, booking.notes||'', booking.created_at]
        );
      } else {
        const bookings = JSON.parse(localStorage.getItem('resort_bookings') || '[]');
        bookings.push(booking);
        localStorage.setItem('resort_bookings', JSON.stringify(bookings));
      }
    },
    update: async (bookingId, updates) => {
      if (isNative) {
        const sets = Object.keys(updates).map(k => `${k}=?`).join(',');
        await dbConnection.run(`UPDATE bookings SET ${sets} WHERE booking_id=?`, [...Object.values(updates), bookingId]);
      } else {
        const bookings = JSON.parse(localStorage.getItem('resort_bookings') || '[]');
        const idx = bookings.findIndex(b => b.booking_id === bookingId);
        if (idx !== -1) { bookings[idx] = {...bookings[idx], ...updates}; localStorage.setItem('resort_bookings', JSON.stringify(bookings)); }
      }
    }
  },

  // TRANSACTIONS
  transactions: {
    getAll: async () => {
      if (isNative) {
        const r = await dbConnection.query('SELECT * FROM transactions ORDER BY date DESC, id DESC');
        return r.values || [];
      }
      return JSON.parse(localStorage.getItem('resort_transactions') || '[]');
    },
    getByDate: async (date) => {
      if (isNative) {
        const r = await dbConnection.query('SELECT * FROM transactions WHERE date=? ORDER BY id ASC', [date]);
        return r.values || [];
      }
      return JSON.parse(localStorage.getItem('resort_transactions') || '[]').filter(t => t.date === date);
    },
    getByDateRange: async (start, end) => {
      if (isNative) {
        const r = await dbConnection.query(
          'SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date, id', [start, end]
        );
        return r.values || [];
      }
      return JSON.parse(localStorage.getItem('resort_transactions') || '[]').filter(t =>
        t.date >= start && t.date <= end
      );
    },
    add: async (tx) => {
      if (isNative) {
        await dbConnection.run(
          `INSERT INTO transactions (date,item_name,category,room_number,receipt,payment,deposit_cash,notes)
           VALUES (?,?,?,?,?,?,?,?)`,
          [tx.date, tx.item_name, tx.category||'income', tx.room_number||'',
           tx.receipt||0, tx.payment||0, tx.deposit_cash||0, tx.notes||'']
        );
      } else {
        const txs = JSON.parse(localStorage.getItem('resort_transactions') || '[]');
        txs.push(tx);
        localStorage.setItem('resort_transactions', JSON.stringify(txs));
      }
    }
  },

  // SETTINGS
  settings: {
    get: async () => {
      if (isNative) {
        const r = await dbConnection.query('SELECT key, value FROM settings');
        const s = {};
        (r.values || []).forEach(row => { s[row.key] = isNaN(row.value) ? row.value : Number(row.value); });
        return s;
      }
      const s = JSON.parse(localStorage.getItem('resort_settings') || 'null');
      return s || { openingBalance: 4037, depositAmount: 200, electricRate: 8, waterRate: 25 };
    },
    update: async (updates) => {
      if (isNative) {
        for (const [k, v] of Object.entries(updates)) {
          await dbConnection.run(`INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)`, [k, String(v)]);
        }
      } else {
        const s = JSON.parse(localStorage.getItem('resort_settings') || '{}');
        localStorage.setItem('resort_settings', JSON.stringify({...s, ...updates}));
      }
    }
  }
};

// Fallback seed data for localStorage mode
async function seedDefaultDataLocal() {
  if (!localStorage.getItem('resort_rooms')) {
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
      {id:11,room_number:'B101',building:'B',floor:1,room_type:'Standard',price_per_night:400,status:'available'},
      {id:12,room_number:'B102',building:'B',floor:1,room_type:'Standard',price_per_night:400,status:'available'},
      {id:13,room_number:'B103',building:'B',floor:1,room_type:'Standard Twin',price_per_night:500,status:'available'},
      {id:14,room_number:'B104',building:'B',floor:1,room_type:'Standard',price_per_night:400,status:'available'},
      {id:15,room_number:'B105',building:'B',floor:1,room_type:'Standard',price_per_night:400,status:'available'},
      {id:16,room_number:'B201',building:'B',floor:2,room_type:'Standard',price_per_night:400,status:'available'},
      {id:17,room_number:'B202',building:'B',floor:2,room_type:'Standard',price_per_night:400,status:'available'},
      {id:18,room_number:'B203',building:'B',floor:2,room_type:'Standard Twin',price_per_night:500,status:'available'},
      {id:19,room_number:'B204',building:'B',floor:2,room_type:'Standard',price_per_night:400,status:'available'},
      {id:20,room_number:'B205',building:'B',floor:2,room_type:'Standard',price_per_night:400,status:'available'},
      {id:21,room_number:'N1',building:'N',floor:1,room_type:'Standard',price_per_night:500,status:'available'},
      {id:22,room_number:'N2',building:'N',floor:1,room_type:'Standard Twin',price_per_night:600,status:'available'},
      {id:23,room_number:'N3',building:'N',floor:1,room_type:'Standard',price_per_night:500,status:'available'},
      {id:24,room_number:'N4',building:'N',floor:1,room_type:'Standard Twin',price_per_night:600,status:'available'},
      {id:25,room_number:'N5',building:'N',floor:1,room_type:'Standard',price_per_night:500,status:'available'},
    ];
    localStorage.setItem('resort_rooms', JSON.stringify(rooms));
  }
  if (!localStorage.getItem('resort_customers')) {
    localStorage.setItem('resort_customers', JSON.stringify([
      {customer_id:'CM00001',name:'สมชาย ใจดี',phone:'081-234-5678',address:'กรุงเทพฯ',total_stays:5,total_spent:8000},
      {customer_id:'CM00002',name:'สมหญิง รักเรียน',phone:'082-345-6789',address:'เชียงใหม่',total_stays:3,total_spent:4500},
      {customer_id:'CM00003',name:'John Smith',phone:'089-999-8888',address:'Bangkok',total_stays:2,total_spent:3000},
    ]));
  }
  if (!localStorage.getItem('resort_bookings')) localStorage.setItem('resort_bookings', JSON.stringify([]));
  if (!localStorage.getItem('resort_transactions')) localStorage.setItem('resort_transactions', JSON.stringify([]));
  if (!localStorage.getItem('resort_settings')) {
    localStorage.setItem('resort_settings', JSON.stringify({openingBalance:4037,depositAmount:200,electricRate:8,waterRate:25}));
  }
}

// Calculator utilities
const Calculator = {
  calculateNights: (checkIn, checkOut) => {
    const nights = moment(checkOut).diff(moment(checkIn), 'days');
    return nights > 0 ? nights : 1;
  },
  calculateTotal: (roomRate, nights, electric, water, deposit, discount) => {
    const roomTotal = roomRate * nights;
    const subtotal = roomTotal + electric + water;
    const afterDiscount = subtotal - discount;
    const grandTotal = afterDiscount + deposit;
    return { roomTotal, electric, water, subtotal, discount, afterDiscount, deposit, grandTotal };
  },
  generateBookingId: () => {
    const random = Math.floor(Math.random() * 1000).toString().padStart(3,'0');
    return `BK${moment().format('YYMMDD')}${random}`;
  }
};

// Init on load
document.addEventListener('DOMContentLoaded', async () => {
  await initDatabase();
  await appInit();
});
