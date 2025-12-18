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
import { createIndicatorRenderer, type IndicatorMap } from "@/lib/charts/tv/tv-indicators";
import {
  chartsApi,
  type Candle,
  type ChartOverviewStat,
  type LiveFeedEvent,
  type MiniChart,
  type ChartSnapshot
} from "@/lib/api/charts";
import { resolveWsUrl } from "@/lib/api-client";
import { LineStyle, type IChartApi, type MouseEventParams, type SeriesMarker, type Time } from "lightweight-charts";

type ChartHoverPayload = Candle & { index: number; time: number };
type ChartMarker = { id: string; action: string; timestamp: number; confidence?: number; reason?: string; count?: number };
type ConfidencePoint = { time: number; value: number; action?: string; phase?: string };
type ConfidenceInflection = { time: number; from: number; to: number; direction: 'up' | 'down'; action?: string; phase?: string };

type ExplainIndicatorPoint = {
  time: number;
  value?: number;
  macd?: number;
  signal?: number;
  histogram?: number;
  color?: string;
};

type ExplainIndicatorSeries = Record<string, ExplainIndicatorPoint[]>;

type ExplainVote = { indicator: string; role?: string; state?: string; support?: string; strength?: number };

type ExplainDecision = {
  time: number;
  action: string;
  phase?: "entry" | "hold" | "exit";
  strategy?: string;
  confidence?: number;
  indicator_states?: Record<string, { value?: number; state?: string }>;
  indicator_votes?: ExplainVote[];
  blocks?: string[];
  reasoning?: string;
};

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
const CONFIDENCE_SCALE_ID = "confidence-pane";

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
  const [indicatorSeriesMap, setIndicatorSeriesMap] = useState<IndicatorMap | null>(null);
  const [decisionTimeline, setDecisionTimeline] = useState<ExplainDecision[]>([]);
  const [hoveredCandle, setHoveredCandle] = useState<ChartHoverPayload | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartSectionRef = useRef<HTMLDivElement | null>(null);
  const candleSeriesRef = useRef<CandleSeries | null>(null);
  const volumeSeriesRef = useRef<VolumeSeries | null>(null);
  const indicatorRendererRef = useRef<ReturnType<typeof createIndicatorRenderer> | null>(null);
  const decisionConnectorRef = useRef<ReturnType<IChartApi["addLineSeries"]> | null>(null);
  const positionBandRef = useRef<ReturnType<IChartApi["addAreaSeries"]> | null>(null);
  const confidenceSeriesRef = useRef<ReturnType<IChartApi["addAreaSeries"]> | null>(null);
  const confidenceInflectionRef = useRef<ReturnType<IChartApi["addHistogramSeries"]> | null>(null);
  const confidenceRiskRef = useRef<ReturnType<IChartApi["addHistogramSeries"]> | null>(null);
  const visibleCandlesRef = useRef<Candle[]>([]);
  const heroFeedStatus = `SYNCED • ${timeframe.toUpperCase()}`;
  const heroHint = `Asset ${asset}`;
  const windowSize = useMemo(() => resolveWindowSize(timeframe), [timeframe]);
  const isFocus = focusMode !== 'normal';
  const isImmersive = focusMode === 'immersive';
  const chartMinHeight = isImmersive ? "84vh" : "80vh";
  const resolvedChartHeight = isFullscreen ? "100vh" : chartMinHeight;

  const decorateIndicatorSeries = useCallback((seriesMap: ExplainIndicatorSeries | null, timeline: ExplainDecision[]): IndicatorMap | null => {
    if (!seriesMap || !Object.keys(seriesMap).length) return null;

    const supportMap = new Map<string, Set<number>>();
    const blockMap = new Map<string, Set<number>>();
    const activeByTime = new Map<number, Set<string>>();

    timeline.forEach((decision) => {
      const time = Number(decision.time);
      if (!Number.isFinite(time)) return;
      const active = activeByTime.get(time) ?? new Set<string>();

      // Votes explicitly reference indicators.
      decision.indicator_votes?.forEach((vote) => {
        const key = vote.indicator;
        if (!key) return;
        active.add(key);
        const support = (vote.support || "support").toLowerCase();
        const bucket = support.includes("exit") || support.includes("block") || support.includes("short") ? blockMap : supportMap;
        if (!bucket.has(key)) bucket.set(key, new Set());
        bucket.get(key)?.add(time);
      });

      // Indicator state mentions also count as active context.
      Object.keys(decision.indicator_states ?? {}).forEach((key) => {
        active.add(key);
      });

      if (active.size) {
        activeByTime.set(time, active);
      }
    });

    const decorated: IndicatorMap = {};
    const baseColor = "rgba(148,163,184,0.25)";

    Object.entries(seriesMap).forEach(([indicator, rows]) => {
      const resolved = rows
        .map((row) => {
          const time = Number(row.time);
          if (!Number.isFinite(time)) return null;
          const activeSet = activeByTime.get(time);
          const supported = supportMap.get(indicator)?.has(time);
          const blocked = blockMap.get(indicator)?.has(time);
          let color = typeof row.color === 'string' ? row.color : baseColor;
          if (activeSet?.has(indicator) && !supported && !blocked) {
            color = "rgba(148,163,184,0.65)";
          }
          if (supported) color = "rgba(16,185,129,0.9)";
          if (blocked) color = "rgba(239,68,68,0.78)";
          return { ...row, color } as ExplainIndicatorPoint;
        })
        .filter(Boolean) as ExplainIndicatorPoint[];

      if (resolved.length) {
        decorated[indicator] = resolved;
      }
    });

    if (!Object.keys(decorated).length) return null;
    return decorated;
  }, []);

  const adaptExplainCandles = useCallback((rawCandles: Array<Record<string, any>>) => {
    if (!Array.isArray(rawCandles) || rawCandles.length === 0) return [] as Candle[];
    const adapted: Candle[] = rawCandles
      .map((row) => {
        const seconds = Number(row.time ?? row.timestamp);
        if (!Number.isFinite(seconds)) return null;
        return {
          timestamp: seconds * 1000,
          open: Number(row.open ?? row.close ?? 0),
          high: Number(row.high ?? row.close ?? 0),
          low: Number(row.low ?? row.close ?? 0),
          close: Number(row.close ?? row.open ?? 0),
          volume: Number(row.volume ?? 0),
          source: 'MOCK',
          validForLearning: false,
        } as Candle;
      })
      .filter((row): row is Candle => Boolean(row?.timestamp));
    return clampCandlesToWindow(adapted, timeframe);
  }, [timeframe]);

  const buildDecisionMarkers = useCallback((timeline: ExplainDecision[]): ChartMarker[] => {
    if (!timeline.length) return [];
    return timeline
      .map((decision) => {
        const tsSeconds = Number(decision.time);
        if (!Number.isFinite(tsSeconds)) return null;
        const support = (decision.indicator_votes || [])
          .filter((vote) => vote.indicator)
          .map((vote) => `${vote.indicator}${vote.state ? `:${vote.state}` : ''}`)
          .slice(0, 4)
          .join(', ');
        const blocked = (decision.blocks || []).slice(0, 3).join(', ');
        const reason = [support && `Support ${support}`, blocked && `Blocks ${blocked}`, decision.reasoning]
          .filter(Boolean)
          .join(' • ');
        return {
          id: `timeline-${decision.action}-${tsSeconds}`,
          action: decision.action,
          timestamp: tsSeconds * 1000,
          confidence: decision.confidence,
          reason,
        } as ChartMarker;
      })
      .filter(Boolean) as ChartMarker[];
  }, []);

  const buildConfidenceSeries = useCallback((timeline: ExplainDecision[]) => {
    const points: ConfidencePoint[] = [];
    const inflections: ConfidenceInflection[] = [];
    let prev: ConfidencePoint | null = null;

    timeline
      .filter((decision) => Number.isFinite(Number(decision.confidence)))
      .sort((a, b) => Number(a.time) - Number(b.time))
      .forEach((decision) => {
        const time = Number(decision.time);
        const value = Number(decision.confidence);
        if (!Number.isFinite(time) || !Number.isFinite(value)) return;
        const point: ConfidencePoint = {
          time,
          value,
          action: decision.action,
          phase: decision.phase,
        };
        if (prev) {
          const delta = value - prev.value;
          if (Math.abs(delta) >= 0.1) {
            inflections.push({
              time,
              from: prev.value,
              to: value,
              direction: delta >= 0 ? 'up' : 'down',
              action: decision.action,
              phase: decision.phase,
            });
          }
        }
        points.push(point);
        prev = point;
      });

    return { points, inflections } as const;
  }, []);

  const clusterMarkers = useCallback((raw: ChartMarker[]): ChartMarker[] => {
    if (!raw.length) return raw;
    const buckets = new Map<number, ChartMarker[]>();
    raw.forEach((marker) => {
      const bucket = toUtcSeconds(marker.timestamp);
      if (!buckets.has(bucket)) buckets.set(bucket, []);
      buckets.get(bucket)?.push(marker);
    });

    const clustered: ChartMarker[] = [];

    buckets.forEach((entries, bucket) => {
      if (entries.length === 1) {
        clustered.push(entries[0]);
        return;
      }

      const byAction = new Map<string, { count: number; top?: ChartMarker }>();
      entries.forEach((marker) => {
        const action = marker.action.toLowerCase();
        const confidence = Number.isFinite(marker.confidence) ? marker.confidence ?? 0 : 0;
        const current = byAction.get(action) ?? { count: 0, top: undefined };
        const top = current.top;
        const nextTop = !top || (Number.isFinite(confidence) && confidence > (top.confidence ?? 0)) ? marker : top;
        byAction.set(action, { count: current.count + 1, top: nextTop });
      });

      const sortedActions = Array.from(byAction.entries()).sort((a, b) => b[1].count - a[1].count || (b[1].top?.confidence ?? 0) - (a[1].top?.confidence ?? 0));
      const [dominantAction, dominantMeta] = sortedActions[0];
      const topMarker = dominantMeta.top ?? entries[0];
      const confidence = topMarker.confidence;
      const reason = (topMarker.reason ?? '').slice(0, 42);
      clustered.push({
        id: `cluster-${bucket}-${dominantAction}`,
        action: dominantAction,
        timestamp: bucket * 1000,
        confidence,
        reason: reason || `${entries.length} decisions`,
        count: entries.length,
      });
    });

    return clustered.slice(-MAX_MARKERS);
  }, []);

  const resolveDecisionColor = useCallback((action: string) => {
    const lowered = action.toLowerCase();
    if (lowered === 'buy') return "rgba(16,185,129,0.8)";
    if (lowered === 'sell') return "rgba(239,68,68,0.82)";
    return "rgba(148,163,184,0.55)";
  }, []);

  const resolveConfidencePalette = useCallback((value?: number) => {
    const v = Number(value);
    const base = {
      inflectionUp: "rgba(16,185,129,0.5)",
      inflectionDown: "rgba(239,68,68,0.48)",
    };

    if (!Number.isFinite(v)) {
      return {
        line: "rgba(94,234,212,0.78)",
        fillTop: "rgba(94,234,212,0.1)",
        fillBottom: "rgba(94,234,212,0.035)",
        ...base,
      };
    }

    if (v < 0.42) {
      return {
        line: "rgba(248,113,113,0.72)",
        fillTop: "rgba(248,113,113,0.09)",
        fillBottom: "rgba(248,113,113,0.03)",
        ...base,
      };
    }

    if (v < 0.65) {
      return {
        line: "rgba(251,191,36,0.74)",
        fillTop: "rgba(251,191,36,0.08)",
        fillBottom: "rgba(251,191,36,0.028)",
        ...base,
      };
    }

    return {
      line: "rgba(94,234,212,0.78)",
      fillTop: "rgba(94,234,212,0.1)",
      fillBottom: "rgba(94,234,212,0.035)",
      ...base,
    };
  }, []);

  const persistSnapshot = useCallback(
    (snapshot: Partial<ChartSnapshot>) => {
      try {
        const targetWindow = Math.max(resolveWindowSize(timeframe) + WINDOW_BUFFER, resolveWindowSize(timeframe));
        const length = snapshot.candles?.length ?? 0;
        if (length && length < targetWindow) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[charts][cache][skip] window too small', { length, targetWindow, timeframe });
          }
          return;
        }
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
        const targetWindow = Math.max(resolveWindowSize(timeframe) + WINDOW_BUFFER, resolveWindowSize(timeframe));
        if (parsed?.candles?.length && parsed.candles.length >= targetWindow) {
          const trimmedCandles = clampCandlesToWindow(parsed.candles ?? [], timeframe);
          setCandles(trimmedCandles);
          setMiniCharts(parsed.miniCharts ?? []);
          setOverviewStats(parsed.overview ?? []);
          setPulse(parsed.pulse ?? []);
          setFeed(parsed.feed ?? []);
          setHoveredCandle(null);
        } else if (process.env.NODE_ENV !== 'production') {
          console.warn('[charts][cache][ignore] cached window too small', {
            length: parsed?.candles?.length ?? 0,
            targetWindow,
            timeframe,
          });
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
    chartRef.current = chart;
    const { candleSeries, volumeSeries } = createPriceVolumeSeries(chart);
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    indicatorRendererRef.current = createIndicatorRenderer(chart);

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
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      if (decisionConnectorRef.current) {
        chart.removeSeries(decisionConnectorRef.current);
        decisionConnectorRef.current = null;
      }
      if (confidenceSeriesRef.current) {
        chart.removeSeries(confidenceSeriesRef.current);
        confidenceSeriesRef.current = null;
      }
      if (confidenceInflectionRef.current) {
        chart.removeSeries(confidenceInflectionRef.current);
        confidenceInflectionRef.current = null;
      }
      if (confidenceRiskRef.current) {
        chart.removeSeries(confidenceRiskRef.current);
        confidenceRiskRef.current = null;
      }
      if (positionBandRef.current) {
        chart.removeSeries(positionBandRef.current);
        positionBandRef.current = null;
      }
      indicatorRendererRef.current?.clear();
      indicatorRendererRef.current = null;
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
    if (indicatorRendererRef.current && indicatorSeriesMap) {
      indicatorRendererRef.current.setIndicators(indicatorSeriesMap);
    }
  }, [visibleCandles, indicatorSeriesMap]);

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

    const clustered = clusterMarkers(windowMarkers);

    if (!clustered.length) {
      series.setMarkers([]);
      return;
    }

    const resolved: Array<SeriesMarker<Time>> = clustered.map((marker) => {
      const action = marker.action?.toLowerCase?.() ?? "hold";
      const shape: SeriesMarker<Time>["shape"] = action === "sell" ? "arrowDown" : action === "buy" ? "arrowUp" : "circle";
      const color = action === "sell" ? "rgba(239,68,68,0.9)" : action === "buy" ? "rgba(16,185,129,0.9)" : "rgba(148,163,184,0.9)";
      const position: SeriesMarker<Time>["position"] = action === "sell" ? "aboveBar" : action === "buy" ? "belowBar" : "inBar";
      const confidence = Number.isFinite(marker.confidence) ? Math.max(0, Math.min(1, marker.confidence ?? 0)) : undefined;
      const percent = confidence !== undefined ? `${(confidence * 100).toFixed(0)}%` : null;
      const shortReason = (marker.reason ?? "").slice(0, 42);
      const countLabel = marker.count && marker.count > 1 ? `${marker.count}×` : null;
      const text = [countLabel, action.toUpperCase(), percent, shortReason].filter(Boolean).join(" · ");
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
  }, [windowMarkers, clusterMarkers]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (!decisionTimeline.length) {
      if (decisionConnectorRef.current) {
        chart.removeSeries(decisionConnectorRef.current);
        decisionConnectorRef.current = null;
      }
      return;
    }

    if (!decisionConnectorRef.current) {
      decisionConnectorRef.current = chart.addLineSeries({
        color: "rgba(148,163,184,0.35)",
        lineStyle: LineStyle.Dotted,
        lineWidth: 1,
        priceLineVisible: false,
      });
    }

    const candleByTime = new Map<number, Candle>();
    visibleCandlesRef.current.forEach((candle) => {
      candleByTime.set(toUtcSeconds(candle.timestamp), candle);
    });

    const connectorData = decisionTimeline
      .map((decision) => {
        const timeSec = Number(decision.time);
        if (!Number.isFinite(timeSec)) return null;
        const candle = candleByTime.get(timeSec);
        if (!candle) return null;
        return {
          time: timeSec as Time,
          value: candle.close,
          color: resolveDecisionColor(decision.action),
        };
      })
      .filter(Boolean) as Array<{ time: Time; value: number; color?: string }>;

    decisionConnectorRef.current?.setData(connectorData);
  }, [decisionTimeline, resolveDecisionColor]);

  const positionBands = useMemo(() => {
    if (!decisionTimeline.length || !visibleCandles.length) return [] as Array<{ start: number; end: number; price: number; direction: 'long' | 'short' }>;
    const candleByTime = new Map<number, Candle>();
    visibleCandles.forEach((candle) => {
      candleByTime.set(toUtcSeconds(candle.timestamp), candle);
    });

    const sorted = [...decisionTimeline].sort((a, b) => Number(a.time) - Number(b.time));
    const bands: Array<{ start: number; end: number; price: number; direction: 'long' | 'short' }> = [];
    let activePosition: { time: number; price: number; direction: 'long' | 'short' } | null = null;

    const resolvePrice = (timeSec: number) => {
      const candle = candleByTime.get(timeSec);
      return candle?.close ?? candle?.open ?? null;
    };

    sorted.forEach((decision) => {
      const timeSec = Number(decision.time);
      if (!Number.isFinite(timeSec)) return;
      const action = (decision.action || '').toLowerCase();

      if (action === 'buy' && !activePosition) {
        const price = resolvePrice(timeSec);
        if (price !== null) activePosition = { time: timeSec, price, direction: 'long' };
        return;
      }

      if (action === 'sell' && activePosition?.direction === 'long') {
        const price = resolvePrice(timeSec) ?? activePosition.price;
        bands.push({ start: activePosition.time, end: timeSec, price, direction: 'long' });
        activePosition = null;
        return;
      }
    });

    if (activePosition) {
      const pos = activePosition as { time: number; price: number; direction: 'long' | 'short' };
      const lastVisible = visibleCandles.at(-1);
      const endTime = lastVisible ? toUtcSeconds(lastVisible.timestamp) : pos.time;
      bands.push({ start: pos.time, end: endTime, price: pos.price, direction: pos.direction });
    }

    return bands;
  }, [decisionTimeline, visibleCandles]);

  const confidenceData = useMemo(() => buildConfidenceSeries(decisionTimeline), [buildConfidenceSeries, decisionTimeline]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (!confidenceData.points.length) {
      confidenceSeriesRef.current?.setData([]);
      confidenceInflectionRef.current?.setData([]);
      confidenceRiskRef.current?.setData([]);
      return;
    }

    chart.priceScale(CONFIDENCE_SCALE_ID).applyOptions({
      scaleMargins: { top: 0.72, bottom: 0.08 },
      borderVisible: false,
    });

    if (!confidenceRiskRef.current) {
      confidenceRiskRef.current = chart.addHistogramSeries({
        priceScaleId: CONFIDENCE_SCALE_ID,
        priceFormat: { type: "price", precision: 2, minMove: 0.01 },
        priceLineVisible: false,
        base: 0,
        color: "rgba(248,113,113,0.12)",
      });
    }

    if (!confidenceSeriesRef.current) {
      confidenceSeriesRef.current = chart.addAreaSeries({
        priceScaleId: CONFIDENCE_SCALE_ID,
        lineWidth: 1.6,
        priceFormat: { type: "price", precision: 2, minMove: 0.01 },
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        topColor: "rgba(94,234,212,0.09)",
        bottomColor: "rgba(94,234,212,0.03)",
        lineColor: "rgba(94,234,212,0.78)",
      });
    }

    if (!confidenceInflectionRef.current) {
      confidenceInflectionRef.current = chart.addHistogramSeries({
        priceScaleId: CONFIDENCE_SCALE_ID,
        priceFormat: { type: "price", precision: 2, minMove: 0.01 },
        priceLineVisible: false,
        base: 0,
        color: "rgba(148,163,184,0.28)",
      });
    }

    const palette = resolveConfidencePalette(confidenceData.points.at(-1)?.value);
    confidenceSeriesRef.current?.applyOptions({
      lineColor: palette.line,
      topColor: palette.fillTop,
      bottomColor: palette.fillBottom,
    });

    const lineData = confidenceData.points.map((point) => ({
      time: point.time as Time,
      value: Math.max(0, Math.min(1, point.value)),
    }));

    const inflectionData = confidenceData.inflections.map((inflection) => ({
      time: inflection.time as Time,
      value: Number((inflection.to - inflection.from).toFixed(3)),
      color: inflection.direction === 'up' ? palette.inflectionUp : palette.inflectionDown,
    }));

    const riskShading = confidenceData.points.map((point) => {
      const risk = Math.max(0, Math.min(1, 1 - point.value));
      const color = risk > 0.55 ? "rgba(248,113,113,0.16)" : risk > 0.35 ? "rgba(251,191,36,0.13)" : "rgba(94,234,212,0.08)";
      return { time: point.time as Time, value: risk, color };
    });

    const inflectionMarkers = confidenceData.inflections.map((inflection) => {
      const label = inflection.direction === 'up' ? '↗' : '↘';
      const position: SeriesMarker<Time>["position"] = inflection.direction === 'up' ? 'aboveBar' : 'belowBar';
      const color = inflection.direction === 'up' ? palette.inflectionUp : palette.inflectionDown;
      return {
        time: inflection.time as Time,
        position,
        color,
        shape: inflection.direction === 'up' ? 'arrowUp' : 'arrowDown',
        size: 0.8,
        text: label,
      } as SeriesMarker<Time>;
    });

    confidenceRiskRef.current?.setData(riskShading);
    confidenceSeriesRef.current?.setData(lineData);
    confidenceSeriesRef.current?.setMarkers(inflectionMarkers);
    confidenceInflectionRef.current?.setData(inflectionData);
  }, [confidenceData, resolveConfidencePalette]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (!positionBandRef.current) {
      positionBandRef.current = chart.addAreaSeries({
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        topColor: 'rgba(125,211,252,0.06)',
        bottomColor: 'rgba(125,211,252,0.02)',
      });
    }

    const series = positionBandRef.current;

    if (!positionBands.length) {
      series.setData([]);
      return;
    }

    const points: Array<{ time: Time; value: number }> = [];
    positionBands.forEach((band) => {
      const color = band.direction === 'short' ? 'rgba(248,113,113,0.08)' : 'rgba(94,234,212,0.06)';
      series.applyOptions({ topColor: color, bottomColor: color });
      points.push({ time: band.start as Time, value: band.price });
      points.push({ time: band.end as Time, value: band.price });
    });

    series.setData(points);
  }, [positionBands]);

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

  useEffect(() => {
    let aborted = false;
    const loadExplain = async () => {
      try {
        const isProd = process.env.NODE_ENV === 'production';
        const urls = Array.from(
          new Set(
            isProd
              ? ['https://bagbot2-backend.onrender.com/api/brain/explain']
              : ['/api/brain/explain']
          )
        ) as string[];

        let payload: any = null;
        for (const url of urls) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              payload = await response.json();
              break;
            }
          } catch (_error) {
            /* retry next url */
          }
        }
        if (aborted || !payload) return;

        const timeline = Array.isArray(payload?.decision_timeline) ? (payload.decision_timeline as ExplainDecision[]) : [];
        setDecisionTimeline(timeline);

        const seriesByStrategy = (payload?.meta?.strategy_indicator_series ?? {}) as Record<string, ExplainIndicatorSeries>;
        const strategyId = Object.keys(seriesByStrategy)[0];
        const rawSeries = strategyId ? seriesByStrategy[strategyId] : null;
        const decorated = decorateIndicatorSeries(rawSeries, timeline);
        setIndicatorSeriesMap(decorated ?? null);

        const explainCandles = adaptExplainCandles(payload?.meta?.candles ?? []);
        if (explainCandles.length && candles.length === 0) {
          setCandles(explainCandles);
        }

        const derivedMarkers = buildDecisionMarkers(timeline);
        setMarkers(derivedMarkers);
      } catch (_error) {
        // Hard-fail explain must never break chart; ignore.
      }
    };
    loadExplain();
    return () => {
      aborted = true;
    };
  }, [adaptExplainCandles, buildDecisionMarkers, candles.length, decorateIndicatorSeries, asset, timeframe]);

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
