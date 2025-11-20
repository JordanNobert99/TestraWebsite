class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.sessionUnsubscribe = null;
        console.log('DashboardManager: Constructor called');
        this.init();
    }

    init() {
        console.log('DashboardManager: init() called');
        
        // Use SessionManager instead of direct Firebase auth
        const sessionManager = new SessionManager();
        console.log('DashboardManager: SessionManager created');
        
        this.sessionUnsubscribe = sessionManager.subscribe((user) => {
            console.log('DashboardManager: Subscribe callback fired with user:', user ? user.email : 'null');
            
            if (user) {
                this.currentUser = user;
                console.log('DashboardManager: User logged in:', user.email);
                this.loadUserData(user.uid);
                this.setupLogout();
            } else {
                // Redirect to login if not authenticated
                console.log('DashboardManager: User not authenticated, redirecting to login');
                window.location.href = '../pages/login.html';
            }
        });
        
        console.log('DashboardManager: Subscribe callback registered');
        this.setupEventListeners();
    }

    async loadUserData(uid) {
        try {
            console.log('DashboardManager: Loading user data for UID:', uid);
            const userDoc = await firebase.firestore().collection('users').doc(uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log('DashboardManager: User data retrieved:', userData);
                this.userRole = userData.role;
                console.log('DashboardManager: User role set to:', this.userRole);
                
                // Update UI
                document.getElementById('userEmail').textContent = this.currentUser.email;
                document.getElementById('userName').textContent = userData.fullName || 'User';
                
                // Show appropriate dashboard
                this.showDashboard(this.userRole);
            } else {
                console.warn('DashboardManager: User document does not exist');
            }
        } catch (error) {
            console.error('DashboardManager: Error loading user data:', error);
        }
    }

    showDashboard(role) {
        console.log('DashboardManager: showDashboard called with role:', role);
        const adminDash = document.getElementById('adminDashboard');
        const custDash = document.getElementById('customerDashboard');
        
        if (role === 'admin') {
            console.log('DashboardManager: Showing admin dashboard');
            adminDash.style.display = 'block';
            custDash.style.display = 'none';
        } else {
            console.log('DashboardManager: Showing customer dashboard');
            custDash.style.display = 'block';
            adminDash.style.display = 'none';
        }
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && !logoutBtn.dataset.initialized) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    console.log('DashboardManager: Logout clicked');
                    await new SessionManager().logout();
                    window.location.href = '../pages/login.html';
                } catch (error) {
                    console.error('DashboardManager: Error logging out:', error);
                }
            });
            logoutBtn.dataset.initialized = 'true';
        }
    }

    setupEventListeners() {
        // Additional event listeners can be added here
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DashboardManager: DOM ready, initializing');
    new DashboardManager();
});