'use client';

import { useEffect, useRef } from 'react';

interface DataSparkProps {
  value: number | string;
  previousValue?: number | string;
  className?: string;
  sparkColor?: 'cyan' | 'magenta' | 'green';
}

export default function DataSpark({ 
  value, 
  previousValue,
  className = '',
  sparkColor = 'cyan'
}: DataSparkProps) {
  const sparkRef = useRef<HTMLDivElement>(null);
  const prevValueRef = useRef(previousValue);

  useEffect(() => {
    if (prevValueRef.current !== undefined && prevValueRef.current !== value) {
      // Trigger spark animation
      if (sparkRef.current) {
        sparkRef.current.classList.add('spark-flash');
        setTimeout(() => {
          sparkRef.current?.classList.remove('spark-flash');
        }, 600);
      }
    }
    prevValueRef.current = value;
  }, [value]);

  const colorClasses = {
    cyan: 'text-neon-cyan',
    magenta: 'text-neon-magenta',
    green: 'text-neon-green'
  };

  return (
    <div 
      ref={sparkRef}
      className={`
        gpu-accelerated 
        data-update
        ${colorClasses[sparkColor]}
        ${className}
      `}
    >
      {value}
    </div>
  );
}
