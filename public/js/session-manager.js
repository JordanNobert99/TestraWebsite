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
        this.authStateCallbacks = []; // Queue for auth state changes
        
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
        console.log('SessionManager: subscribe() called, total listeners before:', this.listeners.length);
        
        // Add listener to array
        this.listeners.push(callback);
        console.log('SessionManager: Listener added, total listeners after:', this.listeners.length);
        
        console.log('SessionManager: Initialized?', this.initialized, 'CurrentUser?', this.currentUser ? this.currentUser.email : 'null');
        
        // Immediately call if already initialized (auth state is known)
        if (this.initialized) {
            console.log('SessionManager: Already initialized, immediately calling callback');
            // Use setTimeout to ensure it's async
            setTimeout(() => {
                console.log('SessionManager: Executing immediate callback with user:', this.currentUser ? this.currentUser.email : 'null');
                callback(this.currentUser);
            }, 0);
        } else {
            console.log('SessionManager: Not yet initialized, callback will be called when auth state is determined');
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