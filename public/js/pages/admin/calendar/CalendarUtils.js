// Date formatting and calculation utilities
class CalendarUtils {
    static formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    static getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        const result = new Date(d.getFullYear(), d.getMonth(), diff);
        return result;
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
     * Get the week number for a specific date within its current month context
     * Does NOT adjust for month boundaries - just calculates the week within that month
     */
    static getWeekNumberForMonth(date, referenceMonth) {
        const year = date.getFullYear();
        const month = referenceMonth.getMonth();
        
        // Get the first day of the reference month
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();
        
        // Calculate which week this date falls into in the reference month
        // This handles dates from the previous/next month as well
        const weekNum = Math.floor((date.getDate() - 1 + firstDayOfWeek) / 7) + 1;
        
        return weekNum;
    }

    /**
     * Get ISO week number (1-53) - consistent across month boundaries
     */
    static getISOWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7; // Monday is 1, Sunday is 7
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    /**
     * Get calendar week number (for display purposes)
     * Shows which week of the year, accounting for month boundaries
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
     * Returns true if the week number is correctly positioned
     */
    static validateWeekNumber(date) {
        const weekNum = this.getWeekNumberInMonth(date);
        const month = date.getMonth();
        const year = date.getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Maximum weeks in a month is 6 (rare edge case)
        // Minimum is 4 (always true for any month)
        // Most common is 4-5 weeks
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

    handleNextMonth() {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        } else {
            const startOfCurrentWeek = CalendarUtils.getStartOfWeek(this.currentDate);
            const endOfCurrentWeek = new Date(startOfCurrentWeek);
            endOfCurrentWeek.setDate(endOfCurrentWeek.getDate() + 6);

            // Week spans two months if start and end are different months
            const weekSpansTwoMonths = startOfCurrentWeek.getMonth() !== endOfCurrentWeek.getMonth();

            if (weekSpansTwoMonths) {
                // Just change the month - we're already viewing the boundary week
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                console.log('MONTH CHANGED ONLY - already on boundary week');
            } else {
                // Normal week - advance 7 days
                this.currentDate.setDate(this.currentDate.getDate() + 7);
                console.log('ADVANCED 7 DAYS - normal week');
            }
        }
        this.renderCalendar();
    }

    handlePrevMonth() {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        } else {
            const startOfCurrentWeek = CalendarUtils.getStartOfWeek(this.currentDate);
            const endOfCurrentWeek = new Date(startOfCurrentWeek);
            endOfCurrentWeek.setDate(endOfCurrentWeek.getDate() + 6);

            // Week spans two months if start and end are different months
            const weekSpansTwoMonths = startOfCurrentWeek.getMonth() !== endOfCurrentWeek.getMonth();

            if (weekSpansTwoMonths) {
                // Just change the month - we're already viewing the boundary week
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                console.log('MONTH CHANGED ONLY - already on boundary week');
            } else {
                // Normal week - go back 7 days
                this.currentDate.setDate(this.currentDate.getDate() - 7);
                console.log('WENT BACK 7 DAYS - normal week');
            }
        }
        this.renderCalendar();
    }
}