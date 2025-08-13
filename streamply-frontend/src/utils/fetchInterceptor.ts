/**
 * Global fetch replacement that uses axios interceptor
 * This ensures all fetch calls go through the axios auth interceptor
 */
import { httpFetch } from './httpClient';

// Store original fetch
const originalFetch = window.fetch;

// Replace global fetch with our httpFetch wrapper
(window as any).fetch = httpFetch;

// Also replace it on global object`
if (typeof global !== 'undefined') {
  (global as any).fetch = httpFetch;
}

// Export original fetch in case it's needed somewhere
export { originalFetch };

console.log('🔧 Global fetch replaced with axios-based httpFetch wrapper');
