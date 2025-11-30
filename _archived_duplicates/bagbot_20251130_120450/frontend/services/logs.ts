/**
 * Logs Service - System & Worker Logs
 * SAFE: Read-only log streaming and filtering
 */

import { api } from '@/lib/api';

export interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface LogFilter {
  level?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  source?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
}

export interface LogStats {
  total_logs: number;
  error_count: number;
  warning_count: number;
  info_count: number;
  debug_count: number;
  sources: string[];
}

/**
 * Get recent logs
 */
export async function getRecentLogs(limit: number = 100): Promise<LogEntry[]> {
  return api.get(`/api/logs/recent?limit=${limit}`);
}

/**
 * Get logs with filters
 */
export async function getLogs(
  filter: LogFilter = {},
  page: number = 1,
  limit: number = 100
): Promise<{
  logs: LogEntry[];
  total: number;
  page: number;
  pages: number;
}> {
  const params = new URLSearchParams();
  
  if (filter.level) params.append('level', filter.level);
  if (filter.source) params.append('source', filter.source);
  if (filter.search) params.append('search', filter.search);
  if (filter.from_date) params.append('from_date', filter.from_date);
  if (filter.to_date) params.append('to_date', filter.to_date);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  return api.get(`/api/logs?${params.toString()}`);
}

/**
 * Get logs for specific source
 */
export async function getLogsBySource(
  source: string,
  limit: number = 100
): Promise<LogEntry[]> {
  return api.get(`/api/logs/source/${source}?limit=${limit}`);
}

/**
 * Get error logs only
 */
export async function getErrorLogs(limit: number = 100): Promise<LogEntry[]> {
  return api.get(`/api/logs/errors?limit=${limit}`);
}

/**
 * Get log statistics
 */
export async function getLogStats(
  period: '1h' | '24h' | '7d' = '24h'
): Promise<LogStats> {
  return api.get(`/api/logs/stats?period=${period}`);
}

/**
 * Get available log sources
 */
export async function getLogSources(): Promise<string[]> {
  return api.get('/api/logs/sources');
}

/**
 * Search logs by query
 */
export async function searchLogs(
  query: string,
  limit: number = 100
): Promise<LogEntry[]> {
  return api.get(`/api/logs/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

/**
 * Tail logs (streaming)
 */
export async function* tailLogs(
  source?: string,
  level?: string
): AsyncGenerator<LogEntry, void, unknown> {
  const params = new URLSearchParams();
  if (source) params.append('source', source);
  if (level) params.append('level', level);
  
  const endpoint = `/api/logs/tail?${params.toString()}`;
  
  for await (const data of api.stream(endpoint)) {
    yield data as LogEntry;
  }
}

export const logsService = {
  getRecent: getRecentLogs,
  getAll: getLogs,
  getBySource: getLogsBySource,
  getErrors: getErrorLogs,
  getStats: getLogStats,
  getSources: getLogSources,
  search: searchLogs,
  tail: tailLogs,
};

export default logsService;
