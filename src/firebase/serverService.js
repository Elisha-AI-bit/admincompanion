import { getAuth } from 'firebase/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Service for interacting with the Node.js backend API
 */
export const serverService = {
    /**
     * Helper to perform authenticated fetch calls to the backend
     */
    async authenticatedFetch(endpoint, options = {}) {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            throw new Error('User not authenticated');
        }

        const token = await user.getIdToken();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API call failed');
        }

        return response.json();
    },

    /**
     * Trigger the Anti-Theft FCM command via the custom backend
     */
    triggerAntiTheft: async (userId) => {
        return serverService.authenticatedFetch('/anti-theft/trigger', {
            method: 'POST',
            body: JSON.stringify({ userId }),
        });
    }
};
