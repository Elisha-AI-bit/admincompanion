const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin with service account and database URL
// Ensure you have a serviceAccountKey.json in the server root or use environment variables
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL // e.g., https://your-project-id.firebaseio.com
});

const db = admin.firestore();
const fcm = admin.messaging();

module.exports = { admin, db, fcm };
