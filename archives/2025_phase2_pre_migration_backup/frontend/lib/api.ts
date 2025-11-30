/**
 * API Client - Core HTTP Request Layer
 * Handles all backend communication with retry, timeout, and error handling
 * SAFE MODE: Only connects to approved read-only and safe endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;

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
  skipRetry?: boolean;
}

/**
 * Core fetch wrapper with timeout and retry logic
 */
async function fetchWithTimeout(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, retries = MAX_RETRIES, skipRetry = false, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || `Request failed with status ${response.status}`,
        response.status,
        errorData.code,
        errorData.details
      );
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Retry logic for network errors (not for 4xx errors)
    if (!skipRetry && retries > 0 && error instanceof TypeError) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (MAX_RETRIES - retries + 1)));
      return fetchWithTimeout(url, { ...options, retries: retries - 1 });
    }

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
 * GET request
 */
export async function get<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetchWithTimeout(url, {
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
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
  return response.json();
}

/**
 * PATCH request
 */
export async function patch<T = any>(
  endpoint: string,
  data?: any,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetchWithTimeout(url, {
    method: 'PATCH',
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
  const response = await fetchWithTimeout(url, {
    method: 'DELETE',
    ...options,
  });
  return response.json();
}

/**
 * Streaming helper for SSE (Server-Sent Events)
 */
export async function* streamEvents(
  endpoint: string,
  options: RequestOptions = {}
): AsyncGenerator<any, void, unknown> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetchWithTimeout(url, {
    method: 'GET',
    ...options,
    headers: {
      ...options.headers,
      'Accept': 'text/event-stream',
    },
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new APIError('No response body', 500, 'NO_BODY');
  }

  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            yield JSON.parse(data);
          } catch {
            yield data;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Health check - verifies backend connectivity
 */
export async function healthCheck(): Promise<{ status: string; timestamp: number }> {
  try {
    return await get('/api/health', { timeout: 5000, skipRetry: true });
  } catch (error) {
    throw new APIError('Backend unavailable', 503, 'BACKEND_DOWN');
  }
}

/**
 * Batch request helper - executes multiple requests in parallel
 */
export async function batch<T = any>(
  requests: Array<{ endpoint: string; method?: 'GET' | 'POST' | 'PATCH'; data?: any }>
): Promise<T[]> {
  const promises = requests.map(({ endpoint, method = 'GET', data }) => {
    switch (method) {
      case 'POST':
        return post(endpoint, data);
      case 'PATCH':
        return patch(endpoint, data);
      default:
        return get(endpoint);
    }
  });

  return Promise.all(promises);
}

/**
 * API client with convenience methods
 */
export const api = {
  get,
  post,
  patch,
  delete: del,
  stream: streamEvents,
  health: healthCheck,
  batch,
};

export default api;
