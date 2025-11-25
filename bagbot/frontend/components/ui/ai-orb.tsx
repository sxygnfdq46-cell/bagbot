import React from 'react';

interface AIOrbProps {
  isActive?: boolean;
  isPulsing?: boolean;
  thinking?: boolean;  // Add thinking prop
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AIOrb: React.FC<AIOrbProps> = ({
  isActive = false,
  isPulsing = false,
  thinking = false,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  };

  // Use thinking prop to control pulsing
  const shouldPulse = thinking || isPulsing;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer glow */}
      <div
        className={`
          absolute ${sizeClasses[size]} rounded-full
          ${isActive ? 'bg-cyan-500/20' : 'bg-gray-500/20'}
          ${shouldPulse ? 'animate-pulse' : ''}
          blur-xl
        `}
      />
      
      {/* Middle ring */}
      <div
        className={`
          absolute ${sizeClasses[size]} rounded-full
          border-2 ${isActive ? 'border-cyan-400/40' : 'border-gray-400/40'}
          ${shouldPulse ? 'animate-ping' : ''}
        `}
      />
      
      {/* Inner orb */}
      <div
        className={`
          relative ${sizeClasses[size]} rounded-full
          ${isActive ? 'bg-gradient-to-br from-cyan-400 to-blue-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'}
          shadow-lg
          flex items-center justify-center
          transition-all duration-300
        `}
      >
        <div className="w-2/3 h-2/3 rounded-full bg-white/30 backdrop-blur-sm" />
      </div>
    </div>
  );
};
