"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Skeleton from "@/components/ui/skeleton";
import MetricLabel from "@/components/ui/metric-label";
import TerminalShell from "@/components/ui/terminal-shell";
import Tag from "@/components/ui/tag";
import { useToast } from "@/components/ui/toast-provider";
import { paperApi, type PaperSummary } from "@/lib/api/paper";

export default function PaperTradesPage() {
  const { notify } = useToast();
  const [summary, setSummary] = useState<PaperSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paperApi.getSummary();
      setSummary(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load paper summary";
      setError(message);
      notify({ title: "Paper summary unavailable", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // single fetch on mount; manual refresh only
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const equity = summary?.equity ?? 0;
  const cash = summary?.cash ?? 0;
  const realized = summary?.realizedPnl ?? 0;
  const unrealized = summary?.unrealizedPnl ?? 0;

  return (
    <TerminalShell className="stack-gap-lg">
      <div className="rounded-xl border border-[color:var(--border-soft)] bg-base/70 px-4 py-3 text-sm text-[color:var(--accent-gold)]">
        OBSERVATION MODE — READ-ONLY (NO LIVE TRADING)
      </div>
      <header className="stack-gap-xxs">
        <MetricLabel className="text-[color:var(--accent-gold)]">Paper Execution</MetricLabel>
        <h1 className="text-3xl font-semibold leading-tight">Trades & Positions</h1>
        <p className="muted-premium">Read-only visibility into paper execution posture.</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={load} isLoading={loading}>
            Refresh snapshot
          </Button>
          {summary?.source === "mock" && (
            <Tag variant="warning">Mock fallback{summary.notice ? ` — ${summary.notice}` : ""}</Tag>
          )}
          {summary?.source === "backend" && <Tag variant="success">Backend snapshot</Tag>}
          {error && <Tag variant="danger">{error}</Tag>}
        </div>
      </header>

      <div className="grid-premium sm:grid-cols-2">
        <Card title="Equity" subtitle="Total account value">
          {loading ? <Skeleton className="h-10 w-32" /> : <p className="metric-value">${equity.toLocaleString()}</p>}
        </Card>
        <Card title="Cash" subtitle="Available">
          {loading ? <Skeleton className="h-10 w-32" /> : <p className="metric-value">${cash.toLocaleString()}</p>}
        </Card>
        <Card title="Realized PnL" subtitle="Settled">
          {loading ? <Skeleton className="h-10 w-32" /> : <p className="metric-value">${realized.toLocaleString()}</p>}
        </Card>
        <Card title="Unrealized PnL" subtitle="Open risk">
          {loading ? <Skeleton className="h-10 w-32" /> : <p className="metric-value">${unrealized.toLocaleString()}</p>}
        </Card>
      </div>

      <Card title="Open Positions" subtitle="Paper-only exposure">
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : summary?.positions?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
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
                {summary.positions.map((position) => (
                  <tr key={position.id} className="data-soft-fade">
                    <td className="py-3 font-semibold">{position.symbol}</td>
                    <td className="py-3">{position.size}</td>
                    <td className="py-3">${position.entryPrice.toLocaleString()}</td>
                    <td className="py-3">${position.markPrice.toLocaleString()}</td>
                    <td className={`py-3 font-semibold ${position.pnl >= 0 ? 'text-[color:var(--accent-green)]' : 'text-red-400'}`}>
                      ${position.pnl.toLocaleString()}
                    </td>
                    <td className="py-3 text-xs uppercase tracking-widest text-[color:var(--accent-cyan)]">
                      {position.status ?? 'open'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm muted-premium">No open positions.</p>
        )}
      </Card>

      <Card title="Recent Trades" subtitle="Simulated fills">
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : summary?.trades?.length ? (
          <div className="divide-y divide-[color:var(--border-soft)] text-sm">
            {summary.trades.map((trade) => (
              <div key={trade.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-[160px]">
                  <p className="font-semibold">{trade.symbol}</p>
                  <p className="text-xs muted-premium">{new Date(trade.timestamp).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p>
                    {trade.side?.toUpperCase?.()} {trade.size} @ ${trade.price.toLocaleString()}
                  </p>
                  {trade.pnl !== undefined && (
                    <p className={trade.pnl >= 0 ? 'text-[color:var(--accent-green)]' : 'text-red-400'}>
                      ${trade.pnl.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm muted-premium">No trades recorded.</p>
        )}
      </Card>

      <Card title="Rejections" subtitle="Orders refused in paper mode">
        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : summary?.rejections?.length ? (
          <ul className="stack-gap-sm text-sm">
            {summary.rejections.map((rej) => (
              <li key={rej.id} className="data-soft-fade rounded-[0.75rem] border border-[color:var(--border-soft)] bg-base/70 p-3">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[color:var(--accent-cyan)]">
                  <span>{new Date(rej.timestamp).toLocaleTimeString()}</span>
                  <span>REJECTION</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[color:var(--text-main)]">{rej.reason}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm muted-premium">No rejections recorded.</p>
        )}
      </Card>
    </TerminalShell>
  );
}
