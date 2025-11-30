'use client';

import { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export default function PageTransition({ 
  children,
  direction = 'up'
}: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const directionClasses = {
    up: 'fade-in-up',
    down: 'fade-in-down',
    left: 'slide-in-left',
    right: 'slide-in-right'
  };

  return (
    <div className={`${isVisible ? directionClasses[direction] : 'opacity-0'}`}>
      {children}
    </div>
  );
}
