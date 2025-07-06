// API base URL configuration for different environments
// In Docker/NGINX proxy setup, API calls go through /api prefix
// In production, direct backend connection

const getApiUrl = () => {
  // Production environment (Vercel + Heroku)
  if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // Check if we're in Docker/proxy environment
  if (process.env.REACT_APP_USE_PROXY === 'true') {
    // Use relative /api path when behind NGINX proxy
    return '/api';
  }
  
  // Development or direct backend connection
  return process.env.REACT_APP_API_URL || 'http://localhost:3001';
};

export const api = getApiUrl();

// Additional constants for different environments
export const isProxyEnvironment = process.env.REACT_APP_USE_PROXY === 'true';
export const isProduction = process.env.NODE_ENV === 'production';
export const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost';
