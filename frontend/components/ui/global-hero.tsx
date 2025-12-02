'use client';

import { ReactNode } from 'react';

export default function GlobalHero({
  eyebrow = 'THE BAGBOT',
  headline = 'World Intelligence Terminal',
  description
}: {
  eyebrow?: string;
  headline?: string;
  description?: ReactNode;
}) {
  return (
    <div className="stack-gap-xxs">
      <p className="metric-label text-[color:var(--accent-gold)]">{eyebrow}</p>
      <p className="metric-value text-3xl leading-tight" data-variant="muted">
        {headline}
      </p>
      {description ? <div className="muted-premium text-sm">{description}</div> : null}
    </div>
  );
}
