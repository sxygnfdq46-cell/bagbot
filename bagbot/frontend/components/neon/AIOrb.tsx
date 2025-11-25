/**
 * AI Orb Component - Floating AI assistant interface
 * Provides quick access to AI chat and help
 */
'use client';

import React, { useState } from 'react';
import { cn } from '@/utils/cn';

interface AIOrbProps {
  onOpen?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

const positions = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6'
};

export default function AIOrb({
  onOpen,
  position = 'bottom-right',
  className
}: AIOrbProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);

  const handleClick = () => {
    setIsPulsing(false);
    onOpen?.();
  };

  return (
    <div className={cn('fixed z-50', positions[position], className)}>
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-neutral-900/95 backdrop-blur-sm border border-cyan-400/50 rounded-lg text-cyan-400 text-sm whitespace-nowrap shadow-lg">
          Ask AI Assistant
          <div className="absolute top-full right-4 w-2 h-2 bg-neutral-900 border-r border-b border-cyan-400/50 transform rotate-45 -translate-y-1" />
        </div>
      )}

      {/* Orb Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'relative w-16 h-16 rounded-full',
          'bg-gradient-to-br from-cyan-500 to-magenta-500',
          'shadow-[0_0_40px_rgba(0,240,255,0.6)]',
          'hover:shadow-[0_0_60px_rgba(0,240,255,0.9)]',
          'transition-all duration-300',
          'hover:scale-110',
          'focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
          isPulsing && 'animate-pulse-slow'
        )}
      >
        {/* Pulsing rings */}
        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping" />
        <div className="absolute inset-1 rounded-full border border-magenta-400/30 animate-pulse" />
        
        {/* AI Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white drop-shadow-lg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>

        {/* Activity indicator */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-neutral-900 animate-pulse" />
      </button>

      {/* Ripple effect on click */}
      <div className="absolute inset-0 rounded-full pointer-events-none" />
    </div>
  );
}

// Named export for compatibility
export { AIOrb };
