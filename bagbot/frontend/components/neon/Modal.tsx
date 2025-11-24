import { cn } from '@/utils/cn';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: 'cyan' | 'magenta' | 'yellow' | 'green';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const glowStyles = {
  cyan: 'shadow-[0_0_50px_rgba(0,240,255,0.3)]',
  magenta: 'shadow-[0_0_50px_rgba(255,0,255,0.3)]',
  yellow: 'shadow-[0_0_50px_rgba(255,255,0,0.3)]',
  green: 'shadow-[0_0_50px_rgba(0,255,0,0.3)]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  glow = 'cyan',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className
}: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full rounded-lg',
          'bg-gradient-to-br from-gray-900 to-gray-950',
          'border border-gray-800',
          sizeStyles[size],
          glowStyles[glow],
          'transition-all duration-300',
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4',
          className
        )}
      >
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-gray-700 rounded-tl-lg" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-gray-700 rounded-br-lg" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
