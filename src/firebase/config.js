import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBcAMnkvSe9wALSIUQILshWryparaK3vPo",
    authDomain: "my-companion-58472.firebaseapp.com",
    projectId: "my-companion-58472",
    storageBucket: "my-companion-58472.firebasestorage.app",
    messagingSenderId: "67590308462",
    appId: "1:67590308462:web:5d90f639768e8df0ce1c7f",
    measurementId: "G-E8H3Z9T7J8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null

export default app
