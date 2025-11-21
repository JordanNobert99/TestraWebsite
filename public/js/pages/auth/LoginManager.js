// Login functionality
class LoginManager {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.errorDiv = document.getElementById('authError');
        this.init();
    }

    init() {
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
            console.log('LoginManager: Attempting login for:', email);
            const result = await firebase.auth().signInWithEmailAndPassword(email, password);

            console.log('LoginManager: Login successful');
            window.location.href = './dashboard.html';
        } catch (error) {
            console.error('LoginManager: Login failed:', error);
            this.showError(AuthUtils.getErrorMessage(error.code, error.message));
        }
    }

    showError(message) {
        this.errorDiv.textContent = message;
        this.errorDiv.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});