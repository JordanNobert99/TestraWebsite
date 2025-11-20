class HomePageManager {
    constructor() {
        this.init();
    }

    init() {
        // Wait for Firebase to be initialized
        this.waitForFirebase();
    }

    waitForFirebase() {
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth()) {
            this.setupAuthListener();
        } else {
            setTimeout(() => this.waitForFirebase(), 100);
        }
    }

    setupAuthListener() {
        // Subscribe to auth changes using SessionManager
        const sessionManager = new SessionManager();
        sessionManager.subscribe((user) => {
            this.updateNavigation(user);
        });
    }

    updateNavigation(user) {
        const authNav = document.getElementById('authNav');
        
        if (!authNav) return; // Safety check
        
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