import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'hover' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * GlassCard - Premium reusable card component
 * Features institutional-quality design with maroon accents
 */
export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  onClick,
  variant = 'default',
  padding = 'md'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const variantClasses = {
    default: 'border-white/10',
    hover: 'border-white/10 hover:border-gold-500/30 hover:shadow-maroon-md transition-all duration-300',
    interactive: 'border-white/10 hover:border-gold-500/30 hover:shadow-maroon-lg hover:scale-[1.02] cursor-pointer transition-all duration-300'
  };

  return (
    <div
      onClick={onClick}
      className={`
        rounded-lg backdrop-blur-xl
        border shadow-maroon-sm
        ${paddingClasses[padding]}
        ${variantClasses[variant]}
        ${className}
      `}
      style={{
        background: 'rgba(26, 14, 21, 0.85)',
        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.05), 0 4px 16px rgba(138, 58, 58, 0.2)',
      }}
    >
      {children}
    </div>
  );
};

export default GlassCard;
