'use client';

import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/button';

type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'bagbot-theme';

const readStoredTheme = (): ThemeMode | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
};

const resolveInitialTheme = (): ThemeMode => {
  if (typeof document === 'undefined') {
    return 'light';
  }
  const datasetTheme = document.documentElement.dataset.theme as ThemeMode | undefined;
  if (datasetTheme === 'light' || datasetTheme === 'dark') {
    return datasetTheme;
  }
  const stored = readStoredTheme();
  if (stored) {
    return stored;
  }
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(resolveInitialTheme);

  const applyTheme = useCallback((next: ThemeMode, persist = true) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.theme = next;
    root.style.colorScheme = next === 'dark' ? 'dark' : 'light';
    if (persist && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Storage might be disabled; ignore the failure.
      }
    }
  }, []);

  useEffect(() => {
    applyTheme(theme, false);
  }, [theme, applyTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      try {
        if (window.localStorage.getItem(STORAGE_KEY)) {
          return;
        }
      } catch {
        // Ignore access issues and continue syncing with system preference.
      }
      const systemTheme: ThemeMode = event.matches ? 'dark' : 'light';
      setTheme(systemTheme);
      applyTheme(systemTheme, false);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [applyTheme]);

  const toggle = () => {
    const next: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next, true);
  };

  return (
    <Button
      variant="secondary"
      onClick={toggle}
      className="w-full justify-between sm:min-w-[140px]"
      aria-pressed={theme === 'dark'}
    >
      <span>{theme === 'light' ? 'Light Luxe' : 'Noir Mode'}</span>
      <span className="text-xs text-[color:var(--accent-violet)]">
        {theme === 'light' ? '☀️' : '🌙'}
      </span>
    </Button>
  );
}
