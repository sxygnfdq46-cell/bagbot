'use client';

import { ReactNode } from 'react';
import Tag from '@/components/ui/tag';

export type GlobalHeroBadgeProps = {
  badge?: string;
  title: string;
  description?: ReactNode;
  statusLabel?: string;
  statusValue?: string;
  metaText?: string;
};

export default function GlobalHeroBadge({
  badge = 'PREMIUM MODE',
  title,
  description,
  statusLabel = 'Status',
  statusValue = 'Streaming',
  metaText = 'LIVE CONTROL'
}: GlobalHeroBadgeProps) {
  return (
    <section className="hero-badge surface-card border border-[color:var(--border-soft)] bg-card shadow-card">
      <div className="stack-gap-xxs flex-1 min-w-[240px]">
        <div className="hero-badge__meta text-[color:var(--accent-gold)]">
          <Tag variant="warning">{badge}</Tag>
          <span>{metaText}</span>
        </div>
        <h1 className="text-3xl font-semibold leading-tight text-[color:var(--text-main)]">{title}</h1>
        {description ? <p className="muted-premium max-w-3xl text-sm sm:text-base">{description}</p> : null}
      </div>
      <div className="hero-badge__status space-y-1 text-sm">
        <p className="metric-label text-[color:var(--accent-gold)]">{statusLabel}</p>
        <p className="text-xl font-semibold">{statusValue}</p>
        <p className="muted-premium text-xs">Auto-refresh enabled</p>
      </div>
    </section>
  );
}
