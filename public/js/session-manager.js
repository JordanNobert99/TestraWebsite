/**
 * Session Manager - Manages auth state across all pages
 * Prevents unnecessary redirects and maintains session
 */
class SessionManager {
    static instance = null;
    
    constructor() {
        if (SessionManager.instance) {
            return SessionManager.instance;
        }
        
        this.currentUser = null;
        this.listeners = [];
        this.initialized = false;
        
        this.init();
        SessionManager.instance = this;
    }

    init() {
        firebase.auth().onAuthStateChanged((user) => {
            console.log('SessionManager: Auth state changed', user ? user.email : 'logged out');
            
            this.currentUser = user;
            this.initialized = true;
            
            // Notify all listeners
            this.listeners.forEach(callback => callback(user));
        });
    }

    /**
     * Subscribe to auth changes
     * Returns unsubscribe function
     */
    subscribe(callback) {
        this.listeners.push(callback);
        
        // Immediately call if already initialized
        if (this.initialized && this.currentUser) {
            callback(this.currentUser);
        }
        
        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.currentUser;
    }

    /**
     * Get current user
     */
    getUser() {
        return this.currentUser;
    }

    /**
     * Logout
     */
    async logout() {
        await firebase.auth().signOut();
    }
}

// Initialize singleton on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SessionManager();
    });
} else {
    new SessionManager();
}