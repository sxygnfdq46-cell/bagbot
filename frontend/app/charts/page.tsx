"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Skeleton from "@/components/ui/skeleton";
import PriceChart from "@/components/ui/price-chart";
import Sparkline from "@/components/ui/sparkline";
import GlobalHeroBadge from "@/components/ui/global-hero-badge";
import MetricLabel from "@/components/ui/metric-label";
import TerminalShell from "@/components/ui/terminal-shell";
import { chartsApi, type ChartOverviewStat, type LiveFeedEvent, type MiniChart, type PricePoint } from "@/lib/api/charts";

const TIMEFRAMES = chartsApi.listTimeframes();
const ASSETS = chartsApi.listAssets();

export default function ChartsPage() {
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[0]);
  const [asset, setAsset] = useState(ASSETS[0]);
  const [chartPoints, setChartPoints] = useState<PricePoint[]>([]);
  const [miniCharts, setMiniCharts] = useState<MiniChart[]>([]);
  const [overviewStats, setOverviewStats] = useState<ChartOverviewStat[]>([]);
  const [pulse, setPulse] = useState<number[]>([]);
  const [feed, setFeed] = useState<LiveFeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    chartsApi
      .getSnapshot(asset, timeframe)
      .then((response) => {
        if (!mounted) return;
        setChartPoints(response.series);
        setMiniCharts(response.miniCharts);
        setOverviewStats(response.overview);
        setPulse(response.pulse);
        setFeed(response.feed);
      })
      .catch((error) => {
        if (!mounted) return;
        console.warn('[charts] snapshot failed', error);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [asset, timeframe]);

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      chartsApi
        .streamPulse(asset)
        .then((response) => {
          if (!mounted) return;
          setPulse(response.pulse);
          setFeed(response.feed);
        })
        .catch((error) => {
          if (!mounted) return;
          console.warn('[charts] pulse failed', error);
        });
    };
    const interval = setInterval(tick, 2200);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [asset]);

  return (
    <TerminalShell className="stack-gap-lg w-full">
      <GlobalHeroBadge
          badge="MARKET CANVAS"
          metaText="LIGHT LUXE"
          title="Charts Intelligence"
          description="Layered telemetry for every trade desk. Pin, compare, and stage premium visualizations without leaving the terminal."
          statusLabel="Feed"
          statusValue={`Synced • ${timeframe}`}
        />

      <section className="stack-gap-sm w-full">
        <header className="stack-gap-xxs w-full">
          <MetricLabel className="text-[color:var(--accent-gold)]">Market Canvas</MetricLabel>
          <h2 className="text-3xl font-semibold leading-tight">Stage premium charting intelligence</h2>
          <p className="muted-premium">
            Pin, compare, and stream layered telemetry without leaving the terminal view.
          </p>
        </header>
      </section>

      <Card title="Multi-section browser" subtitle="Dial-in timeframe + asset contexts">
        <div className="stack-gap-md">
          <div className="flex flex-wrap items-center gap-3">
            <div className="stack-gap-xxs">
              <MetricLabel>Timeframe</MetricLabel>
              <div className="flex flex-wrap gap-2">
                  {TIMEFRAMES.map((frame) => (
                    <Button
                      key={frame}
                      variant={frame === timeframe ? 'primary' : 'secondary'}
                      className="!px-4 !py-2 text-xs uppercase"
                      onClick={() => setTimeframe(frame)}
                      aria-pressed={frame === timeframe}
                    >
                      {frame}
                    </Button>
                  ))}
              </div>
            </div>
            <div className="stack-gap-xxs">
              <MetricLabel>Asset</MetricLabel>
              <select
                className="field-premium field-premium--select min-w-[180px]"
                value={asset}
                onChange={(event) => setAsset(event.target.value)}
              >
                  {ASSETS.map((ticker) => (
                    <option key={ticker} value={ticker}>
                      {ticker}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="grid-premium sm:grid-cols-2 lg:grid-cols-4">
            {overviewStats.map((stat) => (
              <div key={stat.label} className="info-tablet">
                <MetricLabel tone={stat.accent}>{stat.label}</MetricLabel>
                <p className="metric-value text-2xl" data-variant="muted">
                  {loading ? <Skeleton className="h-8 w-20" /> : stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card title="Quick overview" subtitle="Watchlist spark grid">
        <div className="grid-premium sm:grid-cols-2 xl:grid-cols-4">
          {miniCharts.map((chart) => (
            <div key={chart.symbol} className="dashboard-tile">
              <div className="flex items-center justify-between">
                <div>
                  <MetricLabel className="text-[color:var(--accent-gold)]">{chart.symbol}</MetricLabel>
                  <p className={`text-lg font-semibold ${chart.change >= 0 ? 'text-[color:var(--accent-green)]' : 'text-red-400'}`}>
                    {chart.change >= 0 ? '+' : ''}
                    {chart.change.toFixed(2)}%
                  </p>
                </div>
                <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--accent-cyan)]">{chart.volume}</span>
              </div>
              <div className="mt-4 h-20">
                {loading ? <Skeleton className="h-full w-full" /> : <Sparkline points={chart.points} />}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Deep dive" subtitle="Full-width market structure" padded={false}>
        <div className="stack-gap-lg p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <MetricLabel>{asset}</MetricLabel>
              <h2 className="text-3xl font-semibold">Premium liquidity track</h2>
            </div>
            <Button variant="secondary" isLoading={loading}>
              Refresh trace
            </Button>
          </div>
          <div className="rounded-[1.25rem] border border-[color:var(--border-soft)] bg-base/80 p-4">
            {loading ? <Skeleton className="h-48 w-full" /> : <PriceChart points={chartPoints} />}
          </div>
        </div>
      </Card>
      <Card title="Stream monitor" subtitle="WebSocket placeholder feed">
        <div className="grid-premium lg:grid-cols-2">
          <div className="stack-gap-md">
            <div className="info-tablet">
              <MetricLabel className="text-[color:var(--accent-gold)]">Live graph</MetricLabel>
              <div className="mt-4 h-28">
                {loading ? <Skeleton className="h-full w-full" /> : <Sparkline points={pulse} stroke="var(--accent-green)" height={90} />}
              </div>
            </div>
            <div className="dashboard-tile">
              <MetricLabel>Payload cadence</MetricLabel>
              <div className="mt-4 flex items-baseline gap-2">
                <p className="text-4xl font-semibold">{(pulse.at(-1) ?? 0).toFixed(0)}</p>
                <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--accent-cyan)]">ms</span>
              </div>
            </div>
          </div>
          <div className="surface-float stack-gap-sm">
            <MetricLabel className="text-[color:var(--accent-gold)]">Feed log</MetricLabel>
            <div className="no-scrollbar max-h-64 overflow-y-auto stack-gap-sm">
              {feed.map((event) => (
                <div key={event.id} className="rounded-[0.85rem] border border-[color:var(--border-soft)] bg-base/70 p-3">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[color:var(--accent-cyan)]">
                    <span>{event.channel}</span>
                    <span>{event.latency} ms</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--text-main)]">{event.payload}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </TerminalShell>
  );
}
