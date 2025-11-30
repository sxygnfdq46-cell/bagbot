'use client';

import { useEffect, useRef } from 'react';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'pulse-cyan' | 'pulse-magenta' | 'pulse-green' | 'shimmer';
  hover?: boolean;
  delay?: number;
}

export default function AnimatedCard({ 
  children, 
  className = '',
  variant = 'pulse-cyan',
  hover = true,
  delay = 0
}: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (delay > 0 && cardRef.current) {
      cardRef.current.style.animationDelay = `${delay}ms`;
    }
  }, [delay]);

  const variantClasses = {
    'pulse-cyan': 'pulse-glow-cyan',
    'pulse-magenta': 'pulse-glow-magenta',
    'pulse-green': 'pulse-glow-green',
    'shimmer': 'hologram-shimmer'
  };

  const hoverClasses = hover ? 'hover-lift hover-glow transition-smooth' : '';

  return (
    <div 
      ref={cardRef}
      className={`
        gpu-accelerated 
        ${variantClasses[variant]} 
        ${hoverClasses}
        fade-in-up
        ${className}
      `}
    >
      {children}
    </div>
  );
}
