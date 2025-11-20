class CalendarManager {
    constructor() {
        this.currentUser = null;
        this.events = [];
        this.editingId = null;
        this.currentDate = new Date();
        this.contextMenuEventId = null;
        this.init();
    }

    init() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                console.log('CalendarManager: User logged in:', user.email);
                document.getElementById('userEmail').textContent = user.email;
                this.loadCalendarEvents();
                this.setupEventListeners();
                this.setupLogout();
                this.renderCalendarDays();
            } else {
                console.log('CalendarManager: User not authenticated, redirecting to login');
                window.location.href = '../../pages/login.html';
            }
        });
    }

    setupEventListeners() {
        const cancelBtn = document.getElementById('cancelBtn');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const form = document.getElementById('eventFormElement');
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        const modalOverlay = document.getElementById('modalOverlay');
        const deleteEventBtn = document.getElementById('deleteEventBtn');
        
        if (cancelBtn && !cancelBtn.dataset.initialized) {
            cancelBtn.addEventListener('click', () => this.hideModal());
            cancelBtn.dataset.initialized = 'true';
        }

        if (closeModalBtn && !closeModalBtn.dataset.initialized) {
            closeModalBtn.addEventListener('click', () => this.hideModal());
            closeModalBtn.dataset.initialized = 'true';
        }
        
        if (form && !form.dataset.initialized) {
            form.addEventListener('submit', (e) => this.handleSave(e));
            form.dataset.initialized = 'true';
        }

        if (prevBtn && !prevBtn.dataset.initialized) {
            prevBtn.addEventListener('click', () => this.previousMonth());
            prevBtn.dataset.initialized = 'true';
        }

        if (nextBtn && !nextBtn.dataset.initialized) {
            nextBtn.addEventListener('click', () => this.nextMonth());
            nextBtn.dataset.initialized = 'true';
        }

        if (modalOverlay && !modalOverlay.dataset.initialized) {
            modalOverlay.addEventListener('click', () => this.hideModal());
            modalOverlay.dataset.initialized = 'true';
        }

        if (deleteEventBtn && !deleteEventBtn.dataset.initialized) {
            deleteEventBtn.addEventListener('click', () => this.deleteEvent(this.contextMenuEventId));
            deleteEventBtn.dataset.initialized = 'true';
        }

        // Close context menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            const contextMenu = document.getElementById('contextMenu');
            if (contextMenu && !e.target.closest('.event-item') && !e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
        });
    }

    async loadCalendarEvents() {
        try {
            console.log('CalendarManager: Loading events for user:', this.currentUser.uid);
            const snapshot = await firebase.firestore()
                .collection('calendar_events')
                .where('userId', '==', this.currentUser.uid)
                .get();

            this.events = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log('CalendarManager: Loaded', this.events.length, 'events');
            this.renderCalendarDays();
        } catch (error) {
            console.error('CalendarManager: Error loading events:', error);
        }
    }

    renderCalendarDays() {
        const calendar = document.getElementById('calendarGrid');
        if (!calendar) return;
        
        calendar.innerHTML = '';
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month/year header
        document.getElementById('currentMonth').textContent = 
            this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        // Add previous month's days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.innerHTML = `<div class="day-number">${day}</div>`;
            calendar.appendChild(dayDiv);
        }
        
        // Add current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = this.events.filter(e => e.date === dateStr);
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.dataset.date = dateStr;
            dayDiv.innerHTML = `
                <div class="day-number">${day}</div>
                <div class="day-events">
                    ${dayEvents.map(e => `
                        <div class="event-item" data-event-id="${e.id}" title="${e.clientName} - ${e.testType}">
                            <div class="event-client">${e.clientName}</div>
                            <div class="event-test">${e.testType}</div>
                            <div class="event-status">${e.status}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            // Add click listener to day for adding event
            dayDiv.addEventListener('click', (e) => {
                if (!e.target.closest('.event-item')) {
                    this.showModalForDate(dateStr);
                }
            });
            
            calendar.appendChild(dayDiv);
        }
        
        // Add next month's days
        const totalCells = calendar.children.length + daysInMonth;
        const remainingCells = 42 - totalCells; // 6 rows * 7 days
        for (let day = 1; day <= remainingCells; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.innerHTML = `<div class="day-number">${day}</div>`;
            calendar.appendChild(dayDiv);
        }

        // Attach event listeners to event items after rendering
        this.attachEventItemListeners();
    }

    attachEventItemListeners() {
        document.querySelectorAll('.event-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = item.dataset.eventId;
                this.editEvent(eventId);
            });

            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const eventId = item.dataset.eventId;
                this.showContextMenu(e, eventId);
            });
        });
    }

    showModal(id = null) {
        document.getElementById('modalOverlay').style.display = 'block';
        document.getElementById('eventModal').style.display = 'block';
        
        if (id) {
            this.editingId = id;
            const event = this.events.find(e => e.id === id);
            document.getElementById('modalTitle').textContent = 'Edit Event';
            document.getElementById('clientName').value = event.clientName;
            document.getElementById('date').value = event.date;
            document.getElementById('testType').value = event.testType;
            document.getElementById('status').value = event.status;
            document.getElementById('noShow').checked = event.noShow || false;
        } else {
            document.getElementById('modalTitle').textContent = 'Add New Event';
            document.getElementById('eventFormElement').reset();
            this.editingId = null;
        }
    }

    showModalForDate(dateStr) {
        document.getElementById('modalOverlay').style.display = 'block';
        document.getElementById('eventModal').style.display = 'block';
        document.getElementById('modalTitle').textContent = 'Add New Event';
        document.getElementById('eventFormElement').reset();
        document.getElementById('date').value = dateStr;
        this.editingId = null;
    }

    hideModal() {
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById('eventModal').style.display = 'none';
        document.getElementById('eventFormElement').reset();
    }

    showContextMenu(event, eventId) {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'block';
        contextMenu.style.left = event.pageX + 'px';
        contextMenu.style.top = event.pageY + 'px';
        this.contextMenuEventId = eventId;
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'none';
        this.contextMenuEventId = null;
    }

    async handleSave(e) {
        e.preventDefault();

        const eventData = {
            clientName: document.getElementById('clientName').value,
            date: document.getElementById('date').value,
            testType: document.getElementById('testType').value,
            status: document.getElementById('status').value,
            noShow: document.getElementById('noShow').checked,
            userId: this.currentUser.uid,
            updatedAt: new Date()
        };

        try {
            console.log('CalendarManager: Saving event:', eventData);
            
            if (this.editingId) {
                console.log('CalendarManager: Updating existing event:', this.editingId);
                await firebase.firestore()
                    .collection('calendar_events')
                    .doc(this.editingId)
                    .update(eventData);
                
                const index = this.events.findIndex(e => e.id === this.editingId);
                if (index !== -1) {
                    this.events[index] = { id: this.editingId, ...eventData };
                }
            } else {
                console.log('CalendarManager: Adding new event');
                eventData.createdAt = new Date();
                const docRef = await firebase.firestore()
                    .collection('calendar_events')
                    .add(eventData);
                
                this.events.push({ id: docRef.id, ...eventData });
                console.log('CalendarManager: Event added with ID:', docRef.id);
            }

            console.log('CalendarManager: Event saved successfully');
            
            // If event was marked as completed and not a no-show, update inventory
            if (eventData.status === 'completed' && !eventData.noShow) {
                await this.updateInventoryFromEvent(eventData);
            }

            this.hideModal();
            setTimeout(() => {
                this.renderCalendarDays();
            }, 50);
        } catch (error) {
            console.error('CalendarManager: Error saving event:', error);
            alert('Failed to save event: ' + error.message);
        }
    }

    async updateInventoryFromEvent(eventData) {
        try {
            console.log('CalendarManager: Updating inventory for test type:', eventData.testType);
            
            const testSupplies = {
                'urine': [
                    { name: 'Urine Test Cups', quantity: 1 }
                ],
                'hair': [
                    { name: 'Hair Test Vials', quantity: 1 }
                ],
                'saliva': [
                    { name: 'Saliva Test Strips', quantity: 1 }
                ],
                'blood': [
                    { name: 'Blood Test Vials', quantity: 2 },
                    { name: 'Blood Test Needles', quantity: 1 }
                ],
                'breath': [
                    { name: 'Breathalyzer Cartridges', quantity: 1 }
                ]
            };

            const supplies = testSupplies[eventData.testType.toLowerCase()] || [];

            for (const supply of supplies) {
                const inventorySnapshot = await firebase.firestore()
                    .collection('inventory')
                    .where('userId', '==', this.currentUser.uid)
                    .where('itemName', '==', supply.name)
                    .get();

                if (!inventorySnapshot.empty) {
                    const docId = inventorySnapshot.docs[0].id;
                    const currentQuantity = inventorySnapshot.docs[0].data().quantity;
                    const newQuantity = Math.max(0, currentQuantity - supply.quantity);

                    await firebase.firestore()
                        .collection('inventory')
                        .doc(docId)
                        .update({
                            quantity: newQuantity,
                            updatedAt: new Date()
                        });

                    console.log(`CalendarManager: Updated ${supply.name} from ${currentQuantity} to ${newQuantity}`);
                }
            }
        } catch (error) {
            console.error('CalendarManager: Error updating inventory:', error);
        }
    }

    editEvent(id) {
        this.showModal(id);
    }

    async deleteEvent(id) {
        if (confirm('Are you sure you want to delete this event?')) {
            try {
                console.log('CalendarManager: Deleting event:', id);
                await firebase.firestore()
                    .collection('calendar_events')
                    .doc(id)
                    .delete();
                
                this.events = this.events.filter(e => e.id !== id);
                
                console.log('CalendarManager: Event deleted successfully');
                this.hideContextMenu();
                this.renderCalendarDays();
            } catch (error) {
                console.error('CalendarManager: Error deleting event:', error);
                alert('Failed to delete event: ' + error.message);
            }
        }
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendarDays();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendarDays();
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    console.log('CalendarManager: Logout clicked');
                    await firebase.auth().signOut();
                } catch (error) {
                    console.error('CalendarManager: Error logging out:', error);
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('CalendarManager: DOM ready, initializing');
    window.calendarManager = new CalendarManager();
});