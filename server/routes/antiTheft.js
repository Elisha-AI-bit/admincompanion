const express = require('express');
const router = express.Router();
const { db, fcm } = require('../firebaseAdmin');

/**
 * Trigger Anti-Theft FCM command
 * POST /api/anti-theft/trigger
 * Payload: { userId: string }
 */
router.post('/trigger', async (req, res) => {
    const { userId } = req.body;
    const adminId = req.user?.uid; // Assumes some auth middleware populates req.user
    const adminEmail = req.user?.email;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    try {
        // 1. Role Verification (Simplified: check if requesting user is an admin)
        // In a real app, you'd check a 'role' field in the admins collection
        const adminDoc = await db.collection('admins').doc(adminId).get();
        if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }

        // 2. Fetch target user's FCM token from Firestore
        // Expected structure: users/{userId}/fcmToken: "..."
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const fcmToken = userData.fcmToken;

        if (!fcmToken) {
            return res.status(400).json({ error: 'User does not have a registered FCM token' });
        }

        // 3. Prepare HIGH PRIORITY data-only FCM message
        const message = {
            token: fcmToken,
            data: {
                type: 'ANTI_THEFT',
                action: 'START_CAPTURE',
                userId: userId,
                timestamp: new Date().toISOString()
            },
            android: {
                priority: 'high',
                ttl: 0 // Immediate delivery
            },
            apns: {
                payload: {
                    aps: {
                        'content-available': 1 // Trigger background execution on iOS
                    }
                }
            }
        };

        // 4. Send FCM message
        const response = await fcm.send(message);

        // 5. Log the trigger event in Firestore
        const logEntry = {
            userId,
            adminId,
            adminEmail,
            action: 'ANTI_THEFT_TRIGGERED',
            fcmMessageId: response,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('audit_logs').add(logEntry);

        // 6. Return success response
        return res.status(200).json({
            success: true,
            messageId: response,
            message: 'Anti-theft trigger sent successfully'
        });

    } catch (error) {
        console.error('Error triggering anti-theft:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;
