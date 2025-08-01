// API base URL configuration for different environments
// In Docker/NGINX proxy setup, API calls go through /api prefix
// In production, direct backend connection

const getApiUrl = () => {
  // Production environment (Vercel + Heroku)
  if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_USE_PROXY === 'false') {
    return process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL || 'https://your-streamply-backend.herokuapp.com';
  }
  
  // Check if we're in Docker/proxy environment
  if (process.env.REACT_APP_USE_PROXY === 'true') {
    // Use relative /api path when behind NGINX proxy
    return '/api';
  }
  
  // Use ngrok URL for development to avoid CORS issues and test HTTPS
  if (process.env.REACT_APP_USE_NGROK === 'true') {
    return 'https://64a7a6d1a3bd.ngrok-free.app';
  }
  
  // Development or direct backend connection - back to localhost for now
  return process.env.REACT_APP_API_URL || 'http://localhost:3001';
};

export const api = getApiUrl();

// Additional constants for different environments
export const isProxyEnvironment = process.env.REACT_APP_USE_PROXY === 'true';
export const isProduction = process.env.NODE_ENV === 'production';
export const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost';

// Debug logging for environment detection
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Environment Configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    USE_PROXY: process.env.REACT_APP_USE_PROXY,
    BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
    API_URL: process.env.REACT_APP_API_URL,
    Resolved_API: api,
    isProduction,
    isProxyEnvironment
  });
}
