/**
 * Status Indicator Component - Live status dots with labels
 */
'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'loading';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  className?: string;
}

const statusColors = {
  online: 'bg-green-400',
  offline: 'bg-neutral-500',
  warning: 'bg-yellow-400',
  loading: 'bg-cyan-400'
};

const sizes = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4'
};

export default function StatusIndicator({
  status,
  label,
  size = 'md',
  showPulse = true,
  className
}: StatusIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        {/* Dot */}
        <div className={cn(
          'rounded-full',
          statusColors[status],
          sizes[size],
          status === 'loading' && 'animate-pulse'
        )} />
        
        {/* Pulse ring */}
        {showPulse && status === 'online' && (
          <div className={cn(
            'absolute inset-0 rounded-full',
            'bg-green-400 animate-ping opacity-75'
          )} />
        )}
      </div>

      {/* Label */}
      {label && (
        <span className="text-sm text-neutral-300">{label}</span>
      )}
    </div>
  );
}
