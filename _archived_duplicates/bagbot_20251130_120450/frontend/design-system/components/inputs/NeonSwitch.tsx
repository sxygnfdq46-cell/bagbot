'use client';

import React, { useState } from 'react';
import { useTheme } from '@/app/providers';

interface NeonSwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function NeonSwitch({
  checked: controlledChecked,
  onChange,
  label,
  size = 'md',
}: NeonSwitchProps) {
  const { theme } = useTheme();
  const [internalChecked, setInternalChecked] = useState(false);
  
  const isChecked = controlledChecked ?? internalChecked;

  const handleToggle = () => {
    const newValue = !isChecked;
    setInternalChecked(newValue);
    onChange?.(newValue);
  };

  const sizes = {
    sm: { width: '40px', height: '20px', circle: '16px' },
    md: { width: '56px', height: '28px', circle: '24px' },
    lg: { width: '72px', height: '36px', circle: '32px' },
  };

  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        className="relative rounded-full transition-all duration-300"
        style={{
          width: sizes[size].width,
          height: sizes[size].height,
          background: isChecked
            ? 'rgba(0, 246, 255, 0.3)'
            : 'rgba(255, 255, 255, 0.1)',
          border: `1px solid ${isChecked ? theme.border.active : theme.border.subtle}`,
          boxShadow: isChecked ? theme.shadows.glow.soft : 'none',
        }}
        onClick={handleToggle}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-300"
          style={{
            width: sizes[size].circle,
            height: sizes[size].circle,
            background: isChecked ? theme.colors.neonCyan : theme.colors.gray400,
            boxShadow: isChecked ? theme.shadows.glow.cyan : 'none',
            left: isChecked ? `calc(100% - ${sizes[size].circle} - 2px)` : '2px',
          }}
        />
      </div>
      {label && (
        <span className="text-sm font-medium" style={{ color: theme.text.secondary }}>
          {label}
        </span>
      )}
    </label>
  );
}
