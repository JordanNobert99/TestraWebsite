// Firebase dashboard data operations
class DashboardData {
    async loadUserData(uid) {
        try {
            console.log('DashboardData: Loading user data for UID:', uid);
            const userDoc = await firebase.firestore().collection('users').doc(uid).get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log('DashboardData: User data retrieved:', userData);
                return userData;
            } else {
                console.warn('DashboardData: User document does not exist');
                return null;
            }
        } catch (error) {
            console.error('DashboardData: Error loading user data:', error);
            throw error;
        }
    }
}