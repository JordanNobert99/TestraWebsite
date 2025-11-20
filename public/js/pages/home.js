class HomePageManager {
    constructor() {
        this.sessionManager = new SessionManager();
        this.init();
    }

    init() {
        // Subscribe to auth changes
        this.sessionManager.subscribe((user) => {
            this.updateNavigation(user);
        });
    }

    updateNavigation(user) {
        const authNav = document.getElementById('authNav');
        
        if (user) {
            // User is logged in
            authNav.innerHTML = `
                <a href="pages/dashboard.html" class="btn-nav-login">Dashboard</a>
            `;
        } else {
            // User is logged out
            authNav.innerHTML = `
                <a href="pages/login.html" class="btn-nav-login">Login</a>
            `;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new HomePageManager();
});