'use client';

import { useEffect, useState } from 'react';

interface AnimatedTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'breathe-cyan' | 'breathe-magenta' | 'glow-cyan' | 'glow-magenta';
  delay?: number;
}

export default function AnimatedText({ 
  children, 
  className = '',
  variant = 'breathe-cyan',
  delay = 0
}: AnimatedTextProps) {
  const [isVisible, setIsVisible] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  const variantClasses = {
    'breathe-cyan': 'breathe-text-cyan',
    'breathe-magenta': 'breathe-text-magenta',
    'glow-cyan': 'text-shadow-cyan',
    'glow-magenta': 'text-shadow-magenta'
  };

  if (!isVisible) return null;

  return (
    <span className={`${variantClasses[variant]} fade-in ${className}`}>
      {children}
    </span>
  );
}
