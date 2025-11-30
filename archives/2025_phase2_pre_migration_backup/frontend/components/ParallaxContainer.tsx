'use client';

import { useEffect, useRef } from 'react';

interface ParallaxContainerProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export default function ParallaxContainer({ 
  children, 
  className = '',
  intensity = 0.5 
}: ParallaxContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const elements = container.querySelectorAll('[data-parallax]');

      elements.forEach((el) => {
        const element = el as HTMLElement;
        const speed = parseFloat(element.dataset.parallax || '0.5');
        const offset = scrollY * speed * intensity;
        
        element.style.transform = `translateY(${offset}px) translateZ(0)`;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [intensity]);

  return (
    <div ref={containerRef} className={`parallax-container ${className}`}>
      {children}
    </div>
  );
}
