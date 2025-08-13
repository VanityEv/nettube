import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, handleUnauthorized } from '../utils/authUtils';

/**
 * Hook to protect routes that require authentication
 */
export const useAuthRequired = (redirectTo = '/signin') => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      handleUnauthorized('Authentication required to access this page.');
    }
  }, [navigate, redirectTo]);

  return isAuthenticated();
};

/**
 * Hook to redirect authenticated users away from auth pages
 */
export const useRedirectIfAuthenticated = (redirectTo = '/') => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      console.log('🔄 User already authenticated, redirecting...');
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo]);

  return !isAuthenticated();
};

/**
 * Hook to check admin privileges
 */
export const useAdminRequired = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      handleUnauthorized('Authentication required.');
      return;
    }

    // Check if user has admin privileges (account_type 3)
    try {
      const accountType = document.cookie
        .split('; ')
        .find(row => row.startsWith('userAccountType='))
        ?.split('=')[1];

      if (!accountType || parseInt(accountType, 10) !== 3) {
        console.log('❌ Access denied - Admin privileges required');
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Error checking admin privileges:', error);
      navigate('/', { replace: true });
    }
  }, [navigate]);
};
