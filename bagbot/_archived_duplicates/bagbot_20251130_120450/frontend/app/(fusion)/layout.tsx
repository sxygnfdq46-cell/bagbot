/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 20 — TRADING BRAIN FUSION
 * Layout Configuration
 * ═══════════════════════════════════════════════════════════════════
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trading Brain Fusion | BagBot Level 20',
  description: 'Neural Strategy Bridge • Intelligence-Driven Trading Interface',
};

export default function FusionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fusion-layout">
      {children}
    </div>
  );
}
