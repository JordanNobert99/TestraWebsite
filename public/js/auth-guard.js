/**
 * Auth Guard - Protects pages that require authentication
 * Call this at the start of any page that needs a logged-in user
 */
class AuthGuard {
    constructor(onAuthSuccess) {
        this.onAuthSuccess = onAuthSuccess;
        this.initialized = false;
        this.checkAuth();
    }

    checkAuth() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // User is logged in
                this.initialized = true;
                if (this.onAuthSuccess) {
                    this.onAuthSuccess(user);
                }
            } else {
                // User is NOT logged in - redirect to login
                if (this.initialized) {
                    // Only redirect if we've already initialized and lost auth
                    window.location.href = '../../pages/login.html';
                } else {
                    // First check - redirect immediately
                    window.location.href = '../../pages/login.html';
                }
            }
        });
    }
}