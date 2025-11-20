'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  AuthContextType,
  AuthError,
  AuthResponse,
  TokenResponse,
} from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Mock users storage (for demo - in production this would be in a real database)
const MOCK_USERS_KEY = 'bagbot_mock_users';

// Initialize with a default test user if none exist
const initializeMockUsers = () => {
  if (typeof window === 'undefined') return;
  
  const stored = localStorage.getItem(MOCK_USERS_KEY);
  if (!stored) {
    // Create a default test user: test@bagbot.com / password123
    const defaultUsers = [
      {
        id: 'user_default_001',
        email: 'test@bagbot.com',
        password: 'password123',
        name: 'Test User',
      }
    ];
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(defaultUsers));
  }
};

// Helper to get mock users from localStorage
const getMockUsers = (): Array<{ email: string; password: string; name: string; id: string }> => {
  if (typeof window === 'undefined') return [];
  initializeMockUsers(); // Ensure default user exists
  const stored = localStorage.getItem(MOCK_USERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Helper to save mock users
const saveMockUsers = (users: Array<{ email: string; password: string; name: string; id: string }>) => {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (err) {
          console.error('Failed to restore session:', err);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock authentication - check against stored users
      const mockUsers = getMockUsers();
      const foundUser = mockUsers.find(
        (u) => u.email === credentials.email && u.password === credentials.password
      );

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      if (!foundUser) {
        throw new Error('Invalid email or password');
      }

      // Create mock user object
      const userData: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      // Generate mock tokens
      const mockToken = btoa(JSON.stringify({ email: foundUser.email, exp: Date.now() + 3600000 }));
      
      // Store tokens and user data
      localStorage.setItem('accessToken', mockToken);
      localStorage.setItem('refreshToken', mockToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      router.push('/');
    } catch (err: any) {
      setError({
        message: err.message || 'Login failed',
        code: 'LOGIN_ERROR',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Mock registration - check if user already exists
      const mockUsers = getMockUsers();
      const existingUser = mockUsers.find((u) => u.email === data.email);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Create new mock user
      const newUser = {
        id: `user_${Date.now()}`,
        email: data.email,
        password: data.password, // In production, this would be hashed!
        name: data.name,
      };

      // Save to mock storage
      mockUsers.push(newUser);
      saveMockUsers(mockUsers);

      // Create user object
      const userData: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      // Generate mock tokens
      const mockToken = btoa(JSON.stringify({ email: newUser.email, exp: Date.now() + 3600000 }));
      
      // Store tokens and user data
      localStorage.setItem('accessToken', mockToken);
      localStorage.setItem('refreshToken', mockToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      router.push('/');
    } catch (err: any) {
      setError({
        message: err.message || 'Registration failed',
        code: 'REGISTER_ERROR',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear tokens and user data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    setUser(null);
    router.push('/landing');
  };

  const forgotPassword = async (data: ForgotPasswordData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock forgot password - check if email exists
      const mockUsers = getMockUsers();
      const foundUser = mockUsers.find((u) => u.email === data.email);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!foundUser) {
        // For security, don't reveal if email exists or not
        console.log('Password reset requested for:', data.email);
      } else {
        // In production, send actual email with reset token
        console.log('Password reset email would be sent to:', data.email);
        // Store reset token for demo
        const resetToken = btoa(`${data.email}_${Date.now()}`);
        localStorage.setItem('mock_reset_token', resetToken);
        localStorage.setItem('mock_reset_email', data.email);
      }

      // Success - always return success for security
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to send reset email',
        code: 'FORGOT_PASSWORD_ERROR',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (data: ResetPasswordData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Mock password reset - verify token and update password
      const storedToken = localStorage.getItem('mock_reset_token');
      const storedEmail = localStorage.getItem('mock_reset_email');

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      if (!storedToken || data.token !== storedToken) {
        throw new Error('Invalid or expired reset token');
      }

      // Update password in mock storage
      const mockUsers = getMockUsers();
      const userIndex = mockUsers.findIndex((u) => u.email === storedEmail);

      if (userIndex === -1) {
        throw new Error('User not found');
      }

      mockUsers[userIndex].password = data.password;
      saveMockUsers(mockUsers);

      // Clear reset token
      localStorage.removeItem('mock_reset_token');
      localStorage.removeItem('mock_reset_email');

      // Success - redirect to login
      router.push('/login?reset=success');
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to reset password',
        code: 'RESET_PASSWORD_ERROR',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      const userData = localStorage.getItem('user');
      
      if (!refreshTokenValue || !userData) {
        throw new Error('No refresh token');
      }

      // Mock token refresh - just extend the expiration
      const newToken = btoa(JSON.stringify({ 
        email: JSON.parse(userData).email, 
        exp: Date.now() + 3600000 
      }));
      
      localStorage.setItem('accessToken', newToken);
      localStorage.setItem('refreshToken', newToken);
      
      setUser(JSON.parse(userData));
    } catch (err) {
      // Refresh failed, logout user
      logout();
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    refreshToken,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
