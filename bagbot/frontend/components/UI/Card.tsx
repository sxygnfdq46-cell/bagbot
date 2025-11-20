import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * GlassCard - Premium reusable card component
 * Features maroon-tinted glass morphism design
 */
export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  onClick 
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card-maroon ${className}`}
      style={{
        background: 'rgba(30, 15, 15, 0.6)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.05), 0 4px 16px rgba(0, 0, 0, 0.3)',
      }}
    >
      {children}
    </div>
  );
};

export default GlassCard;
