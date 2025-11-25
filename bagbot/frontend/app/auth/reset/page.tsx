'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NeonCard } from '@/components/neon/NeonCard';
import { NeonButton } from '@/components/neon/NeonButton';
import { AlertPanel } from '@/components/ui/alert-panel';
import { AIOrb } from '@/components/ui/ai-orb';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Reset failed');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-magenta-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Reset Card */}
      <div className="relative w-full max-w-md">
        <NeonCard glow="cyan" className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {success ? (
                <CheckCircle className="w-16 h-16 text-green-400" />
              ) : (
                <AIOrb size="lg" thinking={false} />
              )}
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-magenta-500 bg-clip-text text-transparent mb-2">
              {success ? 'Check Your Email' : 'Reset Password'}
            </h1>
            <p className="text-gray-400">
              {success
                ? 'We\'ve sent password reset instructions to your email'
                : 'Enter your email to receive reset instructions'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6">
              <AlertPanel type="error" title="Error" message={error} />
            </div>
          )}

          {success ? (
            <div className="space-y-6">
              <AlertPanel
                type="success"
                title="Email Sent"
                message="Please check your email and follow the instructions to reset your password. The link will expire in 1 hour."
              />
              <Link href="/auth/login">
                <NeonButton variant="primary" className="w-full gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  Back to Login
                </NeonButton>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <NeonButton
                type="submit"
                variant="primary"
                className="w-full gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Send Reset Link
                  </>
                )}
              </NeonButton>

              <Link href="/auth/login">
                <NeonButton variant="outline" className="w-full gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </NeonButton>
              </Link>
            </form>
          )}
        </NeonCard>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact support@bagbot.ai
          </p>
        </div>
      </div>
    </div>
  );
}
