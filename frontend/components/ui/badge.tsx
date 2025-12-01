import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'cyan' | 'magenta' | 'green';
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    cyan: 'bg-deep-void/60 border border-neon-cyan text-neon-cyan pulse-glow-cyan backdrop-blur-sm',
    magenta: 'bg-deep-void/60 border border-neon-magenta text-neon-magenta pulse-glow-magenta backdrop-blur-sm',
    green: 'bg-deep-void/60 border border-neon-green text-neon-green pulse-glow-green backdrop-blur-sm',
  };

  return (
    <div
      className={`gpu-accelerated inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-smooth hover-glow ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
