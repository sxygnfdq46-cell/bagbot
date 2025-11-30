/**
 * System Service - System Health & Monitoring
 * SAFE: Read-only system metrics and health checks
 */

import { api } from '@/lib/api';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  timestamp: number;
  services: {
    api: boolean;
    database: boolean;
    redis: boolean;
    worker: boolean;
  };
  metrics: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
  };
}

export interface SystemSummary {
  active_strategies: number;
  total_positions: number;
  daily_pnl: number;
  win_rate: number;
  uptime_seconds: number;
  last_trade_time?: string;
}

export interface WorkerHealth {
  worker_id: string;
  status: 'active' | 'idle' | 'offline';
  queue_length: number;
  processed_jobs: number;
  failed_jobs: number;
  last_heartbeat: string;
}

/**
 * Get system health status
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  return api.get('/api/system/health');
}

/**
 * Get system summary for dashboard
 */
export async function getSystemSummary(): Promise<SystemSummary> {
  return api.get('/api/system/summary');
}

/**
 * Get worker health status
 */
export async function getWorkerHealth(): Promise<WorkerHealth[]> {
  return api.get('/api/system/workers');
}

/**
 * Get system metrics history
 */
export async function getSystemMetrics(
  timeRange: '1h' | '6h' | '24h' | '7d' = '1h'
): Promise<Array<{
  timestamp: number;
  cpu: number;
  memory: number;
  disk: number;
}>> {
  return api.get(`/api/system/metrics?range=${timeRange}`);
}

/**
 * Get service uptime
 */
export async function getServiceUptime(): Promise<{
  api: number;
  worker: number;
  total: number;
}> {
  return api.get('/api/system/uptime');
}

export const systemService = {
  getHealth: getSystemHealth,
  getSummary: getSystemSummary,
  getWorkerHealth,
  getMetrics: getSystemMetrics,
  getUptime: getServiceUptime,
};

export default systemService;
