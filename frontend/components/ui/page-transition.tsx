'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-transition flex w-full min-w-0 flex-col">
      {children}
    </div>
  );
}
