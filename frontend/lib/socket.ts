/**
 * WebSocket Manager - Unified Real-Time Communication Layer
 * Handles price streams, logs, signals, and terminal output
 * SAFE MODE: Read-only connections, no trading execution
 */

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;
const HEARTBEAT_INTERVAL = 30000;

export type WebSocketChannel = 
  | 'prices'
  | 'signals'
  | 'logs'
  | 'terminal'
  | 'system'
  | 'trades';

export interface WebSocketMessage<T = any> {
  channel: WebSocketChannel;
  event: string;
  data: T;
  timestamp: number;
}

export type MessageHandler<T = any> = (data: T) => void;

interface Subscription {
  channel: WebSocketChannel;
  handler: MessageHandler;
  filters?: Record<string, any>;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, Subscription>();
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isIntentionallyClosed = false;
  private connectionListeners = new Set<(connected: boolean) => void>();

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return new Promise((resolve, reject) => {
        const checkConnection = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection);
            resolve();
          } else if (!this.isConnecting) {
            clearInterval(checkConnection);
            reject(new Error('Connection failed'));
          }
        }, 100);
      });
    }

    this.isConnecting = true;
    this.isIntentionallyClosed = false;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(WS_BASE_URL);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.resubscribeAll();
          this.notifyConnectionListeners(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          this.isConnecting = false;
          this.stopHeartbeat();
          this.notifyConnectionListeners(false);

          if (!this.isIntentionallyClosed) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.notifyConnectionListeners(false);
  }

  /**
   * Subscribe to a channel
   */
  subscribe<T = any>(
    channel: WebSocketChannel,
    handler: MessageHandler<T>,
    filters?: Record<string, any>
  ): () => void {
    const id = this.generateSubscriptionId(channel, filters);
    
    this.subscriptions.set(id, { channel, handler, filters });

    // Send subscription message if connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscription(channel, filters, 'subscribe');
    }

    // Return unsubscribe function
    return () => this.unsubscribe(id);
  }

  /**
   * Unsubscribe from a channel
   */
  private unsubscribe(id: string): void {
    const subscription = this.subscriptions.get(id);
    
    if (subscription) {
      this.subscriptions.delete(id);
      
      // Send unsubscribe message if connected
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendSubscription(subscription.channel, subscription.filters, 'unsubscribe');
      }
    }
  }

  /**
   * Listen to connection status changes
   */
  onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.connectionListeners.add(listener);
    
    // Immediately notify of current status
    listener(this.ws?.readyState === WebSocket.OPEN);

    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Send a message to the server
   */
  send(channel: WebSocketChannel, event: string, data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        channel,
        event,
        data,
        timestamp: Date.now(),
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message: Not connected');
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    // Route message to all matching subscriptions
    this.subscriptions.forEach((subscription) => {
      if (subscription.channel === message.channel) {
        // Apply filters if specified
        if (subscription.filters) {
          const matchesFilters = Object.entries(subscription.filters).every(
            ([key, value]) => message.data[key] === value
          );
          if (!matchesFilters) return;
        }

        subscription.handler(message.data);
      }
    });
  }

  /**
   * Send subscription message to server
   */
  private sendSubscription(
    channel: WebSocketChannel,
    filters: Record<string, any> | undefined,
    action: 'subscribe' | 'unsubscribe'
  ): void {
    this.send('system', action, { channel, filters });
  }

  /**
   * Resubscribe to all channels after reconnection
   */
  private resubscribeAll(): void {
    const channels = new Map<string, { channel: WebSocketChannel; filters?: Record<string, any> }>();
    
    // Collect unique subscriptions
    this.subscriptions.forEach((subscription) => {
      const key = this.generateSubscriptionId(subscription.channel, subscription.filters);
      if (!channels.has(key)) {
        channels.set(key, {
          channel: subscription.channel,
          filters: subscription.filters,
        });
      }
    });

    // Resubscribe to all channels
    channels.forEach(({ channel, filters }) => {
      this.sendSubscription(channel, filters, 'subscribe');
    });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    const delay = RECONNECT_DELAY * Math.pow(1.5, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[WebSocket] Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('system', 'ping', { timestamp: Date.now() });
      }
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Notify connection listeners
   */
  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach((listener) => listener(connected));
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(channel: WebSocketChannel, filters?: Record<string, any>): string {
    const filterString = filters ? JSON.stringify(filters) : '';
    return `${channel}:${filterString}`;
  }
}

// Singleton instance
export const socketManager = new WebSocketManager();

// Auto-connect on import
if (typeof window !== 'undefined') {
  socketManager.connect().catch((error) => {
    console.error('[WebSocket] Initial connection failed:', error);
  });
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    socketManager.disconnect();
  });
}

export default socketManager;
