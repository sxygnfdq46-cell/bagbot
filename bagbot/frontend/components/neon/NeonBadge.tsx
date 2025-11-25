import { cn } from '@/utils/cn';

interface NeonBadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'magenta' | 'green' | 'yellow' | 'red' | 'gray' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

const variantStyles = {
  cyan: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
  magenta: 'bg-neon-magenta/10 text-neon-magenta border-neon-magenta/30',
  green: 'bg-neon-green/10 text-neon-green border-neon-green/30',
  yellow: 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30',
  red: 'bg-red-500/10 text-red-400 border-red-500/30',
  gray: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  orange: 'bg-orange-500 text-black shadow-[0_0_15px_3px_rgba(255,165,0,0.7)]',
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export function NeonBadge({ 
  children, 
  variant = 'cyan', 
  size = 'md',
  pulse = false,
  className 
}: NeonBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        'backdrop-blur-sm',
        variantStyles[variant],
        sizeStyles[size],
        pulse && 'animate-pulse-slow',
        className
      )}
    >
      {children}
    </span>
  );
}
