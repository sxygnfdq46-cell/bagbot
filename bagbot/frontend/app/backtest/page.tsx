'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Home, LayoutDashboard, BarChart3, FileText, TrendingUp, TrendingDown, DollarSign, Target, CheckCircle, XCircle, RefreshCw, Download, Upload, Info } from 'lucide-react';
import Navigation from '../components/Navigation';
import LiveTickerTape from '@/components/Dashboard/LiveTickerTape';
import PageContent from '@/components/Layout/PageContent';
import { useJobStatus } from '@/utils/hooks';
import api from '@/utils/apiService';
import { getUserFriendlyError } from '@/utils/api';

export default function BacktestPage() {
  const [selectedDataFile, setSelectedDataFile] = useState('tests/data/BTCUSDT-1h-merged.csv');
  const [selectedGenomeFile, setSelectedGenomeFile] = useState('');
  const [customGenome, setCustomGenome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Use custom hook for job status tracking
  const { status: jobStatus, results: backtestResults, loading: jobLoading, error: jobError } = useJobStatus(currentJobId || null, 'backtest');

  const handleSubmitBacktest = async () => {
    if (!selectedDataFile) {
      setSubmitError('Please select a data file');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await api.runBacktest({
        data_file: selectedDataFile,
        genome_file: selectedGenomeFile || undefined
      });

      setCurrentJobId(response.data.job_id);
    } catch (error) {
      const errorMsg = getUserFriendlyError(error);
      setSubmitError(errorMsg);
      console.error('Failed to submit backtest:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadResults = async () => {
    if (!backtestResults) return;

    try {
      const blob = new Blob([JSON.stringify(backtestResults, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backtest-${currentJobId}-results.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download results:', error);
    }
  };

  return (
    <>
      <LiveTickerTape />
      <Navigation active="/backtest" />
      <PageContent>
        <div className="max-w-7xl mx-auto">
          {/* Navigation */}
          <nav className="mb-6 md:mb-8 flex items-center gap-2 text-sm">
            <Link href="/" className="text-[#FFFBE7]/60 hover:text-[#F9D949] transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <span className="text-[#FFFBE7]/30">/</span>
            <span className="text-[#F9D949] font-semibold">Backtest</span>
          </nav>

          {/* Quick Navigation */}
          <div className="mb-6 md:mb-8 flex flex-wrap gap-2 md:gap-3">
            <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7]/60 hover:border-[#F9D949]/50 hover:text-[#F9D949] font-semibold text-sm transition-all flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/backtest" className="px-4 py-2 rounded-lg bg-[#7C2F39] border border-[#F9D949] text-[#FFFBE7] font-semibold text-sm transition-all">
              Backtest
            </Link>
            <Link href="/optimizer" className="px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7]/60 hover:border-[#F9D949]/50 hover:text-[#F9D949] font-semibold text-sm transition-all flex items-center gap-2">
              <Target className="w-4 h-4" />
              Optimizer
            </Link>
            <Link href="/artifacts" className="px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7]/60 hover:border-[#F9D949]/50 hover:text-[#F9D949] font-semibold text-sm transition-all flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Artifacts
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-3">
              <span className="bg-gradient-to-r from-[#FFFBE7] to-[#F9D949] bg-clip-text text-transparent">
                Backtest Engine
              </span>
            </h1>
            <p className="text-[#FFFBE7]/60 text-base md:text-lg">Test strategies against historical data</p>
          </div>

          {/* Backtest Configuration */}
          <div className="mb-6 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
            <h2 className="text-2xl font-bold text-[#FFFBE7] mb-6">Configuration</h2>

            {/* Data File Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#FFFBE7] mb-3">
                Market Data File
              </label>
              <select
                value={selectedDataFile}
                onChange={(e) => setSelectedDataFile(e.target.value)}
                disabled={isSubmitting || jobLoading}
                className="w-full px-4 py-3 rounded-xl bg-[#1a0a0f] border-2 border-[#7C2F39] text-[#F9D949] font-bold focus:border-[#F9D949] focus:outline-none transition-all cursor-pointer"
              >
                <option value="tests/data/BTCUSDT-1h-merged.csv">BTC/USDT 1h Historical</option>
                <option value="tests/data/ETHUSDT-1h-merged.csv">ETH/USDT 1h Historical</option>
                <option value="tests/data/custom.csv">Custom Data</option>
              </select>
            </div>

            {/* Genome File Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#FFFBE7] mb-3">
                Genome File (Optional)
              </label>
              <input
                type="text"
                value={selectedGenomeFile}
                onChange={(e) => setSelectedGenomeFile(e.target.value)}
                placeholder="e.g., artifacts/genomes/best_genome_dual.json"
                disabled={isSubmitting || jobLoading}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] placeholder-[#FFFBE7]/30 focus:border-[#F9D949] focus:outline-none transition-all"
              />
              <p className="text-xs text-[#FFFBE7]/50 mt-2">Leave empty to use default brain configuration</p>
            </div>

            {/* Custom Genome JSON */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#FFFBE7] mb-3">
                Or Paste Genome JSON
              </label>
              <textarea
                value={customGenome}
                onChange={(e) => setCustomGenome(e.target.value)}
                placeholder='{"fast_ma": 12, "slow_ma": 26, ...}'
                disabled={isSubmitting || jobLoading}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] placeholder-[#FFFBE7]/30 focus:border-[#F9D949] focus:outline-none transition-all font-mono text-sm"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-[#FFFBE7]/60">
                <Info className="w-4 h-4" />
                <span>Backtest runs asynchronously</span>
              </div>
              <button
                onClick={handleSubmitBacktest}
                disabled={isSubmitting || !selectedDataFile || jobLoading}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#7C2F39] to-[#991B1B] text-[#FFFBE7] font-bold hover:from-[#991B1B] hover:to-[#7C2F39] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Run Backtest
                  </>
                )}
              </button>
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="mt-4 p-4 rounded-xl bg-[#F87171]/10 border border-[#F87171]/30 flex items-center gap-3">
                <XCircle className="w-5 h-5 text-[#F87171]" />
                <p className="text-sm text-[#F87171]">{submitError}</p>
              </div>
            )}
          </div>

          {/* Job Status */}
          {currentJobId && (
            <div className="mb-6 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[#FFFBE7]">Job Status</h2>
                {jobStatus && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    jobStatus === 'completed' ? 'bg-[#4ADE80]/20 text-[#4ADE80]' :
                    jobStatus === 'failed' ? 'bg-[#F87171]/20 text-[#F87171]' :
                    'bg-[#F9D949]/20 text-[#F9D949]'
                  }`}>
                    {jobStatus.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#FFFBE7]/60 text-sm">Job ID:</span>
                  <span className="text-[#FFFBE7] font-mono text-sm">{currentJobId}</span>
                </div>

                {jobLoading && (
                  <div className="text-center py-4">
                    <RefreshCw className="w-6 h-6 text-[#F9D949] animate-spin mx-auto mb-2" />
                    <p className="text-[#FFFBE7]/60 text-sm">Checking status...</p>
                  </div>
                )}

                {jobError && (
                  <div className="p-4 rounded-xl bg-[#F87171]/10 border border-[#F87171]/30">
                    <p className="text-sm text-[#F87171]">{jobError}</p>
                  </div>
                )}

                {jobStatus === 'completed' && backtestResults && (
                  <div className="mt-4 space-y-4">
                    <h3 className="text-lg font-bold text-[#FFFBE7]">Results</h3>

                    {/* Metrics Grid */}
                    <div className="grid md:grid-cols-3 gap-4">
                      {backtestResults.total_return !== undefined && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-[#4ADE80]" />
                            <span className="text-sm text-[#FFFBE7]/60">Total Return</span>
                          </div>
                          <div className="text-2xl font-black text-[#4ADE80]">
                            {(backtestResults.total_return * 100).toFixed(2)}%
                          </div>
                        </div>
                      )}

                      {backtestResults.sharpe_ratio !== undefined && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5 text-[#F9D949]" />
                            <span className="text-sm text-[#FFFBE7]/60">Sharpe Ratio</span>
                          </div>
                          <div className="text-2xl font-black text-[#F9D949]">
                            {backtestResults.sharpe_ratio.toFixed(3)}
                          </div>
                        </div>
                      )}

                      {backtestResults.max_drawdown !== undefined && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="w-5 h-5 text-[#F87171]" />
                            <span className="text-sm text-[#FFFBE7]/60">Max Drawdown</span>
                          </div>
                          <div className="text-2xl font-black text-[#F87171]">
                            {(backtestResults.max_drawdown * 100).toFixed(2)}%
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={handleDownloadResults}
                      className="w-full py-3 rounded-xl bg-[#7C2F39]/50 hover:bg-[#7C2F39] text-[#FFFBE7] border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all flex items-center justify-center gap-2 font-semibold"
                    >
                      <Download className="w-5 h-5" />
                      Download Full Results
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </PageContent>
    </>
  );
}
