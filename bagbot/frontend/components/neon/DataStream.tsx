/**
 * Data Stream Component - Scrolling real-time data feed
 * Shows live trading signals, logs, or market data
 */
'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

interface DataStreamItem {
  id: string;
  timestamp: string;
  type: 'buy' | 'sell' | 'info' | 'warning' | 'error';
  message: string;
  value?: string;
}

interface DataStreamProps {
  items: DataStreamItem[];
  maxItems?: number;
  autoScroll?: boolean;
  className?: string;
}

const typeStyles = {
  buy: 'text-green-400 border-green-400/30',
  sell: 'text-red-400 border-red-400/30',
  info: 'text-cyan-400 border-cyan-400/30',
  warning: 'text-yellow-400 border-yellow-400/30',
  error: 'text-red-400 border-red-400/50'
};

export default function DataStream({
  items,
  maxItems = 50,
  autoScroll = true,
  className
}: DataStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayItems = items.slice(0, maxItems);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [items, autoScroll]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative h-full overflow-y-auto',
        'bg-neutral-950/50 rounded-lg',
        'border border-neutral-700/50',
        'scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent',
        className
      )}
    >
      {/* Grid lines background */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(0deg, rgba(0,240,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.2) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      {/* Stream items */}
      <div className="relative z-10 p-4 space-y-2">
        {displayItems.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              'flex items-start gap-3 p-2 rounded border-l-2',
              'bg-neutral-900/30 backdrop-blur-sm',
              'animate-slide-in',
              typeStyles[item.type]
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Timestamp */}
            <span className="text-xs text-neutral-500 font-mono whitespace-nowrap">
              {new Date(item.timestamp).toLocaleTimeString()}
            </span>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono truncate">{item.message}</p>
            </div>

            {/* Value (if present) */}
            {item.value && (
              <span className="text-sm font-bold whitespace-nowrap">
                {item.value}
              </span>
            )}
          </div>
        ))}

        {displayItems.length === 0 && (
          <div className="text-center text-neutral-500 py-8">
            <p className="text-sm">No data available</p>
            <p className="text-xs mt-2">Waiting for updates...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Named export for compatibility
export { DataStream };
