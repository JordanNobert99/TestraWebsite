class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
    }

    async login(email, password) {
        try {
            const result = await firebase.auth().signInWithEmailAndPassword(email, password);
            return result.user;
        } catch (error) {
            throw new Error(this.getErrorMessage(error.code));
        }
    }

    async register(email, password, role = 'customer') {
        try {
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            await firebase.firestore().collection('users').doc(result.user.uid).set({
                email: email,
                role: role,
                createdAt: new Date()
            });
            return result.user;
        } catch (error) {
            throw new Error(this.getErrorMessage(error.code));
        }
    }

    async logout() {
        try {
            await firebase.auth().signOut();
            this.currentUser = null;
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }

    getErrorMessage(code) {
        const errors = {
            'auth/email-already-in-use': 'Email already in use',
            'auth/invalid-email': 'Invalid email',
            'auth/weak-password': 'Password too weak (min 6 characters)',
            'auth/user-not-found': 'User not found',
            'auth/wrong-password': 'Incorrect password'
        };
        return errors[code] || 'Authentication error';
    }
}

const authManager = new AuthManager();