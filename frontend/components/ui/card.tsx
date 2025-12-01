import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: 'green' | 'yellow' | 'default';
}

export function Card({ className = '', glowColor = 'default', ...props }: CardProps) {
  const glowClasses = {
    green: 'border-primary hover-glow-green',
    yellow: 'border-accent hover-glow-yellow',
    default: 'border-cream'
  };

  return (
    <div
      className={`card-clean-hover ${glowClasses[glowColor]} ${className}`}
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
  return <div className={`flex flex-col space-y-1.5 p-6 border-b border-cream ${className}`} {...props} />;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className = '', ...props }: CardTitleProps) {
  return (
    <h3
      className={`text-2xl font-semibold leading-none tracking-tight text-primary ${className}`}
      {...props}
    />
  );
}
