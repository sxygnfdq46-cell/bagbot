'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Home, LayoutDashboard, Target, Activity, Download, RefreshCw, XCircle } from 'lucide-react';
import Navigation from '../components/Navigation';
import LiveTickerTape from '@/components/Dashboard/LiveTickerTape';
import PageContent from '@/components/Layout/PageContent';
import { useGenomes, useReports } from '@/utils/hooks';
import api from '@/utils/apiService';

export default function ArtifactsPage() {
  const { genomes, loading: genomesLoading, error: genomesError, refetch: refetchGenomes } = useGenomes();
  const { reports, loading: reportsLoading, error: reportsError, refetch: refetchReports } = useReports();

  const handleDownloadGenome = async (filename: string) => {
    try {
      const blob = await api.downloadGenome(filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download genome:', error);
    }
  };

  const handleDownloadReport = async (filename: string) => {
    try {
      const blob = await api.downloadReport(filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  return (
    <>
      <LiveTickerTape />
      <Navigation active="/artifacts" />
      <PageContent>
        <div className="max-w-7xl mx-auto">
          {/* Navigation */}
          <nav className="mb-6 md:mb-8 flex items-center gap-2 text-sm">
            <Link href="/" className="text-[#FFFBE7]/60 hover:text-[#F9D949] transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <span className="text-[#FFFBE7]/30">/</span>
            <span className="text-[#F9D949] font-semibold">Artifacts</span>
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
            <Link href="/optimizer" className="px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7]/60 hover:border-[#F9D949]/50 hover:text-[#F9D949] font-semibold text-sm transition-all flex items-center gap-2">
              <Target className="w-4 h-4" />
              Optimizer
            </Link>
            <Link href="/artifacts" className="px-4 py-2 rounded-lg bg-[#7C2F39] border border-[#F9D949] text-[#FFFBE7] font-semibold text-sm transition-all">
              Artifacts
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-3">
              <span className="bg-gradient-to-r from-[#FFFBE7] to-[#F9D949] bg-clip-text text-transparent">
                Artifacts Browser
              </span>
            </h1>
            <p className="text-[#FFFBE7]/60 text-base md:text-lg">Browse and download optimization results</p>
          </div>

          {/* Genomes Section */}
          <div className="mb-6 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#FFFBE7]">Genome Files</h2>
              <button onClick={() => refetchGenomes()} className="p-2 rounded-lg bg-[#7C2F39]/50 hover:bg-[#7C2F39] transition-all">
                <RefreshCw className={`w-5 h-5 text-[#FFFBE7] ${genomesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {genomesLoading && (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-[#F9D949] animate-spin mx-auto mb-2" />
                <p className="text-[#FFFBE7]/60">Loading genomes...</p>
              </div>
            )}

            {genomesError && (
              <div className="p-4 rounded-xl bg-[#F87171]/10 border border-[#F87171]/30 flex items-center gap-3">
                <XCircle className="w-5 h-5 text-[#F87171]" />
                <p className="text-sm text-[#F87171]">{genomesError}</p>
              </div>
            )}

            {!genomesLoading && !genomesError && genomes.length === 0 && (
              <p className="text-center py-8 text-[#FFFBE7]/60">No genomes found</p>
            )}

            {!genomesLoading && !genomesError && genomes.length > 0 && (
              <div className="space-y-3">
                {genomes.map((genome, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-black/30 border border-[#7C2F39]/20 flex items-center justify-between hover:border-[#F9D949]/50 transition-all">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#FFFBE7]">{genome.filename}</h3>
                      <p className="text-sm text-[#FFFBE7]/60">{genome.timestamp ? new Date(genome.timestamp).toLocaleString() : 'No timestamp'}</p>
                      {genome.metadata?.sharpe_ratio && (
                        <p className="text-sm text-[#4ADE80] mt-1">Sharpe: {genome.metadata.sharpe_ratio.toFixed(3)}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDownloadGenome(genome.filename)}
                      className="px-4 py-2 rounded-lg bg-[#7C2F39]/50 hover:bg-[#7C2F39] text-[#FFFBE7] border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reports Section */}
          <div className="mb-6 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#FFFBE7]">Backtest Reports</h2>
              <button onClick={() => refetchReports()} className="p-2 rounded-lg bg-[#7C2F39]/50 hover:bg-[#7C2F39] transition-all">
                <RefreshCw className={`w-5 h-5 text-[#FFFBE7] ${reportsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {reportsLoading && (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-[#F9D949] animate-spin mx-auto mb-2" />
                <p className="text-[#FFFBE7]/60">Loading reports...</p>
              </div>
            )}

            {reportsError && (
              <div className="p-4 rounded-xl bg-[#F87171]/10 border border-[#F87171]/30 flex items-center gap-3">
                <XCircle className="w-5 h-5 text-[#F87171]" />
                <p className="text-sm text-[#F87171]">{reportsError}</p>
              </div>
            )}

            {!reportsLoading && !reportsError && reports.length === 0 && (
              <p className="text-center py-8 text-[#FFFBE7]/60">No reports found</p>
            )}

            {!reportsLoading && !reportsError && reports.length > 0 && (
              <div className="space-y-3">
                {reports.map((report, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-black/30 border border-[#7C2F39]/20 flex items-center justify-between hover:border-[#F9D949]/50 transition-all">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#FFFBE7]">{report.filename}</h3>
                      <p className="text-sm text-[#FFFBE7]/60">{report.timestamp ? new Date(report.timestamp).toLocaleString() : 'No timestamp'}</p>
                    </div>
                    <button
                      onClick={() => handleDownloadReport(report.filename)}
                      className="px-4 py-2 rounded-lg bg-[#7C2F39]/50 hover:bg-[#7C2F39] text-[#FFFBE7] border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageContent>
    </>
  );
}
