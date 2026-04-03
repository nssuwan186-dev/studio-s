/**
 * Resort Suite v5 - IndexedDB Database Layer
 * 
 * @module db
 * @description Modern storage with IndexedDB for better performance and larger capacity
 */

import { openDB } from 'idb';

// =============================================================
// CONSTANTS
// =============================================================

const DB_NAME = 'resort-suite-v5';
const DB_VERSION = 1;

const STORES = {
  rooms: 'rooms',
  customers: 'customers',
  bookings: 'bookings',
  transactions: 'transactions',
  settings: 'settings',
  employees: 'employees',
  images: 'images',
  sync: 'sync'
};

// =============================================================
// DATABASE INSTANCE
// =============================================================

let dbInstance = null;

/**
 * Get or create database instance
 * @returns {Promise<IDBPDatabase>}
 */
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
        roomStore.createIndex('floor', 'floor');
      }

      // Customers store
      if (!db.objectStoreNames.contains(STORES.customers)) {
        const customerStore = db.createObjectStore(STORES.customers, { keyPath: 'customer_id' });
        customerStore.createIndex('name', 'name');
        customerStore.createIndex('phone', 'phone');
        customerStore.createIndex('id_card', 'id_card');
      }

      // Bookings store
      if (!db.objectStoreNames.contains(STORES.bookings)) {
        const bookingStore = db.createObjectStore(STORES.bookings, { keyPath: 'booking_id' });
        bookingStore.createIndex('customer_id', 'customer_id');
        bookingStore.createIndex('room_id', 'room_id');
        bookingStore.createIndex('status', 'status');
        bookingStore.createIndex('check_in_date', 'check_in_date');
        bookingStore.createIndex('check_out_date', 'check_out_date');
      }

      // Transactions store
      if (!db.objectStoreNames.contains(STORES.transactions)) {
        const txStore = db.createObjectStore(STORES.transactions, { keyPath: 'id', autoIncrement: true });
        txStore.createIndex('date', 'date');
        txStore.createIndex('type', 'type');
        txStore.createIndex('room_number', 'room_number');
      }

      // Settings store
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'key' });
      }

      // Employees store
      if (!db.objectStoreNames.contains(STORES.employees)) {
        const empStore = db.createObjectStore(STORES.employees, { keyPath: 'id', autoIncrement: true });
        empStore.createIndex('username', 'username', { unique: true });
        empStore.createIndex('role', 'role');
        empStore.createIndex('status', 'status');
      }

      // Images store
      if (!db.objectStoreNames.contains(STORES.images)) {
        db.createObjectStore(STORES.images, { keyPath: 'id' });
      }

      // Sync metadata store
      if (!db.objectStoreNames.contains(STORES.sync)) {
        db.createObjectStore(STORES.sync, { keyPath: 'key' });
      }
    }
  });

  return dbInstance;
}

// =============================================================
// SEED DATA
// =============================================================

/**
 * Seed default data if database is empty
 */
async function seedDefaultData() {
  const db = await getDB();
  
  // Check if rooms already exist
  const existingRooms = await db.getAll(STORES.rooms);
  if (existingRooms.length === 0) {
    const rooms = [];
    let id = 1;
    
    // Building A - 11 rooms
    for (let i = 1; i <= 11; i++) {
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
    
    // Building B - 11 rooms
    for (let i = 1; i <= 11; i++) {
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
    
    // Building N - 7 rooms
    for (let i = 1; i <= 7; i++) {
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
        openingBalance: 4037,
        depositAmount: 200,
        electricRate: 8,
        waterRate: 25,
        currency: 'THB',
        language: 'th',
        darkMode: false
      }
    });
  }
}

// =============================================================
// DATABASE OPERATIONS
// =============================================================

const db = {
  /**
   * Room operations
   */
  rooms: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll(STORES.rooms);
    },
    getById: async (id) => {
      const database = await getDB();
      return database.get(STORES.rooms, id);
    },
    getByNumber: async (number) => {
      const database = await getDB();
      return database.getFromIndex(STORES.rooms, 'room_number', number);
    },
    getByStatus: async (status) => {
      const database = await getDB();
      return database.getAllFromIndex(STORES.rooms, 'status', status);
    },
    getByBuilding: async (building) => {
      const database = await getDB();
      return database.getAllFromIndex(STORES.rooms, 'building', building);
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
    },
    delete: async (id) => {
      const database = await getDB();
      return database.delete(STORES.rooms, id);
    },
    bulkAdd: async (rooms) => {
      const database = await getDB();
      const tx = database.transaction(STORES.rooms, 'readwrite');
      await Promise.all([
        ...rooms.map(room => tx.store.put(room)),
        tx.done
      ]);
    }
  },

  /**
   * Customer operations
   */
  customers: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll(STORES.customers);
    },
    getById: async (customerId) => {
      const database = await getDB();
      return database.get(STORES.customers, customerId);
    },
    search: async (query) => {
      const database = await getDB();
      const all = await database.getAll(STORES.customers);
      const q = query.toLowerCase();
      return all.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.customer_id && c.customer_id.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.id_card && c.id_card.includes(q))
      );
    },
    add: async (customer) => {
      const database = await getDB();
      return database.put(STORES.customers, customer);
    },
    update: async (customerId, updates) => {
      const database = await getDB();
      const customer = await database.get(STORES.customers, customerId);
      if (customer) {
        await database.put(STORES.customers, { ...customer, ...updates, updated_at: new Date().toISOString() });
      }
    },
    delete: async (customerId) => {
      const database = await getDB();
      return database.delete(STORES.customers, customerId);
    },
    updateStats: async (customerId, stayInc, spentInc, date) => {
      const database = await getDB();
      const customer = await database.get(STORES.customers, customerId);
      if (customer) {
        customer.total_stays = (customer.total_stays || 0) + stayInc;
        customer.total_spent = (customer.total_spent || 0) + spentInc;
        customer.last_stay_date = date;
        await database.put(STORES.customers, customer);
      }
    }
  },

  /**
   * Booking operations
   */
  bookings: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll(STORES.bookings);
    },
    getActive: async () => {
      const database = await getDB();
      return database.getAllFromIndex(STORES.bookings, 'status', 'checked_in');
    },
    getByDate: async (date) => {
      const database = await getDB();
      const all = await database.getAll(STORES.bookings);
      return all.filter(b => b.check_in_date === date || b.check_out_date === date);
    },
    getByDateRange: async (start, end) => {
      const database = await getDB();
      const all = await database.getAll(STORES.bookings);
      return all.filter(b => b.check_in_date >= start && b.check_in_date <= end);
    },
    getByCustomer: async (customerId) => {
      const database = await getDB();
      return database.getAllFromIndex(STORES.bookings, 'customer_id', customerId);
    },
    add: async (booking) => {
      const database = await getDB();
      return database.put(STORES.bookings, { ...booking, created_at: new Date().toISOString() });
    },
    update: async (bookingId, updates) => {
      const database = await getDB();
      const booking = await database.get(STORES.bookings, bookingId);
      if (booking) {
        await database.put(STORES.bookings, { ...booking, ...updates, updated_at: new Date().toISOString() });
      }
    },
    delete: async (bookingId) => {
      const database = await getDB();
      return database.delete(STORES.bookings, bookingId);
    }
  },

  /**
   * Transaction operations
   */
  transactions: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll(STORES.transactions);
    },
    getByDate: async (date) => {
      const database = await getDB();
      return database.getAllFromIndex(STORES.transactions, 'date', date);
    },
    getByDateRange: async (start, end) => {
      const database = await getDB();
      const all = await database.getAll(STORES.transactions);
      return all.filter(t => t.date >= start && t.date <= end);
    },
    getByType: async (type) => {
      const database = await getDB();
      return database.getAllFromIndex(STORES.transactions, 'type', type);
    },
    add: async (tx) => {
      const database = await getDB();
      return database.add(STORES.transactions, { ...tx, created_at: new Date().toISOString() });
    },
    update: async (txId, updates) => {
      const database = await getDB();
      const tx = await database.get(STORES.transactions, txId);
      if (tx) {
        await database.put(STORES.transactions, { ...tx, ...updates });
      }
    },
    delete: async (txId) => {
      const database = await getDB();
      return database.delete(STORES.transactions, txId);
    }
  },

  /**
   * Settings operations
   */
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

  /**
   * Employee operations
   */
  employees: {
    getAll: async () => {
      const database = await getDB();
      return database.getAll(STORES.employees);
    },
    getById: async (id) => {
      const database = await getDB();
      return database.get(STORES.employees, id);
    },
    getByUsername: async (username) => {
      const database = await getDB();
      return database.getFromIndex(STORES.employees, 'username', username);
    },
    add: async (employee) => {
      const database = await getDB();
      return database.add(STORES.employees, employee);
    },
    update: async (id, updates) => {
      const database = await getDB();
      const emp = await database.get(STORES.employees, id);
      if (emp) {
        await database.put(STORES.employees, { ...emp, ...updates, updated_at: new Date().toISOString() });
      }
    },
    delete: async (id) => {
      const database = await getDB();
      return database.delete(STORES.employees, id);
    }
  },

  /**
   * Image operations
   */
  images: {
    save: async (type, id, imageData) => {
      const database = await getDB();
      return database.put(STORES.images, { id: `${type}_${id}`, type, refId: id, data: imageData, created_at: new Date().toISOString() });
    },
    get: async (type, id) => {
      const database = await getDB();
      const img = await database.get(STORES.images, `${type}_${id}`);
      return img?.data || null;
    },
    delete: async (type, id) => {
      const database = await getDB();
      return database.delete(STORES.images, `${type}_${id}`);
    }
  },

  /**
   * Sync operations
   */
  sync: {
    getLastSync: async () => {
      const database = await getDB();
      const sync = await database.get(STORES.sync, 'last_sync');
      return sync?.timestamp || null;
    },
    setLastSync: async (timestamp) => {
      const database = await getDB();
      await database.put(STORES.sync, { key: 'last_sync', timestamp });
    }
  },

  /**
   * Export all data to JSON
   * @returns {Promise<string>}
   */
  export: async () => {
    const database = await getDB();
    const data = {};
    for (const store of Object.values(STORES)) {
      if (store !== 'images') {
        data[store] = await database.getAll(store);
      }
    }
    return JSON.stringify(data, null, 2);
  },

  /**
   * Import data from JSON
   * @param {string} jsonData 
   */
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

  /**
   * Clear all data and reseed
   */
  clear: async () => {
    const database = await getDB();
    for (const store of Object.values(STORES)) {
      await database.clear(store);
    }
    await seedDefaultData();
  }
};

// =============================================================
// INITIALIZATION
// =============================================================

(async function init() {
  try {
    await seedDefaultData();
    console.log('[DB] Database initialized successfully');
  } catch (err) {
    console.error('[DB] Database initialization error:', err);
  }
})();

// =============================================================
// EXPORTS
// =============================================================

export { db, STORES, getDB };
