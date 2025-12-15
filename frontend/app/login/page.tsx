'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button';
import { ApiError, authTokenStore } from '@/lib/api-client';
import { auth } from '@/lib/api/auth';
import { useToast } from '@/components/ui/toast-provider';
import { useAuthToken } from '@/app/store/auth-store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'success' | 'muted' } | null>(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotPending, setForgotPending] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [accessOpen, setAccessOpen] = useState(false);
  const [accessEmail, setAccessEmail] = useState('');
  const [accessReason, setAccessReason] = useState('');
  const [accessPending, setAccessPending] = useState(false);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const router = useRouter();
  const { notify } = useToast();
  const { token, role, mode } = useAuthToken();

  const modeLabel = useMemo(() => (mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : role === 'admin' ? 'Admin' : 'Observation'), [mode, role]);

  useEffect(() => {
    if (!token) return;
    const destination = role === 'admin' ? '/admin' : '/dashboard';
    router.replace(destination);
  }, [token, role, router]);

  const formatError = (error: unknown) => {
    if (error instanceof ApiError) {
      const detail = (error.body as { detail?: string; message?: string })?.detail || error.message;
      if (error.status === 401) return detail || 'Invalid credentials';
      if (error.status === 403) return detail || 'Access blocked';
      return detail || 'Authentication failed';
    }
    if (error instanceof Error) return error.message;
    return 'Authentication failed';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const data = await auth.login({ email, password });
      if (!data?.token) {
        throw new Error('Missing token in response');
      }
      authTokenStore.set(data.token);
      setIssuedToken(data.token);
      setMessage({ text: 'Access granted. Review token then continue.', tone: 'success' });
      setTokenModalOpen(true);
      notify({
        title: 'Authenticated',
        description: data.user?.name ? `Welcome back, ${data.user.name}` : 'Secure session established',
        variant: 'success'
      });
      const destination = data.user?.role === 'admin' ? '/admin' : '/dashboard';
      setTimeout(() => {
        router.replace(destination);
      }, 600);
    } catch (error) {
      const description = formatError(error);
      setMessage({ text: description, tone: 'error' });
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[login] auth failure', { error });
      }
      notify({ title: 'Login failed', description, variant: 'error' });
    } finally {
      setPending(false);
    }
  };

  const handleForgotSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForgotPending(true);
    setForgotMessage(null);
    try {
      await auth.forgotPassword({ email: forgotEmail });
      setForgotMessage('If this email exists, reset instructions were sent.');
    } catch (error) {
      setForgotMessage('Unable to process request right now.');
    } finally {
      setForgotPending(false);
    }
  };

  const accessModeLabel = mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : role === 'admin' ? 'Admin' : 'Observation';

  const handleRequestAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccessPending(true);
    setAccessMessage(null);
    try {
      await auth.requestAccess({ email: accessEmail, reason: accessReason });
      setAccessMessage('Request received. We will review and respond.');
    } catch (error) {
      setAccessMessage('Unable to submit request right now.');
    } finally {
      setAccessPending(false);
    }
  };

  const copyToken = async () => {
    if (!issuedToken) return;
    try {
      await navigator.clipboard.writeText(issuedToken);
      notify({ title: 'Token copied', description: 'API token copied to clipboard', variant: 'success' });
    } catch {
      notify({ title: 'Copy failed', description: 'Select and copy token manually', variant: 'error' });
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="data-soft-fade w-full max-w-md rounded-[2rem] border border-[color:var(--border-soft)] bg-card p-6 shadow-card sm:p-8 lg:p-10">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--accent-gold)]">BagBot Access</p>
        <h2 className="mt-3 text-3xl font-semibold">Authenticate</h2>
        <p className="mt-2 text-sm text-[color:var(--text-main)] opacity-70">
          Priority access channel for principals only.
        </p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
              className="field-premium"
              placeholder="you@fund.com"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
              className="field-premium"
              placeholder="••••••••"
            />
          </label>
          <div className="flex items-center justify-between text-xs text-[color:var(--text-main)] opacity-80">
            <button type="button" className="text-[color:var(--accent-cyan)] hover:opacity-80" onClick={() => setAccessOpen(true)}>
              Request access
            </button>
            <button type="button" className="text-[color:var(--accent-cyan)] hover:opacity-80" onClick={() => setForgotOpen(true)}>
              Forgot password?
            </button>
          </div>
          <Button type="submit" className="w-full" isLoading={pending} loadingText="Verifying access...">
            Enter Terminal
          </Button>
        </form>
        {message && (
          <p
            className={`mt-4 text-center text-sm ${message.tone === 'error' ? 'text-red-400' : message.tone === 'success' ? 'text-[color:var(--accent-green)]' : 'text-[color:var(--text-main)]/70'}`}
          >
            {message.text}
          </p>
        )}
        <p className="mt-6 text-center text-xs uppercase tracking-[0.35em] text-[color:var(--text-main)]/70">
          Access Mode: {accessModeLabel}
        </p>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-[color:var(--border-soft)] bg-card p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent-gold)]">Password Reset</p>
                <h3 className="mt-2 text-xl font-semibold">Forgot password</h3>
                <p className="mt-1 text-sm text-[color:var(--text-main)] opacity-70">
                  Enter your email. If it exists, we will send reset instructions.
                </p>
              </div>
              <button className="text-sm text-[color:var(--text-main)] opacity-70" onClick={() => setForgotOpen(false)}>
                Close
              </button>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleForgotSubmit}>
              <label className="flex flex-col gap-2 text-sm">
                <span>Email</span>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setForgotEmail(event.target.value)}
                  className="field-premium"
                  placeholder="you@fund.com"
                  required
                />
              </label>
              <div className="flex items-center justify-end gap-3">
                <button type="button" className="text-sm text-[color:var(--text-main)] opacity-70" onClick={() => setForgotOpen(false)}>
                  Cancel
                </button>
                <Button type="submit" isLoading={forgotPending} loadingText="Sending...">
                  Send reset link
                </Button>
              </div>
            </form>
            {forgotMessage && <p className="mt-4 text-sm text-[color:var(--accent-green)]">{forgotMessage}</p>}
          </div>
        </div>
      )}

      {accessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-[color:var(--border-soft)] bg-card p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent-gold)]">Access Request</p>
                <h3 className="mt-2 text-xl font-semibold">Request access</h3>
                <p className="mt-1 text-sm text-[color:var(--text-main)] opacity-70">Submit your email and reason for controlled access.</p>
              </div>
              <button className="text-sm text-[color:var(--text-main)] opacity-70" onClick={() => setAccessOpen(false)}>
                Close
              </button>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleRequestAccess}>
              <label className="flex flex-col gap-2 text-sm">
                <span>Email</span>
                <input
                  type="email"
                  value={accessEmail}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setAccessEmail(event.target.value)}
                  className="field-premium"
                  placeholder="you@fund.com"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span>Reason</span>
                <textarea
                  value={accessReason}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setAccessReason(event.target.value)}
                  className="field-premium"
                  placeholder="Observation access request"
                  rows={3}
                  required
                />
              </label>
              <div className="flex items-center justify-end gap-3">
                <button type="button" className="text-sm text-[color:var(--text-main)] opacity-70" onClick={() => setAccessOpen(false)}>
                  Cancel
                </button>
                <Button type="submit" isLoading={accessPending} loadingText="Submitting...">
                  Submit request
                </Button>
              </div>
            </form>
            {accessMessage && <p className="mt-4 text-sm text-[color:var(--accent-green)]">{accessMessage}</p>}
          </div>
        </div>
      )}

      {tokenModalOpen && issuedToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl rounded-2xl border border-[color:var(--border-soft)] bg-card p-6 shadow-card space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent-gold)]">Session Token</p>
                <h3 className="mt-2 text-xl font-semibold">Authenticated</h3>
                <p className="mt-1 text-sm text-[color:var(--text-main)] opacity-70">Access mode: {modeLabel} · Role: {role ?? 'observer'}</p>
              </div>
              <button className="text-sm text-[color:var(--text-main)] opacity-70" onClick={() => setTokenModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--text-main)]/70">API Token (read-only)</p>
              <div className="rounded-xl border border-[color:var(--border-soft)] bg-base/70 p-3 text-xs break-all text-[color:var(--text-main)]">
                {issuedToken}
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={copyToken}>
                  Copy token
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setTokenModalOpen(false);
                    router.replace(role === 'admin' ? '/admin' : '/dashboard');
                  }}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
