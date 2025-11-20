class RegisterManager {
    constructor() {
        this.form = document.getElementById('registerForm');
        this.errorDiv = document.getElementById('authError');
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleRegister(e));
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
            // Create user in Firebase
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            
            // Store user data in Firestore
            await firebase.firestore().collection('users').doc(result.user.uid).set({
                email: email,
                fullName: fullName,
                role: 'customer', // New users are customers
                createdAt: new Date(),
                emailVerified: false
            });
            
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
            'auth/weak-password': 'Password must be at least 6 characters',
            'auth/operation-not-allowed': 'Registration is currently disabled',
            'auth/too-many-requests': 'Too many registration attempts. Please try again later.'
        };
        return errors[code] || 'Registration failed. Please try again.';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RegisterManager();
});