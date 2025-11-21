// Main dashboard manager orchestrator
class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.dashboardData = new DashboardData();
        this.dashboardUI = new DashboardUI();
        this.init();
    }

    init() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                console.log('DashboardManager: User logged in:', user.email);
                this.loadUserData(user.uid);
                this.setupLogout();
            } else {
                console.log('DashboardManager: User not authenticated, redirecting to login');
                window.location.href = '../pages/login.html';
            }
        });
    }

    async loadUserData(uid) {
        try {
            const userData = await this.dashboardData.loadUserData(uid);

            if (userData) {
                this.userRole = userData.role;
                console.log('DashboardManager: User role set to:', this.userRole);

                this.dashboardUI.displayUserInfo(this.currentUser.email, userData.fullName);
                this.dashboardUI.showDashboard(this.userRole);
            }
        } catch (error) {
            console.error('DashboardManager: Error loading user data:', error);
        }
    }

    setupLogout() {
        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
            try {
                console.log('DashboardManager: Logout clicked');
                await firebase.auth().signOut();
                window.location.href = '../pages/login.html';
            } catch (error) {
                console.error('DashboardManager: Error logging out:', error);
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DashboardManager: DOM ready, initializing');
    new DashboardManager();
});