'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';

export interface RiskEvent {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'limit_breach' | 'drawdown_alert' | 'position_size' | 'correlation' | 'volatility';
  message: string;
  symbol?: string;
  value?: number;
  threshold?: number;
}

export function useRiskEvents(limit: number = 20) {
  const { subscribe } = useWebSocket();
  const [events, setEvents] = useState<RiskEvent[]>([]);

  useEffect(() => {
    const unsubscribe = subscribe('/ws/risk', (data: RiskEvent) => {
      setEvents(prev => [data, ...prev].slice(0, limit));
    });

    return unsubscribe;
  }, [subscribe, limit]);

  return events;
}
