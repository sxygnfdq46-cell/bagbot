'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthToken } from '@/app/store/auth-store';

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole?: string;
};

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { token, role } = useAuthToken();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    if (requiredRole && role && role !== requiredRole) {
      router.replace('/dashboard');
      return;
    }

    if (requiredRole && !role) {
      router.replace('/dashboard');
      return;
    }

    setHasChecked(true);
  }, [requiredRole, role, router, token]);

  if (!hasChecked) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Securing your premium experience…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
