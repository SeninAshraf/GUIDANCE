
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Replace with your actual Firebase project configuration
// You can get this from the Firebase Console (Settings > General > Your apps > SDK setup and configuration)
const firebaseConfig = {
    apiKey: "AIzaSyCrtmT7OAKBXcDxYJij4JGjFxU13JE-7a4",
    authDomain: "career-fa129.firebaseapp.com",
    projectId: "career-fa129",
    storageBucket: "career-fa129.firebasestorage.app",
    messagingSenderId: "254257505124",
    appId: "1:254257505124:web:399b490d7c63a338b9d071",
    measurementId: "G-8041MY9FQR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
