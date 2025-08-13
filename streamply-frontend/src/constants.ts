// Simplified API base configuration (proxy-first approach)
// If REACT_APP_API_URL provided -> use it. Otherwise default to '/api' so that
// all requests go through the proxy (which rewrites /api -> backend root).
// This removes previous complex branching that caused production to call a direct
// backend host and broke the /api prefix (leading to 405 at proxy).
const resolveApi = () => {
  const configured = process.env.REACT_APP_API_URL?.trim();
  if (configured) {
    // Ensure trailing slash not duplicated in usage templates
    return configured.replace(/\/$/, '');
  }
  return '/api';
};

export const api = resolveApi();
export const baseUrl = api; // alias for older code expecting baseUrl
export const isProxyEnvironment = true;
export const isProduction = process.env.NODE_ENV === 'production';

if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-console
  console.log('🔧 API config simplified:', { api, REACT_APP_API_URL: process.env.REACT_APP_API_URL });
}
