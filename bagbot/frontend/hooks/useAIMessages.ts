'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';

export interface AIMessage {
  id: string;
  timestamp: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'analysis' | 'suggestion' | 'warning' | 'info';
}

export function useAIMessages() {
  const { subscribe, send } = useWebSocket();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribe('/ws/ai', (data: AIMessage) => {
      setMessages(prev => [...prev, data]);
      setLoading(false);
    });

    return unsubscribe;
  }, [subscribe]);

  const sendMessage = (content: string) => {
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      role: 'user',
      content
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    send('/ws/ai', { content });
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return { messages, sendMessage, clearMessages, loading };
}
