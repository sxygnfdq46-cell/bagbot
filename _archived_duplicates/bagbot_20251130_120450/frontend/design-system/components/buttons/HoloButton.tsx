'use client';

import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { useTheme } from '@/app/providers';

interface HoloButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glowIntensity?: 'soft' | 'medium' | 'strong';
}

export function HoloButton({
  children,
  variant = 'primary',
  size = 'md',
  glowIntensity = 'medium',
  className = '',
  ...props
}: HoloButtonProps) {
  const { theme } = useTheme();

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const glowStyles = {
    soft: theme.shadows.glow.soft,
    medium: theme.shadows.glow.cyan,
    strong: theme.shadows.glow.strong,
  };

  const variantStyles = {
    primary: {
      background: 'rgba(0, 246, 255, 0.15)',
      border: `1px solid ${theme.border.default}`,
      color: theme.colors.neonCyan,
      boxShadow: glowStyles[glowIntensity],
    },
    secondary: {
      background: 'rgba(255, 0, 255, 0.15)',
      border: `1px solid ${theme.border.magenta}`,
      color: theme.colors.neonMagenta,
      boxShadow: glowStyles[glowIntensity],
    },
    danger: {
      background: 'rgba(255, 0, 85, 0.15)',
      border: '1px solid rgba(255, 0, 85, 0.3)',
      color: theme.colors.error,
      boxShadow: '0 0 20px rgba(255, 0, 85, 0.4)',
    },
    ghost: {
      background: 'transparent',
      border: `1px solid ${theme.border.subtle}`,
      color: theme.text.secondary,
      boxShadow: 'none',
    },
  };

  return (
    <button
      className={`
        ${sizeStyles[size]}
        rounded
        font-medium
        transition-all
        duration-300
        hover:scale-105
        active:scale-95
        backdrop-blur-sm
        ${className}
      `.trim()}
      style={variantStyles[variant]}
      {...props}
    >
      {children}
    </button>
  );
}
