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

        // Determine week number - use the date with most days in the current month
        // If week spans months, prefer the month with more days in the week
        const firstDayMonth = startOfWeek.getMonth();
        const lastDayMonth = weekDays[6].getMonth();
        
        let weekNumDate = currentDate;
        if (firstDayMonth !== lastDayMonth) {
            // Week spans two months - count days in each month
            const daysInFirstMonth = weekDays.filter(d => d.getMonth() === firstDayMonth).length;
            const daysInSecondMonth = 7 - daysInFirstMonth;
            // Use the month with more days (or first month if equal)
            if (daysInSecondMonth > daysInFirstMonth) {
                weekNumDate = weekDays[6]; // Use last day for second month's week number
            }
        }

        const weekNum = CalendarUtils.getWeekNumberInMonth(weekNumDate);
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

// Date formatting and calculation utilities
class CalendarUtils {
    static formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    static getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    /**
     * Get week number within a month (1-6)
     * Used for month view week identification
     */
    static getWeekNumberInMonth(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        
        // Get the first day of the month
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
        
        // Week 1 always includes day 1 of the month
        // Calculate which week this day falls into based on the first day's position
        // Every 7 days increments the week number
        const weekNum = Math.floor((day - 1 + firstDayOfWeek) / 7) + 1;
        
        return weekNum;
    }

    /**
     * Get the canonical week number for a week
     * When a week spans two months, uses the month with more days in that week
     * This ensures consistent numbering when navigating across month boundaries
     */
    static getCanonicalWeekNumber(date) {
        const startOfWeek = this.getStartOfWeek(date);
        const weekDays = [];
        
        // Build array of all 7 days in the week
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            weekDays.push(d);
        }
        
        const firstDayMonth = weekDays[0].getMonth();
        const lastDayMonth = weekDays[6].getMonth();
        
        // If week doesn't span months, just return the normal week number
        if (firstDayMonth === lastDayMonth) {
            return this.getWeekNumberInMonth(date);
        }
        
        // Week spans two months - determine which month to use for numbering
        // Count days in each month
        const daysInFirstMonth = weekDays.filter(d => d.getMonth() === firstDayMonth).length;
        const daysInSecondMonth = 7 - daysInFirstMonth;
        
        // Use the month with more days (or first month if equal)
        if (daysInSecondMonth > daysInFirstMonth) {
            return this.getWeekNumberInMonth(weekDays[6]); // Use second month
        } else {
            return this.getWeekNumberInMonth(weekDays[0]); // Use first month
        }
    }

    /**
     * Get canonical month and year for a week
     * When a week spans two months, returns the month with more days
     */
    static getCanonicalMonthForWeek(date) {
        const startOfWeek = this.getStartOfWeek(date);
        const weekDays = [];
        
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            weekDays.push(d);
        }
        
        const firstDayMonth = weekDays[0].getMonth();
        const lastDayMonth = weekDays[6].getMonth();
        
        // If week doesn't span months, return first month
        if (firstDayMonth === lastDayMonth) {
            return weekDays[0];
        }
        
        // Count days in each month
        const daysInFirstMonth = weekDays.filter(d => d.getMonth() === firstDayMonth).length;
        const daysInSecondMonth = 7 - daysInFirstMonth;
        
        // Return the month with more days (or first month if equal)
        if (daysInSecondMonth > daysInFirstMonth) {
            return weekDays[6]; // Second month
        } else {
            return weekDays[0]; // First month
        }
    }

    /**
     * ISO week number (1-53) - consistent across month boundaries
     */
    static getISOWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7; // Monday is 1, Sunday is 7
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    /**
     * Calendar week number (for display purposes)
     */
    static getCalendarWeekNumber(date) {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const startOfWeek = this.getStartOfWeek(startOfYear);
        const currentWeekStart = this.getStartOfWeek(date);
        const weeksDiff = Math.round((currentWeekStart - startOfWeek) / (7 * 24 * 60 * 60 * 1000));
        return weeksDiff + 1;
    }

    /**
     * Validate week number for a given date
     */
    static validateWeekNumber(date) {
        const weekNum = this.getWeekNumberInMonth(date);
        const month = date.getMonth();
        const year = date.getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        return weekNum >= 1 && weekNum <= 6;
    }

    /**
     * Get all dates that fall within a specific week of a month
     */
    static getWeekDates(date, weekNum) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const dates = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const currentWeekNum = Math.floor((day - 1 + firstDayOfWeek) / 7) + 1;
            if (currentWeekNum === weekNum) {
                dates.push(new Date(year, month, day));
            }
        }
        
        return dates;
    }

    static isEventPast(dateStr, timeStr) {
        const now = new Date();
        const currentDate = CalendarUtils.formatDate(now);
        
        if (dateStr > currentDate) {
            return false;
        }
        
        if (dateStr < currentDate) {
            return true;
        }
        
        if (dateStr === currentDate) {
            if (!timeStr || !timeStr.trim()) {
                return false;
            }
            const eventDateTime = new Date(`${dateStr}T${timeStr}`);
            return eventDateTime < now;
        }
        
        return false;
    }

    static generateTimeOptions() {
        const hours = [];
        const minutes = [];

        for (let h = 0; h < 24; h++) {
            hours.push(String(h).padStart(2, '0'));
        }

        for (let m = 0; m < 60; m += 15) {
            minutes.push(String(m).padStart(2, '0'));
        }

        return { hours, minutes };
    }
}