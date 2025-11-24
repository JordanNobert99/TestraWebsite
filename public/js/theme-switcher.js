class ThemeSwitcher {
    constructor() {
        this.themeToggleBtn = document.getElementById('themeToggle');
        this.themeIcon = document.querySelector('.theme-icon');

        // prefer stored theme; otherwise use system preference
        this.currentTheme = this.getStoredTheme();
        if (!this.currentTheme) {
            this.currentTheme = this.getPreferredTheme();
        }

        this.init();
    }

    init() {
        // Set initial theme
        this.setTheme(this.currentTheme);
        
        // Add click event listener
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        theme = (theme === 'dark') ? 'dark' : 'light'; // normalize
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        this.updateIcon();
        this.storeTheme(theme);
    }

    updateIcon() {
        if (this.themeIcon) {
            // Show icon representing the current theme
            this.themeIcon.textContent = this.currentTheme === 'dark' ? '🌙' : '☀️';
        }
    }

    storeTheme(theme) {
        try {
            localStorage.setItem('testra-theme', theme);
        } catch (e) {
            // ignore storage errors (private mode, etc.)
        }
    }

    getStoredTheme() {
        try {
            const t = localStorage.getItem('testra-theme');
            return (t === 'dark' || t === 'light') ? t : null;
        } catch (e) {
            return null;
        }
    }

    getPreferredTheme() {
        try {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
        } catch (e) {
            // ignore
        }
        return 'light';
    }
}

// Initialize theme switcher when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ThemeSwitcher();
});