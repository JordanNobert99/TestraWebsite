class RegisterManager {
    constructor() {
        this.form = document.getElementById('registerForm');
        this.errorDiv = document.getElementById('authError');
        this.init();
    }

    init() {
        // Wait for Firebase to be ready
        this.waitForFirebase(() => {
            if (this.form) {
                this.form.addEventListener('submit', (e) => this.handleRegister(e));
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

    async handleRegister(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const fullName = document.getElementById('fullName').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }
        
        try {
            console.log('Creating user with email:', email);
            
            // Create user in Firebase
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            console.log('User created successfully:', result.user.uid);
            
            // Store user data in Firestore
            console.log('Attempting to write to Firestore...');
            await firebase.firestore().collection('users').doc(result.user.uid).set({
                email: email,
                fullName: fullName,
                role: 'customer',
                createdAt: new Date(),
                emailVerified: false
            });
            console.log('Firestore write successful');
            
            // Redirect to dashboard
            window.location.href = './dashboard.html';
        } catch (error) {
            console.error('Full error object:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            this.showError(this.getErrorMessage(error.code, error.message));
        }
    }

    showError(message) {
        this.errorDiv.textContent = message;
        this.errorDiv.style.display = 'block';
    }

    getErrorMessage(code, message) {
        const errors = {
            'auth/email-already-in-use': 'Email already in use',
            'auth/invalid-email': 'Invalid email address',
            'auth/weak-password': 'Password must be at least 6 characters',
            'auth/operation-not-allowed': 'Registration is currently disabled',
            'auth/too-many-requests': 'Too many registration attempts. Please try again later.',
            'permission-denied': 'Database permission error - check Firestore rules',
            'failed-precondition': 'Database not initialized properly'
        };
        return errors[code] || `Registration failed: ${message}`;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RegisterManager();
});