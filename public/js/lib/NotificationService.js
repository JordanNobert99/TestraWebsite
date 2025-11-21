// Centralized notification service
class NotificationService {
    constructor(userId) {
        this.userId = userId;
        this.notifications = [];
        this.unreadCount = 0;
        this.listeners = [];
    }

    /**
     * Create a new notification
     */
    async createNotification(type, title, message, data = {}) {
        try {
            const notification = {
                userId: this.userId,
                type: type, // 'inventory', 'event', 'alert', 'info'
                title: title,
                message: message,
                data: data,
                isRead: false,
                createdAt: new Date(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await firebase.firestore()
                .collection('notifications')
                .add(notification);

            notification.id = docRef.id;
            this.notifications.unshift(notification);
            this.unreadCount++;

            // Notify listeners
            this.notifyListeners();

            // Show toast
            this.showToast(type, title, message);

            console.log('NotificationService: Notification created:', notification.id);
            return notification;
        } catch (error) {
            console.error('NotificationService: Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Load all notifications for user
     */
    async loadNotifications() {
        try {
            console.log('NotificationService: Loading notifications for user:', this.userId);
            const snapshot = await firebase.firestore()
                .collection('notifications')
                .where('userId', '==', this.userId)
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            this.notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.unreadCount = this.notifications.filter(n => !n.isRead).length;
            console.log('NotificationService: Loaded', this.notifications.length, 'notifications');

            return this.notifications;
        } catch (error) {
            console.error('NotificationService: Error loading notifications:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
        try {
            await firebase.firestore()
                .collection('notifications')
                .doc(notificationId)
                .update({
                    isRead: true,
                    readAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            const index = this.notifications.findIndex(n => n.id === notificationId);
            if (index !== -1) {
                this.notifications[index].isRead = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
            }

            this.notifyListeners();
        } catch (error) {
            console.error('NotificationService: Error marking as read:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            const unreadNotifications = this.notifications.filter(n => !n.isRead);

            for (const notification of unreadNotifications) {
                await this.markAsRead(notification.id);
            }

            this.unreadCount = 0;
            this.notifyListeners();
        } catch (error) {
            console.error('NotificationService: Error marking all as read:', error);
            throw error;
        }
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId) {
        try {
            await firebase.firestore()
                .collection('notifications')
                .doc(notificationId)
                .delete();

            this.notifications = this.notifications.filter(n => n.id !== notificationId);
            this.notifyListeners();
        } catch (error) {
            console.error('NotificationService: Error deleting notification:', error);
            throw error;
        }
    }

    /**
     * Subscribe to notification changes
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Notify all listeners of changes
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            callback({
                notifications: this.notifications,
                unreadCount: this.unreadCount
            });
        });
    }

    /**
     * Show toast notification
     */
    showToast(type, title, message) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
            <button class="toast-close">&times;</button>
        `;

        // Add to page
        const container = document.getElementById('toastContainer') || this.createToastContainer();
        container.appendChild(toast);

        // Auto remove after 5 seconds
        const timeout = setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timeout);
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        });
    }

    /**
     * Create toast container if it doesn't exist
     */
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    /**
     * Get unread count
     */
    getUnreadCount() {
        return this.unreadCount;
    }

    /**
     * Get all notifications
     */
    getNotifications() {
        return this.notifications;
    }
}