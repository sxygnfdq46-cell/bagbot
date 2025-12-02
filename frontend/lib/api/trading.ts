import { api } from '../api-client';

export type Position = {
  id: string;
  symbol: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  status?: string;
};

export type Trade = {
  id: string;
  symbol: string;
  size: number;
  pnl: number;
  timestamp: string;
};

export type SystemStatus = {
  uptime?: string;
  latencyMs?: number;
  mode?: string;
};

export const trading = {
  getPositions: () => api.get<Position[]>('/api/trading/positions'),
  getRecentTrades: () => api.get<Trade[]>('/api/trading/recent'),
  getSystemStatus: () => api.get<SystemStatus>('/api/system/status')
};
