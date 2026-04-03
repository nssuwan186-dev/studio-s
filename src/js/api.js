/**
 * VIPAT Hotel Manager - API Service
 * เชื่อมต่อกับ FastAPI Backend และ Sync กับ localStorage
 */

const API_URL = localStorage.getItem('API_URL') || 'http://localhost:8000/api/v1';
let isOnline = false;
let syncEnabled = localStorage.getItem('syncEnabled') === 'true';

async function checkOnlineStatus() {
  try {
    const response = await fetch(`${API_URL.replace('/api/v1', '')}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    isOnline = response.ok;
  } catch (e) {
    isOnline = false;
  }
  updateOnlineStatus();
  return isOnline;
}

function updateOnlineStatus() {
  const statusEl = document.getElementById('online-status');
  if (statusEl) {
    statusEl.textContent = isOnline ? 'ออนไลน์' : 'ออฟไลน์';
    statusEl.style.color = isOnline ? '#4caf50' : '#f44336';
  }
}

function setApiUrl(url) {
  API_URL = url;
  localStorage.setItem('API_URL', url);
}

function toggleSync(enabled) {
  syncEnabled = enabled;
  localStorage.setItem('syncEnabled', enabled);
}

const api = {
  rooms: {
    getAll: async () => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/rooms/`);
        return await res.json();
      } catch (e) { return null; }
    },
    create: async (room) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/rooms/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(room)
        });
        return await res.json();
      } catch (e) { return null; }
    },
    update: async (id, room) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/rooms/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(room)
        });
        return await res.json();
      } catch (e) { return null; }
    },
    delete: async (id) => {
      if (!isOnline) return false;
      try {
        await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE' });
        return true;
      } catch (e) { return false; }
    }
  },

  customers: {
    getAll: async () => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/customers/`);
        return await res.json();
      } catch (e) { return null; }
    },
    getById: async (customerId) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/customers/${customerId}`);
        return res.ok ? await res.json() : null;
      } catch (e) { return null; }
    },
    create: async (customer) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/customers/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer)
        });
        return await res.json();
      } catch (e) { return null; }
    },
    update: async (customerId, customer) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/customers/${customerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer)
        });
        return await res.json();
      } catch (e) { return null; }
    },
    delete: async (customerId) => {
      if (!isOnline) return false;
      try {
        await fetch(`${API_URL}/customers/${customerId}`, { method: 'DELETE' });
        return true;
      } catch (e) { return false; }
    },
    search: async (query) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/customers/?search=${encodeURIComponent(query)}`);
        return await res.json();
      } catch (e) { return null; }
    }
  },

  employees: {
    getAll: async () => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/employees/`);
        return await res.json();
      } catch (e) { return null; }
    },
    login: async (username, password) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/employees/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        if (!res.ok) return null;
        return await res.json();
      } catch (e) { return null; }
    },
    create: async (employee) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/employees/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employee)
        });
        return await res.json();
      } catch (e) { return null; }
    },
    update: async (username, employee) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/employees/${username}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employee)
        });
        return await res.json();
      } catch (e) { return null; }
    },
    delete: async (username) => {
      if (!isOnline) return false;
      try {
        await fetch(`${API_URL}/employees/${username}`, { method: 'DELETE' });
        return true;
      } catch (e) { return false; }
    }
  },

  bookings: {
    getAll: async () => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/bookings/`);
        return await res.json();
      } catch (e) { return null; }
    },
    getById: async (bookingId) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/bookings/${bookingId}`);
        return res.ok ? await res.json() : null;
      } catch (e) { return null; }
    },
    create: async (booking) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/bookings/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking)
        });
        return await res.json();
      } catch (e) { return null; }
    },
    update: async (bookingId, booking) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking)
        });
        return await res.json();
      } catch (e) { return null; }
    },
    delete: async (bookingId) => {
      if (!isOnline) return false;
      try {
        await fetch(`${API_URL}/bookings/${bookingId}`, { method: 'DELETE' });
        return true;
      } catch (e) { return false; }
    },
    getTodayCheckins: async () => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/bookings/today/checkins`);
        return await res.json();
      } catch (e) { return null; }
    },
    getTodayCheckouts: async () => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/bookings/today/checkouts`);
        return await res.json();
      } catch (e) { return null; }
    }
  },

  transactions: {
    getAll: async () => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/finance/`);
        return await res.json();
      } catch (e) { return null; }
    },
    getByDate: async (date) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/finance/?start_date=${date}&end_date=${date}`);
        return await res.json();
      } catch (e) { return null; }
    },
    getByDateRange: async (startDate, endDate) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/finance/?start_date=${startDate}&end_date=${endDate}`);
        return await res.json();
      } catch (e) { return null; }
    },
    create: async (transaction) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/finance/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction)
        });
        return await res.json();
      } catch (e) { return null; }
    },
    update: async (id, transaction) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/finance/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction)
        });
        return await res.json();
      } catch (e) { return null; }
    },
    delete: async (id) => {
      if (!isOnline) return false;
      try {
        await fetch(`${API_URL}/finance/${id}`, { method: 'DELETE' });
        return true;
      } catch (e) { return false; }
    },
    getDailySummary: async (date) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/finance/daily/summary?trans_date=${date}`);
        return await res.json();
      } catch (e) { return null; }
    }
  },

  reports: {
    getDailyRevenue: async (startDate, endDate) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/reports/daily/revenue?start_date=${startDate}&end_date=${endDate}`);
        return await res.json();
      } catch (e) { return null; }
    },
    getMonthlyRevenue: async (year) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/reports/monthly/revenue?year=${year}`);
        return await res.json();
      } catch (e) { return null; }
    },
    getOccupancy: async (startDate, endDate) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/reports/occupancy?start_date=${startDate}&end_date=${endDate}`);
        return await res.json();
      } catch (e) { return null; }
    },
    getEmployeeSalary: async (month, year) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/reports/employees/salary?month=${month}&year=${year}`);
        return await res.json();
      } catch (e) { return null; }
    },
    getTopCustomers: async (limit = 10) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/reports/top/customers?limit=${limit}`);
        return await res.json();
      } catch (e) { return null; }
    },
    getSummary: async () => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/reports/summary`);
        return await res.json();
      } catch (e) { return null; }
    }
  },

  settings: {
    get: async () => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/finance/settings`);
        return await res.json();
      } catch (e) { return null; }
    },
    update: async (settings) => {
      if (!isOnline) return null;
      try {
        const res = await fetch(`${API_URL}/finance/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });
        return await res.json();
      } catch (e) { return null; }
    }
  }
};

async function syncAll() {
  if (!isOnline || !syncEnabled) return { success: false, message: 'Sync disabled or offline' };

  const results = { rooms: 0, customers: 0, employees: 0, bookings: 0, transactions: 0 };

  try {
    const remoteRooms = await api.rooms.getAll();
    if (remoteRooms && remoteRooms.length > 0) {
      await db.rooms.importBatch(remoteRooms);
      results.rooms = remoteRooms.length;
    }

    const remoteCustomers = await api.customers.getAll();
    if (remoteCustomers && remoteCustomers.length > 0) {
      await db.customers.importBatch(remoteCustomers);
      results.customers = remoteCustomers.length;
    }

    const remoteEmployees = await api.employees.getAll();
    if (remoteEmployees && remoteEmployees.length > 0) {
      for (const emp of remoteEmployees) {
        const existing = await db.employees.getByUsername(emp.username);
        if (!existing) {
          await db.employees.add(emp);
        }
      }
      results.employees = remoteEmployees.length;
    }

    const remoteBookings = await api.bookings.getAll();
    if (remoteBookings && remoteBookings.length > 0) {
      for (const bk of remoteBookings) {
        const existing = await db.bookings.getAll();
        if (!existing.find(b => b.booking_id === bk.booking_id)) {
          await db.bookings.add(bk);
        }
      }
      results.bookings = remoteBookings.length;
    }

    const remoteTransactions = await api.transactions.getAll();
    if (remoteTransactions && remoteTransactions.length > 0) {
      for (const tx of remoteTransactions) {
        const existing = await db.transactions.getAll();
        if (!existing.find(t => t.id === tx.id)) {
          await db.transactions.add(tx);
        }
      }
      results.transactions = remoteTransactions.length;
    }

    return { success: true, results };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

async function pushAllToServer() {
  if (!isOnline || !syncEnabled) return { success: false, message: 'Sync disabled or offline' };

  const results = { rooms: 0, customers: 0, employees: 0, bookings: 0, transactions: 0 };

  try {
    const rooms = await db.rooms.getAll();
    for (const room of rooms) {
      const remote = await api.rooms.getAll();
      const exists = remote?.find(r => r.room_number === room.room_number);
      if (!exists) {
        await api.rooms.create(room);
        results.rooms++;
      }
    }

    const customers = await db.customers.getAll();
    for (const customer of customers) {
      const exists = await api.customers.getById(customer.customer_id);
      if (!exists) {
        await api.customers.create(customer);
        results.customers++;
      }
    }

    const employees = await db.employees.getAll();
    for (const emp of employees) {
      const remote = await api.employees.getAll();
      const exists = remote?.find(e => e.username === emp.username);
      if (!exists) {
        await api.employees.create(emp);
        results.employees++;
      }
    }

    const bookings = await db.bookings.getAll();
    for (const bk of bookings) {
      const exists = await api.bookings.getById(bk.booking_id);
      if (!exists) {
        await api.bookings.create(bk);
        results.bookings++;
      }
    }

    const transactions = await db.transactions.getAll();
    for (const tx of transactions) {
      await api.transactions.create(tx);
      results.transactions++;
    }

    return { success: true, results };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// Export for ES Module usage
export { api, API_URL, setApiUrl, toggleSync, checkOnlineStatus };

// Initialize on module load
setInterval(checkOnlineStatus, 30000);
checkOnlineStatus();
