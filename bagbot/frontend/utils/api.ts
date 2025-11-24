import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';

// Types
export interface ApiError {
  message: string;
  status?: number;
  detail?: string;
  requestId?: string;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  requestId?: string;
}

// Generate unique request ID
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get API base URL from environment
const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!envUrl) {
    console.error('NEXT_PUBLIC_API_URL is not defined. Check your environment configuration.');
    // Fallback for development only
    return 'http://localhost:8000';
  }
  
  return envUrl;
};

// Create axios instance with default config
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 10000, // 10 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor for request ID and logging
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Generate and add request ID
      const requestId = generateRequestId();
      config.headers['X-Request-ID'] = requestId;
      
      // Log request in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
          requestId,
          params: config.params,
          data: config.data,
        });
      }
      
      return config;
    },
    (error) => {
      console.error('[API] Request error:', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for logging and error handling
  client.interceptors.response.use(
    (response) => {
      const requestId = response.config.headers['X-Request-ID'] as string;
      
      // Log response in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${response.status} ${response.config.url}`, {
          requestId,
          data: response.data,
        });
      }
      
      // Attach request ID to response
      response.data.requestId = requestId;
      
      return response;
    },
    (error: AxiosError) => {
      const requestId = error.config?.headers?.['X-Request-ID'] as string;
      
      // Log error
      console.error('[API] Response error:', {
        requestId,
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
        data: error.response?.data,
      });
      
      // Enhance error with request ID
      if (error.response) {
        (error.response.data as any).requestId = requestId;
      }
      
      return Promise.reject(error);
    }
  );

  // Configure axios-retry for exponential backoff
  axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error: AxiosError) => {
      // Retry on network errors or 5xx server errors
      return (
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        (error.response?.status ? error.response.status >= 500 : false)
      );
    },
    onRetry: (retryCount, error, requestConfig) => {
      console.warn(`[API] Retry attempt ${retryCount} for ${requestConfig.url}`, {
        requestId: requestConfig.headers?.['X-Request-ID'],
        error: error.message,
      });
    },
  });

  return client;
};

// Create singleton instance
const apiClient = createApiClient();

// Export the client
export default apiClient;

// Helper function to extract error message
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    // Check for response error message
    if (axiosError.response?.data?.detail) {
      return axiosError.response.data.detail;
    }
    
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    
    // Check for axios error message
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
};

// Helper function to get user-friendly error message
export const getUserFriendlyError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // Network errors
    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }
    
    if (axiosError.code === 'ERR_NETWORK') {
      return 'Network error. Please check your connection.';
    }
    
    // HTTP status errors
    if (axiosError.response) {
      const status = axiosError.response.status;
      
      if (status === 400) {
        return 'Invalid request. Please check your input.';
      }
      
      if (status === 401) {
        return 'Unauthorized. Please log in again.';
      }
      
      if (status === 403) {
        return 'Access denied.';
      }
      
      if (status === 404) {
        return 'Resource not found.';
      }
      
      if (status === 500) {
        return 'Server error. Please try again later.';
      }
      
      if (status === 501) {
        return 'This feature is not yet implemented.';
      }
      
      if (status === 503) {
        return 'Service unavailable. Please try again later.';
      }
    }
  }
  
  return getErrorMessage(error);
};

// Helper function to create ApiError from any error
export const createApiError = (error: unknown): ApiError => {
  const message = getUserFriendlyError(error);
  
  let status: number | undefined;
  let detail: string | undefined;
  let requestId: string | undefined;
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    status = axiosError.response?.status;
    detail = axiosError.response?.data?.detail || axiosError.message;
    requestId = axiosError.config?.headers?.['X-Request-ID'] as string;
  }
  
  return {
    message,
    status,
    detail,
    requestId,
  };
};

// Wrapper function for API calls with error handling
export const apiCall = async <T = any>(
  request: Promise<any>
): Promise<ApiResponse<T>> => {
  try {
    const response = await request;
    return {
      data: response.data,
      status: response.status,
      requestId: response.data.requestId,
    };
  } catch (error) {
    throw createApiError(error);
  }
};
