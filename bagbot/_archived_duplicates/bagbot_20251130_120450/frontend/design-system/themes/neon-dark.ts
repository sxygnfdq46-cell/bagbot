export const neonDark = {
  name: 'Neon Dark',
  
  // Base Colors
  colors: {
    // Neon Primaries
    neonCyan: '#00f6ff',
    neonMagenta: '#ff00ff',
    neonTeal: '#00ffaa',
    plasmaCyan: '#00e5ff',
    
    // Backgrounds
    vantaBlack: '#000000',
    deepVoid: '#0a0a0f',
    shadowGray: '#1a1a1f',
    panelDark: '#0f0f14',
    
    // Grays
    gray50: '#fafafa',
    gray100: '#f4f4f5',
    gray200: '#e4e4e7',
    gray300: '#d4d4d8',
    gray400: '#a1a1aa',
    gray500: '#71717a',
    gray600: '#52525b',
    gray700: '#3f3f46',
    gray800: '#27272a',
    gray900: '#18181b',
    
    // Status Colors
    success: '#00ffaa',
    warning: '#ffaa00',
    error: '#ff0055',
    info: '#00f6ff',
  },
  
  // Typography
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    neonCyan: '#00f6ff',
    neonMagenta: '#ff00ff',
  },
  
  // Borders
  border: {
    default: 'rgba(0, 246, 255, 0.2)',
    hover: 'rgba(0, 246, 255, 0.4)',
    active: 'rgba(0, 246, 255, 0.6)',
    subtle: 'rgba(255, 255, 255, 0.1)',
    magenta: 'rgba(255, 0, 255, 0.3)',
  },
  
  // Backgrounds
  background: {
    primary: '#000000',
    secondary: '#0a0a0f',
    tertiary: '#1a1a1f',
    panel: 'rgba(255, 255, 255, 0.03)',
    panelHover: 'rgba(255, 255, 255, 0.05)',
    overlay: 'rgba(0, 0, 0, 0.9)',
  },
  
  // Shadows & Glows
  shadows: {
    depth: {
      sm: '0 2px 8px rgba(0, 0, 0, 0.8)',
      md: '0 4px 16px rgba(0, 0, 0, 0.9)',
      lg: '0 8px 32px rgba(0, 0, 0, 0.95)',
      xl: '0 16px 48px rgba(0, 0, 0, 1)',
    },
    glow: {
      cyan: '0 0 20px rgba(0, 246, 255, 0.6), 0 0 40px rgba(0, 246, 255, 0.3)',
      magenta: '0 0 20px rgba(255, 0, 255, 0.6), 0 0 40px rgba(255, 0, 255, 0.3)',
      soft: '0 0 10px rgba(0, 246, 255, 0.4)',
      strong: '0 0 30px rgba(0, 246, 255, 0.8), 0 0 60px rgba(0, 246, 255, 0.5)',
    },
  },
  
  // Gradients
  gradients: {
    holographic: 'linear-gradient(135deg, #00f6ff 0%, #ff00ff 50%, #00f6ff 100%)',
    panel: 'radial-gradient(circle at top, rgba(0, 246, 255, 0.05) 0%, transparent 60%)',
    ambient: 'radial-gradient(circle at 50% 50%, rgba(0, 246, 255, 0.03) 0%, transparent 70%)',
  },
  
  // Effects
  effects: {
    backdropBlur: 'blur(10px)',
    scanlines: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 246, 255, 0.03) 2px, rgba(0, 246, 255, 0.03) 4px)',
  },
};

export type NeonDarkTheme = typeof neonDark;
