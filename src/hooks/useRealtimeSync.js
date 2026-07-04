import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEYS = {
  USERS: 'libraryUsers',
  RESERVATIONS: 'libraryReservations',
  NOTIFICATIONS: 'libraryNotifications',
  FEEDBACKS: 'libraryFeedbacks',
  ROOMS: 'libraryRooms',
};

const migrateNotifications = (notifications) => {
  const hasOldFormat = notifications.some(n => n.time && !n.timestamp);
  if (hasOldFormat) {
    try {
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    } catch {}
    return null;
  }
  return notifications;
};

export function useRealtimeSync(storageKey, initialValue, serializer = JSON.stringify, deserializer = JSON.parse) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = deserializer(stored);
        if (storageKey === STORAGE_KEYS.NOTIFICATIONS && Array.isArray(parsed)) {
          const migrated = migrateNotifications(parsed);
          if (migrated === null) {
            return typeof initialValue === 'function' ? initialValue() : initialValue;
          }
          return migrated;
        }
        return parsed;
      }
    } catch (error) {
      console.error(`Error loading ${storageKey} from localStorage:`, error);
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  });

  const isLocalUpdateRef = useRef(false);

  const updateState = useCallback((updater) => {
    setState(prev => {
      const newValue = typeof updater === 'function' ? updater(prev) : updater;
      
      try {
        isLocalUpdateRef.current = true;
        localStorage.setItem(storageKey, serializer(newValue));
        setTimeout(() => {
          isLocalUpdateRef.current = false;
        }, 0);
      } catch (error) {
        console.error(`Error saving ${storageKey} to localStorage:`, error);
      }
      
      return newValue;
    });
  }, [storageKey, serializer]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === storageKey && !isLocalUpdateRef.current) {
        try {
          const newValue = deserializer(e.newValue);
          setState(newValue);
        } catch (error) {
          console.error(`Error parsing ${storageKey} from storage event:`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey, deserializer]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== serializer(state)) {
        isLocalUpdateRef.current = true;
        localStorage.setItem(storageKey, serializer(state));
        setTimeout(() => {
          isLocalUpdateRef.current = false;
        }, 0);
      }
    } catch (error) {
      console.error(`Error syncing ${storageKey} to localStorage:`, error);
    }
  }, [state, storageKey, serializer]);

  return [state, updateState];
}

export { STORAGE_KEYS };
