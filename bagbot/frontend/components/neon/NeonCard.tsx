/**
 * Neon Card Component - Futuristic glowing card container
 * Used throughout the AI Command Center interface
 */
'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface NeonCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'magenta' | 'yellow' | 'green' | 'orange' | 'red' | 'none';
  pulse?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

const glowColors = {
  cyan: 'shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]',
  magenta: 'shadow-[0_0_20px_rgba(255,0,255,0.3)] hover:shadow-[0_0_30px_rgba(255,0,255,0.5)]',
  yellow: 'shadow-[0_0_20px_rgba(255,255,0,0.3)] hover:shadow-[0_0_30px_rgba(255,255,0,0.5)]',
  green: 'shadow-[0_0_20px_rgba(0,255,0,0.3)] hover:shadow-[0_0_30px_rgba(0,255,0,0.5)]',
  orange: 'shadow-[0_0_20px_rgba(255,102,0,0.3)] hover:shadow-[0_0_30px_rgba(255,102,0,0.5)]',
  red: 'shadow-[0_0_15px_3px_rgba(255,0,0,0.7)]',
  none: ''
};

const borderColors = {
  cyan: 'border-cyan-400/50',
  magenta: 'border-magenta-400/50',
  yellow: 'border-yellow-400/50',
  green: 'border-green-400/50',
  orange: 'border-orange-400/50',
  red: 'border-red-500',
  none: 'border-neutral-700/50'
};

export default function NeonCard({
  children,
  className,
  glow = 'cyan',
  pulse = false,
  hover = true,
  onClick
}: NeonCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg border backdrop-blur-sm',
        'bg-gradient-to-br from-neutral-900/90 to-neutral-950/90',
        'transition-all duration-300',
        borderColors[glow],
        glow !== 'none' && glowColors[glow],
        hover && 'hover:-translate-y-1 hover:scale-[1.02]',
        pulse && 'animate-pulse-slow',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Corner accents */}
      {glow !== 'none' && (
        <>
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-current opacity-50 rounded-tl-lg" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-current opacity-50 rounded-br-lg" />
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Named export for compatibility
export { NeonCard };
