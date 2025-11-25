/**
 * Neon Button Component - Futuristic glowing button
 */
'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface NeonButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const variants = {
  primary: 'bg-cyan-500/20 border-cyan-400/50 text-cyan-400 hover:bg-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]',
  secondary: 'bg-magenta-500/20 border-magenta-400/50 text-magenta-400 hover:bg-magenta-500/30 hover:border-magenta-400 hover:shadow-[0_0_20px_rgba(255,0,255,0.5)]',
  danger: 'bg-red-500/20 border-red-400/50 text-red-400 hover:bg-red-500/30 hover:border-red-400 hover:shadow-[0_0_20px_rgba(255,0,0,0.5)]',
  success: 'bg-green-500/20 border-green-400/50 text-green-400 hover:bg-green-500/30 hover:border-green-400 hover:shadow-[0_0_20px_rgba(0,255,0,0.5)]'
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
};

export default function NeonButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button'
}: NeonButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'relative rounded-md border font-medium',
        'transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// Named export for compatibility
export { NeonButton };
