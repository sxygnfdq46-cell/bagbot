'use client';

import { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'cyan' | 'magenta' | 'green';
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md',
  color = 'cyan',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4'
  };

  const colorClasses = {
    cyan: 'border-neon-cyan border-t-transparent',
    magenta: 'border-neon-magenta border-t-transparent',
    green: 'border-neon-green border-t-transparent'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]}
          ${colorClasses[color]}
          rounded-full
          spin-glow
          gpu-accelerated
        `}
        style={{
          boxShadow: color === 'cyan' 
            ? '0 0 20px rgba(0, 246, 255, 0.5)' 
            : color === 'magenta'
            ? '0 0 20px rgba(255, 0, 255, 0.5)'
            : '0 0 20px rgba(0, 255, 170, 0.5)'
        }}
      />
    </div>
  );
}
