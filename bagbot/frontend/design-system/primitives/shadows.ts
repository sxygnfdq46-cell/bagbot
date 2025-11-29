export const shadows = {
  // Depth Shadows (Dark elevation)
  depth: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.8)',
    md: '0 4px 16px rgba(0, 0, 0, 0.9)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.95)',
    xl: '0 16px 48px rgba(0, 0, 0, 1)',
  },
  
  // Neon Glow Shadows
  glow: {
    cyan: {
      soft: '0 0 10px rgba(0, 246, 255, 0.4)',
      medium: '0 0 20px rgba(0, 246, 255, 0.6), 0 0 40px rgba(0, 246, 255, 0.3)',
      strong: '0 0 30px rgba(0, 246, 255, 0.8), 0 0 60px rgba(0, 246, 255, 0.5)',
      intense: '0 0 40px rgba(0, 246, 255, 1), 0 0 80px rgba(0, 246, 255, 0.7), 0 0 120px rgba(0, 246, 255, 0.4)',
    },
    magenta: {
      soft: '0 0 10px rgba(255, 0, 255, 0.4)',
      medium: '0 0 20px rgba(255, 0, 255, 0.6), 0 0 40px rgba(255, 0, 255, 0.3)',
      strong: '0 0 30px rgba(255, 0, 255, 0.8), 0 0 60px rgba(255, 0, 255, 0.5)',
      intense: '0 0 40px rgba(255, 0, 255, 1), 0 0 80px rgba(255, 0, 255, 0.7), 0 0 120px rgba(255, 0, 255, 0.4)',
    },
    teal: {
      soft: '0 0 10px rgba(0, 255, 170, 0.4)',
      medium: '0 0 20px rgba(0, 255, 170, 0.6), 0 0 40px rgba(0, 255, 170, 0.3)',
      strong: '0 0 30px rgba(0, 255, 170, 0.8), 0 0 60px rgba(0, 255, 170, 0.5)',
    },
  },
  
  // Inner Glow (for borders)
  inner: {
    cyan: 'inset 0 0 20px rgba(0, 246, 255, 0.2)',
    magenta: 'inset 0 0 20px rgba(255, 0, 255, 0.2)',
    subtle: 'inset 0 0 10px rgba(255, 255, 255, 0.05)',
  },
  
  // Combined (Depth + Glow)
  elevated: {
    cyan: '0 8px 32px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 246, 255, 0.4)',
    magenta: '0 8px 32px rgba(0, 0, 0, 0.9), 0 0 20px rgba(255, 0, 255, 0.4)',
  },
  
  // None
  none: 'none',
};

export type ShadowDepth = keyof typeof shadows.depth;
export type GlowColor = keyof typeof shadows.glow;
export type GlowIntensity = 'soft' | 'medium' | 'strong' | 'intense';

export const getShadow = (type: 'depth' | 'glow' | 'inner' | 'elevated', ...args: any[]): string => {
  if (type === 'depth') {
    const [depth] = args as [ShadowDepth];
    return shadows.depth[depth];
  }
  if (type === 'glow') {
    const [color, intensity] = args as [GlowColor, GlowIntensity];
    const glowData = shadows.glow[color];
    if (!glowData) return shadows.glow.cyan.soft;
    
    const intensityMap: Record<GlowIntensity, string> = {
      soft: glowData.soft,
      medium: glowData.medium,
      strong: glowData.strong,
      intense: ('intense' in glowData ? glowData.intense : glowData.strong)
    };
    
    return intensityMap[intensity] || shadows.glow.cyan.soft;
  }
  if (type === 'inner') {
    const [color] = args as ['cyan' | 'magenta' | 'subtle'];
    return shadows.inner[color];
  }
  if (type === 'elevated') {
    const [color] = args as ['cyan' | 'magenta'];
    return shadows.elevated[color];
  }
  return shadows.none;
};
