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

    static isEventPast(dateStr, timeStr) {
        const now = new Date();
        const currentDate = CalendarUtils.formatDate(now);
        
        // If the event date is in the future, it's not past
        if (dateStr > currentDate) {
            return false;
        }
        
        // If the event date is in the past, it's past
        if (dateStr < currentDate) {
            return true;
        }
        
        // Same day - check time
        if (dateStr === currentDate) {
            if (!timeStr || !timeStr.trim()) {
                return false; // No time specified, not past
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