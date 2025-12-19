"use client";

import { useEffect, useMemo, useState } from "react";
import MetricLabel from "@/components/ui/metric-label";
import Tag from "@/components/ui/tag";
import { dashboardApi, type MarketPrice } from "@/lib/api/dashboard";

const FALLBACK_SYMBOL = "BTC-USD";
const FALLBACK_TIMEFRAME = "1h";

export default function InstrumentDisplay() {
  const [symbol, setSymbol] = useState(FALLBACK_SYMBOL);
  const [lastPrice, setLastPrice] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const prices: MarketPrice[] = await dashboardApi.getLivePrices();
        if (!mounted) return;
        const primary = Array.isArray(prices) && prices.length > 0 ? prices[0] : null;
        if (primary?.symbol) setSymbol(primary.symbol);
        if (Number.isFinite(primary?.price)) setLastPrice(Number(primary?.price));
      } catch (_error) {
        /* silent fallback */
      }
    };
    load();
    const interval = setInterval(load, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const label = useMemo(() => `${symbol} • ${FALLBACK_TIMEFRAME.toUpperCase()}`, [symbol]);

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
