/**
 * Resort Suite v5.2 - Hotel ERP Database
 * แยกชัดเจน: รายวัน (โรงแรม) vs รายเดือน (หอพัก)
 * พร้อมระบบภาษีอัตโนมัติ (VAT 7%, อบจ. 1%)
 */

import { openDB } from 'idb';

const DB_NAME = 'hotel-erp-v5.2';
const DB_VERSION = 1;

const STORES = {
  rooms: 'rooms',
  daily_guests: 'daily_guests',       // ผู้เข้าพักรายวัน (โรงแรม)
  monthly_tenants: 'monthly_tenants',  // ผู้เช่ารายเดือน (หอพัก)
  master_data: 'master_data',          // Single Source of Truth
  transactions: 'transactions',
  settings: 'settings',
  employees: 'employees',
  images: 'images'
};

let dbInstance = null;

async function getDB() {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Rooms store
      if (!db.objectStoreNames.contains(STORES.rooms)) {
        const roomStore = db.createObjectStore(STORES.rooms, { keyPath: 'id', autoIncrement: true });
        roomStore.createIndex('room_number', 'room_number', { unique: true });
        roomStore.createIndex('building', 'building');
        roomStore.createIndex('status', 'status');
        roomStore.createIndex('rental_type', 'rental_type'); // 'daily' or 'monthly'
      }

      // Daily Guests (โรงแรม)
      if (!db.objectStoreNames.contains(STORES.daily_guests)) {
        const guestStore = db.createObjectStore(STORES.daily_guests, { keyPath: 'RCP_ID' });
        guestStore.createIndex('Customer_Name', 'Customer_Name');
        guestStore.createIndex('Customer_Phone', 'Customer_Phone');
        guestStore.createIndex('Citizen_ID_Passport', 'Citizen_ID_Passport');
        guestStore.createIndex('Check_In_Date', 'Check_In_Date');
        guestStore.createIndex('Check_Out_Date', 'Check_Out_Date');
        guestStore.createIndex('Room_ID', 'Room_ID');
        guestStore.createIndex('Payment_Status', 'Payment_Status');
      }

      // Monthly Tenants (หอพัก)
      if (!db.objectStoreNames.contains(STORES.monthly_tenants)) {
        const tenantStore = db.createObjectStore(STORES.monthly_tenants, { keyPath: 'RCP_ID' });
        tenantStore.createIndex('Customer_Name', 'Customer_Name');
        tenantStore.createIndex('Customer_Phone', 'Customer_Phone');
        tenantStore.createIndex('Citizen_ID_Passport', 'Citizen_ID_Passport');
        tenantStore.createIndex('Lease_Start', 'Lease_Start');
        tenantStore.createIndex('Lease_End', 'Lease_End');
        tenantStore.createIndex('Room_ID', 'Room_ID');
        tenantStore.createIndex('Payment_Status', 'Payment_Status');
      }

      // Master Data - Single Source of Truth
      if (!db.objectStoreNames.contains(STORES.master_data)) {
        const masterStore = db.createObjectStore(STORES.master_data, { keyPath: 'RCP_ID' });
        masterStore.createIndex('Transaction_Date', 'Transaction_Date');
        masterStore.createIndex('Customer_Name', 'Customer_Name');
        masterStore.createIndex('Customer_Phone', 'Customer_Phone');
        masterStore.createIndex('Rental_Type', 'Rental_Type'); // 'daily' or 'monthly'
        masterStore.createIndex('Check_In_Date', 'Check_In_Date');
        masterStore.createIndex('Room_ID', 'Room_ID');
        masterStore.createIndex('Payment_Status', 'Payment_Status');
      }

      // Transactions
      if (!db.objectStoreNames.contains(STORES.transactions)) {
        const txStore = db.createObjectStore(STORES.transactions, { keyPath: 'id', autoIncrement: true });
        txStore.createIndex('date', 'date');
        txStore.createIndex('type', 'type');
        txStore.createIndex('rental_type', 'rental_type');
      }

      // Settings
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'key' });
      }

      // Employees
      if (!db.objectStoreNames.contains(STORES.employees)) {
        const empStore = db.createObjectStore(STORES.employees, { keyPath: 'id', autoIncrement: true });
        empStore.createIndex('username', 'username', { unique: true });
        empStore.createIndex('role', 'role');
      }

      // Images
      if (!db.objectStoreNames.contains(STORES.images)) {
        db.createObjectStore(STORES.images, { keyPath: 'id' });
      }
    }
  });

  return dbInstance;
}

// =============================================================
// TAX CALCULATION ENGINE
// =============================================================

const TaxCalculator = {
  /**
   * คำนวณภาษีอัตโนมัติ
   * VAT 7% (ถอยจากค่าห้องที่รวม VAT แล้ว)
   * ภาษี อบจ. 1% (จากค่าห้อง)
   */
  calculate: (totalRoomCharge, serviceFee = 0) => {
    const totalIncome = totalRoomCharge + serviceFee;
    
    // VAT 7% - ถอยจากยอดรวมที่รวม VAT แล้ว
    const vatBase = totalRoomCharge / 1.07;
    const vatAmount = vatBase * 0.07;
    
    // ภาษี อบจ. 1% - จากค่าห้อง (ไม่รวม Service Fee)
    const paoTax = totalRoomCharge * 0.01;
    
    // รายได้สุทธิ
    const netRevenue = totalRoomCharge - vatAmount - paoTax;
    
    return {
      totalRoomCharge: Math.round(totalRoomCharge * 100) / 100,
      serviceFee: Math.round(serviceFee * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      vatBase: Math.round(vatBase * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      paoTax: Math.round(paoTax * 100) / 100,
      netRevenue: Math.round(netRevenue * 100) / 100
    };
  }
};

// =============================================================
// ID GENERATORS
// =============================================================

const IDGenerator = {
  // เลขที่ใบเสร็จ: VP + YYMMDD + XXX
  receipt: () => {
    const now = new Date();
    const date = `${now.getFullYear().toString().slice(2)}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}`;
    const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `VP${date}${seq}`;
  },
  
  // Booking ID
  booking: () => {
    const now = new Date();
    const date = `${now.getFullYear().toString().slice(2)}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}`;
    const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BK${date}${seq}`;
  },
  
  // Customer ID
  customer: () => {
    const seq = Math.floor(Math.random() * 90000) + 10000;
    return `C${seq}`;
  }
};

// =============================================================
// SEED DATA
// =============================================================

async function seedDefaultData() {
  const db = await getDB();
  
  // Seed rooms
  const existingRooms = await db.getAll(STORES.rooms);
  if (existingRooms.length === 0) {
    const rooms = [];
    let id = 1;
    
    // Building A - 11 rooms (รายวัน)
    for (let i = 1; i <= 11; i++) {
      const floor = i <= 5 ? 1 : 2;
      rooms.push({
        id: id++,
        room_number: `A10${i}`,
        building: 'A',
        floor,
        room_type: i === 3 || i === 8 ? 'Standard Twin' : 'Standard',
        rate_daily: i === 3 || i === 8 ? 500 : 400,
        rate_monthly: i === 3 || i === 8 ? 8000 : 6000,
        rental_type: 'daily', // ห้องนี้สำหรับรายวัน
        status: 'available'
      });
    }
    
    // Building B - 11 rooms (รายวัน)
    for (let i = 1; i <= 11; i++) {
      const floor = i <= 5 ? 1 : 2;
      rooms.push({
        id: id++,
        room_number: `B10${i}`,
        building: 'B',
        floor,
        room_type: i === 3 || i === 8 || i === 11 ? 'Standard Twin' : 'Standard',
        rate_daily: i === 3 || i === 8 || i === 11 ? 500 : 400,
        rate_monthly: i === 3 || i === 8 || i === 11 ? 8000 : 6000,
        rental_type: 'daily',
        status: 'available'
      });
    }
    
    // Building N - 7 rooms (รายเดือน - หอพัก)
    for (let i = 1; i <= 7; i++) {
      rooms.push({
        id: id++,
        room_number: `N${i}`,
        building: 'N',
        floor: 1,
        room_type: i === 2 || i === 4 || i === 7 ? 'Standard Twin' : 'Standard',
        rate_daily: i === 2 || i === 4 || i === 7 ? 600 : 500,
        rate_monthly: i === 2 || i === 4 || i === 7 ? 5500 : 4500,
        rental_type: 'monthly', // ห้องนี้สำหรับรายเดือน
        status: 'available'
      });
    }
    
    const tx = db.transaction(STORES.rooms, 'readwrite');
    await Promise.all([
      ...rooms.map(room => tx.store.put(room)),
      tx.done
    ]);
  }

  // Seed employees
  const existingEmps = await db.getAll(STORES.employees);
  if (existingEmps.length === 0) {
    const employees = [
      { id: 1, username: 'admin', password: 'admin123', name: 'ผู้ดูแลระบบ', role: 'admin', phone: '081-234-5678', status: 'active', created_at: new Date().toISOString() },
      { id: 2, username: 'manager', password: 'manager123', name: 'ผู้จัดการ', role: 'manager', phone: '082-345-6789', status: 'active', created_at: new Date().toISOString() },
      { id: 3, username: 'staff', password: 'staff123', name: 'พนักงาน', role: 'staff', phone: '083-456-7890', status: 'active', created_at: new Date().toISOString() }
    ];
    
    const tx = db.transaction(STORES.employees, 'readwrite');
    await Promise.all([
      ...employees.map(emp => tx.store.put(emp)),
      tx.done
    ]);
  }

  // Seed settings
  const existingSettings = await db.get(STORES.settings, 'app_settings');
  if (!existingSettings) {
    await db.put(STORES.settings, {
      key: 'app_settings',
      value: {
        vatRate: 7,
        paoTaxRate: 1,
        electricRate: 8,
        waterRate: 25,
        depositAmount: 200,
        currency: 'THB'
      }
    });
  }
}

// =============================================================
// DATABASE API
// =============================================================

const db = {
  // =============================================================
  // ROOMS
  // =============================================================
  rooms: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll(STORES.rooms);
    },
    getByRentalType: async (type) => {
      const database = await getDB();
      return database.getAllFromIndex(STORES.rooms, 'rental_type', type);
    },
    getByStatus: async (status) => {
      const database = await getDB();
      return database.getAllFromIndex(STORES.rooms, 'status', status);
    },
    getById: async (id) => {
      const database = await getDB();
      return database.get(STORES.rooms, id);
    },
    getByNumber: async (number) => {
      const database = await getDB();
      return database.getFromIndex(STORES.rooms, 'room_number', number);
    },
    update: async (id, updates) => {
      const database = await getDB();
      const room = await database.get(STORES.rooms, id);
      if (room) {
        await database.put(STORES.rooms, { ...room, ...updates, updated_at: new Date().toISOString() });
      }
    },
    add: async (room) => {
      const database = await getDB();
      return database.add(STORES.rooms, { ...room, created_at: new Date().toISOString() });
    }
  },

  // =============================================================
  // DAILY GUESTS (โรงแรม)
  // =============================================================
  dailyGuests: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll(STORES.daily_guests);
    },
    getActive: async () => {
      const database = await getDB();
      const all = await database.getAll(STORES.daily_guests);
      const today = new Date().toISOString().split('T')[0];
      return all.filter(g => g.Check_In_Date <= today && g.Check_Out_Date >= today && g.Payment_Status !== 'checked_out');
    },
    checkingOutToday: async () => {
      const database = await getDB();
      const all = await database.getAll(STORES.daily_guests);
      const today = new Date().toISOString().split('T')[0];
      return all.filter(g => g.Check_Out_Date === today && g.Payment_Status !== 'checked_out');
    },
    getById: async (rcpId) => {
      const database = await getDB();
      return database.get(STORES.daily_guests, rcpId);
    },
    add: async (guest) => {
      const database = await getDB();
      return database.put(STORES.daily_guests, guest);
    },
    update: async (rcpId, updates) => {
      const database = await getDB();
      const guest = await database.get(STORES.daily_guests, rcpId);
      if (guest) {
        await database.put(STORES.daily_guests, { ...guest, ...updates });
      }
    },
    // ร.ร.4 Report - ผู้เข้าพักวันนี้
    getRR4Report: async (date) => {
      const database = await getDB();
      const all = await database.getAll(STORES.daily_guests);
      const targetDate = date || new Date().toISOString().split('T')[0];
      return all.filter(g => g.Check_In_Date === targetDate);
    }
  },

  // =============================================================
  // MONTHLY TENANTS (หอพัก)
  // =============================================================
  monthlyTenants: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll(STORES.monthly_tenants);
    },
    getActive: async () => {
      const database = await getDB();
      const all = await database.getAll(STORES.monthly_tenants);
      const today = new Date().toISOString().split('T')[0];
      return all.filter(t => t.Lease_Start <= today && t.Lease_End >= today && t.Payment_Status !== 'terminated');
    },
    getById: async (rcpId) => {
      const database = await getDB();
      return database.get(STORES.monthly_tenants, rcpId);
    },
    add: async (tenant) => {
      const database = await getDB();
      return database.put(STORES.monthly_tenants, tenant);
    },
    update: async (rcpId, updates) => {
      const database = await getDB();
      const tenant = await database.get(STORES.monthly_tenants, rcpId);
      if (tenant) {
        await database.put(STORES.monthly_tenants, { ...tenant, ...updates });
      }
    },
    // ร.ร.6 Report - ภาษี อบจ. รายเดือน
    getRR6Report: async (year, month) => {
      const database = await getDB();
      const all = await database.getAll(STORES.monthly_tenants);
      const targetMonth = `${year}-${month.toString().padStart(2, '0')}`;
      return all.filter(t => t.Lease_Start.startsWith(targetMonth));
    }
  },

  // =============================================================
  // MASTER DATA - Single Source of Truth
  // =============================================================
  masterData: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll(STORES.master_data);
    },
    getByDateRange: async (start, end) => {
      const database = await getDB();
      const all = await database.getAll(STORES.master_data);
      return all.filter(r => r.Check_In_Date >= start && r.Check_In_Date <= end);
    },
    getByRentalType: async (type) => {
      const database = await getDB();
      return database.getAllFromIndex(STORES.master_data, 'Rental_Type', type);
    },
    getById: async (rcpId) => {
      const database = await getDB();
      return database.get(STORES.master_data, rcpId);
    },
    add: async (record) => {
      const database = await getDB();
      return database.put(STORES.master_data, record);
    },
    // Search by name or phone
    search: async (query) => {
      const database = await getDB();
      const all = await database.getAll(STORES.master_data);
      const q = query.toLowerCase();
      return all.filter(r =>
        (r.Customer_Name && r.Customer_Name.toLowerCase().includes(q)) ||
        (r.Customer_Phone && r.Customer_Phone.includes(q)) ||
        (r.Citizen_ID_Passport && r.Citizen_ID_Passport.includes(q))
      );
    }
  },

  // =============================================================
  // TRANSACTIONS
  // =============================================================
  transactions: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll(STORES.transactions);
    },
    getByDate: async (date) => {
      const database = await getDB();
      return database.getAllFromIndex(STORES.transactions, 'date', date);
    },
    add: async (tx) => {
      const database = await getDB();
      return database.add(STORES.transactions, { ...tx, created_at: new Date().toISOString() });
    }
  },

  // =============================================================
  // SETTINGS
  // =============================================================
  settings: {
    get: async (key = 'app_settings') => {
      const database = await getDB();
      const setting = await database.get(STORES.settings, key);
      return setting?.value || null;
    },
    update: async (updates, key = 'app_settings') => {
      const database = await getDB();
      const existing = await database.get(STORES.settings, key);
      if (existing) {
        await database.put(STORES.settings, { key, value: { ...existing.value, ...updates } });
      } else {
        await database.put(STORES.settings, { key, value: updates });
      }
    }
  },

  // =============================================================
  // EMPLOYEES
  // =============================================================
  employees: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll(STORES.employees);
    },
    getByUsername: async (username) => {
      const database = await getDB();
      return database.getFromIndex(STORES.employees, 'username', username);
    },
    add: async (employee) => {
      const database = await getDB();
      return database.add(STORES.employees, employee);
    }
  },

  // =============================================================
  // EXPORT/IMPORT
  // =============================================================
  export: async () => {
    const database = await getDB();
    const data = {};
    for (const store of Object.values(STORES)) {
      data[store] = await database.getAll(store);
    }
    return JSON.stringify(data, null, 2);
  },

  import: async (jsonData) => {
    const database = await getDB();
    const data = JSON.parse(jsonData);
    for (const [storeName, items] of Object.entries(data)) {
      if (Array.isArray(items)) {
        const tx = database.transaction(storeName, 'readwrite');
        await Promise.all([
          ...items.map(item => tx.store.put(item)),
          tx.done
        ]);
      }
    }
  },

  clear: async () => {
    const database = await getDB();
    for (const store of Object.values(STORES)) {
      await database.clear(store);
    }
    await seedDefaultData();
  }
};

// =============================================================
// INIT
// =============================================================

(async function init() {
  try {
    await seedDefaultData();
    console.log('[DB] Hotel ERP Database initialized');
  } catch (err) {
    console.error('[DB] Initialization error:', err);
  }
})();

export { db, TaxCalculator, IDGenerator, STORES, getDB };
