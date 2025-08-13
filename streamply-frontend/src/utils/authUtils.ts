import { removeCookie } from 'typescript-cookie';

/**
 * Handle unauthorized token - clear storage and redirect to login
 */
export const handleUnauthorized = (message = 'Session expired. Please log in again.') => {
  console.log('🔒 Handling unauthorized access:', message);
  
  // Clear all auth-related cookies
  removeCookie('userToken');
  removeCookie('userAccountType');
  
  // Clear local storage and session storage
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    console.warn('Could not clear storage:', error);
  }
  
  // Check if we're already on an auth page
  const currentPath = window.location.pathname;
  const authPaths = ['/signin', '/signup', '/confirm-register'];
  
  if (!authPaths.includes(currentPath)) {
    console.log('🔄 Redirecting to login page...');
    
    // Store the current path for redirect after login (optional)
    try {
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    } catch (error) {
      // Ignore if sessionStorage is not available
    }
    
    // Redirect to login page
    window.location.href = '/signin';
  }
};

/**
 * Handle successful login - redirect to intended page or homepage
 */
export const handleLoginSuccess = (navigate: (path: string, options?: any) => void) => {
  console.log('✅ Login successful, handling redirect...');
  
  // Check if there was a previous page to redirect to
  let redirectPath = '/';
  
  try {
    const savedPath = sessionStorage.getItem('redirectAfterLogin');
    if (savedPath && savedPath !== '/signin' && savedPath !== '/signup') {
      redirectPath = savedPath;
      sessionStorage.removeItem('redirectAfterLogin');
    }
  } catch (error) {
    // If sessionStorage is not available, just use homepage
    console.warn('Could not access sessionStorage:', error);
  }
  
  console.log(`🏠 Redirecting to: ${redirectPath}`);
  
  // Navigate with replace to prevent going back to login page
  setTimeout(() => {
    navigate(redirectPath, { replace: true });
  }, 500);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  try {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('userToken='))
      ?.split('=')[1];
    
    return !!token;
  } catch (error) {
    return false;
  }
};

/**
 * Get current user account type
 */
export const getUserAccountType = (): number | null => {
  try {
    const accountType = document.cookie
      .split('; ')
      .find(row => row.startsWith('userAccountType='))
      ?.split('=')[1];
    
    return accountType ? parseInt(accountType, 10) : null;
  } catch (error) {
    return null;
  }
};
