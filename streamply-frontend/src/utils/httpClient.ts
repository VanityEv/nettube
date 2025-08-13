import axios from './axiosConfig';

/**
 * Universal HTTP client that uses axios with interceptors for all requests
 * This replaces direct fetch calls to ensure consistent error handling and auth
 */

interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export class HttpClient {
  private static baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

  /**
   * Make HTTP request using axios (with interceptors)
   */
  static async request(url: string, options: HttpRequestOptions = {}) {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 30000
    } = options;

    try {
      const config = {
        method: method.toLowerCase(),
        url: url.startsWith('http') ? url : `${this.baseURL}${url}`,
        headers,
        timeout,
        data: body,
      };

      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      // Preserve response information in the error
      if (error.response) {
        // Attach response info to error for better handling
        error.status = error.response.status;
        error.statusText = error.response.statusText;
        error.data = error.response.data;
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  static async get(url: string, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  static async post(url: string, body?: any, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}) {
    return this.request(url, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  static async put(url: string, body?: any, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}) {
    return this.request(url, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  static async delete(url: string, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  static async patch(url: string, body?: any, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}) {
    return this.request(url, { ...options, method: 'PATCH', body });
  }
}

/**
 * Fetch-like wrapper that uses axios under the hood
 * For easier migration from fetch calls
 */
export const httpFetch = async (url: string, init?: RequestInit) => {
  const method = (init?.method || 'GET') as HttpRequestOptions['method'];
  const headers: Record<string, string> = {};
  
  // Convert Headers object to plain object
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, init.headers);
    }
  }

  let body = init?.body;
  
  // Handle different body types
  if (body instanceof FormData) {
    // Let axios handle FormData
  } else if (body instanceof URLSearchParams) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = body.toString();
  } else if (typeof body === 'string') {
    // Keep as is
  } else if (body) {
    // Convert to JSON
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  try {
    const data = await HttpClient.request(url, {
      method,
      headers,
      body,
    });

    // Return fetch-like response object
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
      data, // Direct access to data
    };
  } catch (error: any) {
    // Create fetch-like error response
    const status = error.response?.status || 500;
    const statusText = error.response?.statusText || 'Internal Server Error';
    
    return {
      ok: false,
      status,
      statusText,
      json: () => Promise.resolve(error.response?.data || {}),
      text: () => Promise.resolve(error.message),
      data: error.response?.data,
    };
  }
};

export default HttpClient;
