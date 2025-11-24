import { cn } from '@/utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  glow?: 'cyan' | 'magenta' | 'green' | 'yellow' | 'red';
  loading?: boolean;
  className?: string;
}

const glowStyles = {
  cyan: 'shadow-[0_0_20px_rgba(0,240,255,0.3)]',
  magenta: 'shadow-[0_0_20px_rgba(255,0,255,0.3)]',
  green: 'shadow-[0_0_20px_rgba(0,255,0,0.3)]',
  yellow: 'shadow-[0_0_20px_rgba(255,255,0,0.3)]',
  red: 'shadow-[0_0_20px_rgba(255,0,0,0.3)]',
};

const trendColors = {
  up: 'text-neon-green',
  down: 'text-red-400',
  neutral: 'text-gray-400',
};

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  glow = 'cyan',
  loading = false,
  className
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'relative p-6 rounded-lg',
        'bg-gradient-to-br from-gray-900/90 to-gray-950/90',
        'border border-gray-800',
        'backdrop-blur-sm',
        glow && glowStyles[glow],
        'transition-all duration-300',
        'hover:scale-[1.02] hover:-translate-y-0.5',
        className
      )}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gray-700 rounded-tl-lg" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gray-700 rounded-br-lg" />

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-32 bg-gray-800 animate-pulse rounded" />
          ) : (
            <p className="text-3xl font-bold text-white">{value}</p>
          )}
        </div>
        {icon && (
          <div className="text-2xl opacity-50">
            {icon}
          </div>
        )}
      </div>

      {(subtitle || (trend && trendValue)) && (
        <div className="flex items-center justify-between text-sm">
          {subtitle && <span className="text-gray-500">{subtitle}</span>}
          {trend && trendValue && (
            <span className={cn('flex items-center gap-1', trendColors[trend])}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trend === 'neutral' && '→'}
              {trendValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
