'use client';

import React, { InputHTMLAttributes } from 'react';
import { useTheme } from '@/app/providers';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  glowOnFocus?: boolean;
}

export function GlassInput({
  label,
  error,
  glowOnFocus = true,
  className = '',
  ...props
}: GlassInputProps) {
  const { theme } = useTheme();

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          className="text-sm font-medium uppercase tracking-wider"
          style={{ color: theme.text.secondary }}
        >
          {label}
        </label>
      )}
      <input
        className={`
          px-4 py-3
          rounded
          glass-panel
          backdrop-blur-sm
          transition-all
          duration-300
          ${glowOnFocus ? 'focus:scale-[1.02]' : ''}
          outline-none
        `.trim()}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${theme.border.default}`,
          color: theme.text.primary,
          boxShadow: glowOnFocus ? undefined : theme.shadows.glow.soft,
        }}
        {...props}
      />
      {error && (
        <span className="text-sm" style={{ color: theme.colors.error }}>
          {error}
        </span>
      )}
    </div>
  );
}
