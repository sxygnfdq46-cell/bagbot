import React from 'react';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  glowColor?: 'green' | 'yellow' | 'default';
}

export function Separator({ 
  className = '', 
  orientation = 'horizontal',
  glowColor = 'default',
  ...props 
}: SeparatorProps) {
  const glowClasses = {
    green: 'bg-primary/40 shadow-[0_0_8px_rgba(74,222,128,0.4)]',
    yellow: 'bg-accent/40 shadow-[0_0_8px_rgba(253,224,71,0.4)]',
    default: 'bg-cream border-cream'
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
