'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { neonDark, type NeonDarkTheme } from '@/design-system/themes/neon-dark';
import { holoLight, type HoloLightTheme } from '@/design-system/themes/holo-light';

type ThemeMode = 'neon-dark' | 'holo-light';
type Theme = NeonDarkTheme | HoloLightTheme;

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('neon-dark');
  const [theme, setThemeData] = useState<Theme>(neonDark);

  useEffect(() => {
    // Apply theme to CSS variables
    const root = document.documentElement;
    
    if (mode === 'neon-dark') {
      setThemeData(neonDark);
      root.style.setProperty('--theme-bg-primary', neonDark.background.primary);
      root.style.setProperty('--theme-text-primary', neonDark.text.primary);
      root.style.setProperty('--theme-neon-cyan', neonDark.colors.neonCyan);
      root.style.setProperty('--theme-neon-magenta', neonDark.colors.neonMagenta);
    } else {
      setThemeData(holoLight);
      root.style.setProperty('--theme-bg-primary', holoLight.background.primary);
      root.style.setProperty('--theme-text-primary', holoLight.text.primary);
      root.style.setProperty('--theme-neon-cyan', holoLight.colors.neonCyan);
      root.style.setProperty('--theme-neon-magenta', holoLight.colors.neonMagenta);
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'neon-dark' ? 'holo-light' : 'neon-dark'));
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
