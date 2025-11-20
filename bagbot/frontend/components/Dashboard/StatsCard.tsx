'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  DollarSign, 
  Target, 
  Activity,
  LucideIcon 
} from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon?: 'trades' | 'profit' | 'winrate' | 'positions';
  showLiveTag?: boolean;
  isPercentage?: boolean;
  prefix?: string;
  colorScheme?: 'emerald' | 'amber' | 'sky' | 'violet' | 'rose';
  showProgressBar?: boolean;
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  trades: BarChart3,
  profit: DollarSign,
  winrate: Target,
  positions: Activity,
};

const colorSchemes = {
  emerald: {
    border: 'border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-500/50',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    hoverIconColor: 'group-hover:text-emerald-400',
    valueColor: 'text-emerald-400',
    hoverValueColor: 'group-hover:text-emerald-300',
    glowColor: 'shadow-emerald-500/20',
  },
  amber: {
    border: 'border-amber-500/30',
    hoverBorder: 'hover:border-amber-500/50',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    hoverIconColor: 'group-hover:text-amber-400',
    valueColor: 'text-amber-400',
    hoverValueColor: 'group-hover:text-amber-300',
    glowColor: 'shadow-amber-500/20',
  },
  sky: {
    border: 'border-sky-500/30',
    hoverBorder: 'hover:border-sky-500/50',
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-500',
    hoverIconColor: 'group-hover:text-sky-400',
    valueColor: 'text-sky-400',
    hoverValueColor: 'group-hover:text-sky-300',
    glowColor: 'shadow-sky-500/20',
  },
  violet: {
    border: 'border-violet-500/30',
    hoverBorder: 'hover:border-violet-500/50',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
    hoverIconColor: 'group-hover:text-violet-400',
    valueColor: 'text-violet-400',
    hoverValueColor: 'group-hover:text-violet-300',
    glowColor: 'shadow-violet-500/20',
  },
  rose: {
    border: 'border-rose-500/30',
    hoverBorder: 'hover:border-rose-500/50',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-500',
    hoverIconColor: 'group-hover:text-rose-400',
    valueColor: 'text-rose-400',
    hoverValueColor: 'group-hover:text-rose-300',
    glowColor: 'shadow-rose-500/20',
  },
};

/**
 * AnimatedNumber component with smooth spring animation
 */
const AnimatedNumber: React.FC<{ value: number; prefix?: string; suffix?: string }> = ({ 
  value, 
  prefix = '', 
  suffix = '' 
}) => {
  const spring = useSpring(value, { 
    damping: 30, 
    stiffness: 100,
    mass: 0.5 
  });
  const display = useTransform(spring, (current) =>
    `${prefix}${Math.round(current * 100) / 100}${suffix}`
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    spring.set(value);
  }, [value, spring]);

  if (!mounted) {
    return <>{prefix}{value}{suffix}</>;
  }

  return <motion.span>{display}</motion.span>;
};

/**
 * Enhanced StatsCard Component
 * Features:
 * - Animated number transitions with spring physics
 * - Color-coded gain/loss micro animations
 * - Pulsing glow behind LIVE tag
 * - Lucide icons for each stat type
 * - Glass morphism design with hover effects
 */
const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeLabel = 'vs last week',
  icon = 'trades',
  showLiveTag = false,
  isPercentage = false,
  prefix = '',
  colorScheme = 'emerald',
  showProgressBar = false,
  className = '',
}) => {
  const Icon = iconMap[icon] || BarChart3;
  const colors = colorSchemes[colorScheme];
  const isPositiveChange = change !== undefined && change >= 0;
  const changeColor = isPositiveChange ? 'text-emerald-400' : 'text-rose-400';
  const ChangeTrendIcon = isPositiveChange ? TrendingUp : TrendingDown;

  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const displayValue = isPercentage ? `${numericValue}%` : `${prefix}${value}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={`glass-panel p-3 sm:p-4 lg:p-5 rounded-xl border ${colors.border} ${colors.hoverBorder} transition-all group cursor-pointer ${className}`}
    >
      {/* Header with Title and Icon */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="text-[10px] sm:text-xs text-muted uppercase tracking-wider font-medium">
            {title}
          </p>
          {showLiveTag && (
            <motion.span
              animate={{
                boxShadow: [
                  '0 0 0px rgba(16, 185, 129, 0)',
                  '0 0 20px rgba(16, 185, 129, 0.4)',
                  '0 0 0px rgba(16, 185, 129, 0)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wide"
            >
              Live
            </motion.span>
          )}
        </div>
        <motion.div
          whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className={`p-1.5 sm:p-2 ${colors.iconBg} rounded-lg`}
        >
          <Icon 
            className={`w-3 h-3 sm:w-4 sm:h-4 ${colors.iconColor} ${colors.hoverIconColor} transition-colors`} 
          />
        </motion.div>
      </div>

      {/* Main Value with Animated Number */}
      <div className="metric-text text-xl sm:text-2xl lg:text-3xl text-main transition-colors mb-1">
        {typeof value === 'number' ? (
          <AnimatedNumber 
            value={numericValue} 
            prefix={prefix}
            suffix={isPercentage ? '%' : ''}
          />
        ) : (
          displayValue
        )}
      </div>

      {/* Change Indicator or Progress Bar */}
      {change !== undefined && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mt-1.5 sm:mt-2 flex items-center gap-1"
        >
          <motion.div
            animate={{
              y: isPositiveChange ? [-2, 0, -2] : [2, 0, 2],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <ChangeTrendIcon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${changeColor}`} />
          </motion.div>
          <span className={`percentage-text text-[10px] sm:text-xs ${changeColor}`}>
            {isPositiveChange ? '+' : ''}{change}%
          </span>
          <span className="text-[10px] sm:text-xs text-muted hidden sm:inline">
            {changeLabel}
          </span>
        </motion.div>
      )}

      {showProgressBar && typeof value === 'number' && (
        <div className="mt-2 sm:mt-3">
          <div className="w-full bg-slate-700/30 rounded-full h-1 sm:h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(numericValue, 100)}%` }}
              transition={{ 
                duration: 1, 
                delay: 0.3,
                ease: 'easeOut' 
              }}
              className={`bg-gradient-to-r from-${colorScheme}-500 to-${colorScheme}-400 h-1 sm:h-1.5 rounded-full`}
              style={{
                background: `linear-gradient(to right, var(--tw-gradient-stops))`,
                '--tw-gradient-from': colors.iconColor.replace('text-', ''),
                '--tw-gradient-to': colors.hoverIconColor.replace('group-hover:text-', ''),
              } as any}
            />
          </div>
        </div>
      )}

      {showLiveTag && !change && (
        <div className="mt-1.5 sm:mt-2 flex items-center gap-1">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${colors.iconColor.replace('text-', 'bg-')}`}
          />
          <span className="text-[10px] sm:text-xs text-muted">Real-time</span>
        </div>
      )}
    </motion.div>
  );
};

export default StatsCard;
