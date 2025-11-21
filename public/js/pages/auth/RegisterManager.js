// Registration functionality
class RegisterManager {
    constructor() {
        this.form = document.getElementById('registerForm');
        this.errorDiv = document.getElementById('authError');
        this.init();
    }

    init() {
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

        try {
            console.log('RegisterManager: Validating input');
            AuthUtils.validateEmail(email);
            AuthUtils.validatePasswords(password, confirmPassword);

            console.log('RegisterManager: Creating auth user');
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);

            console.log('RegisterManager: Creating Firestore user document');
            await firebase.firestore().collection('users').doc(result.user.uid).set({
                email: email,
                fullName: fullName,
                role: 'customer',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                emailVerified: false
            });

            console.log('RegisterManager: Registration successful');
            window.location.href = './dashboard.html';
        } catch (error) {
            console.error('RegisterManager: Registration failed:', error);
            this.showError(AuthUtils.getErrorMessage(error.code, error.message));
        }
    }

    showError(message) {
        this.errorDiv.textContent = message;
        this.errorDiv.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RegisterManager();
});