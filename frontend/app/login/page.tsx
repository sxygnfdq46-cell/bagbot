'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button';
import { authTokenStore } from '@/lib/api-client';
import { auth } from '@/lib/api/auth';
import { useToast } from '@/components/ui/toast-provider';
import { useAuthToken } from '@/app/store/auth-store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { notify } = useToast();
  const { token } = useAuthToken();

  useEffect(() => {
    if (!token) return;
    router.replace('/dashboard');
  }, [token, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage('');
    try {
      const data = await auth.login({ email, password });
      if (!data?.token) {
        throw new Error('Missing token in response');
      }
      authTokenStore.set(data.token);
      setMessage('Access granted. Redirecting...');
      notify({
        title: 'Authenticated',
        description: data.user?.name ? `Welcome back, ${data.user.name}` : 'Secure session established',
        variant: 'success'
      });
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Login failed';
      setMessage(description);
      notify({ title: 'Login failed', description, variant: 'error' });
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 sm:px-6">
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
          <Button type="submit" className="w-full" isLoading={pending} loadingText="Verifying access...">
            Enter Terminal
          </Button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-[color:var(--accent-cyan)]">{message}</p>}
      </div>
    </section>
  );
}
