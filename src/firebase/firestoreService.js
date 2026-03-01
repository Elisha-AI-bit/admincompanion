import { db } from './config';
import {
    collection,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';

/**
 * Generic service for Firestore operations
 */
export const firestoreService = {
    // Get all documents from a collection
    getAll: async (collectionName) => {
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(`Error getting all from ${collectionName}:`, error);
            throw error;
        }
    },

    // Get a single document by ID
    getById: async (collectionName, id) => {
        try {
            const docRef = doc(db, collectionName, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error(`Error getting document ${id} from ${collectionName}:`, error);
            throw error;
        }
    },

    // Add a new document
    add: async (collectionName, data) => {
        try {
            const docRef = await addDoc(collection(db, collectionName), data);
            return docRef.id;
        } catch (error) {
            console.error(`Error adding document to ${collectionName}:`, error);
            throw error;
        }
    },

    // Update a document
    update: async (collectionName, id, data) => {
        try {
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, data);
            return true;
        } catch (error) {
            console.error(`Error updating document ${id} in ${collectionName}:`, error);
            throw error;
        }
    },

    // Delete a document
    delete: async (collectionName, id) => {
        try {
            const docRef = doc(db, collectionName, id);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            console.error(`Error deleting document ${id} in ${collectionName}:`, error);
            throw error;
        }
    },

    // Real-time listener (entire collection)
    subscribe: (collectionName, callback, onError) => {
        const q = query(collection(db, collectionName));
        return onSnapshot(q, (snapshot) => {
            try {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(data);
            } catch (error) {
                console.error(`Error processing snapshot for ${collectionName}:`, error);
                if (onError) onError(error);
            }
        }, (error) => {
            console.error(`Error subscribing to ${collectionName}:`, error);
            if (onError) onError(error);
        });
    },

    // Real-time listener with query constraints (ordering, filters, limits)
    subscribeWithQuery: (collectionName, constraints = [], callback, onError) => {
        const q = query(collection(db, collectionName), ...constraints);
        return onSnapshot(q, (snapshot) => {
            try {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(data);
            } catch (error) {
                console.error(`Error processing snapshot for ${collectionName} with constraints:`, error);
                if (onError) onError(error);
            }
        }, (error) => {
            console.error(`Error subscribing (with constraints) to ${collectionName}:`, error);
            if (onError) onError(error);
        });
    },

    // Query documents
    query: async (collectionName, constraints = []) => {
        try {
            const q = query(collection(db, collectionName), ...constraints);
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(`Error querying ${collectionName}:`, error);
            throw error;
        }
    },

    /**
     * Groups the `emergency_calls` collection by day and service for the last N days.
     * Returns: [{ day: 'Mon', Police: 2, Fire: 1, GBV: 0, ... }, ...]
     */
    getEmergencyCallsByDay: async (days = 7) => {
        try {
            const since = new Date();
            since.setDate(since.getDate() - days);
            const sinceTs = Timestamp.fromDate(since);

            const q = query(
                collection(db, 'emergency_calls'),
                where('timestamp', '>=', sinceTs),
                orderBy('timestamp', 'asc')
            );
            const snap = await getDocs(q);
            const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));

            // Normalize service names — Flutter may write 'GBV Support', 'Fire Brigade', etc.
            const normalizeService = (s) => {
                if (!s) return 'Unknown'
                const lower = s.toLowerCase()
                if (lower === 'fire' || lower.includes('fire')) return 'Fire Brigade'
                if (lower === 'gbv' || lower.includes('gbv') || lower.includes('gender')) return 'GBV'
                if (lower.includes('ambulance') || lower.includes('medical')) return 'Ambulance'
                if (lower.includes('child') || lower.includes('support')) return 'Child Support'
                if (lower.includes('police')) return 'Police'
                return s
            }
            const SERVICES = ['Police', 'Fire Brigade', 'GBV', 'Child Support', 'Ambulance'];
            const dayMap = {};
            const dayLabels = [];
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const label = d.toLocaleDateString('en-US', { weekday: 'short' });
                const key = d.toISOString().split('T')[0];
                dayMap[key] = { day: label, Police: 0, 'Fire Brigade': 0, GBV: 0, 'Child Support': 0, Ambulance: 0 };
                dayLabels.push(key);
            }

            docs.forEach(doc => {
                const ts = doc.timestamp?.seconds
                    ? new Date(doc.timestamp.seconds * 1000)
                    : new Date(doc.timestamp);
                const key = ts.toISOString().split('T')[0];
                const service = normalizeService(doc.service || doc.type);
                if (dayMap[key] && SERVICES.includes(service)) {
                    dayMap[key][service] = (dayMap[key][service] || 0) + 1;
                }
            });

            return dayLabels.map(k => dayMap[k]);
        } catch (error) {
            console.error('Error in getEmergencyCallsByDay:', error);
            return [];
        }
    },

    /**
     * Counts action_logs matching given actionTypes since an optional date.
     * @param {string[]} actionTypes - e.g. ['location_share', 'sos']
     * @param {Date|null} since - optional lower bound for timestamp
     */
    getActionLogCounts: async (actionTypes = [], since = null) => {
        try {
            const constraints = [];
            if (actionTypes.length > 0) {
                constraints.push(where('actionType', 'in', actionTypes));
            }
            if (since) {
                constraints.push(where('timestamp', '>=', Timestamp.fromDate(since)));
            }
            const q = query(collection(db, 'action_logs'), ...constraints);
            const snap = await getDocs(q);
            return snap.size;
        } catch (error) {
            console.error('Error in getActionLogCounts:', error);
            return 0;
        }
    },

    /**
     * Fetches the latest N action_logs, optionally filtered by actionType array.
     */
    getRecentActionLogs: async (limitCount = 20, actionTypes = []) => {
        try {
            const constraints = [orderBy('timestamp', 'desc'), limit(limitCount)];
            if (actionTypes.length > 0) {
                // Firestore limitation: can't combine 'in' with orderBy on different fields easily,
                // so fetch and filter client-side when using actionTypes + orderBy timestamp
            }
            const q = query(collection(db, 'action_logs'), ...constraints);
            const snap = await getDocs(q);
            let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            if (actionTypes.length > 0) {
                docs = docs.filter(d => actionTypes.includes(d.actionType));
            }
            return docs;
        } catch (error) {
            console.error('Error in getRecentActionLogs:', error);
            return [];
        }
    }
};
