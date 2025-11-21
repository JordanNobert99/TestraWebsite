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

        let weekNum = Math.floor((day - 1 + firstDayOfWeek) / 7) + 1;

        // Bandaid: If this month's first week is also last month's last week, subtract 1
        const firstWeekStart = CalendarUtils.getStartOfWeek(firstDay);
        const firstWeekStartMonth = firstWeekStart.getMonth();
        
        if (firstWeekStartMonth !== month) {
            // First week spans into previous month, so subtract 1 from all week numbers
            weekNum = weekNum - 1;
        }

        return weekNum;
    }

    static getWeekNumberForMonth(date, referenceMonth) {
        const year = date.getFullYear();
        const month = referenceMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();

        let weekNum = Math.floor((date.getDate() - 1 + firstDayOfWeek) / 7) + 1;

        // Bandaid: If this month's first week is also last month's last week, subtract 1
        const firstWeekStart = CalendarUtils.getStartOfWeek(firstDay);
        const firstWeekStartMonth = firstWeekStart.getMonth();
        
        if (firstWeekStartMonth !== month) {
            // First week spans into previous month, so subtract 1 from all week numbers
            weekNum = weekNum - 1;
        }

        return weekNum;
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