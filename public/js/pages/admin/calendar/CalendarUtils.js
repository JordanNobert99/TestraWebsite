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
        
        // Find the first Sunday of the month (start of week 1)
        const daysUntilFirstSunday = (7 - firstDayOfWeek) % 7;
        const firstSundayDate = firstDay.getDate() + daysUntilFirstSunday;
        
        // If the month starts on Sunday, week 1 starts on day 1
        // Otherwise, days before the first Sunday are also part of week 1
        if (day < firstSundayDate) {
            return 1; // Before first Sunday, still week 1
        }
        
        // Calculate which week after the first Sunday
        const daysSinceFirstSunday = day - firstSundayDate;
        const weekNum = Math.floor(daysSinceFirstSunday / 7) + 2;
        
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