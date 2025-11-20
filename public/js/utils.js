// Utility functions
const Utils = {
    debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US');
    },

    formatTime(date) {
        return new Date(date).toLocaleTimeString('en-US');
    }
};