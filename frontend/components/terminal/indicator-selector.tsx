"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MetricLabel from "@/components/ui/metric-label";
import Tag from "@/components/ui/tag";
import type { ChartIndicator } from "@/app/charts/chart-canvas";

const DEFAULT_INDICATORS: ChartIndicator[] = ["ema", "vwap", "rsi"];

const LABELS: Record<ChartIndicator, string> = {
  ema: "EMA",
  vwap: "VWAP",
  rsi: "RSI",
};

type IndicatorSelectorProps = {
  active: ChartIndicator[];
  onToggle: (indicator: ChartIndicator) => void;
  options?: ChartIndicator[];
};

export default function IndicatorSelector({ active, onToggle, options }: IndicatorSelectorProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const list = useMemo(() => (options && options.length ? options : DEFAULT_INDICATORS), [options]);
  const summary = active.length ? active.map((key) => LABELS[key]).join(", ") : "None";

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    if (open) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }

    return undefined;
  }, [open]);

  const handleToggle = (indicator: ChartIndicator) => {
    onToggle(indicator);
    setOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white/90 transition hover:border-white/25"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Tag className="text-[11px] uppercase tracking-[0.22em]" variant="default">Indicators</Tag>
        <span className="truncate text-left text-xs uppercase tracking-[0.08em] text-slate-200/90">{summary}</span>
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-20 mt-2 min-w-[200px] overflow-hidden rounded-lg border border-white/10 bg-slate-900/90 p-2 shadow-xl backdrop-blur">
          <div className="mb-2 px-2">
            <MetricLabel className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Toggle overlays</MetricLabel>
          </div>
          <div role="listbox" aria-label="Indicators" className="space-y-1">
            {list.map((indicator) => {
              const enabled = active.includes(indicator);
              return (
                <button
                  key={indicator}
                  type="button"
                  role="option"
                  aria-selected={enabled}
                  onClick={() => handleToggle(indicator)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition ${
                    enabled ? "bg-white/10 text-white" : "text-slate-200 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="tracking-[0.08em]">{LABELS[indicator]}</span>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-300">{enabled ? "On" : "Off"}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
