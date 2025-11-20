// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBTeR0DEf1UzphdDdco8JxCRsLb7E0WGVs",
    authDomain: "testra-website.firebaseapp.com",
    projectId: "testra-website",
    storageBucket: "testra-website.firebasestorage.app",
    messagingSenderId: "523864898796",
    appId: "1:523864898796:web:830fb43980feda6608f9c9",
    measurementId: "G-9NFYC08ZR1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export for use in other modules
window.firebaseAuth = firebase.auth();
window.firebaseDB = firebase.firestore();
window.firebaseStorage = firebase.storage();