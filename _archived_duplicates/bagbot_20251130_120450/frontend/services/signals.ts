/**
 * Signals Service - Real-time Trading Signals
 * SAFE: Read-only signal monitoring
 */

import { api } from '@/lib/api';

export interface Signal {
  id: string;
  type: 'buy' | 'sell' | 'hold';
  symbol: string;
  price: number;
  confidence: number;
  strategy: string;
  indicators: Record<string, number>;
  timestamp: string;
  executed: boolean;
}

export interface SignalHistory {
  id: string;
  signal_id: string;
  type: 'buy' | 'sell';
  symbol: string;
  signal_price: number;
  execution_price?: number;
  confidence: number;
  strategy: string;
  executed: boolean;
  pnl?: number;
  timestamp: string;
}

export interface SignalStats {
  total_signals: number;
  buy_signals: number;
  sell_signals: number;
  executed_signals: number;
  execution_rate: number;
  avg_confidence: number;
  profitable_signals: number;
  signal_win_rate: number;
}

export interface SignalFilter {
  symbol?: string;
  type?: 'buy' | 'sell' | 'hold';
  strategy?: string;
  min_confidence?: number;
  from_date?: string;
  to_date?: string;
}

/**
 * Get recent signals
 */
export async function getRecentSignals(limit: number = 50): Promise<Signal[]> {
  return api.get(`/api/signals/recent?limit=${limit}`);
}

/**
 * Get signal history with filters
 */
export async function getSignalHistory(
  filter: SignalFilter = {},
  limit: number = 100
): Promise<SignalHistory[]> {
  const params = new URLSearchParams();
  
  if (filter.symbol) params.append('symbol', filter.symbol);
  if (filter.type) params.append('type', filter.type);
  if (filter.strategy) params.append('strategy', filter.strategy);
  if (filter.min_confidence) params.append('min_confidence', filter.min_confidence.toString());
  if (filter.from_date) params.append('from_date', filter.from_date);
  if (filter.to_date) params.append('to_date', filter.to_date);
  params.append('limit', limit.toString());
  
  return api.get(`/api/signals/history?${params.toString()}`);
}

/**
 * Get signal statistics
 */
export async function getSignalStats(
  period: '24h' | '7d' | '30d' = '24h'
): Promise<SignalStats> {
  return api.get(`/api/signals/stats?period=${period}`);
}

/**
 * Get signal by ID
 */
export async function getSignal(id: string): Promise<Signal> {
  return api.get(`/api/signals/${id}`);
}

/**
 * Get signals for specific symbol
 */
export async function getSignalsBySymbol(
  symbol: string,
  limit: number = 50
): Promise<Signal[]> {
  return api.get(`/api/signals/symbol/${symbol}?limit=${limit}`);
}

/**
 * Get signals for specific strategy
 */
export async function getSignalsByStrategy(
  strategy: string,
  limit: number = 50
): Promise<Signal[]> {
  return api.get(`/api/signals/strategy/${strategy}?limit=${limit}`);
}

export const signalsService = {
  getRecent: getRecentSignals,
  getHistory: getSignalHistory,
  getStats: getSignalStats,
  getOne: getSignal,
  getBySymbol: getSignalsBySymbol,
  getByStrategy: getSignalsByStrategy,
};

export default signalsService;
