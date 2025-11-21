// Dashboard UI management
class DashboardUI {
    displayUserInfo(email, fullName) {
        document.getElementById('userEmail').textContent = email;
        document.getElementById('userName').textContent = fullName || 'User';
    }

    showDashboard(role) {
        console.log('DashboardUI: showDashboard called with role:', role);
        const adminDash = document.getElementById('adminDashboard');
        const custDash = document.getElementById('customerDashboard');

        if (role === 'admin') {
            console.log('DashboardUI: Showing admin dashboard');
            adminDash.style.display = 'block';
            custDash.style.display = 'none';
        } else {
            console.log('DashboardUI: Showing customer dashboard');
            custDash.style.display = 'block';
            adminDash.style.display = 'none';
        }
    }
}