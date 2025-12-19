"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MetricLabel from "@/components/ui/metric-label";
import Tag from "@/components/ui/tag";
import type { ChartCompare } from "@/app/charts/chart-canvas";

const DEFAULT_COMPARES: ChartCompare[] = ["off", "EURUSD", "GBPUSD", "XAUUSD", "NAS100", "BTCUSD"];

const LABELS: Record<ChartCompare, string> = {
  off: "Off",
  EURUSD: "EURUSD",
  GBPUSD: "GBPUSD",
  XAUUSD: "XAUUSD",
  NAS100: "NAS100",
  BTCUSD: "BTCUSD",
};

type CompareSelectorProps = {
  compare: ChartCompare;
  onSelect: (value: ChartCompare) => void;
  options?: ChartCompare[];
};

export default function CompareSelector({ compare, onSelect, options }: CompareSelectorProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const list = useMemo(() => (options && options.length ? options : DEFAULT_COMPARES), [options]);

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

  const handleSelect = (value: ChartCompare) => {
    onSelect(value);
    setOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
          compare === "off"
            ? "border-white/10 bg-white/5 text-white/90 hover:border-white/25"
            : "border-emerald-300/30 bg-emerald-500/10 text-white"
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Tag className="text-[11px] uppercase tracking-[0.22em]" variant="default">Compare</Tag>
        <span className="text-xs uppercase tracking-[0.08em] text-slate-200/90">{LABELS[compare]}</span>
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-20 mt-2 min-w-[220px] overflow-hidden rounded-lg border border-white/10 bg-slate-900/90 p-2 shadow-xl backdrop-blur">
          <div className="mb-2 px-2">
            <MetricLabel className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Select compare</MetricLabel>
          </div>
          <div role="listbox" aria-label="Compare" className="space-y-1">
            {list.map((value) => {
              const active = value === compare;
              return (
                <button
                  key={value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => handleSelect(value)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition ${
                    active ? "bg-white/10 text-white" : "text-slate-200 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="tracking-[0.08em]">{LABELS[value]}</span>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-300">{active ? "Active" : "Select"}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
