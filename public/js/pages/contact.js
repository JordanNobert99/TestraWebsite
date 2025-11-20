class ContactManager {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.successDiv = document.getElementById('contactSuccess');
        this.errorDiv = document.getElementById('contactError');
        this.init();
    }

    init() {
        // Wait for Firebase to be ready
        this.waitForFirebase(() => {
            if (this.form) {
                this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            }
        });
    }

    waitForFirebase(callback) {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            callback();
        } else {
            setTimeout(() => this.waitForFirebase(callback), 100);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('contactEmail').value,
            service: document.getElementById('service').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value,
            submittedAt: new Date()
        };
        
        try {
            // Save to Firestore
            await firebase.firestore().collection('contact_submissions').add(formData);
            
            // Show success message
            this.form.style.display = 'none';
            this.successDiv.style.display = 'block';
            
            // Reset form after 5 seconds
            setTimeout(() => {
                this.form.style.display = 'block';
                this.successDiv.style.display = 'none';
                this.form.reset();
            }, 5000);
        } catch (error) {
            this.showError('Failed to send message. Please try again.');
            console.error('Error:', error);
        }
    }

    showError(message) {
        this.errorDiv.textContent = message;
        this.errorDiv.style.display = 'block';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ContactManager();
});