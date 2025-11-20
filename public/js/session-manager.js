/**
 * Session Manager - Manages auth state across all pages
 * Prevents unnecessary redirects and maintains session
 */
class SessionManager {
    static instance = null;
    
    constructor() {
        console.log('SessionManager: Constructor called');
        
        if (SessionManager.instance) {
            console.log('SessionManager: Returning existing instance');
            return SessionManager.instance;
        }
        
        this.currentUser = null;
        this.listeners = [];
        this.initialized = false;
        
        this.waitForFirebase();
        SessionManager.instance = this;
    }

    waitForFirebase() {
        console.log('SessionManager: waitForFirebase() called');
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth()) {
            console.log('SessionManager: Firebase is ready, calling init()');
            this.init();
        } else {
            console.log('SessionManager: Firebase not ready, waiting...');
            setTimeout(() => this.waitForFirebase(), 100);
        }
    }

    init() {
        console.log('SessionManager: init() called, setting up onAuthStateChanged');
        firebase.auth().onAuthStateChanged((user) => {
            console.log('SessionManager: onAuthStateChanged fired, user:', user ? user.email : 'null');
            
            this.currentUser = user;
            this.initialized = true;
            
            console.log('SessionManager: Notifying', this.listeners.length, 'listeners');
            // Notify all listeners
            this.listeners.forEach((callback, index) => {
                console.log('SessionManager: Calling listener', index);
                callback(user);
            });
        });
    }

    /**
     * Subscribe to auth changes
     * Returns unsubscribe function
     */
    subscribe(callback) {
        console.log('SessionManager: subscribe() called');
        this.listeners.push(callback);
        
        console.log('SessionManager: Initialized?', this.initialized, 'CurrentUser?', this.currentUser ? this.currentUser.email : 'null');
        
        // Immediately call if already initialized
        if (this.initialized && this.currentUser) {
            console.log('SessionManager: Immediately calling callback with current user');
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
    console.log('SessionManager: Document loading, setting up DOMContentLoaded listener');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('SessionManager: DOMContentLoaded fired, creating instance');
        new SessionManager();
    });
} else {
    console.log('SessionManager: Document already loaded, creating instance immediately');
    new SessionManager();
}