console.log('Notifications.js skripta se začenja nalagati...');


// basically kak zglednejo obvestila v dropdowne
class NotificationManager {
    constructor() {
        this.socket = null;
        this.userId = null;
        this.userType = null;
        this.isInitialized = false;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.init();
            });
        } else {
            setTimeout(() => this.init(), 500);
        }
    }

    attemptInit() {
        console.log('Attempting to initialize notifications...');
        this.getUserData();
        if (this.userId && this.userType && !this.isInitialized) {
            console.log('Starting notification initialization for:', this.userType, this.userId);
            this.init();
        } else {
            console.log('Notification manager already initialized or missing data');
        }
    }

    init() {
        if (this.isInitialized) {
            return;
        }
        
        this.getUserData();
        
        if (this.userId && this.userType) {
            this.initializeSocket();
            this.setupEventListeners();
            this.loadNotifications();
            this.loadUnreadCount();
            this.isInitialized = true;
        } else {
            setTimeout(() => {
                if (!this.isInitialized) {
                    this.init();
                }
            }, 2000);
        }
    }

    getUserData() {
        const prostovoljecId = localStorage.getItem('prostovoljecId');
        const drustvoId = localStorage.getItem('drustvoId');
        const prijavljen = localStorage.getItem('prijavljen');
        
        if (prostovoljecId && prijavljen === 'true') {
            this.userId = prostovoljecId;
            this.userType = 'prostovoljec';
        } else if (drustvoId && prijavljen === 'true') {
            this.userId = drustvoId;
            this.userType = 'drustvo';
        }
    }

    initializeSocket() {
        if (typeof io === 'undefined') {
            setTimeout(() => this.initializeSocket(), 1000);
            return;
        }
        
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.socket.emit('register', {
                userId: this.userId,
                userType: this.userType
            });
        });

        this.socket.on('newNotification', (notification) => {
            this.displayNewNotification(notification);
            this.updateNotificationBadge();
            this.loadNotifications();
        });

        this.socket.on('notifications', (notifications) => {
            this.renderNotifications(notifications);
        });

        this.socket.on('notificationsMarked', (response) => {
            if (response.success) {
                this.updateNotificationBadge();
                this.loadNotifications();
            }
        });
    }

    setupEventListeners() {
        const waitForElements = () => {
            const notificationDropdown = document.getElementById('notificationsDropdown');
            
            if (notificationDropdown) {
                notificationDropdown.addEventListener('click', (e) => {
                    e.preventDefault();
                    setTimeout(() => this.loadNotifications(), 100);
                });
            } else {
                setTimeout(waitForElements, 500);
                return;
            }
            
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('mark-read-btn')) {
                    e.preventDefault();
                    this.markAllAsRead();
                }
                
                if (e.target.classList.contains('delete-all-btn')) {
                    e.preventDefault();
                    this.deleteAllNotifications();
                }
            });
        };
        
        waitForElements();
    }

    async loadNotifications() {
        if (!this.userId || !this.userType) {
            return;
        }

        try {
            const url = `/api/obvestila/${this.userType}/${this.userId}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.renderNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Napaka pri nalaganju obvestil:', error);
        }
    }

    async loadUnreadCount() {
        if (!this.userId || !this.userType) {
            return;
        }

        try {
            const url = `/api/obvestila/unread-count/${this.userType}/${this.userId}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.updateNotificationBadge(data.count);
            }
        } catch (error) {
            console.error('Napaka pri nalaganju števila obvestil:', error);
        }
    }

    renderNotifications(notifications) {
    const container = document.getElementById('notifications-container');
    if (!container) {
        return;
    }

    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 px-4">
                <div class="mb-3">
                    <i class="fas fa-bell-slash" style="font-size: 2.5rem; color: #6c757d; opacity: 0.5;"></i>
                </div>
                <p class="text-muted mb-0 fw-medium">Ni novih obvestil</p>
                <small class="text-muted opacity-75">Vsa obvestila se bodo prikazala tukaj</small>
            </div>
        `;
        return;
    }

    const notificationHTML = notifications.map(notification => {
        const isUnread = !notification.prebrano;
        
        return `
            <div class="notification-item position-relative" style="transition: all 0.2s ease; ${isUnread ? 'background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);' : 'background: #f8f9fa; opacity: 0.7;'}">
                <div class="d-flex align-items-start p-3" style="border-bottom: 1px solid #dee2e6;">
                    <div class="me-3 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; background: ${isUnread ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' : '#6c757d'}; border-radius: 50%; flex-shrink: 0;">
                        <i class="fas fa-bell text-white" style="font-size: 0.9rem;"></i>
                    </div>
                    <div class="flex-grow-1" style="min-width: 0;">
                        <p class="mb-0 ${isUnread ? 'fw-bold text-dark' : 'fw-normal text-muted'}" style="font-size: 0.95rem; line-height: 1.4; word-wrap: break-word;">
                            ${notification.sporocilo}
                        </p>
                    </div>
                    ${isUnread ? `
                        <div class="ms-2 d-flex align-items-center">
                            <span class="position-relative">
                                <span class="badge bg-primary rounded-pill" style="font-size: 0.6rem; padding: 0.2em 0.5em; animation: pulse 2s infinite;">
                                    Novo
                                </span>
                            </span>
                        </div>
                    ` : ''}
                </div>
                ${isUnread ? `
                    <div class="position-absolute top-0 start-0" style="width: 3px; height: 100%; background: linear-gradient(180deg, #007bff 0%, #0056b3 100%); border-radius: 0 3px 3px 0;"></div>
                ` : ''}
            </div>
        `;
    }).join('');

    // prevberja ce ze obstajajo kaksa obvestila (nej presteta)
    const hasReadNotifications = notifications.some(n => n.prebrano);
    
    container.innerHTML = `
        <style>
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }
            .notification-item:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .mark-read-btn {
                color: #dc3545 !important;
                text-decoration: none !important;
                transition: color 0.2s ease;
            }
            .mark-read-btn:hover {
                color:rgb(110, 35, 42) !important;
                text-decoration: none !important;
            }
        </style>
        ${notificationHTML}
        ${hasReadNotifications ? `
            <div class="p-3 border-top">
                <button class="btn btn-sm btn-outline-danger w-100 delete-all-btn">
                    <i class="fas fa-trash me-1"></i>
                    Izbriši vsa obvestila
                </button>
            </div>
        ` : ''}
    `;
}

    displayNewNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Novo obvestilo', {
                body: notification.message,
                icon: '/img/hand-in-hand.png'
            });
        }
    }

    async markAllAsRead() {
        if (!this.userId || !this.userType) {
            return;
        }

        try {
            const response = await fetch(`/api/obvestila/mark-read/${this.userType}/${this.userId}`, {
                method: 'PUT'
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (this.socket) {
                    this.socket.emit('markAsRead', {
                        userId: this.userId,
                        userType: this.userType
                    });
                }
                this.loadNotifications();
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error('Napaka pri označevanju obvestil:', error);
        }
    }

    async deleteAllNotifications() {
        if (!this.userId || !this.userType) {
            return;
        }

        try {
            const response = await fetch(`/api/obvestila/delete-all/${this.userType}/${this.userId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.loadNotifications();
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error('Napaka pri brisanju obvestil:', error);
        }
}

    updateNotificationBadge(count = null) {
        const badge = document.querySelector('.notification-badge');
        if (!badge) {
            return;
        }

        if (count === null) {
            this.loadUnreadCount();
            return;
        }

        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    }

    sendNotification(receiverId, receiverType, message) {
        if (this.socket) {
            this.socket.emit('sendNotification', {
                receiverId: receiverId,
                receiverType: receiverType,
                message: message
            });
        }
    }
}

window.notificationManager = new NotificationManager();

if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

console.log('Notifications.js skripta naložena');