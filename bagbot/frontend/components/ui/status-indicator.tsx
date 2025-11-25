import React from 'react';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'connecting' | 'error' | 'processing' | 'active';
  label?: string;
  showPulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showPulse = true,
  size = 'md',
  className = '',
}) => {
  const statusConfig = {
    online: {
      color: 'bg-green-500',
      text: 'text-green-400',
      label: 'Online',
    },
    offline: {
      color: 'bg-gray-500',
      text: 'text-gray-400',
      label: 'Offline',
    },
    connecting: {
      color: 'bg-yellow-500',
      text: 'text-yellow-400',
      label: 'Connecting...',
    },
    error: {
      color: 'bg-red-500',
      text: 'text-red-400',
      label: 'Error',
    },
    processing: {
      color: 'bg-cyan-500',
      text: 'text-cyan-400',
      label: 'Processing...',
    },
    active: {
      color: 'bg-green-500',
      text: 'text-green-400',
      label: 'Active',
    },
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center">
        {showPulse && (status === 'online' || status === 'active') && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75 animate-ping`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full ${sizeClasses[size]} ${config.color} ${
            (status === 'processing' || status === 'connecting') ? 'animate-pulse' : ''
          }`}
        />
      </div>
      {(label || config.label) && (
        <span className={`text-sm font-medium ${config.text}`}>
          {label || config.label}
        </span>
      )}
    </div>
  );
};
