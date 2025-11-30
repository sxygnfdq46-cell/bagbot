/**
 * WebSocket Client for Backend Connection
 * Connects to wss://bagbot2-backend.onrender.com/ws/bot
 */

const WS_URL = process.env.NEXT_PUBLIC_WS_URL 
  ? `${process.env.NEXT_PUBLIC_WS_URL}/bot`
  : 'ws://localhost:8000/ws/bot';

const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;
const HEARTBEAT_INTERVAL = 30000;

export type BotEventType = 
  | 'status_update'
  | 'trade_executed'
  | 'position_opened'
  | 'position_closed'
  | 'signal_generated'
  | 'metrics_update'
  | 'error'
  | 'log';

export interface BotWebSocketMessage<T = any> {
  event: BotEventType;
  data: T;
  timestamp: number;
}

export type BotMessageHandler<T = any> = (data: T, event: BotEventType) => void;

class BotWebSocketClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<BotEventType, Set<BotMessageHandler>>();
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private connectionListeners = new Set<(connected: boolean) => void>();

  /**
   * Connect to WebSocket
   */
  connect(token?: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    this.isIntentionallyClosed = false;

    return new Promise((resolve, reject) => {
      try {
        // Add token to URL if provided
        const url = token ? `${WS_URL}?token=${token}` : WS_URL;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('[BotWebSocket] Connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.notifyConnectionListeners(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: BotWebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[BotWebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[BotWebSocket] Error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[BotWebSocket] Disconnected');
          this.stopHeartbeat();
          this.notifyConnectionListeners(false);

          if (!this.isIntentionallyClosed) {
            this.scheduleReconnect(token);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect
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
   * Subscribe to bot events
   */
  on<T = any>(event: BotEventType, handler: BotMessageHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Unsubscribe from bot events
   */
  off(event: BotEventType, handler: BotMessageHandler): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.delete(handler);
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
  send(event: BotEventType, data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: BotWebSocketMessage = {
        event,
        data,
        timestamp: Date.now(),
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[BotWebSocket] Cannot send message: Not connected');
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: BotWebSocketMessage): void {
    const eventHandlers = this.handlers.get(message.event);
    
    if (eventHandlers) {
      eventHandlers.forEach((handler) => {
        try {
          handler(message.data, message.event);
        } catch (error) {
          console.error('[BotWebSocket] Handler error:', error);
        }
      });
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(token?: string): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[BotWebSocket] Max reconnection attempts reached');
      return;
    }

    const delay = RECONNECT_DELAY * Math.pow(1.5, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`[BotWebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(token).catch((error) => {
        console.error('[BotWebSocket] Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('status_update', { type: 'ping', timestamp: Date.now() });
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
}

// Singleton instance
export const botWebSocket = new BotWebSocketClient();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    botWebSocket.disconnect();
  });
}

export default botWebSocket;
