// Authentication utilities and error handling
class AuthUtils {
    static getErrorMessage(code, message = '') {
        const errors = {
            'auth/email-already-in-use': 'Email already in use',
            'auth/invalid-email': 'Invalid email address',
            'auth/weak-password': 'Password must be at least 6 characters',
            'auth/user-not-found': 'User not found',
            'auth/wrong-password': 'Incorrect password',
            'auth/operation-not-allowed': 'Registration is currently disabled',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'permission-denied': 'Permission denied - check security rules',
            'failed-precondition': 'Database not ready'
        };
        return errors[code] || `Error: ${message || 'Authentication failed'}`;
    }

    static validatePasswords(password, confirmPassword) {
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email address');
        }
    }
}