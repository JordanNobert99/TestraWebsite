class LoginManager {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.errorDiv = document.getElementById('authError');
        this.init();
    }

    init() {
        // Wait for Firebase to be ready
        this.waitForFirebase(() => {
            if (this.form) {
                this.form.addEventListener('submit', (e) => this.handleLogin(e));
            }
        });
    }

    waitForFirebase(callback) {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            callback();
        } else {
            setTimeout(() => this.waitForFirebase(callback), 100);
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            // Sign in with Firebase
            const result = await firebase.auth().signInWithEmailAndPassword(email, password);
            
            // Get user role to determine redirect
            const userDoc = await firebase.firestore()
                .collection('users')
                .doc(result.user.uid)
                .get();
            
            const role = userDoc.data()?.role || 'customer';
            
            // Redirect to dashboard
            window.location.href = './dashboard.html';
        } catch (error) {
            this.showError(this.getErrorMessage(error.code));
        }
    }

    showError(message) {
        this.errorDiv.textContent = message;
        this.errorDiv.style.display = 'block';
    }

    getErrorMessage(code) {
        const errors = {
            'auth/email-already-in-use': 'Email already in use',
            'auth/invalid-email': 'Invalid email address',
            'auth/weak-password': 'Password too weak (min 6 characters)',
            'auth/user-not-found': 'User not found',
            'auth/wrong-password': 'Incorrect password',
            'auth/too-many-requests': 'Too many login attempts. Please try again later.'
        };
        return errors[code] || 'Login failed. Please try again.';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});