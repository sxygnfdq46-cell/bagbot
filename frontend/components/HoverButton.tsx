'use client';

interface HoverButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'cyan' | 'magenta' | 'green';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export default function HoverButton({ 
  children, 
  onClick,
  className = '',
  variant = 'cyan',
  size = 'md',
  disabled = false
}: HoverButtonProps) {
  const variantClasses = {
    cyan: 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10',
    magenta: 'border-neon-magenta text-neon-magenta hover:bg-neon-magenta/10',
    green: 'border-neon-green text-neon-green hover:bg-neon-green/10'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        gpu-accelerated
        click-feedback
        hover-lift
        hover-glow
        transition-smooth
        border-2
        rounded-lg
        font-semibold
        uppercase
        tracking-wider
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
