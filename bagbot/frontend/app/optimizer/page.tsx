'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Target, Home, LayoutDashboard, FileText, Play, RefreshCw, Download, TrendingUp, Zap, Activity, Info, XCircle, CheckCircle } from 'lucide-react';
import Navigation from '../components/Navigation';
import LiveTickerTape from '@/components/Dashboard/LiveTickerTape';
import PageContent from '@/components/Layout/PageContent';
import { useJobStatus } from '@/utils/hooks';
import api from '@/utils/apiService';
import { getUserFriendlyError } from '@/utils/api';

export default function OptimizerPage() {
  const [selectedDataFile, setSelectedDataFile] = useState('tests/data/BTCUSDT-1h-merged.csv');
  const [objective, setObjective] = useState<'sharpe' | 'total_return' | 'dual'>('sharpe');
  const [populationSize, setPopulationSize] = useState(20);
  const [generations, setGenerations] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Use custom hook for job status tracking
  const { status: jobStatus, progress, results: optimizerResults, loading: jobLoading, error: jobError } = useJobStatus(currentJobId || null, 'optimizer');

  const handleSubmitOptimizer = async () => {
    if (!selectedDataFile) {
      setSubmitError('Please select a data file');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await api.runOptimizer({
        data_file: selectedDataFile,
        objective,
        population: populationSize,
        generations
      });

      setCurrentJobId(response.data.job_id);
    } catch (error) {
      const errorMsg = getUserFriendlyError(error);
      setSubmitError(errorMsg);
      console.error('Failed to submit optimizer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadGenome = async () => {
    if (!optimizerResults?.best_genome) return;

    try {
      const blob = new Blob([JSON.stringify(optimizerResults.best_genome, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `optimized-genome-${currentJobId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download genome:', error);
    }
  };

  return (
    <>
      <LiveTickerTape />
      <Navigation active="/optimizer" />
      <PageContent>
        <div className="max-w-7xl mx-auto">
          {/* Navigation */}
          <nav className="mb-6 md:mb-8 flex items-center gap-2 text-sm">
            <Link href="/" className="text-[#FFFBE7]/60 hover:text-[#F9D949] transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <span className="text-[#FFFBE7]/30">/</span>
            <span className="text-[#F9D949] font-semibold">Optimizer</span>
          </nav>

          {/* Quick Navigation */}
          <div className="mb-6 md:mb-8 flex flex-wrap gap-2 md:gap-3">
            <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7]/60 hover:border-[#F9D949]/50 hover:text-[#F9D949] font-semibold text-sm transition-all flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/backtest" className="px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7]/60 hover:border-[#F9D949]/50 hover:text-[#F9D949] font-semibold text-sm transition-all flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Backtest
            </Link>
            <Link href="/optimizer" className="px-4 py-2 rounded-lg bg-[#7C2F39] border border-[#F9D949] text-[#FFFBE7] font-semibold text-sm transition-all">
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
                Genetic Optimizer
              </span>
            </h1>
            <p className="text-[#FFFBE7]/60 text-base md:text-lg">Evolve optimal trading parameters</p>
          </div>

          {/* Optimizer Configuration */}
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
              </select>
            </div>

            {/* Objective Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#FFFBE7] mb-3">
                Optimization Objective
              </label>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { value: 'sharpe', label: 'Sharpe Ratio', desc: 'Risk-adjusted returns', icon: Target },
                  { value: 'total_return', label: 'Total Return', desc: 'Maximize profit', icon: TrendingUp },
                  { value: 'dual', label: 'Dual Objective', desc: 'Balance both', icon: Zap }
                ].map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setObjective(opt.value as any)}
                      disabled={isSubmitting || jobLoading}
                      className={`p-6 rounded-xl transition-all ${
                        objective === opt.value
                          ? 'bg-[#7C2F39] border-2 border-[#F9D949]'
                          : 'bg-black/50 border-2 border-[#7C2F39]/30 hover:border-[#F9D949]/50'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mb-3 ${objective === opt.value ? 'text-[#F9D949]' : 'text-[#FFFBE7]/60'}`} />
                      <h3 className="text-lg font-bold text-[#FFFBE7] mb-2">{opt.label}</h3>
                      <p className="text-xs text-[#FFFBE7]/60">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Population Size */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#FFFBE7] mb-3">
                Population Size: {populationSize}
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={populationSize}
                onChange={(e) => setPopulationSize(parseInt(e.target.value))}
                disabled={isSubmitting || jobLoading}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-[#FFFBE7]/50 mt-2">
                <span>Faster (10)</span>
                <span>Balanced (50)</span>
                <span>Thorough (100)</span>
              </div>
            </div>

            {/* Generations */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#FFFBE7] mb-3">
                Generations: {generations}
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={generations}
                onChange={(e) => setGenerations(parseInt(e.target.value))}
                disabled={isSubmitting || jobLoading}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-[#FFFBE7]/50 mt-2">
                <span>Quick (5)</span>
                <span>Standard (25)</span>
                <span>Extensive (50)</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-[#FFFBE7]/60">
                <Info className="w-4 h-4" />
                <span>Est. time: {Math.ceil((populationSize * generations) / 10)} min</span>
              </div>
              <button
                onClick={handleSubmitOptimizer}
                disabled={isSubmitting || !selectedDataFile || jobLoading}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#7C2F39] to-[#991B1B] text-[#FFFBE7] font-bold hover:from-[#991B1B] hover:to-[#7C2F39] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Optimization
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
                <h2 className="text-2xl font-bold text-[#FFFBE7]">Optimization Progress</h2>
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

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#FFFBE7]/60 text-sm">Job ID:</span>
                  <span className="text-[#FFFBE7] font-mono text-sm">{currentJobId}</span>
                </div>

                {progress && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-[#FFFBE7]">Generation {progress.current_generation} / {progress.total_generations}</span>
                      <span className="text-sm text-[#F9D949] font-bold">
                        {Math.round((progress.current_generation / progress.total_generations) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-black/50 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#F9D949] to-[#4ADE80] transition-all duration-500"
                        style={{ width: `${(progress.current_generation / progress.total_generations) * 100}%` }}
                      />
                    </div>
                    {progress.best_fitness !== undefined && (
                      <div className="mt-3 text-sm text-[#FFFBE7]/60">
                        Best Fitness: <span className="text-[#4ADE80] font-bold">{progress.best_fitness.toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                )}

                {jobLoading && !jobStatus && (
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

                {jobStatus === 'completed' && optimizerResults && (
                  <div className="mt-4 space-y-4">
                    <div className="p-6 rounded-xl bg-[#4ADE80]/10 border border-[#4ADE80]/30 flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-[#4ADE80]" />
                      <div>
                        <h3 className="text-lg font-bold text-[#4ADE80]">Optimization Complete!</h3>
                        <p className="text-sm text-[#FFFBE7]/60">Best genome found and saved</p>
                      </div>
                    </div>

                    {/* Metrics */}
                    {optimizerResults.metrics && (
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
                          <div className="text-sm text-[#FFFBE7]/60 mb-1">Sharpe Ratio</div>
                          <div className="text-2xl font-black text-[#F9D949]">
                            {optimizerResults.metrics.sharpe_ratio?.toFixed(3) || 'N/A'}
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
                          <div className="text-sm text-[#FFFBE7]/60 mb-1">Total Return</div>
                          <div className="text-2xl font-black text-[#4ADE80]">
                            {optimizerResults.metrics.total_return ? `${(optimizerResults.metrics.total_return * 100).toFixed(2)}%` : 'N/A'}
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
                          <div className="text-sm text-[#FFFBE7]/60 mb-1">Max Drawdown</div>
                          <div className="text-2xl font-black text-[#F87171]">
                            {optimizerResults.metrics.max_drawdown ? `${(optimizerResults.metrics.max_drawdown * 100).toFixed(2)}%` : 'N/A'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Download Button */}
                    <button
                      onClick={handleDownloadGenome}
                      className="w-full py-3 rounded-xl bg-[#7C2F39]/50 hover:bg-[#7C2F39] text-[#FFFBE7] border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all flex items-center justify-center gap-2 font-semibold"
                    >
                      <Download className="w-5 h-5" />
                      Download Optimized Genome
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
