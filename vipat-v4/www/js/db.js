/**
 * Resort Management System - SQLite v3
 * เพิ่ม: รูปภาพใบเสร็จ + Import CSV
 */

let sqlitePlugin = null;
let dbConnection = null;
let isNative = false;

async function initDatabase() {
  try {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      isNative = true;
      const { CapacitorSQLite, SQLiteConnection } = window.CapacitorSQLite;
      sqlitePlugin = new SQLiteConnection(CapacitorSQLite);
      const ret = await sqlitePlugin.checkConnectionsConsistency();
      const isConn = (await sqlitePlugin.isConnection('resort_db', false)).result;
      if (ret.result && isConn) {
        dbConnection = await sqlitePlugin.retrieveConnection('resort_db', false);
      } else {
        dbConnection = await sqlitePlugin.createConnection('resort_db', false, 'no-encryption', 1, false);
      }
      await dbConnection.open();
      await createTables();
      await seedDefaultData();
      console.log('SQLite Native OK');
    } else {
      isNative = false;
      await seedDefaultDataLocal();
      console.log('localStorage fallback OK');
    }
  } catch (err) {
    console.error('DB init error:', err);
    isNative = false;
    await seedDefaultDataLocal();
  }
}

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
      id_card TEXT,
      email TEXT,
      notes TEXT,
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
      notes TEXT,
      receipt_image TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS receipt_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER,
      booking_id TEXT DEFAULT '',
      image_data TEXT NOT NULL,
      image_name TEXT DEFAULT 'receipt.jpg',
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `;
  await dbConnection.execute(sql);
}

async function seedDefaultData() {
  const result = await dbConnection.query('SELECT COUNT(*) as cnt FROM rooms');
  if (result.values[0].cnt > 0) return;
  const rooms = [
    // ตึก A ชั้น 1 (11 ห้อง)
    ['A101','A',1,'Standard',400],['A102','A',1,'Standard',400],['A103','A',1,'Standard',400],
    ['A104','A',1,'Standard',400],['A105','A',1,'Standard',400],['A106','A',1,'Standard',400],
    ['A107','A',1,'Standard',400],['A108','A',1,'Standard',400],['A109','A',1,'Standard',400],
    ['A110','A',1,'Standard',400],['A111','A',1,'Standard',400],
    // ตึก A ชั้น 2 (11 ห้อง)
    ['A201','A',2,'Standard',400],['A202','A',2,'Standard',400],['A203','A',2,'Standard',400],
    ['A204','A',2,'Standard',400],['A205','A',2,'Standard',400],['A206','A',2,'Standard',400],
    ['A207','A',2,'Standard',400],['A208','A',2,'Standard',400],['A209','A',2,'Standard',400],
    ['A210','A',2,'Standard',400],['A211','A',2,'Standard',400],
    // ตึก B ชั้น 1 (11 ห้อง)
    ['B101','B',1,'Standard',400],['B102','B',1,'Standard',400],['B103','B',1,'Standard',400],
    ['B104','B',1,'Standard Twin',500],['B105','B',1,'Standard Twin',500],['B106','B',1,'Standard Twin',500],
    ['B107','B',1,'Standard Twin',500],['B108','B',1,'Standard Twin',500],['B109','B',1,'Standard Twin',500],
    ['B110','B',1,'Standard Twin',500],['B111','B',1,'Standard Twin',500],
    // ตึก B ชั้น 2 (11 ห้อง)
    ['B201','B',2,'Standard',400],['B202','B',2,'Standard',400],['B203','B',2,'Standard',400],
    ['B204','B',2,'Standard Twin',500],['B205','B',2,'Standard Twin',500],['B206','B',2,'Standard Twin',500],
    ['B207','B',2,'Standard Twin',500],['B208','B',2,'Standard Twin',500],['B209','B',2,'Standard Twin',500],
    ['B210','B',2,'Standard Twin',500],['B211','B',2,'Standard Twin',500],
    // ตึก N (7 ห้อง)
    ['N1','N',1,'Standard Twin',600],['N2','N',1,'Standard Twin',600],['N3','N',1,'Standard Twin',600],
    ['N4','N',1,'Standard Twin',600],['N5','N',1,'Standard Twin',600],
    ['N6','N',1,'Standard Twin',600],['N7','N',1,'Standard Twin',600],
  ];
  for (const r of rooms) {
    await dbConnection.run(
      `INSERT OR IGNORE INTO rooms (room_number,building,floor,room_type,price_per_night,status) VALUES (?,?,?,?,?,'available')`, r
    );
  }
  const defaults = [['openingBalance','4037'],['depositAmount','200'],['electricRate','8'],['waterRate','25']];
  for (const s of defaults) {
    await dbConnection.run(`INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)`, s);
  }
}

const db = {
  rooms: {
    getAll: async () => {
      if (isNative) return (await dbConnection.query('SELECT * FROM rooms ORDER BY building, room_number')).values || [];
      return JSON.parse(localStorage.getItem('resort_rooms') || '[]');
    },
    getById: async (id) => {
      if (isNative) return (await dbConnection.query('SELECT * FROM rooms WHERE id=?', [id])).values?.[0] || null;
      return JSON.parse(localStorage.getItem('resort_rooms') || '[]').find(r => r.id === id);
    },
    getByStatus: async (status) => {
      if (isNative) return (await dbConnection.query('SELECT * FROM rooms WHERE status=? ORDER BY building, room_number', [status])).values || [];
      return JSON.parse(localStorage.getItem('resort_rooms') || '[]').filter(r => r.status === status);
    },
    update: async (id, updates) => {
      if (isNative) {
        const sets = Object.keys(updates).map(k => `${k}=?`).join(',');
        await dbConnection.run(`UPDATE rooms SET ${sets} WHERE id=?`, [...Object.values(updates), id]);
      } else {
        const rooms = JSON.parse(localStorage.getItem('resort_rooms') || '[]');
        const idx = rooms.findIndex(r => r.id === id);
        if (idx !== -1) { rooms[idx] = {...rooms[idx], ...updates}; localStorage.setItem('resort_rooms', JSON.stringify(rooms)); }
      }
    },
    importBatch: async (rows) => {
      let success = 0, skip = 0;
      for (const r of rows) {
        if (!r.room_number || !r.building) { skip++; continue; }
        try {
          if (isNative) {
            await dbConnection.run(
              `INSERT OR IGNORE INTO rooms (room_number,building,floor,room_type,price_per_night,status) VALUES (?,?,?,?,?,?)`,
              [r.room_number, r.building, parseInt(r.floor)||1, r.room_type||'Standard', parseInt(r.price_per_night)||400, r.status||'available']
            );
          } else {
            const existing = JSON.parse(localStorage.getItem('resort_rooms') || '[]');
            if (!existing.find(e => e.room_number === r.room_number)) {
              existing.push({id: Date.now()+success, room_number:r.room_number, building:r.building, floor:parseInt(r.floor)||1, room_type:r.room_type||'Standard', price_per_night:parseInt(r.price_per_night)||400, status:r.status||'available'});
              localStorage.setItem('resort_rooms', JSON.stringify(existing));
            }
          }
          success++;
        } catch(e) { skip++; }
      }
      return { success, skip };
    }
  },

  customers: {
    getAll: async () => {
      if (isNative) return (await dbConnection.query('SELECT * FROM customers ORDER BY name')).values || [];
      return JSON.parse(localStorage.getItem('resort_customers') || '[]');
    },
    getById: async (custId) => {
      if (isNative) return (await dbConnection.query('SELECT * FROM customers WHERE customer_id=?', [custId])).values?.[0] || null;
      return JSON.parse(localStorage.getItem('resort_customers') || '[]').find(c => c.customer_id === custId);
    },
    search: async (query) => {
      if (isNative) {
        const q = `%${query}%`;
        return (await dbConnection.query(
          'SELECT * FROM customers WHERE name LIKE ? OR customer_id LIKE ? OR phone LIKE ? OR id_card LIKE ? ORDER BY name',
          [q, q, q, q]
        )).values || [];
      }
      const q = query.toLowerCase();
      return JSON.parse(localStorage.getItem('resort_customers') || '[]').filter(c =>
        c.name.toLowerCase().includes(q) || c.customer_id.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
      );
    },
    add: async (customer) => {
      if (isNative) {
        await dbConnection.run(
          `INSERT OR IGNORE INTO customers (customer_id,name,phone,address,id_card,email,notes,total_stays,total_spent) VALUES (?,?,?,?,?,?,?,?,?)`,
          [customer.customer_id, customer.name, customer.phone||'', customer.address||'', customer.id_card||'', customer.email||'', customer.notes||'', 0, 0]
        );
      } else {
        const customers = JSON.parse(localStorage.getItem('resort_customers') || '[]');
        customers.push(customer);
        localStorage.setItem('resort_customers', JSON.stringify(customers));
      }
    },
    importBatch: async (rows) => {
      let success = 0, skip = 0, errors = [];
      for (const c of rows) {
        if (!c.name) { skip++; continue; }
        try {
          if (isNative) {
            await dbConnection.run(
              `INSERT OR IGNORE INTO customers (customer_id,name,phone,address,id_card,email,notes,total_stays,total_spent) VALUES (?,?,?,?,?,?,?,?,?)`,
              [c.customer_id, c.name, c.phone||'', c.address||'', c.id_card||'', c.email||'', c.notes||'', parseInt(c.total_stays)||0, parseInt(c.total_spent)||0]
            );
          } else {
            const existing = JSON.parse(localStorage.getItem('resort_customers') || '[]');
            if (!existing.find(e => e.customer_id === c.customer_id)) {
              existing.push({...c, total_stays: parseInt(c.total_stays)||0, total_spent: parseInt(c.total_spent)||0});
              localStorage.setItem('resort_customers', JSON.stringify(existing));
            }
          }
          success++;
        } catch(e) { errors.push(c.name); }
      }
      return { success, skip, errors };
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
        return `CM${(parseInt(last.replace('CM',''))+1).toString().padStart(5,'0')}`;
      }
      const customers = JSON.parse(localStorage.getItem('resort_customers') || '[]');
      const max = customers.reduce((m,c) => Math.max(m, parseInt(c.customer_id?.replace('CM','')||0)), 0);
      return `CM${(max+1).toString().padStart(5,'0')}`;
    }
  },

  bookings: {
    getAll: async () => {
      if (isNative) return (await dbConnection.query('SELECT * FROM bookings ORDER BY created_at DESC')).values || [];
      return JSON.parse(localStorage.getItem('resort_bookings') || '[]');
    },
    getActive: async () => {
      if (isNative) return (await dbConnection.query(`SELECT * FROM bookings WHERE status='checked_in'`)).values || [];
      return JSON.parse(localStorage.getItem('resort_bookings') || '[]').filter(b => b.status==='checked_in');
    },
    getByDate: async (date) => {
      if (isNative) return (await dbConnection.query(`SELECT * FROM bookings WHERE check_in_date=? OR check_out_date=?`, [date, date])).values || [];
      return JSON.parse(localStorage.getItem('resort_bookings') || '[]').filter(b => b.check_in_date===date || b.check_out_date===date);
    },
    getByDateRange: async (start, end) => {
      if (isNative) return (await dbConnection.query(`SELECT * FROM bookings WHERE check_in_date >= ? AND check_in_date <= ?`, [start, end])).values || [];
      return JSON.parse(localStorage.getItem('resort_bookings') || '[]').filter(b => b.check_in_date>=start && b.check_in_date<=end);
    },
    add: async (booking) => {
      if (isNative) {
        await dbConnection.run(
          `INSERT INTO bookings (booking_id,customer_id,room_id,check_in_date,check_out_date,nights,room_rate,room_total,electric_fee,water_fee,discount,deposit,total_amount,amount_paid,change_amount,payment_method,status,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [booking.booking_id,booking.customer_id,booking.room_id,booking.check_in_date,booking.check_out_date,booking.nights,booking.room_rate,booking.room_total,booking.electric_fee,booking.water_fee,booking.discount,booking.deposit,booking.total_amount,booking.amount_paid,booking.change_amount,booking.payment_method,booking.status,booking.notes||'',booking.created_at]
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
        const idx = bookings.findIndex(b => b.booking_id===bookingId);
        if (idx !== -1) { bookings[idx]={...bookings[idx],...updates}; localStorage.setItem('resort_bookings', JSON.stringify(bookings)); }
      }
    }
  },

  transactions: {
    getAll: async () => {
      if (isNative) return (await dbConnection.query('SELECT * FROM transactions ORDER BY date DESC, id DESC')).values || [];
      return JSON.parse(localStorage.getItem('resort_transactions') || '[]');
    },
    getByDate: async (date) => {
      if (isNative) return (await dbConnection.query('SELECT * FROM transactions WHERE date=? ORDER BY id ASC', [date])).values || [];
      return JSON.parse(localStorage.getItem('resort_transactions') || '[]').filter(t => t.date===date);
    },
    getByDateRange: async (start, end) => {
      if (isNative) return (await dbConnection.query('SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date, id', [start, end])).values || [];
      return JSON.parse(localStorage.getItem('resort_transactions') || '[]').filter(t => t.date>=start && t.date<=end);
    },
    add: async (tx) => {
      if (isNative) {
        const result = await dbConnection.run(
          `INSERT INTO transactions (date,item_name,category,room_number,receipt,payment,deposit_cash,notes,receipt_image) VALUES (?,?,?,?,?,?,?,?,?)`,
          [tx.date,tx.item_name,tx.category||'income',tx.room_number||'',tx.receipt||0,tx.payment||0,tx.deposit_cash||0,tx.notes||'',tx.receipt_image||'']
        );
        return result.changes?.lastId;
      } else {
        const txs = JSON.parse(localStorage.getItem('resort_transactions') || '[]');
        const id = Date.now();
        txs.push({...tx, id});
        localStorage.setItem('resort_transactions', JSON.stringify(txs));
        return id;
      }
    },
    updateImage: async (txId, imageData) => {
      if (isNative) await dbConnection.run(`UPDATE transactions SET receipt_image=? WHERE id=?`, [imageData, txId]);
      else {
        const txs = JSON.parse(localStorage.getItem('resort_transactions') || '[]');
        const t = txs.find(t => t.id===txId);
        if (t) { t.receipt_image = imageData; localStorage.setItem('resort_transactions', JSON.stringify(txs)); }
      }
    }
  },

  images: {
    save: async (txId, bookingId, imageData, imageName) => {
      if (isNative) {
        await dbConnection.run(
          `INSERT INTO receipt_images (transaction_id,booking_id,image_data,image_name,created_at) VALUES (?,?,?,?,?)`,
          [txId||null, bookingId||'', imageData, imageName||'receipt.jpg', new Date().toISOString()]
        );
      } else {
        const imgs = JSON.parse(localStorage.getItem('resort_images') || '[]');
        imgs.push({id:Date.now(), transaction_id:txId, booking_id:bookingId, image_data:imageData, image_name:imageName||'receipt.jpg', created_at:new Date().toISOString()});
        localStorage.setItem('resort_images', JSON.stringify(imgs));
      }
    },
    getByTransaction: async (txId) => {
      if (isNative) return (await dbConnection.query('SELECT * FROM receipt_images WHERE transaction_id=?', [txId])).values || [];
      return JSON.parse(localStorage.getItem('resort_images') || '[]').filter(i => i.transaction_id===txId);
    },
    delete: async (id) => {
      if (isNative) await dbConnection.run('DELETE FROM receipt_images WHERE id=?', [id]);
      else {
        const imgs = JSON.parse(localStorage.getItem('resort_images') || '[]').filter(i => i.id!==id);
        localStorage.setItem('resort_images', JSON.stringify(imgs));
      }
    }
  },

  settings: {
    get: async () => {
      if (isNative) {
        const r = await dbConnection.query('SELECT key, value FROM settings');
        const s = {};
        (r.values||[]).forEach(row => { s[row.key] = isNaN(row.value) ? row.value : Number(row.value); });
        return s;
      }
      return JSON.parse(localStorage.getItem('resort_settings') || 'null') || {openingBalance:4037,depositAmount:200,electricRate:8,waterRate:25};
    },
    update: async (updates) => {
      if (isNative) {
        for (const [k,v] of Object.entries(updates)) await dbConnection.run(`INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)`, [k, String(v)]);
      } else {
        const s = JSON.parse(localStorage.getItem('resort_settings') || '{}');
        localStorage.setItem('resort_settings', JSON.stringify({...s,...updates}));
      }
    }
  }
};

// CSV Import Utilities
const CSVImport = {
  parse: (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return { headers: [], rows: [] };
    const raw = lines[0].split(',').map(h => h.trim().replace(/"/g,''));
    const headers = raw.map(h => {
      const map = {
        'รหัสลูกค้า':'customer_id','รหัส':'customer_id',
        'ชื่อ':'name','ชื่อลูกค้า':'name',
        'เบอร์โทร':'phone','เบอร์':'phone','โทร':'phone',
        'ที่อยู่':'address',
        'เลขบัตร':'id_card','บัตรประชาชน':'id_card',
        'อีเมล':'email','email':'email',
        'หมายเหตุ':'notes',
        'จำนวนครั้ง':'total_stays',
        'ยอดรวม':'total_spent',
        'ห้อง':'room_number','หมายเลขห้อง':'room_number',
        'ตึก':'building','อาคาร':'building',
        'ชั้น':'floor',
        'ประเภท':'room_type','ประเภทห้อง':'room_type',
        'ราคา':'price_per_night','ราคา/คืน':'price_per_night',
        'สถานะ':'status',
      };
      return map[h] || h.toLowerCase();
    });
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
    return rows.map(r => {
      if (!r.customer_id) { maxNum++; r.customer_id = `CM${maxNum.toString().padStart(5,'0')}`; }
      return r;
    });
  }
};

async function seedDefaultDataLocal() {
  if (!localStorage.getItem('resort_rooms')) {
    localStorage.setItem('resort_rooms', JSON.stringify([
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
    ]));
  }
  if (!localStorage.getItem('resort_customers')) localStorage.setItem('resort_customers', JSON.stringify([]));
  if (!localStorage.getItem('resort_bookings')) localStorage.setItem('resort_bookings', JSON.stringify([]));
  if (!localStorage.getItem('resort_transactions')) localStorage.setItem('resort_transactions', JSON.stringify([]));
  if (!localStorage.getItem('resort_settings')) localStorage.setItem('resort_settings', JSON.stringify({openingBalance:4037,depositAmount:200,electricRate:8,waterRate:25}));
}

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

document.addEventListener('DOMContentLoaded', async () => {
  await initDatabase();
  await appInit();
});
