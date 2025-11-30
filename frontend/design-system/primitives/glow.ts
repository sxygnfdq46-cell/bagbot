export const glow = {
  // Neon Text Glow
  text: {
    cyan: {
      soft: '0 0 10px rgba(0, 246, 255, 0.5)',
      medium: '0 0 15px rgba(0, 246, 255, 0.7), 0 0 30px rgba(0, 246, 255, 0.4)',
      strong: '0 0 20px rgba(0, 246, 255, 0.9), 0 0 40px rgba(0, 246, 255, 0.6), 0 0 60px rgba(0, 246, 255, 0.3)',
    },
    magenta: {
      soft: '0 0 10px rgba(255, 0, 255, 0.5)',
      medium: '0 0 15px rgba(255, 0, 255, 0.7), 0 0 30px rgba(255, 0, 255, 0.4)',
      strong: '0 0 20px rgba(255, 0, 255, 0.9), 0 0 40px rgba(255, 0, 255, 0.6), 0 0 60px rgba(255, 0, 255, 0.3)',
    },
    white: {
      soft: '0 0 10px rgba(255, 255, 255, 0.5)',
      medium: '0 0 15px rgba(255, 255, 255, 0.7)',
    },
  },
  
  // Border Glow
  border: {
    cyan: {
      DEFAULT: '0 0 10px rgba(0, 246, 255, 0.3)',
      hover: '0 0 20px rgba(0, 246, 255, 0.6), 0 0 40px rgba(0, 246, 255, 0.3)',
      active: '0 0 30px rgba(0, 246, 255, 0.8), 0 0 60px rgba(0, 246, 255, 0.5)',
    },
    magenta: {
      DEFAULT: '0 0 10px rgba(255, 0, 255, 0.3)',
      hover: '0 0 20px rgba(255, 0, 255, 0.6), 0 0 40px rgba(255, 0, 255, 0.3)',
      active: '0 0 30px rgba(255, 0, 255, 0.8), 0 0 60px rgba(255, 0, 255, 0.5)',
    },
    teal: {
      DEFAULT: '0 0 10px rgba(0, 255, 170, 0.3)',
      hover: '0 0 20px rgba(0, 255, 170, 0.6)',
    },
  },
  
  // Background Glow (for panels)
  background: {
    cyan: 'radial-gradient(circle at center, rgba(0, 246, 255, 0.1) 0%, transparent 70%)',
    magenta: 'radial-gradient(circle at center, rgba(255, 0, 255, 0.1) 0%, transparent 70%)',
    ambient: 'radial-gradient(circle at 50% 50%, rgba(0, 246, 255, 0.05) 0%, transparent 50%)',
  },
  
  // Holographic Shimmer Gradient
  holographic: {
    gradient: 'linear-gradient(135deg, #00f6ff 0%, #ff00ff 50%, #00f6ff 100%)',
    animated: 'linear-gradient(135deg, rgba(0, 246, 255, 0.3) 0%, rgba(255, 0, 255, 0.3) 50%, rgba(0, 246, 255, 0.3) 100%)',
  },
  
  // Scanline Effect
  scanline: {
    light: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 246, 255, 0.03) 2px, rgba(0, 246, 255, 0.03) 4px)',
    medium: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 246, 255, 0.05) 2px, rgba(0, 246, 255, 0.05) 4px)',
  },
};

export type GlowColor = 'cyan' | 'magenta' | 'white' | 'teal';
export type GlowIntensity = 'soft' | 'medium' | 'strong';
export type GlowState = 'DEFAULT' | 'hover' | 'active';

export const getTextGlow = (color: GlowColor = 'cyan', intensity: GlowIntensity = 'medium'): string => {
  const colorKey = color as 'cyan' | 'magenta' | 'white';
  const textGlow = glow.text[colorKey];
  if (!textGlow) return glow.text.cyan.medium;
  
  const intensityMap: Record<GlowIntensity, string> = {
    soft: textGlow.soft,
    medium: textGlow.medium,
    strong: ('strong' in textGlow ? textGlow.strong : textGlow.medium)
  };
  
  return intensityMap[intensity] || glow.text.cyan.medium;
};

export const getBorderGlow = (color: GlowColor = 'cyan', state: GlowState = 'DEFAULT'): string => {
  const colorKey = color as 'cyan' | 'magenta' | 'teal';
  const borderGlow = glow.border[colorKey];
  if (!borderGlow) return glow.border.cyan.DEFAULT;
  
  const stateMap: Record<GlowState, string> = {
    DEFAULT: borderGlow.DEFAULT,
    hover: borderGlow.hover,
    active: ('active' in borderGlow ? borderGlow.active : borderGlow.hover)
  };
  
  return stateMap[state] || glow.border.cyan.DEFAULT;
};

export const getBackgroundGlow = (type: 'cyan' | 'magenta' | 'ambient' = 'ambient'): string => {
  return glow.background[type];
};

export const getHolographicGradient = (animated: boolean = false): string => {
  return animated ? glow.holographic.animated : glow.holographic.gradient;
};

export const getScanline = (intensity: 'light' | 'medium' = 'light'): string => {
  return glow.scanline[intensity];
};
