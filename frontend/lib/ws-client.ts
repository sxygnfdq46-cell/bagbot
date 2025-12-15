import { resolveWsUrl } from './api-client';

export type WsStatus = 'connecting' | 'connected' | 'disconnected';
type MessageHandler = (data: unknown) => void;

const isBrowser = typeof window !== 'undefined';
const DEFAULT_PATH = '/ws/brain';
const RECONNECT_DELAY_MS = 5000;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private listeners = new Map<string, Set<MessageHandler>>();
  private status: WsStatus = 'disconnected';
  private statusListeners = new Set<(status: WsStatus) => void>();

  subscribe(channel: string, handler: MessageHandler) {
    if (!isBrowser) {
      return () => undefined;
    }

    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)?.add(handler);

    this.ensureConnection();

    return () => {
      const channelListeners = this.listeners.get(channel);
      if (!channelListeners) return;
      channelListeners.delete(handler);
      if (channelListeners.size === 0) {
        this.listeners.delete(channel);
      }
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  onStatusChange(listener: (status: WsStatus) => void) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  disconnect() {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.setStatus('disconnected');
  }

  private ensureConnection() {
    if (!isBrowser) return;
    if (this.listeners.size === 0) return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.connect();
  }

  private connect() {
    if (this.listeners.size === 0) {
      return;
    }
    const url = resolveWsUrl(DEFAULT_PATH);
    if (!url) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[ws-client] Missing WebSocket URL');
      }
      return;
    }

    this.intentionalClose = false;
    this.setStatus('connecting');

    try {
      if (process.env.NODE_ENV !== 'production') {
        console.info('[ws-client] connecting', url);
      }
      this.socket = new WebSocket(url);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[ws-client] Failed to construct WebSocket', error);
      }
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.setStatus('connected');
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(event);
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };

    this.socket.onclose = () => {
      this.socket = null;
      this.setStatus('disconnected');
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };
  }

  private handleMessage(event: MessageEvent) {
    try {
      const parsed = JSON.parse(event.data ?? '{}');
      if (parsed === null || (typeof parsed !== 'object' && !Array.isArray(parsed))) return;

      const hasData = typeof parsed === 'object' && parsed !== null && Object.prototype.hasOwnProperty.call(parsed, 'data');
      let channel = typeof (parsed as any)?.channel === 'string' ? (parsed as any).channel : undefined;
      let data = hasData ? (parsed as any).data : parsed;

      // Map typed backend messages (e.g., brain-decision) into virtual channels
      if (!channel && typeof parsed?.type === 'string') {
        const kind = parsed.type.toLowerCase();
        if (kind === 'brain-decision') channel = 'brain_decision';
        else if (kind === 'brain-online' || kind === 'brain-error') channel = 'brain_status';
        else if (kind === 'heartbeat') channel = 'heartbeat';
      }

      if (!channel) return;
      const channelListeners = this.listeners.get(channel);
      if (!channelListeners || channelListeners.size === 0) return;
      channelListeners.forEach((listener) => listener(data));
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[ws-client] Failed to parse message', error);
      }
    }
  }

  private scheduleReconnect() {
    if (!isBrowser || this.reconnectTimer) return;
    if (this.listeners.size === 0) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.intentionalClose) {
        this.connect();
      }
    }, RECONNECT_DELAY_MS);
  }

  private setStatus(status: WsStatus) {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }
}

export const wsClient = new WebSocketClient();