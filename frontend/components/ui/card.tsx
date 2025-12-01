import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: 'cyan' | 'magenta' | 'green';
}

export function Card({ className = '', glowColor = 'cyan', ...props }: CardProps) {
  const glowClasses = {
    cyan: 'border-neon-cyan pulse-glow-cyan',
    magenta: 'border-neon-magenta pulse-glow-magenta',
    green: 'border-neon-green pulse-glow-green'
  };

  return (
    <div
      className={`gpu-accelerated rounded-lg border bg-deep-void/80 backdrop-blur-sm text-card-foreground shadow-lg hover-lift transition-smooth ${glowClasses[glowColor]} ${className}`}
      {...props}
    />
  );
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className = '', ...props }: CardContentProps) {
  return <div className={`p-6 pt-0 ${className}`} {...props} />;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className = '', ...props }: CardHeaderProps) {
  return <div className={`flex flex-col space-y-1.5 p-6 border-b border-neon-cyan/20 ${className}`} {...props} />;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className = '', ...props }: CardTitleProps) {
  return (
    <h3
      className={`text-2xl font-semibold leading-none tracking-tight text-neon-cyan ${className}`}
      {...props}
    />
  );
}
