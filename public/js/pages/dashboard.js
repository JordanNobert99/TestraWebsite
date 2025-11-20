class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.sessionUnsubscribe = null;
        this.init();
    }

    init() {
        // Use SessionManager instead of direct Firebase auth
        this.sessionUnsubscribe = new SessionManager().subscribe((user) => {
            if (user) {
                this.currentUser = user;
                this.loadUserData(user.uid);
                this.setupLogout();
            } else {
                // Redirect to login if not authenticated
                window.location.href = '../pages/login.html';
            }
        });
        
        this.setupEventListeners();
    }

    async loadUserData(uid) {
        try {
            const userDoc = await firebase.firestore().collection('users').doc(uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.userRole = userData.role;
                
                // Update UI
                document.getElementById('userEmail').textContent = this.currentUser.email;
                document.getElementById('userName').textContent = userData.fullName || 'User';
                
                // Show appropriate dashboard
                this.showDashboard(this.userRole);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    showDashboard(role) {
        if (role === 'admin') {
            document.getElementById('adminDashboard').style.display = 'block';
            document.getElementById('customerDashboard').style.display = 'none';
        } else {
            document.getElementById('customerDashboard').style.display = 'block';
            document.getElementById('adminDashboard').style.display = 'none';
        }
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await new SessionManager().logout();
                    window.location.href = '../pages/login.html';
                } catch (error) {
                    console.error('Error logging out:', error);
                }
            });
        }
    }

    setupEventListeners() {
        // Additional event listeners can be added here
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});