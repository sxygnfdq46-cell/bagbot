import React from 'react';

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  type = 'button',
}) => {
  const variantClasses = {
    primary: 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-cyan-500/50',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white border-gray-500 shadow-gray-500/50',
    danger: 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-red-500/50',
    success: 'bg-green-600 hover:bg-green-500 text-white border-green-400 shadow-green-500/50',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-3 rounded-lg font-semibold border
        transition-all duration-300 transform
        ${variantClasses[variant]}
        hover:scale-105 hover:shadow-lg
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
        ${className}
      `}
    >
      {children}
    </button>
  );
};
