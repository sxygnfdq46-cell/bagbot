import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'cyan' | 'magenta' | 'green' | 'yellow';
}

export function LoadingSpinner({ size = 'md', color = 'cyan' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  const colorClasses = {
    cyan: 'border-cyan-400 border-t-transparent',
    magenta: 'border-magenta-400 border-t-transparent',
    green: 'border-green-400 border-t-transparent',
    yellow: 'border-yellow-400 border-t-transparent',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin`}
      />
    </div>
  );
}

interface HologramSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export function HologramSpinner({ size = 'md' }: HologramSpinnerProps) {
  const sizeValue = {
    sm: 40,
    md: 60,
    lg: 80,
  }[size];

  return (
    <div className="flex items-center justify-center">
      <div className="relative" style={{ width: sizeValue, height: sizeValue }}>
        {/* Outer Ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-spin"
          style={{ animationDuration: '3s' }}
        />
        
        {/* Middle Ring */}
        <div
          className="absolute inset-2 rounded-full border-2 border-magenta-400/30 animate-spin"
          style={{ animationDuration: '2s', animationDirection: 'reverse' }}
        />
        
        {/* Inner Ring */}
        <div
          className="absolute inset-4 rounded-full border-2 border-green-400/30 animate-spin"
          style={{ animationDuration: '1.5s' }}
        />
        
        {/* Center Orb */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-magenta-500 rounded-full animate-pulse shadow-lg shadow-cyan-500/50" />
        </div>
      </div>
    </div>
  );
}

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <HologramSpinner size="lg" />
        <p className="mt-6 text-cyan-400 font-medium animate-pulse">{message}</p>
      </div>
    </div>
  );
}
