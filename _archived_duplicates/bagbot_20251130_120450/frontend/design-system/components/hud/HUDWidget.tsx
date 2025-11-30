'use client';

import React, { ReactNode } from 'react';
import { useTheme } from '@/app/providers';

interface HUDWidgetProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'cyan' | 'magenta' | 'success' | 'warning' | 'error';
  children?: ReactNode;
}

export function HUDWidget({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  color = 'cyan',
  children,
}: HUDWidgetProps) {
  const { theme } = useTheme();

  const colors = {
    cyan: theme.colors.neonCyan,
    magenta: theme.colors.neonMagenta,
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→',
  };

  const trendColors = {
    up: theme.colors.success,
    down: theme.colors.error,
    neutral: theme.colors.info,
  };

  return (
    <div
      className="glass-panel holo-border rounded-lg p-4 transition-all hover:scale-[1.02]"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.border.default}`,
        boxShadow: theme.shadows.glow.soft,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && <span className="text-2xl">{icon}</span>}
          <span
            className="text-sm uppercase tracking-wider font-medium"
            style={{ color: theme.text.tertiary }}
          >
            {title}
          </span>
        </div>
        {trend && trendValue && (
          <div
            className="flex items-center gap-1 text-xs font-bold"
            style={{ color: trendColors[trend] }}
          >
            <span>{trendIcons[trend]}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span
          className="text-3xl font-bold neon-text"
          style={{ color: colors[color] }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm" style={{ color: theme.text.tertiary }}>
            {unit}
          </span>
        )}
      </div>

      {children && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: theme.border.subtle }}>
          {children}
        </div>
      )}
    </div>
  );
}
