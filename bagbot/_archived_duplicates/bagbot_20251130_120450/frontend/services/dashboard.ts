/**
 * Dashboard Service - Overview & Recent Activity
 * SAFE: Read-only dashboard metrics
 */

import { api } from '@/lib/api';

export interface RecentTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  value: number;
  pnl?: number;
  timestamp: string;
  strategy: string;
}

export interface StrategyStatus {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'stopped';
  pnl_today: number;
  win_rate: number;
  total_trades: number;
  last_trade?: string;
}

export interface DashboardMetrics {
  total_balance: number;
  available_balance: number;
  total_pnl: number;
  pnl_percent: number;
  daily_pnl: number;
  open_positions: number;
  active_strategies: number;
  win_rate: number;
}

export interface PositionSummary {
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entry_price: number;
  current_price: number;
  pnl: number;
  pnl_percent: number;
  strategy: string;
}

/**
 * Get dashboard overview metrics
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return api.get('/api/dashboard/metrics');
}

/**
 * Get recent trades (last 50)
 */
export async function getRecentTrades(limit: number = 50): Promise<RecentTrade[]> {
  return api.get(`/api/trading/recent?limit=${limit}`);
}

/**
 * Get all strategy statuses
 */
export async function getStrategyStatuses(): Promise<StrategyStatus[]> {
  return api.get('/api/strategies/status');
}

/**
 * Get open positions summary
 */
export async function getOpenPositions(): Promise<PositionSummary[]> {
  return api.get('/api/trading/positions');
}

/**
 * Get PnL history for chart
 */
export async function getPnLHistory(
  period: '24h' | '7d' | '30d' = '24h'
): Promise<Array<{ timestamp: number; pnl: number }>> {
  return api.get(`/api/dashboard/pnl-history?period=${period}`);
}

export const dashboardService = {
  getMetrics: getDashboardMetrics,
  getRecentTrades,
  getStrategyStatuses,
  getOpenPositions,
  getPnLHistory,
};

export default dashboardService;
