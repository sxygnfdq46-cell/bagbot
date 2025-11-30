/**
 * Strategies Service - Strategy Management & Performance
 * SAFE: Read-only strategy data + safe start/stop endpoints
 */

import { api } from '@/lib/api';

export interface Strategy {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'paused' | 'stopped';
  symbol: string;
  timeframe: string;
  created_at: string;
  updated_at: string;
}

export interface StrategyConfig {
  id: string;
  name: string;
  parameters: Record<string, any>;
  risk_parameters: {
    max_position_size: number;
    stop_loss_percent: number;
    take_profit_percent: number;
    max_daily_loss: number;
  };
  enabled: boolean;
}

export interface StrategyPerformance {
  strategy_id: string;
  name: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_pnl: number;
  avg_win: number;
  avg_loss: number;
  max_drawdown: number;
  sharpe_ratio: number;
  profit_factor: number;
  best_trade: number;
  worst_trade: number;
  avg_trade_duration: number;
}

export interface StrategyTrade {
  id: string;
  strategy_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entry_price: number;
  exit_price?: number;
  quantity: number;
  pnl?: number;
  status: 'open' | 'closed';
  entry_time: string;
  exit_time?: string;
}

/**
 * Get all strategy configurations
 */
export async function getStrategies(): Promise<Strategy[]> {
  return api.get('/api/strategies/list');
}

/**
 * Get specific strategy details
 */
export async function getStrategy(id: string): Promise<Strategy> {
  return api.get(`/api/strategies/${id}`);
}

/**
 * Get strategy configuration
 */
export async function getStrategyConfig(id: string): Promise<StrategyConfig> {
  return api.get(`/api/strategies/${id}/config`);
}

/**
 * Get strategy performance metrics
 */
export async function getStrategyPerformance(id: string): Promise<StrategyPerformance> {
  return api.get(`/api/strategies/${id}/performance`);
}

/**
 * Get all strategies performance summary
 */
export async function getAllPerformance(): Promise<StrategyPerformance[]> {
  return api.get('/api/strategies/performance');
}

/**
 * Get strategy trade history
 */
export async function getStrategyTrades(
  id: string,
  limit: number = 100
): Promise<StrategyTrade[]> {
  return api.get(`/api/strategies/${id}/trades?limit=${limit}`);
}

/**
 * Start strategy (SAFE endpoint)
 */
export async function startStrategy(id: string): Promise<{ success: boolean; message: string }> {
  return api.post(`/api/strategies/${id}/start`);
}

/**
 * Stop strategy (SAFE endpoint)
 */
export async function stopStrategy(id: string): Promise<{ success: boolean; message: string }> {
  return api.post(`/api/strategies/${id}/stop`);
}

/**
 * Pause strategy (SAFE endpoint)
 */
export async function pauseStrategy(id: string): Promise<{ success: boolean; message: string }> {
  return api.post(`/api/strategies/${id}/pause`);
}

/**
 * Update strategy configuration (SAFE parameters only)
 */
export async function updateStrategyConfig(
  id: string,
  config: Partial<StrategyConfig>
): Promise<StrategyConfig> {
  return api.patch(`/api/strategies/${id}/config`, config);
}

export const strategiesService = {
  getAll: getStrategies,
  getOne: getStrategy,
  getConfig: getStrategyConfig,
  getPerformance: getStrategyPerformance,
  getAllPerformance,
  getTrades: getStrategyTrades,
  start: startStrategy,
  stop: stopStrategy,
  pause: pauseStrategy,
  updateConfig: updateStrategyConfig,
};

export default strategiesService;
