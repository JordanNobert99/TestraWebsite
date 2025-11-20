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
            
            console.log('SessionManager: Current listeners:', this.listeners.length);
            console.log('SessionManager: Notifying', this.listeners.length, 'listeners');
            
            // Notify all current listeners
            this.listeners.forEach((callback, index) => {
                console.log('SessionManager: Calling listener', index);
                try {
                    callback(user);
                } catch (error) {
                    console.error('SessionManager: Error calling listener', index, error);
                }
            });
        });
    }

    /**
     * Subscribe to auth changes
     * Returns unsubscribe function
     */
    subscribe(callback) {
        console.log('SessionManager: subscribe() called');
        
        // Add listener to array FIRST
        this.listeners.push(callback);
        console.log('SessionManager: Listener added, total listeners:', this.listeners.length);
        
        console.log('SessionManager: Initialized?', this.initialized, 'CurrentUser?', this.currentUser ? this.currentUser.email : 'null');
        
        // CRITICAL: If already initialized, call callback immediately
        // This handles the case where onAuthStateChanged already fired
        if (this.initialized) {
            console.log('SessionManager: Already initialized, calling callback immediately with:', this.currentUser ? this.currentUser.email : 'null');
            // Call synchronously since state is already known
            callback(this.currentUser);
        } else {
            console.log('SessionManager: Not yet initialized, waiting for onAuthStateChanged');
        }
        
        // Return unsubscribe function
        return () => {
            console.log('SessionManager: Unsubscribe called');
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
        console.log('SessionManager: logout() called');
        await firebase.auth().signOut();
    }
}

// Initialize singleton on page load
console.log('SessionManager file: Document readyState:', document.readyState);

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