/**
 * API Client Utility
 * 
 * Provides a consistent way to make authenticated API calls
 * to the backend endpoints with proper error handling
 */

/**
 * Configuration for API requests
 */
export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  status?: number;
}

/**
 * Makes an authenticated API call to the specified endpoint
 * 
 * @param {string} url - The API endpoint URL
 * @param {ApiRequestConfig} config - Request configuration
 * @return {Promise<ApiResponse>} API response with data or error
 */
export async function apiClient<T = any>(
  url: string,
  config: ApiRequestConfig = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    headers = {},
    body,
    credentials = 'include'
  } = config;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      credentials,
      ...(body && { body: JSON.stringify(body) })
    });

    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Handle successful responses
    if (response.ok) {
      return {
        success: true,
        data: responseData,
        status: response.status
      };
    }

    // Handle error responses
    return {
      success: false,
      error: responseData?.error || responseData || 'Request failed',
      code: responseData?.code || 'REQUEST_FAILED',
      status: response.status
    };
  } catch (error) {
    console.error('API Client Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
      code: 'NETWORK_ERROR'
    };
  }
}

/**
 * Convenience method for GET requests
 */
export async function apiGet<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
  return apiClient<T>(url, { method: 'GET', headers });
}

/**
 * Convenience method for POST requests
 */
export async function apiPost<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
  return apiClient<T>(url, { method: 'POST', body, headers });
}

/**
 * Convenience method for PUT requests
 */
export async function apiPut<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
  return apiClient<T>(url, { method: 'PUT', body, headers });
}

/**
 * Convenience method for DELETE requests
 */
export async function apiDelete<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
  return apiClient<T>(url, { method: 'DELETE', headers });
}