import React from 'react';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  glowColor?: 'cyan' | 'magenta' | 'green';
}

export function Separator({ 
  className = '', 
  orientation = 'horizontal',
  glowColor = 'cyan',
  ...props 
}: SeparatorProps) {
  const glowClasses = {
    cyan: 'bg-neon-cyan/30 shadow-[0_0_10px_rgba(0,246,255,0.5)]',
    magenta: 'bg-neon-magenta/30 shadow-[0_0_10px_rgba(255,0,255,0.5)]',
    green: 'bg-neon-green/30 shadow-[0_0_10px_rgba(0,255,0,0.5)]'
  };

  return (
    <div
      className={`${glowClasses[glowColor]} ${
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]'
      } ${className}`}
      {...props}
    />
  );
}
