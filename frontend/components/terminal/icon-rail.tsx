"use client";

type IconRailProps = {
  onOpenSignals: () => void;
  signalsActive: boolean;
  onOpenBrain: () => void;
  brainActive: boolean;
  onOpenTrades: () => void;
  tradesActive: boolean;
  onOpenOrderbook: () => void;
  orderbookActive: boolean;
  onOpenTimeline: () => void;
  timelineActive: boolean;
};
const glyphs = [IconSpark, IconWave, IconStack, IconPulse, IconGrid, IconCode];

export default function IconRail({ onOpenSignals, signalsActive, onOpenBrain, brainActive, onOpenTrades, tradesActive, onOpenOrderbook, orderbookActive, onOpenTimeline, timelineActive }: IconRailProps) {
  const items = [
    { Glyph: glyphs[0], onClick: onOpenSignals, active: signalsActive, label: "Open Signals panel" },
    { Glyph: glyphs[1], onClick: onOpenBrain, active: brainActive, label: "Open Brain panel" },
    { Glyph: glyphs[2], onClick: onOpenTrades, active: tradesActive, label: "Open Trades panel" },
    { Glyph: glyphs[3], onClick: onOpenOrderbook, active: orderbookActive, label: "Open Order Book panel" },
    { Glyph: glyphs[4], onClick: onOpenTimeline, active: timelineActive, label: "Open Decision Timeline" },
  ];

  return (
    <aside
      className="flex w-14 flex-col items-center gap-2.5 border-r border-slate-800/80 bg-slate-950/70 px-2 py-3 text-slate-200/70"
      aria-label="Terminal tool rail"
    >
      {items.map(({ Glyph, onClick, active, label }, idx) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          aria-pressed={active}
          aria-label={label}
          className={`flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800/70 bg-slate-900/60 shadow-inner shadow-black/15 transition ${active ? "border-cyan-200/50 bg-slate-900/80" : "hover:border-slate-200/30"}`}
        >
          <Glyph className="h-5 w-5 opacity-90" />
        </button>
      ))}

      <span
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900/60 shadow-inner shadow-black/15"
        aria-hidden
      >
        <IconCode className="h-5 w-5 opacity-80" />
      </span>
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
