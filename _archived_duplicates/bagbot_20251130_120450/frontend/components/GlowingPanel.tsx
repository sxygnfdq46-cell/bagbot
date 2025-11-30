'use client';

import { useEffect, useRef } from 'react';

interface GlowingPanelProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'magenta' | 'green';
  intensity?: 'low' | 'medium' | 'high';
  animate?: boolean;
}

export default function GlowingPanel({ 
  children, 
  className = '',
  glowColor = 'cyan',
  intensity = 'medium',
  animate = true
}: GlowingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const colorClasses = {
    cyan: animate ? 'pulse-glow-cyan' : 'border-neon-cyan',
    magenta: animate ? 'pulse-glow-magenta' : 'border-neon-magenta',
    green: animate ? 'pulse-glow-green' : 'border-neon-green'
  };

  const intensityStyles = {
    low: { opacity: 0.6 },
    medium: { opacity: 0.8 },
    high: { opacity: 1 }
  };

  return (
    <div 
      ref={panelRef}
      className={`
        gpu-accelerated
        border-2
        rounded-xl
        backdrop-blur-md
        bg-deep-void/30
        ${colorClasses[glowColor]}
        ${className}
      `}
      style={intensityStyles[intensity]}
    >
      {children}
    </div>
  );
}
