class CalendarManager {
    constructor() {
        this.currentUser = null;
        this.events = [];
        this.editingId = null;
        this.currentDate = new Date();
        this.contextMenuEventId = null;
        this.draggedEvent = null;
        this.currentView = 'month';
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
                this.renderCalendar();
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
        const monthViewBtn = document.getElementById('monthViewBtn');
        const weekViewBtn = document.getElementById('weekViewBtn');
        const timeSelect = document.getElementById('time');
        
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
            prevBtn.addEventListener('click', () => this.previousPeriod());
            prevBtn.dataset.initialized = 'true';
        }

        if (nextBtn && !nextBtn.dataset.initialized) {
            nextBtn.addEventListener('click', () => this.nextPeriod());
            nextBtn.dataset.initialized = 'true';
        }

        if (modalOverlay && !modalOverlay.dataset.initialized) {
            modalOverlay.addEventListener('click', () => this.hideModal());
            modalOverlay.dataset.initialized = 'true';
        }

        if (deleteEventBtn && !deleteEventBtn.dataset.initialized) {
            deleteEventBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.deleteEvent(this.contextMenuEventId);
            });
            deleteEventBtn.dataset.initialized = 'true';
        }

        if (monthViewBtn && !monthViewBtn.dataset.initialized) {
            monthViewBtn.addEventListener('click', () => this.switchView('month'));
            monthViewBtn.dataset.initialized = 'true';
        }

        if (weekViewBtn && !weekViewBtn.dataset.initialized) {
            weekViewBtn.addEventListener('click', () => this.switchView('week'));
            weekViewBtn.dataset.initialized = 'true';
        }

        if (timeSelect && !timeSelect.dataset.initialized) {
            timeSelect.addEventListener('change', () => {});
            timeSelect.dataset.initialized = 'true';
        }

        // Global click handler to close context menu
        if (!document.body.dataset.globalClickHandler) {
            document.addEventListener('click', (e) => {
                this.hideContextMenu();
            });
            document.body.dataset.globalClickHandler = 'true';
        }
    }

    generateTimeOptions() {
        const options = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                options.push(timeStr);
            }
        }
        return options;
    }

    populateTimeSelect() {
        const timeSelect = document.getElementById('time');
        const times = this.generateTimeOptions();
        const currentValue = timeSelect.value;
        
        timeSelect.innerHTML = '<option value="">Select Time</option>';
        times.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            timeSelect.appendChild(option);
        });
        
        if (currentValue) {
            timeSelect.value = currentValue;
        }
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
            this.renderCalendar();
        } catch (error) {
            console.error('CalendarManager: Error loading events:', error);
        }
    }

    renderCalendar() {
        if (this.currentView === 'month') {
            this.renderMonthView();
        } else {
            this.renderWeekView();
        }
    }

    renderMonthView() {
        const calendar = document.getElementById('calendarGrid');
        const weekdaysHeader = document.getElementById('calendarWeekdays');
        if (!calendar || !weekdaysHeader) return;
        
        weekdaysHeader.style.display = 'grid';
        calendar.innerHTML = '';
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        document.getElementById('currentMonth').textContent = 
            this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.innerHTML = `<div class="day-number">${day}</div>`;
            calendar.appendChild(dayDiv);
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = this.events
                .filter(e => e.date === dateStr)
                .sort((a, b) => {
                    const timeA = a.time || '00:00';
                    const timeB = b.time || '00:00';
                    return timeA.localeCompare(timeB);
                });
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.dataset.date = dateStr;
            
            let eventsHTML = '';
            const displayCount = dayEvents.length > 5 ? 5 : dayEvents.length;
            
            eventsHTML = dayEvents.slice(0, displayCount).map(e => {
                const displayTime = e.time ? e.time : '00:00';
                return `
                    <div class="event-item" data-event-id="${e.id}" draggable="true">
                        <span class="event-time">${displayTime}</span>
                        <span class="event-client">${e.clientName}</span>
                        <span class="event-test">${e.testType}</span>
                    </div>
                `;
            }).join('');

            if (dayEvents.length > 5) {
                eventsHTML += `<div class="event-more">+${dayEvents.length - 5} more</div>`;
            }
            
            dayDiv.innerHTML = `
                <div class="day-number">${day}</div>
                <div class="day-events">
                    ${eventsHTML}
                </div>
            `;
            
            dayDiv.addEventListener('click', (e) => {
                if (!e.target.closest('.event-item')) {
                    this.showModalForDate(dateStr);
                }
            });

            dayDiv.addEventListener('dragover', (e) => {
                e.preventDefault();
                dayDiv.classList.add('drag-over');
            });

            dayDiv.addEventListener('dragleave', (e) => {
                dayDiv.classList.remove('drag-over');
            });

            dayDiv.addEventListener('drop', (e) => {
                e.preventDefault();
                dayDiv.classList.remove('drag-over');
                if (this.draggedEvent) {
                    this.moveEventToDate(this.draggedEvent, dateStr);
                }
            });
            
            calendar.appendChild(dayDiv);
        }
        
        const totalCells = calendar.children.length + daysInMonth;
        const remainingCells = 42 - totalCells;
        for (let day = 1; day <= remainingCells; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.innerHTML = `<div class="day-number">${day}</div>`;
            calendar.appendChild(dayDiv);
        }

        this.attachEventItemListeners();
    }

    renderWeekView() {
        const calendar = document.getElementById('calendarGrid');
        const weekdaysHeader = document.getElementById('calendarWeekdays');
        if (!calendar || !weekdaysHeader) return;
        
        calendar.innerHTML = '';
        weekdaysHeader.innerHTML = '';
        
        const startOfWeek = this.getStartOfWeek(this.currentDate);
        const weekDays = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            weekDays.push(date);
            
            const dayName = dayNames[date.getDay()];
            const dayNum = date.getDate();
            const header = document.createElement('div');
            header.className = 'weekday';
            header.textContent = `${dayName} ${dayNum}`;
            weekdaysHeader.appendChild(header);
        }
        
        const monthYear = this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        document.getElementById('currentMonth').textContent = 
            `${monthYear} - Week of ${weekDays[0].toLocaleDateString()}`;
        
        calendar.classList.add('week-view');
        
        for (const date of weekDays) {
            const dateStr = this.formatDate(date);
            const dayEvents = this.events
                .filter(e => e.date === dateStr)
                .sort((a, b) => {
                    const timeA = a.time || '00:00';
                    const timeB = b.time || '00:00';
                    return timeA.localeCompare(timeB);
                });
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day week-day';
            dayDiv.dataset.date = dateStr;
            
            const eventsHTML = dayEvents.map(e => {
                const displayTime = e.time ? e.time : '00:00';
                return `
                    <div class="event-item" data-event-id="${e.id}" draggable="true">
                        <span class="event-time">${displayTime}</span>
                        <span class="event-client">${e.clientName}</span>
                        <span class="event-test">${e.testType}</span>
                    </div>
                `;
            }).join('');
            
            dayDiv.innerHTML = `<div class="day-events">${eventsHTML}</div>`;
            
            dayDiv.addEventListener('click', (e) => {
                if (!e.target.closest('.event-item')) {
                    this.showModalForDate(dateStr);
                }
            });

            dayDiv.addEventListener('dragover', (e) => {
                e.preventDefault();
                dayDiv.classList.add('drag-over');
            });

            dayDiv.addEventListener('dragleave', (e) => {
                dayDiv.classList.remove('drag-over');
            });

            dayDiv.addEventListener('drop', (e) => {
                e.preventDefault();
                dayDiv.classList.remove('drag-over');
                if (this.draggedEvent) {
                    this.moveEventToDate(this.draggedEvent, dateStr);
                }
            });
            
            calendar.appendChild(dayDiv);
        }

        this.attachEventItemListeners();
    }

    formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    switchView(view) {
        this.currentView = view;
        
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        const calendar = document.getElementById('calendarGrid');
        calendar.classList.remove('week-view');
        
        this.renderCalendar();
    }

    attachEventItemListeners() {
        document.querySelectorAll('.event-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                if (e.button === 0) {
                    const eventId = item.dataset.eventId;
                    this.editEvent(eventId);
                }
            });

            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const eventId = item.dataset.eventId;
                this.showContextMenu(e, eventId);
            });

            item.addEventListener('dragstart', (e) => {
                this.draggedEvent = item.dataset.eventId;
                item.style.opacity = '0.5';
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', (e) => {
                item.style.opacity = '1';
                this.draggedEvent = null;
            });
        });
    }

    showModal(id = null) {
        document.getElementById('modalOverlay').style.display = 'block';
        document.getElementById('eventModal').style.display = 'block';
        this.populateTimeSelect();
        
        if (id) {
            this.editingId = id;
            const event = this.events.find(e => e.id === id);
            document.getElementById('modalTitle').textContent = 'Edit Event';
            document.getElementById('clientName').value = event.clientName;
            document.getElementById('date').value = event.date;
            document.getElementById('time').value = event.time || '';
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
        
        this.populateTimeSelect();
        const now = new Date();
        const roundedTime = this.roundToNextQuarter(now);
        document.getElementById('time').value = roundedTime;
        this.editingId = null;
    }

    hideModal() {
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById('eventModal').style.display = 'none';
        document.getElementById('eventFormElement').reset();
        this.hideContextMenu();
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

    roundToNextQuarter(date) {
        const hours = date.getHours();
        let minutes = date.getMinutes();
        
        minutes = Math.ceil(minutes / 15) * 15;
        
        if (minutes === 60) {
            minutes = 0;
            date.setHours(hours + 1);
        }
        
        date.setMinutes(minutes);
        date.setSeconds(0);
        
        return date.toTimeString().slice(0, 5);
    }

    async moveEventToDate(eventId, newDate) {
        try {
            await firebase.firestore()
                .collection('calendar_events')
                .doc(eventId)
                .update({
                    date: newDate,
                    updatedAt: new Date()
                });
            
            const index = this.events.findIndex(e => e.id === eventId);
            if (index !== -1) {
                this.events[index].date = newDate;
                this.events[index].updatedAt = new Date();
            }
            
            this.renderCalendar();
        } catch (error) {
            console.error('CalendarManager: Error moving event:', error);
            alert('Failed to move event: ' + error.message);
        }
    }

    async handleSave(e) {
        e.preventDefault();

        const eventData = {
            clientName: document.getElementById('clientName').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            testType: document.getElementById('testType').value,
            status: document.getElementById('status').value,
            noShow: document.getElementById('noShow').checked,
            userId: this.currentUser.uid,
            updatedAt: new Date()
        };

        try {
            if (this.editingId) {
                await firebase.firestore()
                    .collection('calendar_events')
                    .doc(this.editingId)
                    .update(eventData);
                
                const index = this.events.findIndex(e => e.id === this.editingId);
                if (index !== -1) {
                    this.events[index] = { id: this.editingId, ...eventData };
                }
            } else {
                eventData.createdAt = new Date();
                const docRef = await firebase.firestore()
                    .collection('calendar_events')
                    .add(eventData);
                
                this.events.push({ id: docRef.id, ...eventData });
            }
            
            if (eventData.status === 'completed' && !eventData.noShow) {
                await this.updateInventoryFromEvent(eventData);
            }

            this.hideModal();
            setTimeout(() => {
                this.renderCalendar();
            }, 50);
        } catch (error) {
            console.error('CalendarManager: Error saving event:', error);
            alert('Failed to save event: ' + error.message);
        }
    }

    async updateInventoryFromEvent(eventData) {
        try {
            const testSupplies = {
                'urine': [{ name: 'Urine Test Cups', quantity: 1 }],
                'hair': [{ name: 'Hair Test Vials', quantity: 1 }],
                'saliva': [{ name: 'Saliva Test Strips', quantity: 1 }],
                'blood': [
                    { name: 'Blood Test Vials', quantity: 2 },
                    { name: 'Blood Test Needles', quantity: 1 }
                ],
                'breath': [{ name: 'Breathalyzer Cartridges', quantity: 1 }]
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
                await firebase.firestore()
                    .collection('calendar_events')
                    .doc(id)
                    .delete();
                
                this.events = this.events.filter(e => e.id !== id);
                
                this.hideContextMenu();
                this.renderCalendar();
            } catch (error) {
                console.error('CalendarManager: Error deleting event:', error);
                alert('Failed to delete event: ' + error.message);
            }
        }
    }

    previousPeriod() {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        } else {
            this.currentDate.setDate(this.currentDate.getDate() - 7);
        }
        this.renderCalendar();
    }

    nextPeriod() {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        } else {
            this.currentDate.setDate(this.currentDate.getDate() + 7);
        }
        this.renderCalendar();
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await firebase.auth().signOut();
                } catch (error) {
                    console.error('CalendarManager: Error logging out:', error);
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.calendarManager = new CalendarManager();
});