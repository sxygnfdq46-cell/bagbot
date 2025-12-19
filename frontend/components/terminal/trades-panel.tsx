"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { dashboardApi, type Position, type Trade } from "@/lib/api/dashboard";
import MetricLabel from "@/components/ui/metric-label";
import Tag from "@/components/ui/tag";

const REFRESH_MS = 7000;

export default function TradesPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [status, setStatus] = useState<"loading" | "live" | "offline">("loading");

  useEffect(() => {
    if (!open) return undefined;
    let mounted = true;

    const load = async () => {
      try {
        const [nextPositions, nextTrades] = await Promise.all([
          dashboardApi.getPositions(),
          dashboardApi.getRecentTrades()
        ]);
        if (!mounted) return;
        setPositions(Array.isArray(nextPositions) ? nextPositions : []);
        setTrades(Array.isArray(nextTrades) ? nextTrades : []);
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

  const pnlTotal = useMemo(
    () => positions.reduce((sum, position) => sum + (Number(position.pnl) || 0), 0),
    [positions]
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 flex justify-end"
      aria-hidden={!open}
      style={{ zIndex: 22 }}
    >
      <PanelContainer open={open}>
        {open ? (
          <div className="flex h-full flex-col overflow-hidden">
            <header className="relative flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="space-y-1">
                <MetricLabel className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Trades</MetricLabel>
                <p className="text-lg font-semibold text-white/90">Execution state</p>
                <p className="text-sm text-slate-300/80">Open positions and recent fills. Read-only.</p>
              </div>
              <div className="flex items-center gap-2">
                <Tag variant={status === "offline" ? "warning" : "default"}>{status === "offline" ? "OFFLINE" : "LIVE"}</Tag>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80 backdrop-blur transition hover:border-white/30 hover:text-white"
                  aria-label="Close Trades panel"
                >
                  Close
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 pr-2">
              <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-inner shadow-black/30">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <MetricLabel className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Open Positions</MetricLabel>
                    <p className="text-xl font-semibold text-white/90">{positions.length || 0} active</p>
                  </div>
                  <div className="text-right text-sm text-slate-200/80">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Unrealized PnL</p>
                    <p
                      className={`text-right text-sm font-semibold ${Number(pnlTotal) >= 0 ? "text-emerald-300" : "text-red-300"}`}
                    >
                      {pnlTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
                <ul className="mt-3 space-y-3">
                  {positions.length === 0 ? (
                    <li className="text-sm text-slate-300/70">No open positions.</li>
                  ) : (
                    positions.map((position) => (
                      <li key={position.id} className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-200/90">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-white/90">{position.symbol}</p>
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Size {position.size}</p>
                          </div>
                          <div className="text-right text-xs text-slate-300/80">
                            <p>Entry {position.entryPrice}</p>
                            <p>Last {position.currentPrice}</p>
                          </div>
                          <div
                            className={`text-right text-sm font-semibold ${Number(position.pnl ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"}`}
                          >
                            {Number(position.pnl ?? 0).toFixed(2)}
                          </div>
                        </div>
                        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">{position.status ?? "Monitoring"}</p>
                      </li>
                    ))
                  )}
                </ul>
              </section>

              <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between">
                  <MetricLabel className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Recent Trades</MetricLabel>
                  <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Latest fills</span>
                </div>
                <ul className="mt-3 space-y-3">
                  {trades.length === 0 ? (
                    <li className="text-sm text-slate-300/70">No trades yet.</li>
                  ) : (
                    trades.map((trade) => (
                      <li key={trade.id} className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-200/90">
                        <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                          <span>{trade.timestamp}</span>
                          <span>{trade.symbol}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-3">
                          <p className="text-base font-semibold text-white/90">Size {trade.size}</p>
                          <p className={`${Number(trade.pnl ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                            {(trade.pnl ?? 0).toFixed(2)}
                          </p>
                        </div>
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
