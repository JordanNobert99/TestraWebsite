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

    static getWeekNumberInMonth(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();

        // Standard calculation: ceil((day + firstDayOfWeek) / 7)
        let weekNum = Math.ceil((day + firstDayOfWeek) / 7);

        // Only subtract 1 if:
        // 1. Week 1 doesn't start on day 1 (firstDayOfWeek > 0)
        // 2. We calculated week 2 or higher (weekNum >= 2)
        // 3. The first week has MORE days from previous month than current month
        if (firstDayOfWeek > 0 && weekNum >= 2) {
            // Days from previous month in week 1: firstDayOfWeek
            // Days from current month in week 1: 7 - firstDayOfWeek
            const daysFromPrevMonth = firstDayOfWeek;
            const daysFromCurrMonth = 7 - firstDayOfWeek;
            
            // Only subtract if previous month has more days in week 1
            if (daysFromPrevMonth > daysFromCurrMonth) {
                weekNum = Math.max(1, weekNum - 1);
            }
        }

        return weekNum;
    }

    static getWeekNumberForMonth(date, referenceMonth) {
        const year = date.getFullYear();
        const month = referenceMonth.getMonth();
        const day = date.getDate();

        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();

        // Count weeks from the start of the month
        let weekNum = Math.ceil((day + firstDayOfWeek) / 7);

        // If week 1 doesn't start on day 1, subtract 1 from the week number
        if (firstDayOfWeek > 0) {
            weekNum = Math.max(1, weekNum - 1);
        }

        return weekNum;
    }

    static getWeekNumberInMonthByStartDate(weekStartDate, referenceMonth) {
        // Find which week this Sunday belongs to in the reference month
        // by counting from the month's first day
        const year = referenceMonth.getFullYear();
        const month = referenceMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();
        
        // Get any date in the week to find the week number
        const testDate = new Date(weekStartDate);
        if (testDate.getMonth() === month) {
            // Use the date from this month
            const weekNum = Math.ceil((testDate.getDate() + firstDayOfWeek) / 7);
            return weekNum;
        } else {
            // Use the first date from the reference month in this week
            for (let i = 0; i < 7; i++) {
                const checkDate = new Date(weekStartDate);
                checkDate.setDate(checkDate.getDate() + i);
                if (checkDate.getMonth() === month) {
                    const weekNum = Math.ceil((checkDate.getDate() + firstDayOfWeek) / 7);
                    return weekNum;
                }
            }
        }
        return 1;
    }

    static getISOWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    static getCalendarWeekNumber(date) {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const startOfWeek = this.getStartOfWeek(startOfYear);
        const currentWeekStart = this.getStartOfWeek(date);
        const weeksDiff = Math.round((currentWeekStart - startOfWeek) / (7 * 24 * 60 * 60 * 1000));
        return weeksDiff + 1;
    }

    static validateWeekNumber(date) {
        const weekNum = this.getWeekNumberInMonth(date);
        const month = date.getMonth();
        const year = date.getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        return weekNum >= 1 && weekNum <= 6;
    }

    static getWeekDates(date, weekNum) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const dates = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const currentWeekNum = Math.ceil((day + firstDayOfWeek) / 7);
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