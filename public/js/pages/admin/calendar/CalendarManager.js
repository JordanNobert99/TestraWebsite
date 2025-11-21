// Main calendar manager orchestrating all components
class CalendarManager {
    constructor() {
        this.currentUser = null;
        this.currentDate = new Date();
        this.currentView = 'week';
        this.draggedEvent = null;

        this.eventManager = null;
        this.modalManager = new ModalManager();
        this.contextMenu = new ContextMenu();
        this.renderer = null;
        this.notificationService = null;

        this.init();
    }

    init() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                console.log('CalendarManager: User logged in:', user.email);
                document.getElementById('userEmail').textContent = user.email;

                // Initialize notification service
                this.notificationService = new NotificationService(user.uid);

                this.eventManager = new EventManager(user.uid, this.notificationService);
                this.renderer = new CalendarRenderer(this.eventManager);

                this.setupEventListeners();
                this.loadCalendarEvents();
                this.setupLogout();
            } else {
                console.log('CalendarManager: User not authenticated, redirecting to login');
                window.location.href = '../../pages/login.html';
            }
        });
    }

    // ... rest of the code remains the same ...
}