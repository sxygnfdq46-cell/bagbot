/**
 * Bot Service
 * Controls bot status, operations, and metrics
 */

import { get, post } from '@/lib/api-client';

export interface BotStatus {
  running: boolean;
  mode: 'live' | 'paper' | 'backtest';
  uptime: number;
  last_update: string;
  health: 'healthy' | 'warning' | 'error';
  active_strategies: string[];
  total_trades: number;
  open_positions: number;
}

export interface BotMetrics {
  pnl_total: number;
  pnl_today: number;
  pnl_week: number;
  win_rate: number;
  sharpe_ratio: number;
  max_drawdown: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  avg_trade_duration: number;
  timestamp: string;
}

export interface StartBotConfig {
  mode?: 'live' | 'paper';
  strategies?: string[];
  risk_level?: 'low' | 'medium' | 'high';
}

/**
 * Get current bot status
 */
export async function getBotStatus(): Promise<BotStatus> {
  return await get('/bot/status');
}

/**
 * Start the bot
 */
export async function startBot(config?: StartBotConfig): Promise<{ message: string; status: BotStatus }> {
  return await post('/bot/start', config);
}

/**
 * Stop the bot
 */
export async function stopBot(): Promise<{ message: string }> {
  return await post('/bot/stop');
}

/**
 * Get live metrics
 */
export async function getLiveMetrics(): Promise<BotMetrics> {
  return await get('/bot/metrics/live');
}

/**
 * Get historical metrics
 */
export async function getHistoricalMetrics(period: 'day' | 'week' | 'month' | 'year'): Promise<BotMetrics[]> {
  return await get(`/bot/metrics/historical?period=${period}`);
}

/**
 * Pause bot (if endpoint exists)
 */
export async function pauseBot(): Promise<{ message: string }> {
  return await post('/bot/pause');
}

/**
 * Resume bot (if endpoint exists)
 */
export async function resumeBot(): Promise<{ message: string }> {
  return await post('/bot/resume');
}
