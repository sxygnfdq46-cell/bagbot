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
} from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock authentication - works without backend
const MOCK_USERS_KEY = 'bagbot_mock_users';

// Initialize default users
const DEFAULT_USERS = [
  {
    id: 'user_default_001',
    email: 'test@bagbot.com',
    password: 'password123',
    name: 'Test User',
    role: 'user' as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'admin_default_001',
    email: 'admin@bagbot.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin' as const,
    createdAt: new Date().toISOString(),
  },
];

// Initialize mock users in localStorage
const initializeMockUsers = () => {
  if (typeof window === 'undefined') return;
  
  const existingUsers = localStorage.getItem(MOCK_USERS_KEY);
  if (!existingUsers) {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(DEFAULT_USERS));
    console.log('✅ Initialized default users:', DEFAULT_USERS.map(u => u.email));
  }
};

// Get mock users
const getMockUsers = () => {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  
  const users = localStorage.getItem(MOCK_USERS_KEY);
  return users ? JSON.parse(users) : DEFAULT_USERS;
};

// Save mock users
const saveMockUsers = (users: any[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    initializeMockUsers();
    
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
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔐 FREE PASS MODE: Login attempt for:', credentials.email);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const users = getMockUsers();
      
      // FREE PASS MODE: Only check email, ignore password
      const foundUser = users.find((u: any) => 
        u.email.toLowerCase() === credentials.email.toLowerCase()
      );

      // If email not found, create a new user on the fly
      if (!foundUser) {
        console.log('✨ Creating new user for:', credentials.email);
        const newUser = {
          id: `user_${Date.now()}`,
          email: credentials.email,
          password: credentials.password,
          name: credentials.email.split('@')[0],
          role: credentials.email.includes('admin') ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
        };
        users.push(newUser);
        saveMockUsers(users);
        
        const userData: User = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role as 'user' | 'admin',
          createdAt: newUser.createdAt,
          lastLogin: new Date().toISOString(),
        };
        
        const tokens = {
          accessToken: `mock_token_${Date.now()}`,
          refreshToken: `mock_refresh_${Date.now()}`,
          expiresIn: 3600,
        };
        
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        console.log('✅ New user created and logged in:', userData.email);
        
        router.push('/dashboard');
        return;
      }

      console.log('✅ Login successful (FREE PASS):', foundUser.email);

      // Create tokens
      const tokens = {
        accessToken: `mock_token_${Date.now()}`,
        refreshToken: `mock_refresh_${Date.now()}`,
        expiresIn: 3600,
      };

      const userData: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
        createdAt: foundUser.createdAt,
        lastLogin: new Date().toISOString(),
      };

      // Store tokens and user data
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      
      console.log('💾 User data stored, redirecting to dashboard...');
      
      // Navigate to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('🚨 Login error:', err);
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

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const users = getMockUsers();
      
      // Check if email already exists
      const existingUser = users.find((u: any) => 
        u.email.toLowerCase() === data.email.toLowerCase()
      );
      
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Create new user
      const newUser = {
        id: `user_${Date.now()}`,
        email: data.email,
        password: data.password,
        name: data.name,
        role: 'user' as const,
        createdAt: new Date().toISOString(),
      };

      // Save to mock storage
      users.push(newUser);
      saveMockUsers(users);

      console.log('✅ Registration successful:', newUser.email);

      // Auto-login after registration
      await login({ email: data.email, password: data.password });
    } catch (err: any) {
      console.error('🚨 Registration error:', err);
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
    
    // Use window.location for reliable redirect
    if (typeof window !== 'undefined') {
      window.location.href = '/landing';
    }
  };

  const forgotPassword = async (data: ForgotPasswordData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const users = getMockUsers();
      const user = users.find((u: any) => 
        u.email.toLowerCase() === data.email.toLowerCase()
      );

      if (!user) {
        // Don't reveal if email exists or not for security
        console.log('Password reset email would be sent to:', data.email);
      } else {
        console.log('✅ Password reset email sent to:', data.email);
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

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // In a real app, validate token and update password
      console.log('✅ Password reset successful');

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
    // Mock refresh token - in real app, call API to refresh
    const newToken = `mock_token_${Date.now()}`;
    localStorage.setItem('accessToken', newToken);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
