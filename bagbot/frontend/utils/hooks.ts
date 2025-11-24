/**
 * Custom React hooks for API calls with loading and error states
 */

import { useState, useEffect, useCallback } from 'react';
import api from '@/utils/apiService';
import { ApiResponse } from '@/utils/api';

// Generic hook for API calls with loading/error states
export function useApiCall<T>(
  apiFunction: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction();
      setData(response.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Hook for worker status with auto-refresh
export function useWorkerStatus(refreshInterval: number = 5000) {
  const [status, setStatus] = useState<'running' | 'stopped'>('stopped');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getWorkerStatus();
      setStatus(response.data.status);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch worker status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStatus, refreshInterval]);

  return { status, loading, error, refetch: fetchStatus };
}

// Hook for strategy list
export function useStrategies() {
  const [strategies, setStrategies] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setLoading(true);
        const response = await api.listStrategies();
        setStrategies(response.data.strategies);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch strategies');
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, []);

  return { strategies, loading, error };
}

// Hook for active strategy config
export function useStrategyConfig() {
  const [config, setConfig] = useState<{
    active_strategy: string;
    parameters: Record<string, any>;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getStrategyConfig();
      setConfig(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch strategy config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (strategy: string, parameters: Record<string, any>) => {
    try {
      await api.updateStrategyConfig({ strategy, parameters });
      await fetchConfig();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update strategy config');
      return false;
    }
  };

  return { config, loading, error, updateConfig, refetch: fetchConfig };
}

// Hook for genomes list
export function useGenomes() {
  const [genomes, setGenomes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGenomes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.listGenomes();
      setGenomes(response.data.genomes);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch genomes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGenomes();
  }, [fetchGenomes]);

  return { genomes, loading, error, refetch: fetchGenomes };
}

// Hook for reports list
export function useReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.listReports();
      setReports(response.data.reports);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, loading, error, refetch: fetchReports };
}

// Hook for logs with auto-refresh
export function useLogs(
  filters?: {
    limit?: number;
    level?: string;
    since?: string;
  },
  refreshInterval: number = 10000
) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getLogs(filters);
      setLogs(response.data.logs);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [filters?.limit, filters?.level, filters?.since]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchLogs, refreshInterval]);

  return { logs, loading, error, refetch: fetchLogs };
}

// Hook for job status polling
export function useJobStatus(
  jobId: string | null,
  jobType: 'backtest' | 'optimizer',
  pollInterval: number = 2000
) {
  const [status, setStatus] = useState<string>('unknown');
  const [progress, setProgress] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const fetchStatus = async () => {
      try {
        setLoading(true);
        
        if (jobType === 'backtest') {
          const response = await api.getBacktestStatus(jobId);
          setStatus(response.data.status);
          
          if (response.data.status === 'completed') {
            const resultsResponse = await api.getBacktestResults(jobId);
            setResults(resultsResponse.data.results);
          }
        } else if (jobType === 'optimizer') {
          const response = await api.getOptimizerStatus(jobId);
          setStatus(response.data.status);
          setProgress(response.data.progress);
          
          if (response.data.status === 'completed') {
            const resultsResponse = await api.getOptimizerResults(jobId);
            setResults(resultsResponse.data);
          }
        }
        
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch job status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
    // Only poll if job is not completed
    if (status !== 'completed' && status !== 'failed') {
      const interval = setInterval(fetchStatus, pollInterval);
      return () => clearInterval(interval);
    }
  }, [jobId, jobType, status, pollInterval]);

  return { status, progress, results, loading, error };
}

// Hook for backtest submission
export function useBacktest() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = async (request: {
    data_file: string;
    genome_file?: string;
    initial_balance?: number;
    fee_rate?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.runBacktest(request);
      setJobId(response.data.job_id);
      return response.data.job_id;
    } catch (err: any) {
      setError(err.message || 'Failed to start backtest');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { jobId, runBacktest, loading, error };
}

// Hook for optimizer submission
export function useOptimizer() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runOptimizer = async (request: {
    data_file: string;
    objective: 'sharpe' | 'total_return' | 'dual';
    population: number;
    generations: number;
    seed?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.runOptimizer(request);
      setJobId(response.data.job_id);
      return response.data.job_id;
    } catch (err: any) {
      setError(err.message || 'Failed to start optimizer');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { jobId, runOptimizer, loading, error };
}
