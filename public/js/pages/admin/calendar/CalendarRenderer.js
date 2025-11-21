// Calendar rendering logic
class CalendarRenderer {
    constructor(eventManager) {
        this.eventManager = eventManager;
    }

    /**
     * Get status color for indicator dot
     */
    getStatusColor(event) {
        const eventType = event.eventType || 'drug-testing';

        if (eventType === 'drug-testing') {
            if (event.noShow) return '#dc2626'; // Red
            if (event.status === 'scheduled') return '#3b82f6'; // Blue
            if (event.status === 'completed') return '#10b981'; // Green
            if (event.status === 'cancelled') return '#8b5cf6'; // Purple
            return '#3b82f6'; // Default blue
        } else if (eventType === 'consultation') {
            return '#f59e0b'; // Amber
        } else if (eventType === 'follow-up') {
            return '#06b6d4'; // Cyan
        } else if (eventType === 'other') {
            return '#6366f1'; // Indigo
        }
        return '#6b7280'; // Gray
    }

    /**
     * Get event type display name
     */
    getEventTypeLabel(eventType) {
        const labels = {
            'drug-testing': 'Drug Test',
            'consultation': 'Consult',
            'follow-up': 'Follow-up',
            'other': 'Other'
        };
        return labels[eventType] || eventType;
    }

    /**
     * Get test type abbreviation
     */
    getTestTypeAbbrev(testType) {
        if (!testType) return '';
        const abbrevs = {
            'urine': 'U',
            'hair': 'H',
            'saliva': 'S',
            'blood': 'B',
            'breath': 'BR'
        };
        return abbrevs[testType.toLowerCase()] || testType.charAt(0).toUpperCase();
    }

    /**
     * Create tooltip content for hover
     */
    createEventTooltip(event) {
        const status = event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : 'N/A';
        const testType = event.testType ? event.testType.charAt(0).toUpperCase() + event.testType.slice(1) : 'N/A';

        let tooltipHTML = `
            <div class="event-tooltip">
                <div class="tooltip-row">
                    <span class="tooltip-label">Client:</span>
                    <span class="tooltip-value">${event.clientName}</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Time:</span>
                    <span class="tooltip-value">${event.time || 'N/A'}</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Type:</span>
                    <span class="tooltip-value">${this.getEventTypeLabel(event.eventType)}</span>
                </div>
        `;

        if (event.eventType === 'drug-testing') {
            tooltipHTML += `
                <div class="tooltip-row">
                    <span class="tooltip-label">Test:</span>
                    <span class="tooltip-value">${testType}</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Status:</span>
                    <span class="tooltip-value">${status}</span>
                </div>
            `;

            if (event.noShow) {
                tooltipHTML += `
                    <div class="tooltip-row tooltip-warning">
                        <span class="tooltip-label">⚠️ No Show</span>
                    </div>
                `;
            }
        }

        tooltipHTML += `</div>`;
        return tooltipHTML;
    }

    /**
     * Create event item HTML
     */
    createEventItem(event) {
        const statusColor = this.getStatusColor(event);
        const testTypeAbbrev = this.getTestTypeAbbrev(event.testType);
        const displayTime = event.time ? event.time : '—';
        const eventTypeLabel = this.getEventTypeLabel(event.eventType);
        const classes = this.getEventClasses(event);
        const tooltip = this.createEventTooltip(event);

        return `
            <div class="${classes}" data-event-id="${event.id}" draggable="true" title="${event.clientName}">
                <div class="event-indicator" style="background-color: ${statusColor};" title="${event.status || 'scheduled'}"></div>
                <div class="event-body">
                    <div class="event-time">${displayTime}</div>
                    <div class="event-name">${event.clientName}</div>
                    <div class="event-meta">
                        <span class="event-type">${eventTypeLabel}</span>
                        ${testTypeAbbrev ? `<span class="event-test-abbrev">${testTypeAbbrev}</span>` : ''}
                        ${event.noShow ? '<span class="event-no-show-badge">No Show</span>' : ''}
                    </div>
                </div>
                ${tooltip}
            </div>
        `;
    }

    getEventClasses(event) {
        let classes = 'event-item';
        const eventType = event.eventType || 'drug-testing';

        if (eventType === 'drug-testing') {
            if (event.noShow) {
                classes += ' status-no-show';
            } else if (event.status === 'scheduled') {
                classes += ' status-scheduled';
            } else if (event.status === 'completed') {
                classes += ' status-completed';
            } else if (event.status === 'cancelled') {
                classes += ' status-cancelled';
            } else {
                classes += ' status-scheduled';
            }
        } else if (eventType === 'consultation') {
            classes += ' type-consultation';
        } else if (eventType === 'follow-up') {
            classes += ' type-followup';
        } else if (eventType === 'other') {
            classes += ' type-other';
        } else {
            classes += ' status-scheduled';
        }

        if (CalendarUtils.isEventPast(event.date, event.time)) {
            classes += ' past-event';
        }

        return classes;
    }

    renderMonthView(currentDate) {
        const calendar = document.getElementById('calendarGrid');
        const weekdaysHeader = document.getElementById('calendarWeekdays');
        if (!calendar || !weekdaysHeader) return;

        weekdaysHeader.style.display = 'grid';
        calendar.innerHTML = '';

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        document.getElementById('currentMonth').textContent =
            currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const dayDiv = this._createDayDiv('other-month', day);
            calendar.appendChild(dayDiv);
        }

        const today = new Date();
        const todayStr = CalendarUtils.formatDate(today);

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayDiv = this._createDayElement(dateStr, day, dateStr === todayStr, false);
            calendar.appendChild(dayDiv);
        }

        // Next month days
        const totalCells = calendar.children.length + daysInMonth;
        const remainingCells = 42 - totalCells;
        for (let day = 1; day <= remainingCells; day++) {
            const dayDiv = this._createDayDiv('other-month', day);
            calendar.appendChild(dayDiv);
        }
    }

    renderWeekView(currentDate) {
        const calendar = document.getElementById('calendarGrid');
        const weekdaysHeader = document.getElementById('calendarWeekdays');
        if (!calendar || !weekdaysHeader) return;

        calendar.innerHTML = '';
        weekdaysHeader.innerHTML = '';

        const startOfWeek = CalendarUtils.getStartOfWeek(currentDate);
        const weekDays = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const today = new Date();
        const todayStr = CalendarUtils.formatDate(today);

        // Create week day headers
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

        // Update header with week number - uses calendar week number that spans months correctly
        const weekNum = CalendarUtils.getCalendarWeekNumber(currentDate);
        const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = weekDays[6].toLocaleDateString('en-US', { month: 'short' });
        const year = currentDate.getFullYear();
        
        // Display both months if the week spans two months
        const monthDisplay = startMonth === endMonth 
            ? `${startMonth} ${year}`
            : `${startMonth} - ${endMonth} ${year}`;
        
        document.getElementById('currentMonth').textContent = `${monthDisplay} - Week ${weekNum}`;

        calendar.classList.add('week-view');

        // Create day cells
        for (const date of weekDays) {
            const dateStr = CalendarUtils.formatDate(date);
            const dayNum = date.getDate();
            const isToday = dateStr === todayStr;
            const dayDiv = this._createDayElement(dateStr, dayNum, isToday, true);
            calendar.appendChild(dayDiv);
        }
    }

    _createDayElement(dateStr, dayNum, isToday, isWeekView) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day' + (isWeekView ? ' week-day' : '');
        if (isToday) dayDiv.classList.add('today');
        dayDiv.dataset.date = dateStr;

        const dayEvents = this.eventManager.getEventsByDate(dateStr);
        const displayCount = dayEvents.length > 5 ? 5 : dayEvents.length;

        let eventsHTML = dayEvents.slice(0, displayCount).map(e => {
            return this.createEventItem(e);
        }).join('');

        if (dayEvents.length > 5) {
            eventsHTML += `<div class="event-more">+${dayEvents.length - 5} more</div>`;
        }

        // FIXED: Now always shows day number if provided
        if (dayNum) {
            dayDiv.innerHTML = `
                <div class="day-number">${dayNum}</div>
                <div class="day-events">
                    ${eventsHTML}
                </div>
            `;
        } else {
            dayDiv.innerHTML = `<div class="day-events">${eventsHTML}</div>`;
        }

        return dayDiv;
    }

    _createDayDiv(className, dayNum) {
        const dayDiv = document.createElement('div');
        dayDiv.className = `calendar-day ${className}`;
        dayDiv.innerHTML = `<div class="day-number">${dayNum}</div>`;
        return dayDiv;
    }
}