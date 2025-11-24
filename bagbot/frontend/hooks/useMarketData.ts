'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';

export interface MarketTick {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

export function useMarketData(symbols: string[] = []) {
  const { subscribe } = useWebSocket();
  const [marketData, setMarketData] = useState<Record<string, MarketTick>>({});

  useEffect(() => {
    const unsubscribe = subscribe('/ws/market', (data: MarketTick) => {
      if (!symbols.length || symbols.includes(data.symbol)) {
        setMarketData(prev => ({
          ...prev,
          [data.symbol]: data
        }));
      }
    });

    return unsubscribe;
  }, [subscribe, symbols]);

  return marketData;
}
