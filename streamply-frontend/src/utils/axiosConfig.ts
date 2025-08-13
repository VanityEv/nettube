import axios from 'axios';
import { getCookie, setCookie, removeCookie } from 'typescript-cookie';
import { api } from '../constants';
import { addCsrfToken, handleCsrfError } from './csrfUtils';

// Global axios configuration
axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000;

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: any[] = [];
let refreshPromise: Promise<string> | null = null;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token, CSRF token and ngrok bypass headers
axios.interceptors.request.use(
  async (config) => {
    // Skip auth for refresh token requests
    if (config.headers?.['Skip-Auth-Interceptor']) {
      delete config.headers['Skip-Auth-Interceptor'];
      return config;
    }
    
    // Add ngrok bypass headers for all requests
    config.headers['ngrok-skip-browser-warning'] = 'true';
    config.headers['Bypass-Tunnel-Reminder'] = 'true';
    
    const token = getCookie('userToken');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing requests
    config = await addCsrfToken(config);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle CSRF token errors first
    if (handleCsrfError(error) && !originalRequest._csrfRetry) {
      console.log('🔄 Retrying request after CSRF token refresh...');
      originalRequest._csrfRetry = true;
      
      try {
        const retryConfig = await addCsrfToken({ ...originalRequest });
        return axios(retryConfig);
      } catch (csrfError) {
        console.error('❌ Failed to retry request with new CSRF token:', csrfError);
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // If already refreshing, wait for the existing refresh to complete
        try {
          const token = await refreshPromise;
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          }
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      isRefreshing = true;

      // Create a shared refresh promise
      refreshPromise = new Promise(async (resolve, reject) => {
        try {
          
          // Add a small delay to prevent rapid refresh attempts
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Attempt to refresh the token
          const refreshResponse = await axios.post(`${api}/user/refresh-token`, {}, {
            withCredentials: true, // Include httpOnly cookies
            headers: {
              'Skip-Auth-Interceptor': 'true' // Skip the auth interceptor for this request
            }
          });

          if (refreshResponse.data.accessToken) {
            const newToken = refreshResponse.data.accessToken;
            setCookie('userToken', newToken);
            
            
            // Process the queue of failed requests
            processQueue(null, newToken);
            
            resolve(newToken);
          } else {
            throw new Error('No access token in refresh response');
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          
          // Refresh failed, clear tokens
          processQueue(refreshError, null);
          
          // Clear tokens and redirect to login
          removeCookie('userToken');
          removeCookie('userAccountType');
          
          // Only redirect if we're not already on the login page
          if (window.location.pathname !== '/signin') {
            window.location.href = '/signin';
          }
          
          reject(refreshError);
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      });

      try {
        const newToken = await refreshPromise;
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axios;
