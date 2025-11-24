'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';

export interface NewsItem {
  id: string;
  timestamp: string;
  title: string;
  summary: string;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  symbols: string[];
  url?: string;
  impact: 'low' | 'medium' | 'high';
}

export function useNewsStream(limit: number = 30) {
  const { subscribe } = useWebSocket();
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribe('/ws/news', (data: NewsItem) => {
      setNews(prev => [data, ...prev].slice(0, limit));
    });

    return unsubscribe;
  }, [subscribe, limit]);

  return news;
}
