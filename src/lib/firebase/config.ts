// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC6oNYoFTxF_oMa1bYsH5kwdq8ou-VeuKo",
    authDomain: "coders-hackathon.firebaseapp.com",
    projectId: "coders-hackathon",
    storageBucket: "coders-hackathon.firebasestorage.app",
    messagingSenderId: "89556740537",
    appId: "1:89556740537:web:14957766afeb21fa872e68",
    measurementId: "G-CWEX969ELX"
};

// Initialize Firebase (singleton pattern for Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics safely (only runs in browser contexts that support it)
let analytics: any;
if (typeof window !== "undefined") {
    isSupported().then(supported => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, auth, db, analytics };
