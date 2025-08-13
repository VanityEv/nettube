import { useState, useEffect } from 'react';
import { getCookie } from 'typescript-cookie';

/**
 * Hook that reactively tracks authentication status based on userToken cookie
 */
export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getCookie('userToken'));

  useEffect(() => {
    // Function to check auth status
    const checkAuthStatus = () => {
      const token = getCookie('userToken');
      const newAuthStatus = !!token;
      setIsAuthenticated(newAuthStatus);
    };

    // Check immediately
    checkAuthStatus();

    // Set up a periodic check (every 1 second) to catch cookie changes
    const interval = setInterval(checkAuthStatus, 1000);

    // Also listen to focus events in case token was set in another tab
    const handleFocus = () => {
      checkAuthStatus();
    };

    window.addEventListener('focus', handleFocus);

    // Listen to storage events (though cookies don't trigger these, other tabs might set localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authRefresh') {
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Function to manually trigger auth check (useful after login)
  const refreshAuthStatus = () => {
    const token = getCookie('userToken');
    const newAuthStatus = !!token;
    setIsAuthenticated(newAuthStatus);
    
    // Trigger storage event to notify other tabs
    try {
      localStorage.setItem('authRefresh', Date.now().toString());
      localStorage.removeItem('authRefresh');
    } catch (error) {
      // Ignore if localStorage is not available
    }
  };

  return { isAuthenticated, refreshAuthStatus };
};
