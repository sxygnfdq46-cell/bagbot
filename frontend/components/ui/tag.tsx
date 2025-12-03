'use client';

import { ReactNode } from 'react';

export type TagVariant = 'default' | 'success' | 'warning' | 'danger';

type TagProps = {
  children: ReactNode;
  variant?: TagVariant;
  className?: string;
};

export default function Tag({ children, variant = 'default', className = '' }: TagProps) {
  return (
    <span className={`tag-premium ${className}`.trim()} data-variant={variant}>
      {children}
    </span>
  );
}
