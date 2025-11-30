/**
 * Enhanced API Client with Authentication Support
 * Extends the base API client with auth token management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT = 10000;

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
}

/**
 * Token management
 */
class TokenManager {
  private static TOKEN_KEY = 'auth_token';
  private static REFRESH_KEY = 'refresh_token';

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_KEY);
  }

  static setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.REFRESH_KEY, token);
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }
}

/**
 * Core fetch wrapper with timeout and auth
 */
async function fetchWithAuth(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, skipAuth = false, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Add auth token if available
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (!skipAuth) {
    const token = TokenManager.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeoutId);

    // Handle 401 - Unauthorized (token expired)
    if (response.status === 401 && !skipAuth) {
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        // Retry request with new token
        return fetchWithAuth(url, options);
      } else {
        // Refresh failed, clear tokens and throw
        TokenManager.clearTokens();
        throw new APIError('Authentication failed', 401, 'UNAUTHORIZED');
      }
    }

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || errorData.detail || `Request failed with status ${response.status}`,
        response.status,
        errorData.code,
        errorData.details
      );
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new APIError('Request timeout', 408, 'TIMEOUT');
    }

    throw new APIError('Network error', undefined, 'NETWORK_ERROR', error);
  }
}

/**
 * Refresh auth token
 */
async function refreshAuthToken(): Promise<boolean> {
  const refreshToken = TokenManager.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (data.access_token) {
      TokenManager.setToken(data.access_token);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * GET request
 */
export async function get<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetchWithAuth(url, {
    method: 'GET',
    ...options,
  });
  return response.json();
}

/**
 * POST request
 */
export async function post<T = any>(
  endpoint: string,
  data?: any,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
  return response.json();
}

/**
 * PUT request
 */
export async function put<T = any>(
  endpoint: string,
  data?: any,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
  return response.json();
}

/**
 * DELETE request
 */
export async function del<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetchWithAuth(url, {
    method: 'DELETE',
    ...options,
  });
  return response.json();
}

/**
 * API client with convenience methods
 */
export const apiClient = {
  get,
  post,
  put,
  delete: del,
  tokens: TokenManager,
};

export default apiClient;
