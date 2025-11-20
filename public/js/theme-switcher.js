class ThemeSwitcher {
    constructor() {
        this.themeToggleBtn = document.getElementById('themeToggle');
        this.themeIcon = document.querySelector('.theme-icon');
        this.currentTheme = this.getStoredTheme() || 'light';
        
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
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        this.updateIcon();
        this.storeTheme(theme);
    }

    updateIcon() {
        if (this.themeIcon) {
            this.themeIcon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        }
    }

    storeTheme(theme) {
        localStorage.setItem('testra-theme', theme);
    }

    getStoredTheme() {
        return localStorage.getItem('testra-theme');
    }
}

// Initialize theme switcher when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ThemeSwitcher();
});