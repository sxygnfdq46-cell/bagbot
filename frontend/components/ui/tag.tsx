'use client';

import { ReactNode } from 'react';

export type TagVariant = 'default' | 'success' | 'warning' | 'danger';

export default function Tag({ children, variant = 'default' }: { children: ReactNode; variant?: TagVariant }) {
  return (
    <span className="tag-premium" data-variant={variant}>
      {children}
    </span>
  );
}
