'use client';

import React, { ReactNode } from 'react';
import { useTheme } from '@/app/providers';

interface HoloCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  glowColor?: 'cyan' | 'magenta' | 'teal';
}

export function HoloCard({
  children,
  title,
  subtitle,
  className = '',
  glowColor = 'cyan',
}: HoloCardProps) {
  const { theme } = useTheme();

  const glowColors = {
    cyan: theme.shadows.glow.cyan,
    magenta: theme.shadows.glow.magenta,
    teal: theme.shadows.glow.soft,
  };

  const borderColors = {
    cyan: theme.border.default,
    magenta: theme.border.magenta,
    teal: theme.border.hover,
  };

  return (
    <div
      className={`glass-panel holo-border rounded-lg p-6 transition-all hover:scale-[1.02] ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${borderColors[glowColor]}`,
        boxShadow: glowColors[glowColor],
      }}
    >
      {(title || subtitle) && (
        <div className="mb-4 border-b border-gray-800 pb-3">
          {title && (
            <h3
              className="text-xl font-bold mb-1"
              style={{ color: theme.colors.neonCyan }}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm" style={{ color: theme.text.tertiary }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
