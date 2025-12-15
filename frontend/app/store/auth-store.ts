'use client';

import { useEffect, useMemo, useState } from 'react';
import { Buffer } from 'buffer';
import { tokenStore } from '@/lib/token-store';

type TokenClaims = {
  role?: string;
  user?: { role?: string };
  mode?: string;
  [key: string]: unknown;
};

const decodeClaims = (token: string | null): TokenClaims | null => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const base64 = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
    const raw = typeof window === 'undefined'
      ? Buffer.from(base64, 'base64').toString('utf-8')
      : window.atob(base64);
    return JSON.parse(raw);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[auth-store] Failed to decode token claims', error);
    }
    return null;
  }
};

export const getRoleFromToken = (token: string | null) => {
  const claims = decodeClaims(token);
  if (!claims) return null;
  return (claims.user as { role?: string } | undefined)?.role ?? claims.role ?? null;
};

export const getModeFromToken = (token: string | null) => {
  const claims = decodeClaims(token);
  if (!claims) return null;
  return (claims.mode as string | undefined) ?? null;
};

export const authStore = {
  getToken: () => tokenStore.getToken(),
  setToken: (token: string) => tokenStore.setToken(token),
  clearToken: () => tokenStore.clearToken(),
  isAuthenticated: () => Boolean(tokenStore.getToken()),
  subscribe: (listener: (value: string | null) => void) => tokenStore.subscribe(listener)
};

export function useAuthToken() {
  const [token, setTokenState] = useState<string | null>(() => authStore.getToken());

  useEffect(() => {
    return authStore.subscribe((value) => setTokenState(value));
  }, []);

  const role = useMemo(() => getRoleFromToken(token), [token]);
  const mode = useMemo(() => getModeFromToken(token), [token]);

  return {
    token,
    role,
    mode,
    isAuthenticated: Boolean(token)
  };
}
