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
    onSnapshot
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
    }
};
