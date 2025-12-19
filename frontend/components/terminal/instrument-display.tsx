"use client";

import { useMemo } from "react";
import MetricLabel from "@/components/ui/metric-label";
import Tag from "@/components/ui/tag";

type InstrumentDisplayProps = {
  timeframe: string;
  instrument: string;
  lastPrice?: number | null;
};

export default function InstrumentDisplay({ timeframe, instrument, lastPrice = null }: InstrumentDisplayProps) {
  const label = useMemo(() => `${instrument} • ${timeframe.toUpperCase()}`, [instrument, timeframe]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
        <Tag className="text-[11px] uppercase tracking-[0.22em]" variant="default">Instrument</Tag>
        <div className="min-w-0">
          <MetricLabel className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Active</MetricLabel>
          <p className="truncate text-sm font-semibold text-white/90">{label}</p>
        </div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-right text-sm text-white/80">
        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Last</p>
        <p className="font-mono text-base text-white/90">{lastPrice !== null ? lastPrice.toFixed(2) : "--"}</p>
      </div>
    </div>
  );
}
