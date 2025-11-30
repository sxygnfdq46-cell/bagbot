export const holoLight = {
  name: 'Holo Light',
  
  // Base Colors
  colors: {
    // Neon Primaries (slightly desaturated for light theme)
    neonCyan: '#00d4dd',
    neonMagenta: '#dd00dd',
    neonTeal: '#00dd99',
    plasmaCyan: '#00c9d9',
    
    // Backgrounds
    lightBase: '#f8f9fa',
    lightElevated: '#ffffff',
    lightPanel: '#f0f2f5',
    lightOverlay: 'rgba(255, 255, 255, 0.9)',
    
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
    success: '#00cc88',
    warning: '#dd9900',
    error: '#dd0044',
    info: '#00d4dd',
  },
  
  // Typography
  text: {
    primary: '#18181b',
    secondary: 'rgba(24, 24, 27, 0.7)',
    tertiary: 'rgba(24, 24, 27, 0.5)',
    disabled: 'rgba(24, 24, 27, 0.3)',
    neonCyan: '#00d4dd',
    neonMagenta: '#dd00dd',
  },
  
  // Borders
  border: {
    default: 'rgba(0, 212, 221, 0.3)',
    hover: 'rgba(0, 212, 221, 0.5)',
    active: 'rgba(0, 212, 221, 0.7)',
    subtle: 'rgba(0, 0, 0, 0.1)',
    magenta: 'rgba(221, 0, 221, 0.3)',
  },
  
  // Backgrounds
  background: {
    primary: '#f8f9fa',
    secondary: '#ffffff',
    tertiary: '#f0f2f5',
    panel: 'rgba(0, 0, 0, 0.02)',
    panelHover: 'rgba(0, 0, 0, 0.04)',
    overlay: 'rgba(255, 255, 255, 0.95)',
  },
  
  // Shadows & Glows (lighter, more subtle)
  shadows: {
    depth: {
      sm: '0 2px 8px rgba(0, 0, 0, 0.1)',
      md: '0 4px 16px rgba(0, 0, 0, 0.15)',
      lg: '0 8px 32px rgba(0, 0, 0, 0.2)',
      xl: '0 16px 48px rgba(0, 0, 0, 0.25)',
    },
    glow: {
      cyan: '0 0 15px rgba(0, 212, 221, 0.4), 0 0 30px rgba(0, 212, 221, 0.2)',
      magenta: '0 0 15px rgba(221, 0, 221, 0.4), 0 0 30px rgba(221, 0, 221, 0.2)',
      soft: '0 0 8px rgba(0, 212, 221, 0.3)',
      strong: '0 0 20px rgba(0, 212, 221, 0.6), 0 0 40px rgba(0, 212, 221, 0.3)',
    },
  },
  
  // Gradients
  gradients: {
    holographic: 'linear-gradient(135deg, #00d4dd 0%, #dd00dd 50%, #00d4dd 100%)',
    panel: 'radial-gradient(circle at top, rgba(0, 212, 221, 0.08) 0%, transparent 60%)',
    ambient: 'radial-gradient(circle at 50% 50%, rgba(0, 212, 221, 0.05) 0%, transparent 70%)',
  },
  
  // Effects
  effects: {
    backdropBlur: 'blur(8px)',
    scanlines: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 212, 221, 0.02) 2px, rgba(0, 212, 221, 0.02) 4px)',
  },
};

export type HoloLightTheme = typeof holoLight;
