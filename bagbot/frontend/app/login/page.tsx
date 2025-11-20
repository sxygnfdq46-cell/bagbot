'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/**
 * Login Page - Beautiful maroon, cream & gold theme
 */
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get('reset') === 'success';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      // Redirect handled by AuthContext
    } catch (err: any) {
      setLocalError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0810] via-[#1A0E15] to-[#150A12] flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(199,91,122,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(249,217,73,0.12)_0%,transparent_50%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/landing" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C75B7A] to-[#F9D949] flex items-center justify-center shadow-lg shadow-[#C75B7A]/50">
            <Sparkles className="w-7 h-7 text-[#FFF8E7]" />
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-[#FFF8E7] to-[#F9D949] bg-clip-text text-transparent">
            BagBot
          </span>
        </Link>

        {/* Login Card */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-[#2A1721]/90 to-[#1A0E15]/90 border border-[#C75B7A]/30 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#FFF8E7] mb-2">Welcome Back</h1>
            <p className="text-[#D4B5C4]">Sign in to continue to your dashboard</p>
          </div>

          {/* Success Message */}
          {resetSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-[#4ADE80]/10 border border-[#4ADE80]/30 flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-[#4ADE80] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[#4ADE80] font-medium">Password reset successful!</p>
                <p className="text-[#4ADE80]/80 text-sm mt-1">You can now sign in with your new password.</p>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {localError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
              <p className="text-[#EF4444] text-sm">{localError}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#FFF8E7] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4B5C4]" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1A0E15]/50 border border-[#C75B7A]/30 text-[#FFF8E7] placeholder-[#D4B5C4]/50 focus:outline-none focus:border-[#F9D949]/50 focus:ring-2 focus:ring-[#F9D949]/20 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#FFF8E7] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4B5C4]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-[#1A0E15]/50 border border-[#C75B7A]/30 text-[#FFF8E7] placeholder-[#D4B5C4]/50 focus:outline-none focus:border-[#F9D949]/50 focus:ring-2 focus:ring-[#F9D949]/20 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D4B5C4] hover:text-[#F9D949] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-[#F9D949] hover:text-[#FDE68A] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C75B7A] to-[#F9D949] text-[#FFF8E7] font-bold text-lg hover:scale-105 transform transition-all shadow-lg shadow-[#C75B7A]/50 hover:shadow-xl hover:shadow-[#F9D949]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#FFF8E7]/30 border-t-[#FFF8E7] rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 pt-6 border-t border-[#C75B7A]/20 text-center">
            <p className="text-[#D4B5C4]">
              Don't have an account?{' '}
              <Link href="/register" className="text-[#F9D949] hover:text-[#FDE68A] font-semibold transition-colors">
                Create one now
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Landing */}
        <div className="text-center mt-6">
          <Link
            href="/landing"
            className="text-[#D4B5C4] hover:text-[#F9D949] transition-colors text-sm"
          >
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
