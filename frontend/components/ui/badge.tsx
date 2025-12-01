import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'outline';
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'badge-info',
    success: 'badge-success',
    warning: 'badge-warning',
    info: 'badge-info',
    outline: 'bg-transparent border border-primary text-primary hover:bg-primary-light'
  };

  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-smooth ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
