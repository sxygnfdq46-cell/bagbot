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

const currency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value ?? 0);

export default function DashboardPage() {
  const { loading, error, prices, positions, trades, status, portfolioValue, totalPnl, chartPoints, reload } =
    useDashboardData();
  const { notify } = useToast();

  useEffect(() => {
    if (error) {
      notify({ title: "Dashboard data issue", description: error, variant: "error" });
    }
  }, [error, notify]);

  return (
    <ProtectedRoute>
      <div className="stack-gap-lg">
        <GlobalHeroBadge
          badge="PORTFOLIO"
          metaText="LIVE INTELLIGENCE"
          title="Command Dashboard"
          description="Live telemetry across portfolio value, system health, and execution feeds."
          statusLabel="Mode"
          statusValue={status?.mode ?? "Standby"}
        />
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[220px] flex-1 space-y-1">
            <p className="metric-label text-[color:var(--accent-gold)]">Portfolio Overview</p>
            <h2 className="text-3xl font-semibold">Live intelligence feed</h2>
          </div>
          <div className="flex w-full flex-wrap gap-3 sm:ml-auto sm:w-auto sm:justify-end">
            <Button variant="secondary" onClick={reload} isLoading={loading}>
              Refresh snapshot
            </Button>
          </div>
        </div>

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
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <StatusRow label="Uptime" value={status?.uptime ?? "--"} />
                <StatusRow label="Latency" value={status?.latencyMs ? `${status.latencyMs} ms` : "--"} />
                <StatusRow label="Mode" value={status?.mode ?? "Standby"} />
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
                <p className="metric-label text-[color:var(--accent-green)]">{asset.symbol}</p>
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
                  <p className={trade.pnl >= 0 ? 'text-[color:var(--accent-green)]' : 'text-red-400'}>
                    {currency(trade.pnl)}
                  </p>
                </div>
              </div>
            ))}
            {!loading && trades.length === 0 && (
              <p className="py-4 muted-premium">No trades executed.</p>
            )}
          </div>
        </Card>
      </div>
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
