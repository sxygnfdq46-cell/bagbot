'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NeonCard } from '@/components/neon/NeonCard';
import { NeonButton } from '@/components/neon/NeonButton';
import { NeonBadge } from '@/components/neon/NeonBadge';
import { AlertPanel } from '@/components/ui/alert-panel';
import { AIOrb } from '@/components/ui/ai-orb';
import { Lock, Mail, User, Eye, EyeOff, UserPlus, Check } from 'lucide-react';

const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    description: 'Perfect for beginners',
    features: [
      '3 active strategies',
      'Basic analytics',
      'Email support',
      '1 exchange connection',
      'Community access',
    ],
    color: 'gray',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    description: 'For serious traders',
    features: [
      'Unlimited strategies',
      'Advanced analytics',
      'Priority support',
      'Unlimited exchanges',
      'AI chat assistant',
      'Custom notifications',
      'API access',
    ],
    color: 'cyan',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    description: 'Maximum performance',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Custom strategies',
      'White-label option',
      'Advanced risk controls',
      'Data export',
      'SLA guarantee',
    ],
    color: 'magenta',
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'account' | 'tier'>('account');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedTier, setSelectedTier] = useState('pro');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setStep('tier');
  };

  const handleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tier: selectedTier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Store token and redirect
      localStorage.setItem('auth_token', data.token);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderAccountForm = () => (
    <form onSubmit={handleAccountSubmit} className="space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Username</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="trader_pro"
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your.email@example.com"
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            required
            minLength={8}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-12 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="••••••••"
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-12 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <NeonButton type="submit" variant="primary" className="w-full">
        Continue to Plan Selection
      </NeonButton>
    </form>
  );

  const renderTierSelection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((tier) => (
          <button
            key={tier.id}
            onClick={() => setSelectedTier(tier.id)}
            className={`relative text-left transition-all ${
              selectedTier === tier.id ? 'scale-105' : 'scale-100'
            }`}
          >
            <NeonCard
              glow={tier.color as any}
              className={`p-6 h-full ${
                selectedTier === tier.id ? 'ring-2 ring-offset-2 ring-offset-gray-900' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <NeonBadge color="cyan">Most Popular</NeonBadge>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-200">{tier.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{tier.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-cyan-400">
                    ${tier.price}
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>

              <ul className="space-y-3">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {selectedTier === tier.id && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold">
                    <Check className="w-5 h-5" />
                    Selected
                  </div>
                </div>
              )}
            </NeonCard>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <NeonButton
          variant="outline"
          onClick={() => setStep('account')}
          className="flex-1"
        >
          Back
        </NeonButton>
        <NeonButton
          variant="primary"
          onClick={handleSignup}
          disabled={loading}
          className="flex-1 gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              Create Account
            </>
          )}
        </NeonButton>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-magenta-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Signup Card */}
      <div className="relative w-full max-w-4xl">
        <NeonCard glow="cyan" className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <AIOrb size="lg" thinking={false} />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-magenta-500 bg-clip-text text-transparent mb-2">
              {step === 'account' ? 'Create Your Account' : 'Choose Your Plan'}
            </h1>
            <p className="text-gray-400">
              {step === 'account'
                ? 'Join thousands of traders using AI-powered strategies'
                : 'Select the plan that fits your trading goals'}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step === 'account' ? 'text-cyan-400' : 'text-green-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step === 'account' ? 'border-cyan-400 bg-cyan-400/20' : 'border-green-400 bg-green-400/20'
              }`}>
                {step === 'tier' ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-sm font-medium">Account</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-700" />
            <div className={`flex items-center gap-2 ${step === 'tier' ? 'text-cyan-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step === 'tier' ? 'border-cyan-400 bg-cyan-400/20' : 'border-gray-700 bg-gray-800'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Plan</span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6">
              <AlertPanel type="error" title="Error" message={error} />
            </div>
          )}

          {/* Form Content */}
          {step === 'account' ? renderAccountForm() : renderTierSelection()}

          {/* Login Link */}
          {step === 'account' && (
            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </NeonCard>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
