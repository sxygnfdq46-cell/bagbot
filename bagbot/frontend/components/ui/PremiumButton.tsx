'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface PremiumButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  fullWidth?: boolean;
}

const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  fullWidth = false,
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples([...ripples, { x, y, id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);

    onClick?.();
  };

  const variants = {
    primary: {
      base: 'bg-gradient-to-r from-amber-500 to-amber-600',
      hover: 'hover:from-amber-400 hover:to-amber-500',
      shadow: 'shadow-amber-500/30',
      glow: '0 0 30px rgba(253, 185, 26, 0.4)',
    },
    success: {
      base: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      hover: 'hover:from-emerald-400 hover:to-emerald-500',
      shadow: 'shadow-emerald-500/30',
      glow: '0 0 30px rgba(16, 185, 129, 0.4)',
    },
    danger: {
      base: 'bg-gradient-to-r from-rose-500 to-rose-600',
      hover: 'hover:from-rose-400 hover:to-rose-500',
      shadow: 'shadow-rose-500/30',
      glow: '0 0 30px rgba(255, 83, 112, 0.4)',
    },
    warning: {
      base: 'bg-gradient-to-r from-orange-500 to-orange-600',
      hover: 'hover:from-orange-400 hover:to-orange-500',
      shadow: 'shadow-orange-500/30',
      glow: '0 0 30px rgba(255, 159, 64, 0.4)',
    },
    info: {
      base: 'bg-gradient-to-r from-sky-500 to-sky-600',
      hover: 'hover:from-sky-400 hover:to-sky-500',
      shadow: 'shadow-sky-500/30',
      glow: '0 0 30px rgba(56, 189, 248, 0.4)',
    },
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  const currentVariant = variants[variant];
  const currentSize = sizes[size];

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden
        ${currentVariant.base}
        ${currentVariant.hover}
        ${currentSize}
        ${fullWidth ? 'w-full' : ''}
        rounded-xl font-semibold
        shadow-lg ${currentVariant.shadow}
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        transform active:scale-95
        ${className}
      `}
      whileHover={{
        scale: disabled || loading ? 1 : 1.02,
        boxShadow: disabled || loading ? undefined : currentVariant.glow,
      }}
      whileTap={{
        scale: disabled || loading ? 1 : 0.98,
      }}
    >
      {/* Ripple Effect */}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 10,
            height: 10,
          }}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 20, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}

      {/* Shimmer Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: 'linear',
        }}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <motion.svg
            className="animate-spin h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </motion.svg>
        ) : icon ? (
          <motion.span whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
            {icon}
          </motion.span>
        ) : null}
        {children}
      </span>
    </motion.button>
  );
};

export default PremiumButton;
