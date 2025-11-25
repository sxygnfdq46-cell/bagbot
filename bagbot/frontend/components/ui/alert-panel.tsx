import React from 'react';

interface AlertPanelProps {
  children?: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({
  children,
  variant,
  type,
  title,
  message,
  onClose,
  className = '',
}) => {
  // Use type if provided, otherwise fall back to variant, default to 'info'
  const alertType = type || variant || 'info';
  
  const variantStyles = {
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      icon: 'ℹ',
    },
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      icon: '✓',
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      icon: '⚠',
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: '✕',
    },
  };

  const style = variantStyles[alertType];

  return (
    <div
      className={`
        relative p-4 rounded-lg border
        ${style.bg} ${style.border}
        backdrop-blur-sm
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <span className={`text-xl ${style.text}`}>{style.icon}</span>
        <div className="flex-1">
          {title && (
            <h4 className={`font-semibold mb-1 ${style.text}`}>{title}</h4>
          )}
          <div className="text-gray-300 text-sm">{message || children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`${style.text} hover:opacity-70 transition-opacity`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
