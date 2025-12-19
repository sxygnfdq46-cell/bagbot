"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { dashboardApi, type MarketPrice } from "@/lib/api/dashboard";
import MetricLabel from "@/components/ui/metric-label";
import Tag from "@/components/ui/tag";

const REFRESH_MS = 5200;

type BookLevel = {
  price: number;
  size: number;
  side: "bid" | "ask";
};

type TapePrint = {
  id: string;
  price: number;
  size: number;
  side: "buy" | "sell";
  timestamp: string;
};

export default function OrderbookPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [levels, setLevels] = useState<BookLevel[]>([]);
  const [tape, setTape] = useState<TapePrint[]>([]);
  const [status, setStatus] = useState<"loading" | "live" | "offline">("loading");
  const [symbol, setSymbol] = useState<string>("BTC-USD");

  useEffect(() => {
    if (!open) return undefined;
    let mounted = true;

    const buildSnapshot = (price: number) => {
      const mid = price || 30000;
      const levelsNext: BookLevel[] = [];
      const step = mid * 0.0008;
      for (let i = 1; i <= 8; i += 1) {
        levelsNext.push({ price: Number((mid - i * step).toFixed(2)), size: Number((Math.random() * 4 + 0.2).toFixed(2)), side: "bid" });
        levelsNext.push({ price: Number((mid + i * step).toFixed(2)), size: Number((Math.random() * 4 + 0.2).toFixed(2)), side: "ask" });
      }
      setLevels(levelsNext);

      const prints: TapePrint[] = Array.from({ length: 8 }).map((_, idx) => {
        const signed = Math.random() > 0.5 ? 1 : -1;
        const px = mid + signed * step * (Math.random() * 3);
        return {
          id: `print-${Date.now()}-${idx}`,
          price: Number(px.toFixed(2)),
          size: Number((Math.random() * 2 + 0.05).toFixed(2)),
          side: signed > 0 ? "buy" : "sell",
          timestamp: new Date(Date.now() - idx * 1200).toISOString()
        };
      });
      setTape(prints);
    };

    const load = async () => {
      try {
        const prices: MarketPrice[] = await dashboardApi.getLivePrices();
        const primary = Array.isArray(prices) && prices.length > 0 ? prices[0] : null;
        if (!mounted) return;
        setSymbol(primary?.symbol ?? "BTC-USD");
        buildSnapshot(primary?.price ?? 30000);
        setStatus("live");
      } catch (_error) {
        if (!mounted) return;
        setStatus("offline");
      }
    };

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [open]);

  const bids = useMemo(() => levels.filter((level) => level.side === "bid").sort((a, b) => b.price - a.price), [levels]);
  const asks = useMemo(() => levels.filter((level) => level.side === "ask").sort((a, b) => a.price - b.price), [levels]);
  const bestBid = bids[0]?.price ?? null;
  const bestAsk = asks[0]?.price ?? null;
  const spread = useMemo(() => {
    if (!bestBid || !bestAsk) return null;
    return Number((bestAsk - bestBid).toFixed(2));
  }, [bestAsk, bestBid]);

  return (
    <div
      className="pointer-events-none absolute inset-0 flex justify-end"
      aria-hidden={!open}
      style={{ zIndex: 23 }}
    >
      <PanelContainer open={open}>
        {open ? (
          <div className="flex h-full flex-col overflow-hidden">
            <header className="relative flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="space-y-1">
                <MetricLabel className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Order Book</MetricLabel>
                <p className="text-lg font-semibold text-white/90">Market microstructure</p>
                <p className="text-sm text-slate-300/80">Depth and tape context. Read-only.</p>
              </div>
              <div className="flex items-center gap-2">
                <Tag variant={status === "offline" ? "warning" : "default"}>{status === "offline" ? "OFFLINE" : "LIVE"}</Tag>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80 backdrop-blur transition hover:border-white/30 hover:text-white"
                  aria-label="Close Order Book panel"
                >
                  Close
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 pr-2">
              <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-inner shadow-black/30">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <MetricLabel className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Book</MetricLabel>
                    <p className="text-xl font-semibold text-white/90">{symbol}</p>
                  </div>
                  <div className="text-right text-sm text-slate-200/80">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Spread</p>
                    <p>{spread !== null ? spread.toFixed(2) : "–"}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-200/90">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      <span>Bids</span>
                      <span>Size</span>
                    </div>
                    <ul className="space-y-1">
                      {(bids.slice(0, 8)).map((level) => (
                        <li key={`bid-${level.price}`} className="flex items-center justify-between rounded-lg bg-emerald-400/5 px-3 py-1">
                          <span className="font-mono">{level.price.toFixed(2)}</span>
                          <span className="font-semibold text-emerald-200">{level.size.toFixed(2)}</span>
                        </li>
                      ))}
                      {bids.length === 0 ? <li className="text-xs text-slate-400">No bid depth.</li> : null}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      <span>Asks</span>
                      <span>Size</span>
                    </div>
                    <ul className="space-y-1">
                      {(asks.slice(0, 8)).map((level) => (
                        <li key={`ask-${level.price}`} className="flex items-center justify-between rounded-lg bg-red-400/5 px-3 py-1">
                          <span className="font-mono">{level.price.toFixed(2)}</span>
                          <span className="font-semibold text-red-200">{level.size.toFixed(2)}</span>
                        </li>
                      ))}
                      {asks.length === 0 ? <li className="text-xs text-slate-400">No ask depth.</li> : null}
                    </ul>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between">
                  <MetricLabel className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Time & Sales</MetricLabel>
                  <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Recent prints</span>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-200/90">
                  {tape.length === 0 ? (
                    <li className="text-sm text-slate-400">No recent prints.</li>
                  ) : (
                    tape.map((print) => (
                      <li key={print.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                        <div className="flex items-center gap-3">
                          <span className={`h-2.5 w-2.5 rounded-full ${print.side === "buy" ? "bg-emerald-400" : "bg-red-400"}`} aria-hidden />
                          <div>
                            <p className="font-mono text-base text-white/90">{print.price.toFixed(2)}</p>
                            <p className="text-xs text-slate-400">{new Date(print.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
                          </div>
                        </div>
                        <p className={`${print.side === "buy" ? "text-emerald-200" : "text-red-200"} font-semibold`}>{print.size.toFixed(2)}</p>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>
          </div>
        ) : null}
      </PanelContainer>
    </div>
  );
}

function PanelContainer({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className={`pointer-events-auto relative h-full w-[420px] max-w-[90vw] ${open ? "translate-x-0" : "translate-x-full"} overflow-hidden rounded-l-2xl border border-white/10 bg-slate-950/80 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-transform duration-300 ease-out`}
    >
      {children}
    </div>
  );
}
