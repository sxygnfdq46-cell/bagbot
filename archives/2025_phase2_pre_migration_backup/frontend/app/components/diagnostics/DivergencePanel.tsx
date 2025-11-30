/**
 * Divergence Panel
 * 
 * Displays reality divergence scan results in a sci-fi styled panel.
 * Shows the gap between backtest expectations and live execution reality.
 */

import React, { useMemo } from 'react';
import RealityDivergenceScanner, {
  BacktestData,
  LiveData,
  MarketMeta,
  ExpectedModel,
  DivergenceScanResult,
} from '../../engines/RealityDivergenceScanner';

interface DivergencePanelProps {
  backtestData: BacktestData;
  liveData: LiveData;
  marketMeta: MarketMeta;
  expectedModel?: ExpectedModel;
}

const DivergencePanel: React.FC<DivergencePanelProps> = ({
  backtestData,
  liveData,
  marketMeta,
  expectedModel,
}) => {
  // Initialize scanner and compute results
  const scanResult = useMemo(() => {
    const scanner = new RealityDivergenceScanner();
    return scanner.scan(backtestData, liveData, marketMeta, expectedModel);
  }, [backtestData, liveData, marketMeta, expectedModel]);

  // Get severity badge styling
  const getSeverityBadge = (severity: DivergenceScanResult['severityLevel']) => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider';
    
    switch (severity) {
      case 'low':
        return `${baseClasses} bg-teal-500/20 text-teal-400 border border-teal-500/50`;
      case 'medium':
        return `${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/50`;
      case 'high':
        return `${baseClasses} bg-orange-500/20 text-orange-400 border border-orange-500/50`;
      case 'critical':
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse`;
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/50`;
    }
  };

  // Get divergence index color
  const getDivergenceColor = (index: number) => {
    if (index < 25) return 'text-teal-400';
    if (index < 50) return 'text-yellow-400';
    if (index < 75) return 'text-orange-400';
    return 'text-red-400';
  };

  // Get metric color based on value (positive = worse, negative = better)
  const getMetricColor = (value: number, threshold: number = 0) => {
    if (Math.abs(value) < threshold) return 'text-teal-400';
    if (Math.abs(value) < threshold * 2) return 'text-yellow-400';
    if (Math.abs(value) < threshold * 3) return 'text-orange-400';
    return 'text-red-400';
  };

  // Get score color (0-100, higher is better)
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-teal-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 md:p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-cyan-400 mb-1">
            Reality Divergence Scanner
          </h2>
          <p className="text-xs md:text-sm text-gray-400">
            Backtest vs Live Execution Analysis
          </p>
        </div>
        <div className={getSeverityBadge(scanResult.severityLevel)}>
          {scanResult.severityLevel}
        </div>
      </div>

      {/* Divergence Index - Main Display */}
      <div className="bg-black/40 border border-cyan-500/20 rounded-lg p-4 md:p-6 mb-6">
        <div className="text-center">
          <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider mb-2">
            Divergence Index
          </div>
          <div className={`text-5xl md:text-7xl font-bold ${getDivergenceColor(scanResult.divergenceIndex)} mb-2`}>
            {scanResult.divergenceIndex.toFixed(1)}
          </div>
          <div className="text-xs md:text-sm text-gray-500">
            0 = Perfect Match • 100 = Maximum Divergence
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Slippage Deviation */}
        <div className="bg-black/30 border border-gray-700/50 rounded-lg p-4 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm text-gray-400 uppercase tracking-wide">
              Slippage Deviation
            </span>
            <span className="text-xs text-gray-600">pips</span>
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${getMetricColor(scanResult.slippageDeviation, 0.5)}`}>
            {scanResult.slippageDeviation > 0 ? '+' : ''}{scanResult.slippageDeviation.toFixed(2)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Live vs Expected
          </div>
        </div>

        {/* Spread Anomaly */}
        <div className="bg-black/30 border border-gray-700/50 rounded-lg p-4 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm text-gray-400 uppercase tracking-wide">
              Spread Anomaly
            </span>
            <span className="text-xs text-gray-600">pips</span>
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${getMetricColor(scanResult.spreadAnomaly, 0.3)}`}>
            {scanResult.spreadAnomaly > 0 ? '+' : ''}{scanResult.spreadAnomaly.toFixed(2)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Market vs Normal
          </div>
        </div>

        {/* Volatility Mismatch */}
        <div className="bg-black/30 border border-gray-700/50 rounded-lg p-4 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm text-gray-400 uppercase tracking-wide">
              Volatility Mismatch
            </span>
            <span className="text-xs text-gray-600">%</span>
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${getMetricColor(scanResult.volatilityMismatch, 10)}`}>
            {scanResult.volatilityMismatch > 0 ? '+' : ''}{scanResult.volatilityMismatch.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Change from Baseline
          </div>
        </div>

        {/* Execution Quality Score */}
        <div className="bg-black/30 border border-gray-700/50 rounded-lg p-4 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm text-gray-400 uppercase tracking-wide">
              Execution Quality
            </span>
            <span className="text-xs text-gray-600">/100</span>
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${getScoreColor(scanResult.executionQualityScore)}`}>
            {scanResult.executionQualityScore.toFixed(0)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Higher is Better
          </div>
        </div>

        {/* Fill Delay Score */}
        <div className="bg-black/30 border border-gray-700/50 rounded-lg p-4 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm text-gray-400 uppercase tracking-wide">
              Fill Delay Score
            </span>
            <span className="text-xs text-gray-600">/100</span>
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${getScoreColor(scanResult.fillDelayScore)}`}>
            {scanResult.fillDelayScore.toFixed(0)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Speed Performance
          </div>
        </div>

        {/* Sample Size (if available) */}
        <div className="bg-black/30 border border-gray-700/50 rounded-lg p-4 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm text-gray-400 uppercase tracking-wide">
              Live Sample Size
            </span>
            <span className="text-xs text-gray-600">trades</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-cyan-400">
            {liveData.sampleSize}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Data Confidence
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
          <div>
            <span className="text-cyan-400/60">●</span> Real-time divergence monitoring
          </div>
          <div>
            Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DivergencePanel;
