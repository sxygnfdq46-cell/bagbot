/**
 * Authentication Service
 * Handles user login, registration, token refresh
 */

import { post } from '@/lib/api-client';
import { apiClient } from '@/lib/api-client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user?: {
    id: string;
    email: string;
    username?: string;
  };
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
}

/**
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await post<AuthResponse>('/auth/login', credentials, { skipAuth: true });
  
  // Store tokens
  if (response.access_token) {
    apiClient.tokens.setToken(response.access_token);
  }
  if (response.refresh_token) {
    apiClient.tokens.setRefreshToken(response.refresh_token);
  }
  
  return response;
}

/**
 * Register new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await post<AuthResponse>('/auth/register', data, { skipAuth: true });
  
  // Store tokens
  if (response.access_token) {
    apiClient.tokens.setToken(response.access_token);
  }
  if (response.refresh_token) {
    apiClient.tokens.setRefreshToken(response.refresh_token);
  }
  
  return response;
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<RefreshTokenResponse> {
  const refreshToken = apiClient.tokens.getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const response = await post<RefreshTokenResponse>(
    '/auth/refresh',
    { refresh_token: refreshToken },
    { skipAuth: true }
  );
  
  // Store new access token
  if (response.access_token) {
    apiClient.tokens.setToken(response.access_token);
  }
  
  return response;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  // Clear tokens
  apiClient.tokens.clearTokens();
  
  // Optional: Call backend logout endpoint if it exists
  try {
    await post('/auth/logout', {});
  } catch {
    // Ignore errors on logout
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!apiClient.tokens.getToken();
}

/**
 * Get current user (if endpoint exists)
 */
export async function getCurrentUser(): Promise<AuthResponse['user']> {
  return await post('/auth/me');
}
