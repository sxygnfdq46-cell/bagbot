'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  service: string;
  message: string;
  metadata?: Record<string, any>;
}

export function useSystemLogs(limit: number = 100) {
  const { subscribe } = useWebSocket();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const unsubscribe = subscribe('/ws/logs', (data: LogEntry) => {
      setLogs(prev => [data, ...prev].slice(0, limit));
    });

    return unsubscribe;
  }, [subscribe, limit]);

  return logs;
}
