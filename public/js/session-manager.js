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
            console.log('SessionManager: Setting initialized to true');
            
            this.currentUser = user;
            this.initialized = true;
            
            console.log('SessionManager: Current listeners before notification:', this.listeners.length);
            console.log('SessionManager: Notifying', this.listeners.length, 'listeners');
            
            // Notify all current listeners
            this.listeners.forEach((callback, index) => {
                console.log('SessionManager: Calling listener', index, 'with user:', user ? user.email : 'null');
                try {
                    callback(user);
                } catch (error) {
                    console.error('SessionManager: Error calling listener', index, error);
                }
            });
            
            console.log('SessionManager: Done notifying listeners');
        });
    }

    /**
     * Subscribe to auth changes
     * Returns unsubscribe function
     */
    subscribe(callback) {
        console.log('SessionManager: subscribe() called, current state - initialized:', this.initialized, 'currentUser:', this.currentUser ? this.currentUser.email : 'null');
        
        // Add listener to array immediately
        this.listeners.push(callback);
        console.log('SessionManager: Callback added to listeners array. Total listeners now:', this.listeners.length);
        
        // If already initialized, call the callback immediately with current state
        if (this.initialized) {
            console.log('SessionManager: IMMEDIATELY calling callback with currentUser:', this.currentUser ? this.currentUser.email : 'null');
            callback(this.currentUser);
            console.log('SessionManager: Immediate callback execution completed');
        } else {
            console.log('SessionManager: Not initialized yet, callback will be called by onAuthStateChanged listener');
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
console.log('SessionManager file loading, document.readyState:', document.readyState);

if (document.readyState === 'loading') {
    console.log('SessionManager: Document is loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('SessionManager: DOMContentLoaded event fired');
        new SessionManager();
    });
} else {
    console.log('SessionManager: Document already loaded');
    new SessionManager();
}