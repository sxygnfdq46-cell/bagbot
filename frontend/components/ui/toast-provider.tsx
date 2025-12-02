'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastRecord = ToastOptions & { id: string; createdAt: number };

type ToastContextValue = {
  notify: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 4200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timerId = timersRef.current.get(id);
    if (timerId) {
      clearTimeout(timerId);
      timersRef.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (options: ToastOptions) => {
      setToasts((prev) => {
        const variant = options.variant ?? 'info';
        const duplicate = prev.some(
          (toast) => toast.title === options.title && toast.description === options.description && toast.variant === variant
        );
        if (duplicate) {
          return prev;
        }

        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const durationMs = options.durationMs ?? DEFAULT_DURATION;
        const record: ToastRecord = {
          id,
          createdAt: Date.now(),
          ...options,
          variant
        };

        const timerId = window.setTimeout(() => removeToast(id), durationMs);
        timersRef.current.set(id, timerId);

        return [...prev, record];
      });
    },
    [removeToast]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timerId) => clearTimeout(timerId));
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-card backdrop-blur-sm transition-all ${
              toast.variant === 'error'
                ? 'border-red-500/30 bg-red-950/70 text-red-100'
                : toast.variant === 'success'
                  ? 'border-green-500/30 bg-emerald-950/70 text-green-100'
                  : 'border-[color:var(--border-soft)] bg-card/80 text-[color:var(--text-main)]'
            }`}
          >
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.description && (
              <p className="text-xs opacity-80">{toast.description}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
