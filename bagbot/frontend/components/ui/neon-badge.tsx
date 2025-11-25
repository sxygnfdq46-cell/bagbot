import React from 'react';

interface NeonBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'premium' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export const NeonBadge: React.FC<NeonBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const variantClasses = {
    default: 'bg-gray-500/20 text-gray-300 border-gray-400/30',
    premium: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    success: 'bg-green-500/20 text-green-300 border-green-400/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
    error: 'bg-red-500/20 text-red-300 border-red-400/30',
    info: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-semibold rounded-full border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${pulse ? 'animate-pulse' : ''}
        backdrop-blur-sm
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </span>
  );
};
