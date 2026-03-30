import { Preferences } from '@capacitor/preferences';

// คลาสจัดการข้อมูลห้องพัก
class ResortManager {
    constructor() {
        this.rooms = [];
        this.init();
    }

    async init() {
        await this.loadRooms();
        this.renderRooms();
        this.setupEventListeners();
    }

    // โหลดข้อมูลจาก localStorage (ผ่าน Capacitor Preferences)
    async loadRooms() {
        try {
            const { value } = await Preferences.get({ key: 'rooms' });
            this.rooms = value ? JSON.parse(value) : this.getDefaultRooms();
        } catch (error) {
            console.error('Error loading rooms:', error);
            this.rooms = this.getDefaultRooms();
        }
    }

    // บันทึกข้อมูลลง localStorage
    async saveRooms() {
        try {
            await Preferences.set({
                key: 'rooms',
                value: JSON.stringify(this.rooms)
            });
        } catch (error) {
            console.error('Error saving rooms:', error);
        }
    }

    // ห้องเริ่มต้น
    getDefaultRooms() {
        return [
            { id: 1, number: '101', type: 'standard', status: 'available', guest: null },
            { id: 2, number: '102', type: 'standard', status: 'occupied', guest: 'คุณสมชาย' },
            { id: 3, number: '201', type: 'deluxe', status: 'available', guest: null },
            { id: 4, number: '202', type: 'deluxe', status: 'available', guest: null },
            { id: 5, number: '301', type: 'suite', status: 'occupied', guest: 'คุณวิภา' },
        ];
    }

    // เพิ่มห้องใหม่
    async addRoom(number, type) {
        const newRoom = {
            id: Date.now(),
            number,
            type,
            status: 'available',
            guest: null
        };
        this.rooms.push(newRoom);
        await this.saveRooms();
        this.renderRooms();
    }

    // อัพเดทสถานะห้อง
    async updateRoomStatus(id, status, guest = null) {
        const room = this.rooms.find(r => r.id === id);
        if (room) {
            room.status = status;
            room.guest = guest;
            await this.saveRooms();
            this.renderRooms();
        }
    }

    // แสดงรายการห้อง
    renderRooms() {
        const container = document.getElementById('roomsContainer');
        container.innerHTML = '';

        this.rooms.forEach(room => {
            const roomCard = document.createElement('div');
            roomCard.className = `room-card ${room.status}`;
            roomCard.innerHTML = `
                <div class="room-number">${room.number}</div>
                <div class="room-type">${this.getTypeLabel(room.type)}</div>
                <div class="room-status ${room.status}">
                    ${room.status === 'occupied' ? 'ไม่ว่าง' : 'ว่าง'}
                </div>
                ${room.guest ? `<div class="guest-name">${room.guest}</div>` : ''}
            `;
            
            roomCard.addEventListener('click', () => this.showRoomDetails(room));
            container.appendChild(roomCard);
        });
    }

    getTypeLabel(type) {
        const labels = {
            standard: 'Standard',
            deluxe: 'Deluxe',
            suite: 'Suite'
        };
        return labels[type] || type;
    }

    // แสดงรายละเอียดห้อง (สำหรับพัฒนาต่อ)
    showRoomDetails(room) {
        const action = room.status === 'available' 
            ? confirm(`ห้อง ${room.number} ว่าง\nต้องการเช็คอินผู้เข้าพัก?`)
            : confirm(`ห้อง ${room.number} ไม่ว่าง\nผู้เข้าพัก: ${room.guest}\nต้องการเช็คเอาท์?`);
        
        if (action) {
            if (room.status === 'available') {
                const guestName = prompt('ชื่อผู้เข้าพัก:');
                if (guestName) {
                    this.updateRoomStatus(room.id, 'occupied', guestName);
                }
            } else {
                this.updateRoomStatus(room.id, 'available', null);
            }
        }
    }

    setupEventListeners() {
        // Form เพิ่มห้อง
        document.getElementById('addRoomForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const number = document.getElementById('roomNumber').value;
            const type = document.getElementById('roomType').value;
            
            if (number) {
                await this.addRoom(number, type);
                e.target.reset();
            }
        });

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }
}

// เริ่มต้นแอปเมื่อ DOM พร้อม
document.addEventListener('DOMContentLoaded', () => {
    new ResortManager();
});

// Service Worker สำหรับ Offline Support (ต้องสร้างไฟล์ sw.js เพิ่ม)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}
