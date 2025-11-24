'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';

export interface TradingSignal {
  id: string;
  timestamp: string;
  symbol: string;
  strategy: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  reason: string;
}

export function useRealTimeSignals(limit: number = 50) {
  const { subscribe } = useWebSocket();
  const [signals, setSignals] = useState<TradingSignal[]>([]);

  useEffect(() => {
    const unsubscribe = subscribe('/ws/signals', (data: TradingSignal) => {
      setSignals(prev => [data, ...prev].slice(0, limit));
    });

    return unsubscribe;
  }, [subscribe, limit]);

  return signals;
}
