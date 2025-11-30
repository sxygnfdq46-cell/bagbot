'use client';

import { useEffect, useRef, useState } from 'react';

interface TradeSignalSparkProps {
  type: 'buy' | 'sell' | 'neutral';
  amount?: number;
  className?: string;
}

export default function TradeSignalSpark({ 
  type,
  amount,
  className = ''
}: TradeSignalSparkProps) {
  const [show, setShow] = useState(true);
  const sparkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  const colors = {
    buy: 'bg-neon-green text-neon-green',
    sell: 'bg-neon-magenta text-neon-magenta',
    neutral: 'bg-neon-cyan text-neon-cyan'
  };

  const symbols = {
    buy: '↑',
    sell: '↓',
    neutral: '→'
  };

  return (
    <div 
      ref={sparkRef}
      className={`
        absolute
        spark-trail
        gpu-accelerated
        pointer-events-none
        ${className}
      `}
    >
      <div 
        className={`
          ${colors[type]}
          px-3 py-1.5
          rounded-full
          border-2
          font-bold
          text-sm
          backdrop-blur-sm
          bg-opacity-20
        `}
        style={{
          boxShadow: type === 'buy' 
            ? '0 0 20px rgba(0, 255, 170, 0.6)' 
            : type === 'sell'
            ? '0 0 20px rgba(255, 0, 255, 0.6)'
            : '0 0 20px rgba(0, 246, 255, 0.6)'
        }}
      >
        {symbols[type]} {amount ? `$${amount.toFixed(2)}` : ''}
      </div>
    </div>
  );
}
