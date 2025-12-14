import { tokenStore } from '@/lib/token-store';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
const WS_BASE_URL = (process.env.NEXT_PUBLIC_WS_URL ?? '').replace(/\/$/, '');

const isBrowser = typeof window !== 'undefined';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export const authTokenStore = {
  get(): string | null {
    return tokenStore.getToken();
  },
  set(token: string) {
    tokenStore.setToken(token);
  },
  clear() {
    tokenStore.clearToken();
  },
  subscribe(listener: (token: string | null) => void) {
    return tokenStore.subscribe(listener);
  }
};

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  skipAuth?: boolean;
  query?: Record<string, string | number | boolean | undefined>;
  body?: BodyInit | Record<string, unknown> | null;
};

export const resolveWsUrl = (path = '/ws') => {
  const base = WS_BASE_URL || (API_BASE_URL ? API_BASE_URL.replace(/^http/, 'ws') : '');
  if (!base) return path;
  return `${base}${path}`;
};

const buildUrl = (path: string, query?: ApiRequestOptions['query']) => {
  const cleanBase = API_BASE_URL || '';
  const cleanPath = path.startsWith('http') ? path : `${cleanBase}${path}`;
  if (!query || Object.keys(query).length === 0) return cleanPath;
  const originFallback = typeof window === 'undefined' ? 'http://localhost' : cleanBase || window.location.origin;
  const url = new URL(cleanPath, originFallback);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined) return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

const handleUnauthorized = () => {
  authTokenStore.clear();
  if (isBrowser && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const parsePayload = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  if (isJson) {
    return response.json().catch(() => null);
  }
  return response.text().catch(() => null);
};

const request = async <T>(method: string, path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const { skipAuth, query, body, headers, ...rest } = options;
  const url = buildUrl(path, query);
  const finalHeaders = new Headers(headers);
  const init: RequestInit = { ...rest, method, headers: finalHeaders };

  if (!skipAuth) {
    const token = authTokenStore.get();
    if (token) {
      finalHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      init.body = body;
    } else if (typeof body === 'string') {
      init.body = body;
      if (!finalHeaders.has('Content-Type')) {
        finalHeaders.set('Content-Type', 'application/json');
      }
    } else {
      init.body = JSON.stringify(body);
      finalHeaders.set('Content-Type', 'application/json');
    }
  }

  try {
    const response = await fetch(url, init);
    const payload = await parsePayload(response);

    if (response.status === 401 && !skipAuth) {
      handleUnauthorized();
      throw new ApiError('Session expired', response.status, payload);
    }

    if (!response.ok) {
      const message = (payload as { message?: string })?.message ?? 'Request failed';
      throw new ApiError(message, response.status, payload);
    }

    return (payload ?? null) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Unknown error', 500);
  }
};

export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, options?: ApiRequestOptions) => request<T>('POST', path, options),
  put: <T>(path: string, options?: ApiRequestOptions) => request<T>('PUT', path, options),
  delete: <T>(path: string, options?: ApiRequestOptions) => request<T>('DELETE', path, options)
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  return request<T>(method, path, options);
}

export async function safeApiRequest<T>(path: string, options?: ApiRequestOptions): Promise<T | null> {
  try {
    return await apiRequest<T>(path, options);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[api] ${path} failed`, error);
    }
    return null;
  }
}
