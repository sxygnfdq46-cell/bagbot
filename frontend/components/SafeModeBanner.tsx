'use client';

import React, { useEffect, useState } from 'react';

interface SafeModeStatus {
  enabled: boolean;
  level: string;
  reason: string;
  activated_at: number;
  activated_by: string;
  status: string;
  is_active: boolean;
  real_trading_allowed: boolean;
}

/**
 * Safe Mode Banner Component
 * 
 * Displays a prominent banner when safe mode is active
 * Shows current safe mode level and prevents confusion about trading status
 */
export default function SafeModeBanner() {
  const [safeModeStatus, setSafeModeStatus] = useState<SafeModeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch safe mode status
    const fetchSafeModeStatus = async () => {
      try {
        const response = await fetch('/api/safe-mode/status');
        if (response.ok) {
          const data = await response.json();
          setSafeModeStatus(data);
        }
      } catch (error) {
        console.error('Error fetching safe mode status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSafeModeStatus();

    // Poll status every 10 seconds
    const interval = setInterval(fetchSafeModeStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return null;
  }

  if (!safeModeStatus?.is_active) {
    return null;
  }

  // Determine banner color based on safe mode level
  const getBannerColor = (level: string) => {
    switch (level) {
      case 'simulation':
        return 'bg-blue-600';
      case 'read_only':
        return 'bg-yellow-600';
      case 'full_lockdown':
        return 'bg-red-600';
      default:
        return 'bg-blue-600';
    }
  };

  const bannerColor = getBannerColor(safeModeStatus.level);

  return (
    <div className={`${bannerColor} text-white px-6 py-3 fixed top-0 left-0 right-0 z-50 shadow-lg`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-6 h-6 animate-pulse"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-bold text-lg">🛡️ SAFE MODE ACTIVE</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm opacity-90">
            <span>|</span>
            <span className="uppercase font-semibold">{safeModeStatus.level.replace('_', ' ')}</span>
            <span>|</span>
            <span>All real trading operations are blocked</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-75">
            {safeModeStatus.reason}
          </span>
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
