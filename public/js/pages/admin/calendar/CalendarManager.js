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

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('prevMonth')?.addEventListener('click', () => this.handlePrevMonth());
        document.getElementById('nextMonth')?.addEventListener('click', () => this.handleNextMonth());
        document.getElementById('todayBtn')?.addEventListener('click', () => this.handleToday());

        // View toggle buttons
        document.getElementById('monthViewBtn')?.addEventListener('click', () => this.switchView('month'));
        document.getElementById('weekViewBtn')?.addEventListener('click', () => this.switchView('week'));

        // Modal controls
        document.getElementById('closeModalBtn')?.addEventListener('click', () => this.modalManager.hideModal());
        document.getElementById('cancelBtn')?.addEventListener('click', () => this.modalManager.hideModal());
        document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') this.modalManager.hideModal();
        });

        // Delete button in modal
        document.getElementById('deleteEventModalBtn')?.addEventListener('click', () => {
            if (this.modalManager.editingId) {
                this.handleDeleteEvent(this.modalManager.editingId);
            }
        });

        // Event form submission
        document.getElementById('eventFormElement')?.addEventListener('submit', (e) => this.handleSaveEvent(e));

        // Event type change
        document.getElementById('eventType')?.addEventListener('change', (e) => {
            this.modalManager.handleEventTypeChange(e.target.value);
        });

        // Calendar day click
        document.addEventListener('click', (e) => {
            const dayElement = e.target.closest('[data-date]');
            if (dayElement && !e.target.closest('.event-item')) {
                const dateStr = dayElement.dataset.date;
                this.modalManager.showModalForDate(dateStr);
            }

            // Event click
            const eventElement = e.target.closest('.event-item');
            if (eventElement && e.button === 0) {
                const eventId = eventElement.dataset.eventId;
                const event = this.eventManager.events.find(e => e.id === eventId);
                if (event) {
                    this.modalManager.showModal(event);
                }
            }
        });

        // Right-click context menu on events
        document.addEventListener('contextmenu', (e) => {
            const eventElement = e.target.closest('.event-item');
            if (eventElement) {
                e.preventDefault();
                e.stopPropagation();
                const eventId = eventElement.dataset.eventId;
                console.log('Context menu triggered for event:', eventId);
                this.contextMenu.show(e.clientX, e.clientY, eventId, (id) => this.handleDeleteEvent(id));
            }
        });

        // Drag and drop
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
            // Get current week
            const startOfCurrentWeek = CalendarUtils.getStartOfWeek(this.currentDate);
            const endOfCurrentWeek = new Date(startOfCurrentWeek);
            endOfCurrentWeek.setDate(endOfCurrentWeek.getDate() + 6);

            // Get what WOULD be the previous week (7 days back)
            const potentialPrevStart = new Date(startOfCurrentWeek);
            potentialPrevStart.setDate(potentialPrevStart.getDate() - 7);
            const potentialPrevEnd = new Date(potentialPrevStart);
            potentialPrevEnd.setDate(potentialPrevEnd.getDate() + 6);

            // Check if current and potential previous week have the SAME calendar dates
            const isSameWeek = (
                startOfCurrentWeek.getDate() === potentialPrevStart.getDate() &&
                endOfCurrentWeek.getDate() === potentialPrevEnd.getDate()
            );

            if (isSameWeek && startOfCurrentWeek.getMonth() !== potentialPrevStart.getMonth()) {
                // Same 7 calendar days but different months - just change month context
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                // Keep the same day of month so we stay in the same week
            } else {
                // Different weeks - move back 7 days
                this.currentDate.setDate(this.currentDate.getDate() - 7);
            }
        }
        this.renderCalendar();
    }

    handleNextMonth() {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        } else {
            // Get current week
            const startOfCurrentWeek = CalendarUtils.getStartOfWeek(this.currentDate);
            const endOfCurrentWeek = new Date(startOfCurrentWeek);
            endOfCurrentWeek.setDate(endOfCurrentWeek.getDate() + 6);

            // Get what WOULD be the next week (7 days ahead)
            const potentialNextStart = new Date(startOfCurrentWeek);
            potentialNextStart.setDate(potentialNextStart.getDate() + 7);
            const potentialNextEnd = new Date(potentialNextStart);
            potentialNextEnd.setDate(potentialNextEnd.getDate() + 6);

            // Check if current and potential next week have the SAME calendar dates
            const isSameWeek = (
                startOfCurrentWeek.getDate() === potentialNextStart.getDate() &&
                endOfCurrentWeek.getDate() === potentialNextEnd.getDate()
            );

            if (isSameWeek && startOfCurrentWeek.getMonth() !== potentialNextStart.getMonth()) {
                // Same 7 calendar days but different months - just change month context
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                // Keep the same day of month so we stay in the same week
            } else {
                // Different weeks - move ahead 7 days
                this.currentDate.setDate(this.currentDate.getDate() + 7);
            }
        }
        this.renderCalendar();
    }

    handleToday() {
        this.currentDate = new Date();
        this.renderCalendar();
    }

    switchView(view) {
        this.currentView = view;

        // Update button states
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

                // Update inventory if it's a drug testing event
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