import React from 'react';

interface NeonCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'premium' | 'success' | 'warning';
}

export const NeonCard: React.FC<NeonCardProps> = ({ 
  children, 
  className = '', 
  variant = 'default' 
}) => {
  const variantClasses = {
    default: 'border-cyan-500/30 shadow-cyan-500/20',
    premium: 'border-purple-500/30 shadow-purple-500/20',
    success: 'border-green-500/30 shadow-green-500/20',
    warning: 'border-yellow-500/30 shadow-yellow-500/20',
  };

  return (
    <div
      className={`
        relative p-6 rounded-lg border bg-gray-900/50 backdrop-blur-sm
        ${variantClasses[variant]}
        shadow-lg transition-all duration-300
        hover:shadow-xl hover:border-opacity-50
        ${className}
      `}
    >
      {children}
    </div>
  );
};
