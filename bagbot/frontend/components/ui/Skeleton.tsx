import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

/**
 * Skeleton - Loading placeholder component
 * Shows animated skeleton while content is loading
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  count = 1,
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 bg-[length:200%_100%]';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : '100%'),
    height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? '3rem' : '12rem'),
  };

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

/**
 * CardSkeleton - Pre-built skeleton for cards
 */
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  if (count > 1) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="rounded-lg border border-white/10 p-6 space-y-4" style={{ background: 'rgba(26, 14, 21, 0.85)' }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="rectangular" height="8rem" />
            <div className="flex gap-2">
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="text" width="30%" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 p-6 space-y-4" style={{ background: 'rgba(26, 14, 21, 0.85)' }}>
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="rectangular" height="8rem" />
      <div className="flex gap-2">
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="text" width="30%" />
      </div>
    </div>
  );
};

export default Skeleton;
