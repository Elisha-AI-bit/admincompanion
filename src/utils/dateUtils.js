/**
 * Utility for handling dates across the application, 
 * especially normalizing Firestore Timestamps.
 */

export const dateUtils = {
    /**
     * Converts a value (String, Date, or Firestore Timestamp) to a JS Date object.
     */
    toDate: (val) => {
        if (!val) return new Date(0);

        // Handle Firestore Timestamp { seconds, nanoseconds }
        if (typeof val === 'object' && val.seconds !== undefined) {
            return new Date(val.seconds * 1000);
        }

        // Handle regular Date object
        if (val instanceof Date) return val;

        // Handle String or Number
        return new Date(val);
    },

    /**
     * Safely formats a date for display.
     */
    format: (val, options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) => {
        const date = dateUtils.toDate(val);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString(undefined, options);
    },

    /**
     * Safely formats a date as a simple string (YYYY-MM-DD).
     */
    toISODate: (val) => {
        const date = dateUtils.toDate(val);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    },

    /**
     * Comparator for sorting dates (descending by default).
     */
    compare: (a, b, desc = true) => {
        const dateA = dateUtils.toDate(a).getTime();
        const dateB = dateUtils.toDate(b).getTime();
        return desc ? dateB - dateA : dateA - dateB;
    }
};
