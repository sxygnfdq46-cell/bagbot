import apiClient, { apiCall, ApiResponse } from './api';

// Types for API responses
export interface HealthResponse {
  status: string;
  service?: string;
}

export interface WorkerStatusResponse {
  status: 'running' | 'stopped';
  thread_id?: number;
  uptime?: string;
}

export interface WorkerActionResponse {
  status: string;
}

export interface JobSubmission {
  job_type: string;
  payload: Record<string, any>;
}

export interface JobResponse {
  status: string;
  job_id: string;
}

export interface Trade {
  id: string;
  timestamp: string;
  pair: string;
  side: 'BUY' | 'SELL';
  price: number;
  amount: number;
  profit?: number;
  strategy?: string;
}

export interface TradesResponse {
  trades: Trade[];
}

export interface Signal {
  id: string;
  timestamp: string;
  pair: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  indicators?: Record<string, any>;
}

export interface SignalsResponse {
  signals: Signal[];
}

export interface Metrics {
  total_trades: number;
  win_rate: number;
  profit_today: number;
  active_positions: number;
  total_pnl: number;
  sharpe_ratio?: number;
  max_drawdown?: number;
}

export interface OptimizerRequest {
  data_file: string;
  objective: 'sharpe' | 'total_return' | 'dual';
  population: number;
  generations: number;
  seed?: number;
}

export interface OptimizerResponse {
  job_id: string;
  status: string;
}

export interface OptimizerStatus {
  job_id: string;
  status: string;
  progress?: {
    current_generation: number;
    total_generations: number;
    best_fitness?: number;
  };
}

export interface OptimizerResults {
  job_id: string;
  status: string;
  best_genome?: Record<string, any>;
  best_fitness?: number;
  artifact_path?: string;
}

export interface BacktestRequest {
  data_file: string;
  genome_file?: string;
  initial_balance?: number;
  fee_rate?: number;
}

export interface BacktestResponse {
  job_id: string;
  status: string;
}

export interface BacktestResults {
  job_id: string;
  status: string;
  results?: {
    final_balance: number;
    total_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    num_trades: number;
    win_rate: number;
    equity_curve?: Array<{ timestamp: string; equity: number }>;
    trades?: Array<any>;
  };
}

export interface GenomeArtifact {
  filename: string;
  timestamp: string;
  fitness?: number;
  objective?: string;
  size: number;
}

export interface ReportArtifact {
  filename: string;
  timestamp: string;
  metrics?: Record<string, number>;
  size: number;
}

export interface ArtifactsGenomesResponse {
  genomes: GenomeArtifact[];
  total: number;
}

export interface ArtifactsReportsResponse {
  reports: ReportArtifact[];
  total: number;
}

export interface StrategyInfo {
  name: string;
  description?: string;
  available: boolean;
}

export interface StrategiesListResponse {
  strategies: string[];
  details: StrategyInfo[];
  total: number;
}

export interface StrategyConfig {
  active_strategy: string;
  parameters: Record<string, any>;
}

export interface StrategyUpdateRequest {
  strategy: string;
  parameters: Record<string, any>;
}

export interface StrategyParameterSchema {
  strategy: string;
  parameters: Record<string, {
    default: number | string;
    min?: number;
    max?: number;
    type: 'int' | 'float' | 'string';
  }>;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source?: string;
  job_id?: string;
}

export interface LogsResponse {
  logs: LogEntry[];
  total: number;
  has_more?: boolean;
}

export interface ChartDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartDataResponse {
  data: ChartDataPoint[];
}

// API Service Class
class ApiService {
  // Health endpoints
  async rootHealth(): Promise<ApiResponse<HealthResponse>> {
    return apiCall(apiClient.get('/'));
  }

  async apiHealth(): Promise<ApiResponse<HealthResponse>> {
    return apiCall(apiClient.get('/api/health'));
  }

  // Worker endpoints
  async getWorkerStatus(): Promise<ApiResponse<WorkerStatusResponse>> {
    return apiCall(apiClient.get('/api/worker/status'));
  }

  async startWorker(): Promise<ApiResponse<WorkerActionResponse>> {
    return apiCall(apiClient.post('/api/worker/start'));
  }

  async stopWorker(): Promise<ApiResponse<WorkerActionResponse>> {
    return apiCall(apiClient.post('/api/worker/stop'));
  }

  // Jobs endpoint
  async submitJob(job: JobSubmission): Promise<ApiResponse<JobResponse>> {
    return apiCall(apiClient.post('/jobs', job));
  }

  // ========================================
  // BACKTEST ENDPOINTS
  // ========================================
  
  async runBacktest(request: BacktestRequest): Promise<ApiResponse<BacktestResponse>> {
    return apiCall(apiClient.post('/api/backtest/run', request));
  }

  async getBacktestResults(jobId: string): Promise<ApiResponse<BacktestResults>> {
    return apiCall(apiClient.get(`/api/backtest/results/${jobId}`));
  }

  async getBacktestStatus(jobId: string): Promise<ApiResponse<{ job_id: string; status: string }>> {
    return apiCall(apiClient.get(`/api/backtest/status/${jobId}`));
  }

  // ========================================
  // OPTIMIZER ENDPOINTS
  // ========================================
  
  async runOptimizer(request: OptimizerRequest): Promise<ApiResponse<OptimizerResponse>> {
    return apiCall(apiClient.post('/api/optimizer/run', request));
  }

  async getOptimizerStatus(jobId: string): Promise<ApiResponse<OptimizerStatus>> {
    return apiCall(apiClient.get(`/api/optimizer/status/${jobId}`));
  }

  async getOptimizerResults(jobId: string): Promise<ApiResponse<OptimizerResults>> {
    return apiCall(apiClient.get(`/api/optimizer/results/${jobId}`));
  }

  async getOptimizerHistory(): Promise<ApiResponse<{ jobs: any[]; total: number }>> {
    return apiCall(apiClient.get('/api/optimizer/history'));
  }

  // ========================================
  // ARTIFACTS ENDPOINTS
  // ========================================
  
  async listGenomes(): Promise<ApiResponse<ArtifactsGenomesResponse>> {
    return apiCall(apiClient.get('/api/artifacts/genomes'));
  }

  async listReports(): Promise<ApiResponse<ArtifactsReportsResponse>> {
    return apiCall(apiClient.get('/api/artifacts/reports'));
  }

  async getGenome(filename: string): Promise<ApiResponse<Record<string, any>>> {
    return apiCall(apiClient.get(`/api/artifacts/genomes/${filename}`));
  }

  async getReport(filename: string): Promise<ApiResponse<string>> {
    return apiCall(apiClient.get(`/api/artifacts/reports/${filename}`, {
      responseType: 'text'
    }));
  }

  async getLatestGenome(): Promise<ApiResponse<{ filename: string; data: Record<string, any> }>> {
    return apiCall(apiClient.get('/api/artifacts/latest/genome'));
  }

  async getLatestReport(): Promise<ApiResponse<string>> {
    return apiCall(apiClient.get('/api/artifacts/latest/report', {
      responseType: 'text'
    }));
  }

  async downloadGenome(filename: string): Promise<Blob> {
    const response = await apiClient.get(`/api/artifacts/genomes/${filename}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadReport(filename: string): Promise<Blob> {
    const response = await apiClient.get(`/api/artifacts/reports/${filename}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // ========================================
  // STRATEGY ENDPOINTS
  // ========================================
  
  async listStrategies(): Promise<ApiResponse<StrategiesListResponse>> {
    return apiCall(apiClient.get('/api/strategy/list'));
  }

  async getStrategyConfig(): Promise<ApiResponse<StrategyConfig>> {
    return apiCall(apiClient.get('/api/strategy/config'));
  }

  async updateStrategyConfig(config: StrategyUpdateRequest): Promise<ApiResponse<{
    status: string;
    message: string;
    active_strategy: string;
    parameters: Record<string, any>;
  }>> {
    return apiCall(apiClient.put('/api/strategy/config', config));
  }

  async activateStrategy(strategyName: string): Promise<ApiResponse<{
    status: string;
    message: string;
    active_strategy: string;
  }>> {
    return apiCall(apiClient.post('/api/strategy/activate', null, {
      params: { strategy_name: strategyName }
    }));
  }

  async getStrategyParameters(strategyName: string): Promise<ApiResponse<StrategyParameterSchema>> {
    return apiCall(apiClient.get(`/api/strategy/parameters/${strategyName}`));
  }

  async getStrategyInfo(strategyName: string): Promise<ApiResponse<{
    name: string;
    description: string;
    active: boolean;
    available: boolean;
  }>> {
    return apiCall(apiClient.get(`/api/strategy/info/${strategyName}`));
  }

  // ========================================
  // LOGS ENDPOINTS
  // ========================================
  
  async getLogs(params?: {
    limit?: number;
    level?: string;
    since?: string;
    source?: string;
  }): Promise<ApiResponse<LogsResponse>> {
    return apiCall(apiClient.get('/api/logs', { params }));
  }

  async searchLogs(query: string, limit?: number): Promise<ApiResponse<{
    query: string;
    results: LogEntry[];
    total: number;
  }>> {
    return apiCall(apiClient.get('/api/logs/search', {
      params: { query, limit }
    }));
  }

  async getLogLevels(): Promise<ApiResponse<{
    levels: Array<{ name: string; count: number }>;
  }>> {
    return apiCall(apiClient.get('/api/logs/levels'));
  }

  async downloadLogs(): Promise<Blob> {
    const response = await apiClient.get('/api/logs/download', {
      responseType: 'blob'
    });
    return response.data;
  }

  // ========================================
  // LEGACY/PLANNED ENDPOINTS
  // ========================================

  // Trading endpoints (planned - will return 501 for now)
  async getTrades(params?: { limit?: number; strategy?: string }): Promise<ApiResponse<TradesResponse>> {
    return apiCall(apiClient.get('/api/trades', { params }));
  }

  async getSignals(params?: { limit?: number }): Promise<ApiResponse<SignalsResponse>> {
    return apiCall(apiClient.get('/api/signals', { params }));
  }

  async getMetrics(): Promise<ApiResponse<Metrics>> {
    return apiCall(apiClient.get('/api/metrics'));
  }

  // Chart data endpoint (planned)
  async getChartData(params: {
    pair: string;
    timeframe?: string;
    start?: string;
    end?: string;
  }): Promise<ApiResponse<ChartDataResponse>> {
    return apiCall(apiClient.get('/api/chart/data', { params }));
  }
}

// Export singleton instance
const api = new ApiService();
export default api;
