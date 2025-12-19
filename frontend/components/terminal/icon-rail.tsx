"use client";

type IconRailProps = {
  onOpenSignals: () => void;
  signalsActive: boolean;
  onOpenBrain: () => void;
  brainActive: boolean;
  onOpenTrades: () => void;
  tradesActive: boolean;
};

const glyphs = [IconSpark, IconWave, IconStack, IconPulse, IconGrid, IconCode];

export default function IconRail({ onOpenSignals, signalsActive, onOpenBrain, brainActive, onOpenTrades, tradesActive }: IconRailProps) {
  return (
    <aside
      className="flex w-14 flex-col items-center gap-3 border-r border-white/5 bg-slate-900/40 px-2 py-4 text-slate-200/70"
      aria-label="Terminal tool rail"
    >
      {glyphs.map((Glyph, idx) => {
        const interactive = idx === 0 || idx === 1 || idx === 2;
        if (interactive) {
          const isSignals = idx === 0;
          const isBrain = idx === 1;
          const isTrades = idx === 2;
          const active = isSignals ? signalsActive : isBrain ? brainActive : tradesActive;
          const handleClick = isSignals ? onOpenSignals : isBrain ? onOpenBrain : onOpenTrades;
          const label = isSignals ? "Open Signals panel" : isBrain ? "Open Brain panel" : "Open Trades panel";
          return (
            <button
              key={idx}
              type="button"
              onClick={handleClick}
              aria-pressed={active}
              aria-label={label}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/10 shadow-inner shadow-black/20 transition ${active ? "ring-2 ring-[color:var(--accent-cyan)]" : "hover:border-white/15"}`}
            >
              <Glyph className="h-5 w-5 opacity-90" />
            </button>
          );
        }

        return (
          <span
            key={idx}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 shadow-inner shadow-black/20"
            aria-hidden
          >
            <Glyph className="h-5 w-5 opacity-80" />
          </span>
        );
      })}
    </aside>
  );
}

function IconSpark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M12 3v5m0 8v5m-6-6h5m2 0h5m-9.5-7.5 3 3m2.5 2.5 3 3m0-8.5-3 3m-2.5 2.5-3 3" />
    </svg>
  );
}

function IconWave({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M3 12c2.5-3 5.5-3 8 0s5.5 3 8 0" />
      <path d="M3 7c2.5-3 5.5-3 8 0s5.5 3 8 0" opacity="0.45" />
      <path d="M3 17c2.5-3 5.5-3 8 0s5.5 3 8 0" opacity="0.45" />
    </svg>
  );
}

function IconStack({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M4.5 9 12 5l7.5 4-7.5 4L4.5 9Z" />
      <path d="M4.5 13 12 9l7.5 4-7.5 4L4.5 13Z" opacity="0.7" />
      <path d="M4.5 17 12 13l7.5 4-7.5 4L4.5 17Z" opacity="0.5" />
    </svg>
  );
}

function IconPulse({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M3 13h4l2-6 4 12 2-6h4" />
    </svg>
  );
}

function IconGrid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </svg>
  );
}

function IconCode({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="m9 7-5 5 5 5" />
      <path d="m15 7 5 5-5 5" />
      <path d="M13 4 11 20" opacity="0.6" />
    </svg>
  );
}
