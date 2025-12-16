"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Skeleton from "@/components/ui/skeleton";
import OhlcPanel from "@/components/charts/ohlc-panel";
import Sparkline from "@/components/ui/sparkline";
import GlobalHeroBadge from "@/components/ui/global-hero-badge";
import MetricLabel from "@/components/ui/metric-label";
import TerminalShell from "@/components/ui/terminal-shell";
import {
  adaptCandlesToPriceData,
  adaptCandlesToVolumeData,
  type CandleSeries,
  createPriceVolumeSeries,
  createTvChart,
  toUtcSeconds,
  type VolumeSeries,
} from "@/lib/charts/tv";
import {
  chartsApi,
  type Candle,
  type ChartOverviewStat,
  type LiveFeedEvent,
  type MiniChart,
  type ChartSnapshot
} from "@/lib/api/charts";
import { resolveWsUrl } from "@/lib/api-client";
import type { MouseEventParams, SeriesMarker, Time } from "lightweight-charts";

type ChartHoverPayload = Candle & { index: number; time: number };
type ChartMarker = { id: string; action: string; timestamp: number; confidence?: number; reason?: string };

const TIMEFRAMES = chartsApi.listTimeframes();
const ASSETS = chartsApi.listAssets();
const CACHE_KEY = (asset: string, timeframe: string) => `charts-cache-${asset}-${timeframe}`;
const WINDOW_BY_TIMEFRAME: Record<string, number> = {
  '1H': 90,
  '4H': 140,
  '1D': 200,
  '1W': 240,
  '1M': 260,
};
const WINDOW_BUFFER = 12;
const DEFAULT_WINDOW = 180;
const MAX_MARKERS = 80;
const OBS_BADGE = "OBSERVATION MODE — READ-ONLY";

const resolveWindowSize = (frame: string) => WINDOW_BY_TIMEFRAME[frame?.toUpperCase?.() ?? frame] ?? DEFAULT_WINDOW;
const clampCandlesToWindow = (series: Candle[], frame: string) => {
  const windowSize = resolveWindowSize(frame);
  const limit = Math.max(windowSize + WINDOW_BUFFER, windowSize);
  return series.slice(-limit);
};

export default function ChartsPage() {
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[0]);
  const [asset, setAsset] = useState(ASSETS[0]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [miniCharts, setMiniCharts] = useState<MiniChart[]>([]);
  const [overviewStats, setOverviewStats] = useState<ChartOverviewStat[]>([]);
  const [pulse, setPulse] = useState<number[]>([]);
  const [feed, setFeed] = useState<LiveFeedEvent[]>([]);
  const [markers, setMarkers] = useState<ChartMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartMode, setChartMode] = useState<"full" | "mini">("full");
  const [focusMode, setFocusMode] = useState<"normal" | "focus" | "immersive">("normal");
  const [coachEnabled, setCoachEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredCandle, setHoveredCandle] = useState<ChartHoverPayload | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartSectionRef = useRef<HTMLDivElement | null>(null);
  const candleSeriesRef = useRef<CandleSeries | null>(null);
  const volumeSeriesRef = useRef<VolumeSeries | null>(null);
  const visibleCandlesRef = useRef<Candle[]>([]);
  const heroFeedStatus = `SYNCED • ${timeframe.toUpperCase()}`;
  const heroHint = `Asset ${asset}`;
  const windowSize = useMemo(() => resolveWindowSize(timeframe), [timeframe]);
  const isFocus = focusMode !== 'normal';
  const isImmersive = focusMode === 'immersive';
  const chartMinHeight = isImmersive ? "84vh" : "80vh";
  const resolvedChartHeight = isFullscreen ? "100vh" : chartMinHeight;

  const persistSnapshot = useCallback(
    (snapshot: Partial<ChartSnapshot>) => {
      try {
        const cache = {
          candles: snapshot.candles,
          miniCharts: snapshot.miniCharts,
          overview: snapshot.overview,
          pulse: snapshot.pulse,
          feed: snapshot.feed,
        };
        sessionStorage.setItem(CACHE_KEY(asset, timeframe), JSON.stringify(cache));
      } catch (_error) {
        /* ignore cache write failures */
      }
    },
    [asset, timeframe]
  );

  const applySnapshot = useCallback((snapshot: Awaited<ReturnType<typeof chartsApi.getSnapshot>>) => {
    const trimmedCandles = clampCandlesToWindow(snapshot.candles, timeframe);
    setCandles(trimmedCandles);
    setMiniCharts(snapshot.miniCharts);
    setOverviewStats(snapshot.overview);
    setPulse(snapshot.pulse);
    setFeed(snapshot.feed);
    setHoveredCandle(null);
    persistSnapshot({ ...snapshot, candles: trimmedCandles });
  }, [persistSnapshot, timeframe]);

  const loadSnapshot = useCallback(async () => {
    try {
      const cached = typeof window !== 'undefined' ? sessionStorage.getItem(CACHE_KEY(asset, timeframe)) : null;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.candles?.length) {
          const trimmedCandles = clampCandlesToWindow(parsed.candles ?? [], timeframe);
          setCandles(trimmedCandles);
          setMiniCharts(parsed.miniCharts ?? []);
          setOverviewStats(parsed.overview ?? []);
          setPulse(parsed.pulse ?? []);
          setFeed(parsed.feed ?? []);
          setHoveredCandle(null);
        }
      }
    } catch (_error) {
      /* ignore cache read failures */
    }
    return chartsApi.getSnapshot(asset, timeframe);
  }, [asset, timeframe]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loadSnapshot()
      .then((snapshot) => {
        if (!mounted) return;
        applySnapshot(snapshot);
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
  }, [loadSnapshot, applySnapshot]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    if (coarse || width < 820) {
      setFocusMode('immersive');
      setChartMode('full');
      return;
    }
    if (width < 1180 && focusMode === 'normal') {
      setFocusMode('focus');
    }
  }, [focusMode]);

  useEffect(() => {
    setCandles((current) => clampCandlesToWindow(current, timeframe));
  }, [timeframe]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const { chart, cleanup } = createTvChart(container);
    const { candleSeries, volumeSeries } = createPriceVolumeSeries(chart);
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleCrosshairMove = (event: MouseEventParams) => {
      if (!event.time || typeof event.time !== 'number') {
        setHoveredCandle(null);
        return;
      }

      const match = visibleCandlesRef.current.find(
        (candle) => toUtcSeconds(candle.timestamp) === event.time
      );

      if (!match) {
        setHoveredCandle(null);
        return;
      }

      setHoveredCandle({
        ...match,
        index: visibleCandlesRef.current.indexOf(match),
        time: match.timestamp,
      });
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      cleanup();
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const snapshot = await chartsApi.getSnapshot(asset, timeframe, { cache: "no-store" });
      applySnapshot(snapshot);
    } catch (error) {
      console.warn('[charts] manual refresh failed', error);
    } finally {
      setRefreshing(false);
    }
  }, [applySnapshot, asset, timeframe]);

  const visibleCandles = useMemo(() => candles.slice(-windowSize), [candles, windowSize]);

  useEffect(() => {
    visibleCandlesRef.current = visibleCandles;
    candleSeriesRef.current?.setData(adaptCandlesToPriceData(visibleCandles));
    volumeSeriesRef.current?.setData(adaptCandlesToVolumeData(visibleCandles));
  }, [visibleCandles]);

  const latestCandle = useMemo(() => {
    const last = visibleCandles.at(-1);
    if (!last) return null;
    return { ...last, index: visibleCandles.length - 1, time: last.timestamp } as ChartHoverPayload;
  }, [visibleCandles]);

  const activeCandle = hoveredCandle ?? latestCandle;

  const windowStart = visibleCandles[0]?.timestamp ?? null;
  const windowMarkers = useMemo(() => {
    const scoped = windowStart ? markers.filter((marker) => marker.timestamp >= windowStart) : markers;
    return scoped.slice(-MAX_MARKERS);
  }, [markers, windowStart]);

  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;

    if (!windowMarkers.length) {
      series.setMarkers([]);
      return;
    }

    const resolved: Array<SeriesMarker<Time>> = windowMarkers.map((marker) => {
      const action = marker.action?.toLowerCase?.() ?? "hold";
      const shape: SeriesMarker<Time>["shape"] = action === "sell" ? "arrowDown" : action === "buy" ? "arrowUp" : "circle";
      const color = action === "sell" ? "rgba(239,68,68,0.9)" : action === "buy" ? "rgba(16,185,129,0.9)" : "rgba(148,163,184,0.9)";
      const position: SeriesMarker<Time>["position"] = action === "sell" ? "aboveBar" : action === "buy" ? "belowBar" : "inBar";
      const confidence = Number.isFinite(marker.confidence) ? Math.max(0, Math.min(1, marker.confidence ?? 0)) : undefined;
      const percent = confidence !== undefined ? `${(confidence * 100).toFixed(0)}%` : null;
      const shortReason = (marker.reason ?? "").slice(0, 42);
      const text = [action.toUpperCase(), percent, shortReason].filter(Boolean).join(" · ");
      return {
        id: marker.id,
        time: toUtcSeconds(marker.timestamp),
        position,
        shape,
        color,
        text,
      };
    });

    series.setMarkers(resolved);
  }, [windowMarkers]);

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      chartsApi
        .streamPulse(asset)
        .then((response) => {
          if (!mounted) return;
          setPulse(response.pulse);
          setFeed(response.feed);
          if ('candles' in response && Array.isArray((response as any).candles)) {
            const nextCandles = clampCandlesToWindow((response as any).candles as Candle[], timeframe);
            setCandles(nextCandles);
          }
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

  useEffect(() => {
    // Synthetic price drift to keep the surface moving while in observation-only mode.
    const mutateNextCandle = () => {
      setCandles((current) => {
        if (!current.length) return current;
        const last = current[current.length - 1];
        const drift = (Math.random() - 0.5) * Math.max(1, last.close * 0.0015);
        const close = Math.max(0.01, last.close + drift);
        const high = Math.max(last.high, close + Math.random() * Math.max(1, last.close * 0.0008));
        const low = Math.min(last.low, close - Math.random() * Math.max(1, last.close * 0.0008));
        const volume = Math.max(10, last.volume * (0.9 + Math.random() * 0.2));
        const next: Candle = {
          timestamp: Date.now(),
          open: last.close,
          high,
          low,
          close,
          volume,
          source: 'MOCK',
          validForLearning: false,
        };
        return clampCandlesToWindow([...current, next], timeframe);
      });
    };

    const interval = setInterval(mutateNextCandle, 2600);
    return () => clearInterval(interval);
  }, [asset, timeframe]);

  useEffect(() => {
    // Persist the current view so refresh keeps playback continuity.
    if (!candles.length) return;
    persistSnapshot({ candles, miniCharts, overview: overviewStats, pulse, feed });
  }, [candles, miniCharts, overviewStats, pulse, feed, persistSnapshot]);

  useEffect(() => {
    setMarkers([]);
    setFallbackNotice(null);

    const url = resolveWsUrl('/ws/brain');
    let closed = false;
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(typeof event.data === 'string' ? event.data : 'null');
          if (!message) return;
          const channel = message.channel || message.type;
          if (channel === 'brain_decision') {
            const decision = message.data || message;
            const action = String(decision?.action || 'hold').toLowerCase();
            const timestamp = Date.parse(decision?.timestamp || '') || Date.now();
            const id = String(decision?.id || `${timestamp}-${action}`);
            const confidence = Number(decision?.confidence ?? decision?.intensity);
            const reason = typeof decision?.reason === 'string' ? decision.reason : (typeof decision?.outcome === 'string' ? decision.outcome : undefined);
            setMarkers((prev) => [...prev, { id, action, timestamp, confidence, reason }].slice(-MAX_MARKERS));
          }
        } catch (error) {
          console.warn('[charts] ws parse error', error);
        }
      };

      ws.onerror = () => {
        if (closed) return;
        setFallbackNotice('Live brain feed unavailable — showing simulated playback');
      };

      ws.onclose = () => {
        closed = true;
        setFallbackNotice('Live brain feed unavailable — showing simulated playback');
      };
    } catch (error) {
      console.warn('[charts] ws init failed', error);
      setFallbackNotice('Live brain feed unavailable — showing simulated playback');
    }

    return () => {
      closed = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [asset, timeframe]);

  return (
    <TerminalShell className="stack-gap-lg w-full max-w-full px-0" style={{ minHeight: "calc(100vh - 80px)" }}>
      <GlobalHeroBadge
          badge="MARKET CANVAS"
          metaText="LIGHT LUXE"
          title="Charts Intelligence"
          description="Layered telemetry for every trade desk. Pin, compare, and stage premium visualizations without leaving the terminal."
          statusAdornment={
            <div>
              <MetricLabel className="text-[color:var(--accent-gold)]">Feed</MetricLabel>
              <p className="text-lg font-semibold text-[color:var(--text-main)]">{heroFeedStatus}</p>
              <span className="status-indicator text-[color:var(--accent-cyan)]">{heroHint}</span>
            </div>
          }
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

      <div className="stack-gap-md">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--border-soft)]/50 bg-base/60 px-4 py-3 sm:px-6">
          <div className="rounded-xl border border-[color:var(--border-soft)]/80 bg-base/70 px-4 py-2 text-xs uppercase tracking-[0.35em] text-[color:var(--accent-gold)]">
            {OBS_BADGE}
            {fallbackNotice && (
              <span className="ml-3 text-[color:var(--accent-cyan)] normal-case tracking-tight">{fallbackNotice}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={chartMode === 'full' ? 'secondary' : 'ghost'}
              onClick={() => {
                setChartMode('full');
                setFocusMode('focus');
              }}
              aria-pressed={chartMode === 'full'}
            >
              Full view
            </Button>
            <Button
              variant={chartMode === 'mini' ? 'secondary' : 'ghost'}
              onClick={() => {
                setChartMode('mini');
                setFocusMode('normal');
              }}
              aria-pressed={chartMode === 'mini'}
            >
              Mini view
            </Button>
            <Button
              variant={isImmersive ? 'secondary' : 'ghost'}
              onClick={() => setFocusMode(isImmersive ? 'focus' : 'immersive')}
              aria-pressed={isImmersive}
              className="!px-4 !py-2"
            >
              Immersive
            </Button>
            <Button
              variant={isFullscreen ? 'secondary' : 'ghost'}
              onClick={() => {
                const section = chartSectionRef.current;
                if (!section) return;
                if (!document.fullscreenElement) {
                  section.requestFullscreen?.().catch((error) => {
                    console.warn('[charts] fullscreen request failed', error);
                  });
                } else {
                  document.exitFullscreen?.().catch((error) => {
                    console.warn('[charts] exit fullscreen failed', error);
                  });
                }
              }}
              aria-pressed={isFullscreen}
              className="!px-4 !py-2"
            >
              {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </Button>
            <Button
              variant={coachEnabled ? 'secondary' : 'ghost'}
              onClick={() => setCoachEnabled((state) => !state)}
              aria-pressed={coachEnabled}
              className="!px-4 !py-2"
            >
              Coach overlay
            </Button>
            <Button variant="secondary" onClick={handleRefresh} isLoading={refreshing} className="!px-4 !py-2">
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 rounded-2xl border border-[color:var(--border-soft)]/30 bg-base/40 p-4 sm:p-6">
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
          {!isImmersive && (
            <p className="muted-premium text-sm max-w-xl">
              Crosshair, tooltip, volume, and OHLC data are wired locally. Placeholder controls remain ready for backend streaming contracts.
            </p>
          )}
        </div>
      </div>

      <section
        ref={chartSectionRef}
        className={`relative isolate overflow-hidden rounded-3xl border border-[color:var(--border-soft)]/40 bg-base/40 transition-[height,transform] ${isFullscreen ? 'rounded-none border-none' : ''}`}
        style={{ minHeight: resolvedChartHeight, height: resolvedChartHeight }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_45%)]" aria-hidden />
        <div className="absolute right-4 top-4 z-[130]">
          <Button
            variant="secondary"
            onClick={() => {
              const section = chartSectionRef.current;
              if (!section) return;
              if (!document.fullscreenElement) {
                section.requestFullscreen?.().catch((error) => {
                  console.warn('[charts] fullscreen request failed', error);
                });
              } else {
                document.exitFullscreen?.().catch((error) => {
                  console.warn('[charts] exit fullscreen failed', error);
                });
              }
            }}
            aria-pressed={isFullscreen}
            className="px-4 py-2 text-xs uppercase tracking-[0.25em] shadow-lg"
          >
            {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          </Button>
        </div>
        <div className="relative w-full" style={{ minHeight: chartMinHeight, height: "100%" }}>
          <div className="absolute inset-0">
            <div ref={chartContainerRef} className="h-full w-full" />
          </div>
        </div>
      </section>

      <section className={`grid gap-4 md:grid-cols-[minmax(0,1fr)_360px] ${isFullscreen ? 'hidden' : ''}`}>
        <div className="stack-gap-md">
          <div className="grid gap-3 sm:grid-cols-2">
            <OhlcPanel candle={activeCandle} loading={loading || refreshing} />
            {!isImmersive && (
              <div className="rounded-2xl border border-dashed border-[color:var(--border-soft)] p-3 text-xs">
                <p className="text-[color:var(--accent-gold)]">Backend wiring placeholder</p>
                <p className="mt-1 text-sm text-[color:var(--text-main)] opacity-70">
                  WebSocket + REST endpoints will bind here for live executions once the contracts land in Phase 4.
                </p>
                <Button variant="ghost" className="mt-3 w-full opacity-70" disabled>
                  Awaiting feed binding
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="stack-gap-sm">
          <div className="rounded-2xl border border-[color:var(--border-soft)]/50 bg-base/70 p-4">
            <MetricLabel className="text-[color:var(--accent-gold)]">View modes</MetricLabel>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant={focusMode !== 'normal' ? 'secondary' : 'ghost'} onClick={() => setFocusMode('focus')} className="!px-3 !py-1 text-xs uppercase">
                Focus
              </Button>
              <Button variant={isImmersive ? 'secondary' : 'ghost'} onClick={() => setFocusMode(isImmersive ? 'focus' : 'immersive')} className="!px-3 !py-1 text-xs uppercase">
                Immersive
              </Button>
              <Button variant="ghost" onClick={() => setChartMode('full')} className="!px-3 !py-1 text-xs uppercase">
                Return to live layout
              </Button>
            </div>
          </div>

          {isFocus && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
              {overviewStats.map((stat) => (
                <div key={stat.label} className="info-tablet">
                  <MetricLabel tone={stat.accent}>{stat.label}</MetricLabel>
                  <p className="metric-value text-2xl" data-variant="muted">
                    {loading ? <Skeleton className="h-8 w-20" /> : stat.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      {!isImmersive && !isFullscreen && (
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
      )}
      {!isImmersive && !isFullscreen && (
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
      )}
    </TerminalShell>
  );
}
