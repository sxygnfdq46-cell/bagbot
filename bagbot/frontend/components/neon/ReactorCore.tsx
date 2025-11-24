/**
 * Reactor Core Component - Pulsing energy core animation
 * Represents system status and activity
 */
'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface ReactorCoreProps {
  size?: 'sm' | 'md' | 'lg';
  status?: 'active' | 'idle' | 'warning' | 'error';
  showRings?: boolean;
  className?: string;
}

const sizes = {
  sm: 'w-12 h-12',
  md: 'w-24 h-24',
  lg: 'w-32 h-32'
};

const statusColors = {
  active: {
    core: 'bg-cyan-400',
    glow: 'shadow-[0_0_40px_rgba(0,240,255,0.8)]',
    ring: 'border-cyan-400/30'
  },
  idle: {
    core: 'bg-neutral-400',
    glow: 'shadow-[0_0_20px_rgba(163,163,163,0.5)]',
    ring: 'border-neutral-400/20'
  },
  warning: {
    core: 'bg-yellow-400',
    glow: 'shadow-[0_0_40px_rgba(255,255,0,0.8)]',
    ring: 'border-yellow-400/30'
  },
  error: {
    core: 'bg-red-400',
    glow: 'shadow-[0_0_40px_rgba(255,0,0,0.8)]',
    ring: 'border-red-400/30'
  }
};

export default function ReactorCore({
  size = 'md',
  status = 'active',
  showRings = true,
  className
}: ReactorCoreProps) {
  const colors = statusColors[status];

  return (
    <div className={cn('relative flex items-center justify-center', sizes[size], className)}>
      {/* Outer pulsing rings */}
      {showRings && (
        <>
          <div className={cn(
            'absolute inset-0 rounded-full border-2',
            'animate-ping',
            colors.ring
          )} />
          <div className={cn(
            'absolute inset-2 rounded-full border',
            'animate-pulse',
            colors.ring
          )} />
        </>
      )}
      
      {/* Core */}
      <div className={cn(
        'relative z-10 rounded-full',
        'animate-pulse-slow',
        colors.core,
        colors.glow
      )} style={{ width: '40%', height: '40%' }}>
        {/* Inner highlight */}
        <div className="absolute inset-0 rounded-full bg-white/30" style={{
          clipPath: 'ellipse(40% 30% at 30% 30%)'
        }} />
      </div>
      
      {/* Rotating ring */}
      {showRings && (
        <div className="absolute inset-0 animate-spin-slow">
          <div className={cn(
            'absolute top-0 left-1/2 w-1 h-1 rounded-full -translate-x-1/2',
            colors.core
          )} />
          <div className={cn(
            'absolute bottom-0 left-1/2 w-1 h-1 rounded-full -translate-x-1/2',
            colors.core
          )} />
        </div>
      )}
    </div>
  );
}
