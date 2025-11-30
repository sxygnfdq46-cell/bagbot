/**
 * Backtest Service - Backtest Configuration & Results
 * SAFE: Read/write backtest configs, run backtest via safe endpoint
 */

import { api } from '@/lib/api';

export interface BacktestConfig {
  id?: string;
  name: string;
  strategy: string;
  symbol: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  parameters: Record<string, any>;
  commission: number;
  slippage: number;
  created_at?: string;
}

export interface BacktestResult {
  id: string;
  config_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  metrics?: BacktestMetrics;
  trades?: BacktestTrade[];
  equity_curve?: Array<{ timestamp: string; equity: number }>;
  error?: string;
}

export interface BacktestMetrics {
  total_return: number;
  total_return_percent: number;
  annual_return: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  max_drawdown_percent: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  profit_factor: number;
  avg_win: number;
  avg_loss: number;
  largest_win: number;
  largest_loss: number;
  avg_trade_duration: number;
  avg_bars_in_trade: number;
}

export interface BacktestTrade {
  entry_date: string;
  exit_date: string;
  symbol: string;
  side: 'long' | 'short';
  entry_price: number;
  exit_price: number;
  quantity: number;
  pnl: number;
  pnl_percent: number;
  duration_hours: number;
}

/**
 * Get all backtest configurations
 */
export async function getBacktestConfigs(): Promise<BacktestConfig[]> {
  return api.get('/api/backtest/configs');
}

/**
 * Get specific backtest configuration
 */
export async function getBacktestConfig(id: string): Promise<BacktestConfig> {
  return api.get(`/api/backtest/config/${id}`);
}

/**
 * Create new backtest configuration
 */
export async function createBacktestConfig(config: BacktestConfig): Promise<BacktestConfig> {
  return api.post('/api/backtest/config', config);
}

/**
 * Update backtest configuration
 */
export async function updateBacktestConfig(
  id: string,
  config: Partial<BacktestConfig>
): Promise<BacktestConfig> {
  return api.patch(`/api/backtest/config/${id}`, config);
}

/**
 * Delete backtest configuration
 */
export async function deleteBacktestConfig(id: string): Promise<{ success: boolean }> {
  return api.delete(`/api/backtest/config/${id}`);
}

/**
 * Run backtest (SAFE endpoint)
 */
export async function runBacktest(configId: string): Promise<BacktestResult> {
  return api.post(`/api/backtest/run/${configId}`);
}

/**
 * Get backtest result
 */
export async function getBacktestResult(id: string): Promise<BacktestResult> {
  return api.get(`/api/backtest/result/${id}`);
}

/**
 * Get all backtest results for a config
 */
export async function getBacktestResults(configId: string): Promise<BacktestResult[]> {
  return api.get(`/api/backtest/results/${configId}`);
}

/**
 * Get recent backtest results
 */
export async function getRecentResults(limit: number = 20): Promise<BacktestResult[]> {
  return api.get(`/api/backtest/recent?limit=${limit}`);
}

/**
 * Cancel running backtest
 */
export async function cancelBacktest(id: string): Promise<{ success: boolean }> {
  return api.post(`/api/backtest/cancel/${id}`);
}

/**
 * Compare multiple backtest results
 */
export async function compareBacktests(ids: string[]): Promise<{
  configs: BacktestConfig[];
  results: BacktestResult[];
  comparison: Record<string, any>;
}> {
  return api.post('/api/backtest/compare', { ids });
}

/**
 * Export backtest results
 */
export async function exportBacktest(
  id: string,
  format: 'json' | 'csv' = 'json'
): Promise<Blob> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/backtest/export/${id}?format=${format}`
  );
  return response.blob();
}

export const backtestService = {
  getConfigs: getBacktestConfigs,
  getConfig: getBacktestConfig,
  createConfig: createBacktestConfig,
  updateConfig: updateBacktestConfig,
  deleteConfig: deleteBacktestConfig,
  run: runBacktest,
  getResult: getBacktestResult,
  getResults: getBacktestResults,
  getRecent: getRecentResults,
  cancel: cancelBacktest,
  compare: compareBacktests,
  export: exportBacktest,
};

export default backtestService;
