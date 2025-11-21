'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatusTile from '@/components/StatusTile';
import { useAuth } from '@/context/AuthContext';

/**
 * Main Dashboard Page - integrates existing functionality with new components
 */
const Dashboard: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Protect dashboard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0810] via-[#1A0E15] to-[#150A12] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#C75B7A] border-t-[#F9D949] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFF8E7] text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!user) return null;
  
  const [apiStatus, setApiStatus] = useState<'healthy' | 'warning' | 'error' | 'loading' | 'inactive'>('inactive');
  const [workerStatus, setWorkerStatus] = useState<'healthy' | 'warning' | 'error' | 'loading' | 'inactive'>('inactive');
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
    <div className="min-h-screen bg-gradient-to-br from-[#0F0810] via-[#1A0E15] to-[#150A12]">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[#FFF8E7] to-[#F9D949] bg-clip-text text-transparent mb-3 tracking-tight">
            BagBot Trading Platform
          </h1>
          <p className="text-lg text-[#D4B5C4] font-medium">Real-time trading operations & analytics</p>
        </header>

        {/* Status Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#FFF8E7] mb-8 tracking-tight">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#FFF8E7] mb-8 tracking-tight">Worker Controls</h2>
          <div className="bg-gradient-to-br from-[#2A1721]/80 to-[#1A0E15]/80 backdrop-blur-sm border border-[#C75B7A]/30 rounded-2xl shadow-custom-lg p-8">
            <div className="flex flex-wrap gap-5">
              <button
                onClick={startWorker}
                disabled={isLoading}
                className={`
                  px-8 py-4 rounded-xl font-semibold text-base tracking-wide
                  transition-smooth btn-hover shadow-custom-md
                  ${isLoading 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-[#C75B7A] text-white hover:bg-[#9F3A5E] hover:shadow-custom-lg hover:scale-105 active:scale-95'
                  }
                `}
              >
                {isLoading ? '⏳ Processing...' : '▶ Start Worker'}
              </button>
              
              <button
                onClick={stopWorker}
                disabled={isLoading}
                className={`
                  px-8 py-4 rounded-xl font-semibold text-base tracking-wide
                  transition-smooth btn-hover shadow-custom-md
                  ${isLoading 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-[#DC2626] text-white hover:bg-[#B91C1C] hover:shadow-custom-lg hover:scale-105 active:scale-95'
                  }
                `}
              >
                {isLoading ? '⏳ Processing...' : '⏹ Stop Worker'}
              </button>
              
              <button
                onClick={refreshStatus}
                disabled={isLoading}
                className={`
                  px-8 py-4 rounded-xl font-semibold text-base tracking-wide
                  transition-smooth btn-hover shadow-custom-md
                  ${isLoading 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-[#F9D949] text-[#0F0810] hover:bg-[#F59E0B] hover:shadow-custom-lg hover:scale-105 active:scale-95'
                  }
                `}
              >
                {isLoading ? '⏳ Processing...' : '🔄 Refresh Status'}
              </button>
            </div>
          </div>
        </section>

        {/* Activity Log Section */}
        <section>
          <h2 className="text-3xl font-bold text-[#FFF8E7] mb-8 tracking-tight">Activity Log</h2>
          <div className="bg-gradient-to-br from-[#2A1721]/80 to-[#1A0E15]/80 backdrop-blur-sm border border-[#C75B7A]/30 rounded-2xl shadow-custom-lg p-8">
            <div className="h-80 overflow-y-auto space-y-3 custom-scrollbar">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-sm font-mono leading-relaxed p-3 rounded-lg transition-smooth hover:bg-[#2A1721]/50 ${
                    log.type === 'error' ? 'text-[#DC2626] bg-red-900/20' : 'text-[#D4B5C4]'
                  }`}
                >
                  <span className="text-xs font-semibold text-[#C75B7A] mr-3">
                    {log.timestamp.toLocaleTimeString()}
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

export default Dashboard;