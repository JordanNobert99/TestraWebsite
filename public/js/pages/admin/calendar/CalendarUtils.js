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

    static getWeekNumber(date) {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const firstMonday = new Date(firstDay);
        firstMonday.setDate(firstDay.getDate() + (8 - firstDay.getDay()) % 7);
        
        const diffTime = Math.abs(date - firstDay);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let weekNum = Math.floor(diffDays / 7) + 1;
        if (weekNum > 4) {
            weekNum = 4;
        }
        
        return weekNum;
    }

    static isEventPast(dateStr, timeStr) {
        const now = new Date();
        const eventTime = (timeStr && timeStr.trim()) ? timeStr : '23:59';
        const eventDateTime = new Date(`${dateStr}T${eventTime}`);
        return eventDateTime < now;
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