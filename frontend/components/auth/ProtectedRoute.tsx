'use client';

import { ReactNode } from 'react';

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole?: string;
};

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  // TEMPORARY BYPASS: frontend preview does not require authentication yet.
  // When backend auth is wired, restore the previous checks here.
  return <>{children}</>;
}
