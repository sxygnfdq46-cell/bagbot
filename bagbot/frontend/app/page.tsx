'use client';

import React, { useState, useEffect } from 'react';
import StatusTile from '../components/StatusTile';
import { ThemeProvider } from '../utils/theme';

/**
 * Main Dashboard Page - integrates existing functionality with new components
 */
const DashboardPage: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'healthy' | 'degraded' | 'down'>('down');
  const [workerStatus, setWorkerStatus] = useState<'healthy' | 'degraded' | 'down'>('down');
  const [logs, setLogs] = useState<Array<{ timestamp: Date; message: string; type: string }>>([
    { timestamp: new Date(), message: 'Dashboard loaded...', type: 'info' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // API Base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  /**
   * Add log message
   */
  const addLog = (message: string, type: string = 'info') => {
    setLogs(prev => [...prev, { timestamp: new Date(), message, type }]);
  };

  /**
   * Check API Health
   */
  const checkAPIHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      
      if (response.ok) {
        setApiStatus('healthy');
        addLog('API health check successful');
        return true;
      } else {
        throw new Error('API not healthy');
      }
    } catch (error) {
      setApiStatus('down');
      addLog('API health check failed', 'error');
      return false;
    }
  };

  /**
   * Check Worker Status
   */
  const checkWorkerStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/worker/status`);
      const data = await response.json();
      
      if (response.ok && data.status === 'running') {
        setWorkerStatus('healthy');
        addLog('Worker is running');
      } else {
        setWorkerStatus('down');
        addLog('Worker is not running');
      }
    } catch (error) {
      setWorkerStatus('down');
      addLog('Worker status check failed', 'error');
    }
  };

  /**
   * Start Worker
   */
  const startWorker = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/worker/start`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        addLog('Worker start command sent');
        setTimeout(checkWorkerStatus, 2000); // Check status after 2 seconds
      } else {
        addLog('Failed to start worker', 'error');
      }
    } catch (error) {
      addLog('Error starting worker', 'error');
    }
    setIsLoading(false);
  };

  /**
   * Stop Worker
   */
  const stopWorker = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/worker/stop`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        addLog('Worker stop command sent');
        setTimeout(checkWorkerStatus, 2000); // Check status after 2 seconds
      } else {
        addLog('Failed to stop worker', 'error');
      }
    } catch (error) {
      addLog('Error stopping worker', 'error');
    }
    setIsLoading(false);
  };

  /**
   * Refresh all status
   */
  const refreshStatus = async () => {
    setIsLoading(true);
    await Promise.all([checkAPIHealth(), checkWorkerStatus()]);
    setIsLoading(false);
  };

  // Initial load and periodic updates
  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-main mb-2">BagBot Trading Dashboard</h1>
          <p className="text-muted">Monitor and control your trading bot operations</p>
        </header>

        {/* Status Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-main mb-6">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatusTile
              title="API Health"
              status={apiStatus}
              description="Backend API connectivity and health"
              lastUpdated={new Date()}
              onClick={checkAPIHealth}
            />
            <StatusTile
              title="Worker Status"
              status={workerStatus}
              description="Trading worker process status"
              lastUpdated={new Date()}
              onClick={checkWorkerStatus}
            />
          </div>
        </section>

        {/* Controls Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-main mb-6">Worker Controls</h2>
          <div className="bg-surface rounded-xl border border-border p-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={startWorker}
                disabled={isLoading}
                className={`
                  px-6 py-3 rounded-lg font-medium transition-all duration-200
                  ${isLoading 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-success text-white hover:bg-green-700 hover:shadow-lg'
                  }
                `}
              >
                {isLoading ? 'Loading...' : 'Start Worker'}
              </button>
              
              <button
                onClick={stopWorker}
                disabled={isLoading}
                className={`
                  px-6 py-3 rounded-lg font-medium transition-all duration-200
                  ${isLoading 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-danger text-white hover:bg-red-700 hover:shadow-lg'
                  }
                `}
              >
                {isLoading ? 'Loading...' : 'Stop Worker'}
              </button>
              
              <button
                onClick={refreshStatus}
                disabled={isLoading}
                className={`
                  px-6 py-3 rounded-lg font-medium transition-all duration-200
                  ${isLoading 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-primary text-white hover:bg-primary-700 hover:shadow-lg'
                  }
                `}
              >
                {isLoading ? 'Loading...' : 'Refresh Status'}
              </button>
            </div>
          </div>
        </section>

        {/* Activity Log Section */}
        <section>
          <h2 className="text-2xl font-semibold text-main mb-6">Activity Log</h2>
          <div className="bg-surface rounded-xl border border-border p-6">
            <div className="h-64 overflow-y-auto space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-sm font-mono ${
                    log.type === 'error' ? 'text-danger' : 'text-muted'
                  }`}
                >
                  <span className="text-xs text-muted mr-2">
                    [{log.timestamp.toLocaleTimeString()}]
                  </span>
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

/**
 * Dashboard with Theme Provider
 */
const Dashboard: React.FC = () => {
  return (
    <ThemeProvider>
      <DashboardPage />
    </ThemeProvider>
  );
};

export default Dashboard;