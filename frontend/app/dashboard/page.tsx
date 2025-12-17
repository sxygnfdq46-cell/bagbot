"use client";

import { useEffect } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Skeleton from "@/components/ui/skeleton";
import PriceChart from "@/components/ui/price-chart";
import { useToast } from "@/components/ui/toast-provider";
import { useDashboardData } from "./use-dashboard-data";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import GlobalHeroBadge from "@/components/ui/global-hero-badge";
import MetricLabel from "@/components/ui/metric-label";
import TerminalShell from "@/components/ui/terminal-shell";
import { useRuntimeSnapshot } from "@/lib/runtime/use-runtime-snapshot";

const currency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value ?? 0);

export default function DashboardPage() {
  const { loading, error, prices, positions, trades, status, portfolioValue, totalPnl, chartPoints, reload, notice } =
    useDashboardData();
  const { snapshot: runtimeSnapshot, loading: runtimeLoading } = useRuntimeSnapshot();
  const { notify } = useToast();
  const safeMode = runtimeSnapshot.system.safeMode === true;
  const heroMode = safeMode ? 'SAFE MODE' : status?.mode ? status.mode.toUpperCase() : 'STANDBY';
  const heroHint = safeMode ? 'Execution paused' : status?.latencyMs ? `${status.latencyMs} ms latency` : 'Live telemetry';

  useEffect(() => {
    if (error) {
      notify({ title: "Dashboard data issue", description: error, variant: "error" });
    }
  }, [error, notify]);

  return (
    <ProtectedRoute>
      <TerminalShell className="stack-gap-lg">
        <div className="rounded-xl border border-[color:var(--border-soft)] bg-base/70 px-4 py-3 text-sm text-[color:var(--accent-gold)]">
          OBSERVATION MODE — READ-ONLY (NO LIVE TRADING)
        </div>
        <GlobalHeroBadge
          badge="PORTFOLIO"
          metaText="LIVE INTELLIGENCE"
          title="Command Dashboard"
          description="Live telemetry across portfolio value, system health, and execution feeds."
          statusAdornment={
            <div>
              <MetricLabel className="text-[color:var(--accent-gold)]">Mode</MetricLabel>
              <p className="text-lg font-semibold text-[color:var(--text-main)]">{heroMode}</p>
              <span className="status-indicator text-[color:var(--accent-cyan)]">{heroHint}</span>
            </div>
          }
        />
        {notice && (
          <p className="text-sm text-[color:var(--accent-gold)]">Backend fallback: {notice}</p>
        )}
        {error && (
          <p className="text-sm text-red-400">Dashboard data issue: {error}</p>
        )}
        <section className="stack-gap-sm w-full">
          <header className="stack-gap-xxs w-full">
            <MetricLabel className="text-[color:var(--accent-gold)]">Portfolio Overview</MetricLabel>
            <div className="stack-gap-xxs sm:flex sm:items-end sm:justify-between sm:gap-4">
              <div className="stack-gap-xxs max-w-3xl">
                <h2 className="text-3xl font-semibold leading-tight">Live intelligence feed</h2>
                <p className="muted-premium">
                  Monitor capital posture, health, and execution in a single synchronized surface.
                </p>
              </div>
              <div className="stack-gap-xxs w-full sm:w-auto sm:flex sm:flex-wrap sm:justify-end sm:gap-3">
                <Button variant="secondary" onClick={reload} isLoading={loading}>
                  Refresh snapshot
                </Button>
              </div>
            </div>
          </header>
        </section>

        <div className="grid-premium sm:grid-cols-2 lg:grid-cols-3">
          <Card title="Portfolio Value" subtitle="Real-time valuation">
            {loading ? (
              <Skeleton className="h-12 w-48" />
            ) : (
              <p className="metric-value" data-variant="muted">
                {currency(portfolioValue)}
              </p>
            )}
            <p className="mt-2 text-sm text-[color:var(--accent-green)]">
              Daily PnL {loading ? <Skeleton className="mt-1 h-4 w-20" /> : <span className="metric-value text-base" data-variant="success">{currency(totalPnl)}</span>}
            </p>
            <div className="mt-4 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-base/80 p-4">
              {chartPoints.length ? <PriceChart points={chartPoints} /> : <Skeleton className="h-28 w-full" />}
            </div>
          </Card>
          <Card title="System Status" subtitle="Core health overview">
            {(loading || runtimeLoading) && !runtimeSnapshot.system.status ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <StatusRow label="Uptime" value={runtimeSnapshot.system.status?.uptime ?? status?.uptime ?? "--"} />
                <StatusRow label="Latency" value={(runtimeSnapshot.system.status?.latencyMs ?? status?.latencyMs) ? `${runtimeSnapshot.system.status?.latencyMs ?? status?.latencyMs} ms` : "--"} />
                <StatusRow label="Mode" value={safeMode ? "Safe Mode" : runtimeSnapshot.system.status?.mode ?? status?.mode ?? "Standby"} />
              </dl>
            )}
          </Card>
          <Card title="Open Positions" subtitle={`${positions.length} active`}>
            <div className="space-y-3">
              {loading && !positions.length && <Skeleton className="h-16 w-full" />}
              {positions.slice(0, 4).map((position) => (
                <div
                  key={position.id ?? position.symbol}
                  className="data-soft-fade flex items-center justify-between rounded-[0.75rem] border border-[color:var(--border-soft)] bg-base/70 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{position.symbol}</p>
                    <p className="text-xs muted-premium">
                      {position.size} @ {currency(position.entryPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{currency(position.currentPrice)}</p>
                    <p className={position.pnl >= 0 ? 'text-[color:var(--accent-green)]' : 'text-red-400'}>
                      {currency(position.pnl)}
                    </p>
                  </div>
                </div>
              ))}
              {!loading && positions.length === 0 && (
                <p className="text-sm muted-premium">No active positions.</p>
              )}
            </div>
          </Card>
        </div>

        <Card title="Live Markets" subtitle="Streaming pricing intelligence">
          <div className="grid-premium sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading && !prices.length && [0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-24 w-full" />)}
            {prices.slice(0, 4).map((asset) => (
              <div
                key={asset.symbol}
                className="data-soft-fade rounded-[0.75rem] border border-[color:var(--border-soft)] bg-base/70 p-4 transition-all hover:border-[color:var(--accent-cyan)]"
              >
                <MetricLabel className="text-[color:var(--accent-green)]">{asset.symbol}</MetricLabel>
                <p className="mt-2 text-2xl font-semibold">{currency(asset.price)}</p>
                <p className={`text-sm ${asset.change && asset.change >= 0 ? 'text-[color:var(--accent-green)]' : 'text-red-400'}`}>
                  {asset.change ? `${asset.change.toFixed(2)}%` : '--'}
                </p>
              </div>
            ))}
            {!loading && !prices.length && (
              <p className="text-sm muted-premium">No market data received.</p>
            )}
          </div>
        </Card>

        <Card title="Positions Table" subtitle="Risk-weighted exposure overview">
          {loading && !positions.length ? (
            <Skeleton className="h-32 w-full" />
          ) : positions.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-widest text-[color:var(--accent-gold)]">
                    <th className="pb-3">Symbol</th>
                    <th className="pb-3">Size</th>
                    <th className="pb-3">Entry</th>
                    <th className="pb-3">Mark</th>
                    <th className="pb-3">PnL</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border-soft)]">
                  {positions.map((position) => (
                    <tr key={`table-${position.id ?? position.symbol}`} className="data-soft-fade transition hover:bg-base/40">
                      <td className="py-3 font-semibold">{position.symbol}</td>
                      <td className="py-3">{position.size}</td>
                      <td className="py-3">{currency(position.entryPrice)}</td>
                      <td className="py-3">{currency(position.currentPrice)}</td>
                      <td className={`py-3 font-semibold ${position.pnl >= 0 ? 'text-[color:var(--accent-green)]' : 'text-red-400'}`}>
                        {currency(position.pnl)}
                      </td>
                      <td className="py-3 text-xs uppercase tracking-widest text-[color:var(--accent-cyan)]">
                        {position.status ?? 'Active'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm muted-premium">No open positions to display.</p>
          )}
        </Card>

        <Card title="Recent Trades" subtitle="Chronological execution log">
          <div className="divide-y divide-[color:var(--border-soft)] text-sm">
            {loading && !trades.length && [0, 1, 2].map((index) => <Skeleton key={index} className="h-12 w-full" />)}
            {trades.slice(0, 6).map((trade) => (
              <div key={trade.id ?? trade.timestamp} className="data-soft-fade flex flex-wrap items-center justify-between gap-4 py-3">
                <div className="min-w-[160px]">
                  <p className="font-medium">{trade.symbol}</p>
                  <p className="text-xs muted-premium">
                    {new Date(trade.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p>{trade.size} units</p>
                  <p
                    className={
                      typeof trade.pnl === 'number'
                        ? trade.pnl >= 0
                          ? 'text-[color:var(--accent-green)]'
                          : 'text-red-400'
                        : 'text-[color:var(--accent-cyan)]'
                    }
                  >
                    {typeof trade.pnl === 'number' ? currency(trade.pnl) : 'PnL unavailable'}
                  </p>
                </div>
              </div>
            ))}
            {!loading && trades.length === 0 && (
              <p className="py-4 muted-premium">No trades executed.</p>
            )}
          </div>
        </Card>
      </TerminalShell>
    </ProtectedRoute>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="opacity-70">{label}</span>
      <span className="data-soft-fade font-semibold">{value}</span>
    </div>
  );
}
