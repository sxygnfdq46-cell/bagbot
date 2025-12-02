'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/button';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app-error]', error);
  }, [error]);

  return (
    <div className="error-stage">
      <div className="error-stage__pulse" aria-hidden />
      <div className="error-panel">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--accent-gold)]">System fault</p>
        <h2 className="text-3xl font-semibold">Something destabilized.</h2>
        <p className="text-sm text-[color:var(--text-main)] opacity-70">
          {error?.message ? `The interface hit an unexpected error: ${error.message}` : 'The interface hit an unexpected error.'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="error-primary flex-1" onClick={() => reset()}>
            Retry operation
          </Button>
          <Button
            className="flex-1"
            variant="ghost"
            onClick={() => {
              window.location.assign('/login');
            }}
          >
            Return to login
          </Button>
        </div>
        {error?.digest && (
          <p className="text-xs text-[color:var(--text-main)] opacity-50">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
