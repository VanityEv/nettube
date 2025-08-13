import axios from 'axios';
import { api } from '../constants';

// CSRF Token Management
let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;

/**
 * Fetch CSRF token from backend
 */
export const fetchCsrfToken = async (): Promise<string> => {
  try {
    console.log('🔐 Fetching CSRF token...');
    
    const response = await axios.get(`${api}/csrf-token`, {
      withCredentials: true,
      headers: {
        'Skip-CSRF-Interceptor': 'true' // Skip CSRF for token fetch
      }
    });

    const token = response.data.csrfToken;
    if (!token) {
      throw new Error('No CSRF token received from server');
    }

    csrfToken = token;
    console.log('✅ CSRF token fetched successfully');
    
    return token;
  } catch (error) {
    console.error('❌ Failed to fetch CSRF token:', error);
    throw error;
  }
};

/**
 * Get CSRF token (fetch if not available)
 */
export const getCsrfToken = async (): Promise<string> => {
  // Return cached token if available
  if (csrfToken) {
    return csrfToken;
  }

  // Return existing promise if already fetching
  if (csrfPromise) {
    return csrfPromise;
  }

  // Fetch new token
  csrfPromise = fetchCsrfToken();
  
  try {
    const token = await csrfPromise;
    csrfPromise = null;
    return token;
  } catch (error) {
    csrfPromise = null;
    throw error;
  }
};

/**
 * Clear cached CSRF token (on 403 CSRF errors)
 */
export const clearCsrfToken = (): void => {
  console.log('🔄 Clearing cached CSRF token');
  csrfToken = null;
  csrfPromise = null;
};

/**
 * Check if request needs CSRF token
 */
export const needsCsrfToken = (config: any): boolean => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(config.method?.toUpperCase())) {
    return false;
  }

  // Skip CSRF if explicitly disabled
  if (config.headers?.['Skip-CSRF-Interceptor']) {
    return false;
  }

  // Skip CSRF for specific endpoints
  const skipPaths = [
    '/csrf-token',
    '/health',
    '/status',
    '/stripe-webhook'
  ];

  const url = config.url || '';
  if (skipPaths.some(path => url.includes(path))) {
    return false;
  }

  return true;
};

/**
 * Add CSRF token to request headers
 */
export const addCsrfToken = async (config: any): Promise<any> => {
  if (!needsCsrfToken(config)) {
    return config;
  }

  try {
    const token = await getCsrfToken();
    config.headers['X-CSRF-Token'] = token;
    console.log('🔐 Added CSRF token to request:', config.method?.toUpperCase(), config.url);
  } catch (error) {
    console.error('❌ Failed to add CSRF token:', error);
    // Don't block the request, let backend handle the missing token
  }

  return config;
};

/**
 * Handle CSRF errors in response
 */
export const handleCsrfError = (error: any): boolean => {
  if (error.response?.status === 403 && 
      error.response?.data?.code === 'CSRF_TOKEN_MISMATCH') {
    
    console.log('🚨 CSRF token mismatch detected, clearing cache');
    clearCsrfToken();
    return true;
  }
  
  return false;
};
