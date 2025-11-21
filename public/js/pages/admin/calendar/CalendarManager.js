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

    setupEventListeners() {
        document.getElementById('prevMonth')?.addEventListener('click', () => this.handlePrevMonth());
        document.getElementById('nextMonth')?.addEventListener('click', () => this.handleNextMonth());
        document.getElementById('todayBtn')?.addEventListener('click', () => this.handleToday());

        document.getElementById('monthViewBtn')?.addEventListener('click', () => this.switchView('month'));
        document.getElementById('weekViewBtn')?.addEventListener('click', () => this.switchView('week'));

        document.getElementById('closeModalBtn')?.addEventListener('click', () => this.modalManager.hideModal());
        document.getElementById('cancelBtn')?.addEventListener('click', () => this.modalManager.hideModal());
        document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') this.modalManager.hideModal();
        });

        document.getElementById('deleteEventModalBtn')?.addEventListener('click', () => {
            if (this.modalManager.editingId) {
                this.handleDeleteEvent(this.modalManager.editingId);
            }
        });

        document.getElementById('eventFormElement')?.addEventListener('submit', (e) => this.handleSaveEvent(e));

        document.getElementById('eventType')?.addEventListener('change', (e) => {
            this.modalManager.handleEventTypeChange(e.target.value);
        });

        document.addEventListener('click', (e) => {
            const dayElement = e.target.closest('[data-date]');
            if (dayElement && !e.target.closest('.event-item')) {
                const dateStr = dayElement.dataset.date;
                this.modalManager.showModalForDate(dateStr);
            }

            const eventElement = e.target.closest('.event-item');
            if (eventElement && e.button === 0) {
                const eventId = eventElement.dataset.eventId;
                const event = this.eventManager.events.find(e => e.id === eventId);
                if (event) {
                    this.modalManager.showModal(event);
                }
            }
        });

        document.addEventListener('contextmenu', (e) => {
            const eventElement = e.target.closest('.event-item');
            if (eventElement) {
                e.preventDefault();
                e.stopPropagation();
                const eventId = eventElement.dataset.eventId;
                this.contextMenu.show(e.clientX, e.clientY, eventId, (id) => this.handleDeleteEvent(id));
            }
        });

        document.addEventListener('dragstart', (e) => {
            const eventElement = e.target.closest('.event-item');
            if (eventElement) {
                this.draggedEvent = eventElement.dataset.eventId;
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const dayElement = e.target.closest('[data-date]');
            if (dayElement && this.draggedEvent) {
                const newDate = dayElement.dataset.date;
                this.handleMoveEvent(this.draggedEvent, newDate);
                this.draggedEvent = null;
            }
        });
    }

    async loadCalendarEvents() {
        try {
            await this.eventManager.loadEvents();
            console.log('CalendarManager: Events loaded, rendering calendar');
            this.renderCalendar();
        } catch (error) {
            console.error('CalendarManager: Error loading events:', error);
        }
    }

    renderCalendar() {
        if (this.currentView === 'month') {
            this.renderer.renderMonthView(this.currentDate);
        } else {
            this.renderer.renderWeekView(this.currentDate);
        }
    }

    handlePrevMonth() {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        } else {
            this.currentDate.setDate(this.currentDate.getDate() - 7);
        }
        this.renderCalendar();
    }

    handleNextMonth() {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        } else {
            this.currentDate.setDate(this.currentDate.getDate() + 7);
        }
        this.renderCalendar();
    }

    handleToday() {
        this.currentDate = new Date();
        this.renderCalendar();
    }

    switchView(view) {
        this.currentView = view;
        document.getElementById('monthViewBtn')?.classList.toggle('active', view === 'month');
        document.getElementById('weekViewBtn')?.classList.toggle('active', view === 'week');
        this.renderCalendar();
    }

    async handleSaveEvent(e) {
        e.preventDefault();
        try {
            const eventData = this.modalManager.getFormData();
            eventData.userId = this.currentUser.uid;

            if (this.modalManager.editingId) {
                eventData.id = this.modalManager.editingId;
                await this.eventManager.saveEvent(eventData);
            } else {
                await this.eventManager.saveEvent(eventData);
                if (eventData.eventType === 'drug-testing') {
                    await this.eventManager.updateInventory(eventData);
                }
            }

            this.modalManager.hideModal();
            this.renderCalendar();
        } catch (error) {
            console.error('CalendarManager: Error saving event:', error);
            alert('Failed to save event: ' + error.message);
        }
    }

    async handleDeleteEvent(eventId) {
        if (confirm('Are you sure you want to delete this event?')) {
            try {
                await this.eventManager.deleteEvent(eventId);
                this.contextMenu.hide();
                this.modalManager.hideModal();
                this.renderCalendar();
            } catch (error) {
                console.error('CalendarManager: Error deleting event:', error);
                alert('Failed to delete event: ' + error.message);
            }
        }
    }

    async handleMoveEvent(eventId, newDate) {
        try {
            await this.eventManager.moveEventToDate(eventId, newDate);
            this.renderCalendar();
        } catch (error) {
            console.error('CalendarManager: Error moving event:', error);
            alert('Failed to move event: ' + error.message);
        }
    }

    setupLogout() {
        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
            try {
                console.log('CalendarManager: Logout clicked');
                await firebase.auth().signOut();
            } catch (error) {
                console.error('CalendarManager: Error logging out:', error);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('CalendarManager: DOM ready, initializing');
    window.calendarManager = new CalendarManager();
});