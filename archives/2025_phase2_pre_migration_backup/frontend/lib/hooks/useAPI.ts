/**
 * React Hook for API requests with SWR
 * Provides caching, revalidation, and error handling
 */

import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import { api, APIError } from '../api';

export interface UseAPIOptions extends SWRConfiguration {
  enabled?: boolean;
}

export interface UseAPIReturn<T> extends Omit<SWRResponse<T, APIError>, 'mutate'> {
  loading: boolean;
  refetch: () => Promise<T | undefined>;
}

/**
 * Hook for GET requests with caching
 */
export function useAPI<T = any>(
  endpoint: string | null,
  options: UseAPIOptions = {}
): UseAPIReturn<T> {
  const { enabled = true, ...swrOptions } = options;

  const swr = useSWR<T, APIError>(
    enabled && endpoint ? endpoint : null,
    (url: string) => api.get<T>(url),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      ...swrOptions,
    }
  );

  return {
    ...swr,
    loading: !swr.data && !swr.error,
    refetch: swr.mutate,
  };
}

/**
 * Hook for polling data at intervals
 */
export function useAPIPoll<T = any>(
  endpoint: string | null,
  interval: number = 5000,
  options: UseAPIOptions = {}
): UseAPIReturn<T> {
  return useAPI<T>(endpoint, {
    ...options,
    refreshInterval: interval,
    dedupingInterval: interval / 2,
  });
}

/**
 * Hook for making POST/PATCH requests
 */
export function useAPIMutation<TData = any, TResponse = any>(
  endpoint: string,
  method: 'POST' | 'PATCH' | 'DELETE' = 'POST'
) {
  const execute = async (data?: TData): Promise<TResponse> => {
    switch (method) {
      case 'POST':
        return api.post<TResponse>(endpoint, data);
      case 'PATCH':
        return api.patch<TResponse>(endpoint, data);
      case 'DELETE':
        return api.delete<TResponse>(endpoint);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  };

  return execute;
}

export default useAPI;
