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
        
        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }
        
        try {
            console.log('Step 1: Creating auth user with email:', email);
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            console.log('Step 2: Auth user created, UID:', result.user.uid);
            
            console.log('Step 3: Starting Firestore write...');
            const userRef = firebase.firestore().collection('users').doc(result.user.uid);
            
            await userRef.set({
                email: email,
                fullName: fullName,
                role: 'customer',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                emailVerified: false
            });
            
            console.log('Step 4: Firestore write successful!');
            
            // Redirect to dashboard
            window.location.href = './dashboard.html';
        } catch (error) {
            console.error('=== FULL ERROR ===');
            console.error('Error Code:', error.code);
            console.error('Error Message:', error.message);
            console.error('Full Error:', error);
            console.error('=================');
            
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
            'permission-denied': 'Firestore permission denied - check security rules',
            'failed-precondition': 'Firestore database not ready'
        };
        return errors[code] || `Error: ${message}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RegisterManager();
});