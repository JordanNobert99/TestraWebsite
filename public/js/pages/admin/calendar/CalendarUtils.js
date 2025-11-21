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
}