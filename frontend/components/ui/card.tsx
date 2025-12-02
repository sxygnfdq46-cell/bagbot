"use client";

import { ReactNode } from "react";

type CardProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  padded?: boolean;
};

export default function Card({ title, subtitle, action, children, padded = true }: CardProps) {
  return (
    <section className={`premium-card border border-[color:var(--border-soft)] bg-card shadow-card backdrop-blur-sm ${padded ? 'p-5 sm:p-6' : ''}`}>
      {(title || subtitle || action) && (
        <div className="card-section flex flex-wrap items-start justify-between gap-3 pb-4">
          <div className="min-w-0 space-y-1">
            {title && <h3 className="text-lg font-semibold leading-tight text-[color:var(--text-main)]">{title}</h3>}
            {subtitle && (
              <p className="text-sm muted-premium">
                {subtitle}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
