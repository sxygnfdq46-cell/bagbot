'use client';

/**
 * Theme utility functions and React hooks for Bagbot Trading Platform
 * Provides SSR-safe theme switching with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';

// TypeScript types
export type Theme = 'light' | 'dark';

// Constants
const THEME_STORAGE_KEY = 'bagbot_theme';
const DARK_CLASS = 'dark';
const DEFAULT_THEME: Theme = 'light';

/**
 * Apply theme to document element by toggling CSS class
 * @param theme - The theme to apply ('light' or 'dark')
 */
export function applyTheme(theme: Theme): void {
  // SSR safety check
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add(DARK_CLASS);
  } else {
    root.classList.remove(DARK_CLASS);
  }
}

/**
 * Get stored theme from localStorage with fallback
 * @returns The stored theme or default theme
 */
function getStoredTheme(): Theme {
  // SSR safety check
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored === 'dark' || stored === 'light') ? stored : DEFAULT_THEME;
  } catch (error) {
    // Handle localStorage access errors (e.g., private browsing)
    console.warn('Failed to read theme from localStorage:', error);
    return DEFAULT_THEME;
  }
}

/**
 * Store theme to localStorage
 * @param theme - The theme to store
 */
function storeTheme(theme: Theme): void {
  // SSR safety check
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    // Handle localStorage access errors (e.g., private browsing)
    console.warn('Failed to save theme to localStorage:', error);
  }
}

/**
 * Detect system theme preference
 * @returns The system preferred theme
 */
function getSystemTheme(): Theme {
  // SSR safety check
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }

  // Check if user prefers dark mode
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

/**
 * React hook for theme management with localStorage persistence
 * @returns [currentTheme, setTheme] - Current theme and setter function
 */
export function useTheme(): [Theme, (theme: Theme) => void] {
  // Initialize with stored theme or system preference
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme();
    return stored !== DEFAULT_THEME ? stored : getSystemTheme();
  });

  // Set theme function that updates state, DOM, and localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    storeTheme(newTheme);
  }, []);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    // SSR safety check
    if (typeof window === 'undefined') {
      return;
    }

    // Only listen to system changes if no theme is stored
    const storedTheme = getStoredTheme();
    if (storedTheme !== DEFAULT_THEME) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const systemTheme = e.matches ? 'dark' : 'light';
      setTheme(systemTheme);
    };

    // Add listener for system theme changes
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Cleanup listener on unmount
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [setTheme]);

  return [theme, setTheme];
}

/**
 * Toggle between light and dark themes
 * @param currentTheme - The current theme
 * @returns The opposite theme
 */
export function toggleTheme(currentTheme: Theme): Theme {
  return currentTheme === 'light' ? 'dark' : 'light';
}

/**
 * Check if current theme is dark
 * @param theme - The theme to check
 * @returns True if theme is dark
 */
export function isDarkTheme(theme: Theme): boolean {
  return theme === 'dark';
}

/**
 * Get theme-appropriate class names
 * @param theme - Current theme
 * @returns Object with theme-appropriate class names
 */
export function getThemeClasses(theme: Theme) {
  return {
    background: theme === 'dark' ? 'bg-gray-900' : 'bg-white',
    text: theme === 'dark' ? 'text-white' : 'text-gray-900',
    card: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
    border: theme === 'dark' ? 'border-gray-700' : 'border-gray-200',
  };
}

// Export default theme for convenience
export { DEFAULT_THEME };