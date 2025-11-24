import { cn } from '@/utils/cn';
import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';

interface AlertPanelProps {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'critical';
  timestamp?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const typeStyles = {
  info: {
    bg: 'bg-neon-cyan/10 border-neon-cyan/30',
    icon: <Info className="w-5 h-5 text-neon-cyan" />,
    text: 'text-neon-cyan'
  },
  warning: {
    bg: 'bg-neon-yellow/10 border-neon-yellow/30',
    icon: <AlertTriangle className="w-5 h-5 text-neon-yellow" />,
    text: 'text-neon-yellow'
  },
  error: {
    bg: 'bg-red-500/10 border-red-500/30',
    icon: <AlertCircle className="w-5 h-5 text-red-400" />,
    text: 'text-red-400'
  },
  critical: {
    bg: 'bg-red-600/20 border-red-600/50 animate-pulse-slow',
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    text: 'text-red-500'
  },
};

export function AlertPanel({
  title,
  message,
  type = 'info',
  timestamp,
  dismissible = false,
  onDismiss,
  className
}: AlertPanelProps) {
  const style = typeStyles[type];

  return (
    <div
      className={cn(
        'relative p-4 rounded-lg border backdrop-blur-sm',
        style.bg,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {style.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn('font-semibold', style.text)}>
              {title}
            </h4>
            {dismissible && onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <p className="mt-1 text-sm text-gray-300">
            {message}
          </p>
          
          {timestamp && (
            <p className="mt-2 text-xs text-gray-500">
              {timestamp}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
