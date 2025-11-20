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
            if (user) {
                this.loadUserRole(user.uid);
            } else {
                this.updateNavigation(null);
            }
        });
    }

    async loadUserRole(uid) {
        try {
            const userDoc = await firebase.firestore()
                .collection('users')
                .doc(uid)
                .get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.updateNavigation(userData.role);
            }
        } catch (error) {
            console.error('Error loading user role:', error);
            this.updateNavigation(null);
        }
    }

    updateNavigation(role) {
        const authNav = document.getElementById('authNav');
        
        if (!authNav) return; // Safety check
        
        if (role === 'admin') {
            // Admin user - show admin-specific nav
            authNav.innerHTML = `
                <a href="pages/dashboard.html" class="btn-nav-login">Dashboard</a>
            `;
        } else if (role === 'customer') {
            // Customer user - show customer nav
            authNav.innerHTML = `
                <a href="pages/dashboard.html" class="btn-nav-login">Dashboard</a>
            `;
        } else {
            // Not logged in
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