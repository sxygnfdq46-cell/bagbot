/**
 * React Hook for WebSocket subscriptions
 * Provides real-time data streaming with automatic cleanup
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { socketManager, WebSocketChannel, MessageHandler } from '../socket';

export interface UseWebSocketOptions<T> {
  channel: WebSocketChannel;
  filters?: Record<string, any>;
  onMessage?: MessageHandler<T>;
  enabled?: boolean;
  autoConnect?: boolean;
}

export interface UseWebSocketReturn<T> {
  data: T | null;
  isConnected: boolean;
  error: Error | null;
  send: (event: string, data: any) => void;
}

export function useWebSocket<T = any>(
  options: UseWebSocketOptions<T>
): UseWebSocketReturn<T> {
  const {
    channel,
    filters,
    onMessage,
    enabled = true,
    autoConnect = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Handle incoming messages
  const handleMessage = useCallback(
    (messageData: T) => {
      setData(messageData);
      onMessage?.(messageData);
    },
    [onMessage]
  );

  // Connect and subscribe
  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    const setup = async () => {
      try {
        // Connect if needed
        if (autoConnect && !socketManager.isConnected()) {
          await socketManager.connect();
        }

        if (!mounted) return;

        // Subscribe to channel
        unsubscribeRef.current = socketManager.subscribe<T>(
          channel,
          handleMessage,
          filters
        );

        setError(null);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('WebSocket connection failed'));
        }
      }
    };

    setup();

    // Listen to connection status
    const removeConnectionListener = socketManager.onConnectionChange((connected) => {
      if (mounted) {
        setIsConnected(connected);
      }
    });

    return () => {
      mounted = false;
      removeConnectionListener();
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [channel, filters, enabled, autoConnect, handleMessage]);

  // Send message function
  const send = useCallback(
    (event: string, sendData: any) => {
      if (isConnected) {
        socketManager.send(channel, event, sendData);
      } else {
        console.warn('[useWebSocket] Cannot send: Not connected');
      }
    },
    [channel, isConnected]
  );

  return {
    data,
    isConnected,
    error,
    send,
  };
}

export default useWebSocket;
