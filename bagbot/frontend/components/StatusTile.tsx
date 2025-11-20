import React from 'react';

interface StatusTileProps {
  label: string;
  status: 'healthy' | 'warning' | 'error' | 'loading' | 'inactive';
  value?: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const statusConfig = {
  healthy: {
    bg: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300',
    indicator: 'bg-emerald-400',
    pulse: 'animate-pulse-slow'
  },
  warning: {
    bg: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300',
    indicator: 'bg-amber-400',
    pulse: 'animate-pulse-slow'
  },
  error: {
    bg: 'from-rose-500/20 to-rose-600/10',
    border: 'border-rose-500/30',
    glow: 'shadow-rose-500/20',
    text: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300',
    indicator: 'bg-rose-400',
    pulse: 'animate-pulse'
  },
  loading: {
    bg: 'from-sky-500/20 to-sky-600/10',
    border: 'border-sky-500/30',
    glow: 'shadow-sky-500/20',
    text: 'text-sky-400',
    badge: 'bg-sky-500/20 text-sky-300',
    indicator: 'bg-sky-400',
    pulse: 'animate-spin'
  },
  inactive: {
    bg: 'from-slate-500/20 to-slate-600/10',
    border: 'border-slate-500/30',
    glow: 'shadow-slate-500/20',
    text: 'text-slate-400',
    badge: 'bg-slate-500/20 text-slate-300',
    indicator: 'bg-slate-400',
    pulse: ''
  }
};

const StatusTile: React.FC<StatusTileProps> = ({
  label,
  status,
  value,
  subtitle,
  icon,
  onClick
}) => {
  const config = statusConfig[status];
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`
        group relative overflow-hidden
        glass-card
        backdrop-blur-xl
        bg-gradient-to-br ${config.bg}
        border ${config.border}
        rounded-2xl
        shadow-lg shadow-black/20 hover:${config.glow}
        transition-all duration-500 ease-out
        ${isClickable ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}
        ${isClickable ? 'hover:border-opacity-50' : ''}
      `}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      {/* Sophisticated gradient overlay */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100
        bg-gradient-to-br ${config.bg}
        transition-opacity duration-500
      `} />
      
      {/* Premium glow effect */}
      <div className={`
        absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100
        bg-gradient-to-br ${config.border.replace('border-', 'from-')} to-transparent
        blur-sm transition-opacity duration-500
      `} />

      {/* Content container */}
      <div className="relative p-6 space-y-4">
        {/* Header section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Status indicator with pulse */}
            <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 ${config.border}`}>
              <div className={`w-3 h-3 rounded-full ${config.indicator} ${config.pulse}`} />
              <div className={`absolute w-3 h-3 rounded-full ${config.indicator} animate-ping opacity-30`} />
            </div>

            {/* Label */}
            <div>
              <h3 className="text-sm font-medium text-white/90 tracking-wide uppercase">
                {label}
              </h3>
              {subtitle && (
                <p className="text-xs text-white/50 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Icon */}
          {icon && (
            <div className={`${config.text} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}>
              {icon}
            </div>
          )}
        </div>

        {/* Value display */}
        {value !== undefined && (
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${config.text} tracking-tight`}>
              {value}
            </span>
          </div>
        )}

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className={`
            inline-flex items-center gap-1.5 px-3 py-1
            ${config.badge}
            rounded-full text-xs font-medium
            backdrop-blur-sm
            transition-all duration-300
            group-hover:scale-105
          `}>
            <div className={`w-1.5 h-1.5 rounded-full ${config.indicator} ${config.pulse}`} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>

      {/* Hover shimmer effect */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100
        bg-gradient-to-r from-transparent via-white/5 to-transparent
        -translate-x-full group-hover:translate-x-full
        transition-all duration-1000 ease-out
        pointer-events-none
      `} />
    </div>
  );
};

export default StatusTile;
