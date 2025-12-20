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
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-md border border-slate-800/70 bg-slate-950/60 px-2.5 py-1.25">
        <Tag className="text-[10px] uppercase tracking-[0.2em]" variant="default">Instrument</Tag>
        <div className="min-w-0">
          <MetricLabel className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Active</MetricLabel>
          <p className="truncate text-[13px] font-semibold text-white/90">{label}</p>
        </div>
      </div>
      <div className="rounded-md border border-slate-800/70 bg-slate-950/60 px-2.5 py-1.25 text-right text-[13px] text-white/80">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Last</p>
        <p className="font-mono text-[14px] text-white/90">{lastPrice !== null ? lastPrice.toFixed(2) : "--"}</p>
      </div>
    </div>
  );
}
