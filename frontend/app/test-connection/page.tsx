'use client';

import { useEffect, useState } from 'react';
import { runAllTests, ConnectionTestResult } from '@/lib/connection-test';

export default function ConnectionTestPage() {
  const [results, setResults] = useState<ConnectionTestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [summary, setSummary] = useState<{ passed: number; failed: number } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResults([]);
    setSummary(null);

    const testResults = await runAllTests();
    setResults(testResults.results);
    setSummary({ passed: testResults.passed, failed: testResults.failed });
    setTesting(false);
  };

  useEffect(() => {
    // Auto-run tests on mount
    handleTest();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Connection Test</h1>
            <p className="text-gray-400 mt-1">Testing backend connectivity</p>
          </div>
          
          <button
            onClick={handleTest}
            disabled={testing}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 transition-all"
          >
            {testing ? 'Testing...' : 'Run Tests'}
          </button>
        </div>

        {/* Configuration Display */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-purple-500/30 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Configuration</h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">API URL:</span>
              <span className="text-green-400">{process.env.NEXT_PUBLIC_API_URL || 'Not configured'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">WebSocket URL:</span>
              <span className="text-green-400">{process.env.NEXT_PUBLIC_WS_URL || 'Not configured'}</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-purple-500/30 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                <p className="text-green-300 text-sm">Passed</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{summary.passed}</p>
              </div>
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-300 text-sm">Failed</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{summary.failed}</p>
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-purple-500/30 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Test Results</h2>
          
          {testing && results.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-purple-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-400">Running tests...</p>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === 'success'
                      ? 'bg-green-500/10 border-green-500/50'
                      : 'bg-red-500/10 border-red-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        result.status === 'success' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <span className="text-white font-medium">{result.name}</span>
                    </div>
                    {result.duration && (
                      <span className="text-gray-400 text-sm">{result.duration}ms</span>
                    )}
                  </div>
                  <p className={`mt-2 text-sm ${
                    result.status === 'success' ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {result.message}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!testing && results.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              Click "Run Tests" to check backend connectivity
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-purple-500/30 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Links</h2>
          <div className="space-y-2">
            <a
              href="/login"
              className="block p-3 bg-gray-900/50 hover:bg-gray-900/70 rounded-lg text-purple-400 hover:text-purple-300 transition-all"
            >
              → Go to Login Page
            </a>
            <a
              href="/bot-dashboard"
              className="block p-3 bg-gray-900/50 hover:bg-gray-900/70 rounded-lg text-purple-400 hover:text-purple-300 transition-all"
            >
              → Go to Bot Dashboard
            </a>
            <a
              href={process.env.NEXT_PUBLIC_API_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-gray-900/50 hover:bg-gray-900/70 rounded-lg text-purple-400 hover:text-purple-300 transition-all"
            >
              → Open Backend URL ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
