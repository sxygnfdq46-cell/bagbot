"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
  type SeriesOptionsMap,
} from "lightweight-charts";
import Card from "@/components/ui/card";
import MetricLabel from "@/components/ui/metric-label";
import TerminalShell from "@/components/ui/terminal-shell";

type Candle = {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type IndicatorPoint = {
  time: UTCTimestamp;
  value: number;
};

type BandIndicatorPoint = {
  time: UTCTimestamp;
  upper: number;
  middle?: number;
  lower: number;
};

type PositionSide = "long" | "short";

type PositionLifecycle = {
  id: string;
  side: PositionSide;
  entryIndex: number;
  exitIndex?: number;
};

type ReasoningPhase = "ENTRY" | "HOLD" | "EXIT";

type ReasoningAnchor = {
  id: string;
  positionId: string;
  phase: ReasoningPhase;
  time: UTCTimestamp;
  price: number;
  reasons: string[];
  confidence: "steady" | "cautious" | "measured";
};

const TIMEFRAME_SECONDS: Record<string, number> = {
  "1m": 60,
  "5m": 5 * 60,
  "15m": 15 * 60,
  "1h": 60 * 60,
  "4h": 4 * 60 * 60,
  "1d": 24 * 60 * 60,
};

const WINDOW_SIZE = 420; // stable window between 300-500
const LIVE_TICK_MS = 3200;
const DEFAULT_SYMBOL = "BTC-USD";
const DEFAULT_TIMEFRAME = "1h";

const palette = {
  background: "#070c19",
  gridMinor: "rgba(255,255,255,0.05)",
  gridMajor: "rgba(255,255,255,0.07)",
  textMuted: "#cbd5e1",
  priceUp: "#16a34a",
  priceDown: "#ef4444",
  wickUp: "#22c55e",
  wickDown: "#f97316",
  volumeUp: "rgba(34,197,94,0.28)",
  volumeDown: "rgba(239,68,68,0.28)",
  overlaySMA: "rgba(245,158,11,0.7)",
  overlayEMA: "rgba(34,211,238,0.75)",
  overlayVWAP: "rgba(168,85,247,0.78)",
  overlayBBEdge: "rgba(148,163,184,0.7)",
  overlayBBMid: "rgba(148,163,184,0.45)",
  oscillator: "rgba(14,165,233,0.8)",
  crosshair: "#38bdf8",
  lifecycleLong: "rgba(34,197,94,0.35)",
  lifecycleShort: "rgba(239,68,68,0.32)",
  markerLong: "#22c55e",
  markerShort: "#f87171",
  markerExit: "#eab308",
  markerReason: "#f8fafc",
  reasoningFill: "rgba(255,255,255,0.08)",
  reasoningBorder: "rgba(255,255,255,0.18)",
};

const adjustAlpha = (rgba: string, factor: number) => {
  const match = rgba.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*(0?\.\d+|1)\)$/i);
  if (!match) return rgba;
  const [, r, g, b, a] = match;
  const nextA = Math.max(0, Math.min(1, parseFloat(a) * factor));
  return `rgba(${r},${g},${b},${nextA})`;
};

const hashSeed = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // force 32-bit
  }
  return Math.abs(hash) || 1;
};

const createRng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const buildHistory = (symbol: string, timeframe: string, windowSize: number, rng: () => number): Candle[] => {
  const spacing = TIMEFRAME_SECONDS[timeframe] ?? TIMEFRAME_SECONDS[DEFAULT_TIMEFRAME];
  const start = Math.floor(Date.UTC(2024, 0, 1) / 1000);
  const basePrice = 120 + rng() * 40;
  const series: Candle[] = [];
  let anchor = basePrice;

  for (let i = 0; i < windowSize; i += 1) {
    const drift = (rng() - 0.5) * 4.2 + Math.sin(i / 12) * 1.4;
    const open = anchor;
    const close = clamp(open + drift, 40, 480);
    const high = Math.max(open, close) + rng() * 2.4;
    const low = Math.min(open, close) - rng() * 2.4;
    const volume = 900 + Math.round(400 * rng() + 280 * Math.abs(Math.sin(i / 8)));
    series.push({
      time: start + i * spacing,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
    anchor = close;
  }

  return series;
};

const appendNextCandle = (prev: Candle, rng: () => number, timeframe: string): Candle => {
  const spacing = TIMEFRAME_SECONDS[timeframe] ?? TIMEFRAME_SECONDS[DEFAULT_TIMEFRAME];
  const drift = (rng() - 0.5) * 3.6;
  const wiggle = 1.6 + rng() * 1.8;
  const open = prev.close;
  const close = clamp(open + drift, 40, 520);
  const high = Math.max(open, close) + wiggle;
  const low = Math.min(open, close) - wiggle;
  const volumeBaseline = prev.volume * (0.9 + rng() * 0.2);
  const volume = Math.max(300, Math.round(volumeBaseline));

  return {
    time: prev.time + spacing,
    open: Number(open.toFixed(2)),
    high: Number(high.toFixed(2)),
    low: Number(low.toFixed(2)),
    close: Number(close.toFixed(2)),
    volume,
  };
};

const toTimestamp = (timeSec: number): UTCTimestamp => timeSec as UTCTimestamp;

const buildTimeIndex = (candles: Candle[]) => new Set(candles.map((c) => toTimestamp(c.time)));

const computeSMA = (candles: Candle[], period: number, index: Set<UTCTimestamp>): IndicatorPoint[] => {
  if (candles.length < period) return [];
  const result: IndicatorPoint[] = [];
  for (let i = period - 1; i < candles.length; i += 1) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j += 1) {
      sum += candles[j].close;
    }
    const time = toTimestamp(candles[i].time);
    if (!index.has(time)) continue;
    result.push({ time, value: Number((sum / period).toFixed(4)) });
  }
  return result;
};

const computeEMA = (candles: Candle[], period: number, index: Set<UTCTimestamp>): IndicatorPoint[] => {
  if (candles.length < period) return [];
  const k = 2 / (period + 1);
  const result: IndicatorPoint[] = [];
  let ema = candles.slice(0, period).reduce((sum, c) => sum + c.close, 0) / period;
  for (let i = period - 1; i < candles.length; i += 1) {
    const close = candles[i].close;
    ema = i === period - 1 ? ema : close * k + ema * (1 - k);
    const time = toTimestamp(candles[i].time);
    if (!index.has(time)) continue;
    result.push({ time, value: Number(ema.toFixed(4)) });
  }
  return result;
};

const computeVWAP = (candles: Candle[], index: Set<UTCTimestamp>): IndicatorPoint[] => {
  if (!candles.length) return [];
  const result: IndicatorPoint[] = [];
  let cumulativePV = 0;
  let cumulativeVolume = 0;
  candles.forEach((candle) => {
    const typical = (candle.high + candle.low + candle.close) / 3;
    cumulativePV += typical * candle.volume;
    cumulativeVolume += candle.volume;
    if (cumulativeVolume === 0) return;
    const time = toTimestamp(candle.time);
    if (!index.has(time)) return;
    result.push({ time, value: Number((cumulativePV / cumulativeVolume).toFixed(4)) });
  });
  return result;
};

const computeBollinger = (candles: Candle[], period: number, stdDev = 2, index: Set<UTCTimestamp>): BandIndicatorPoint[] => {
  if (candles.length < period) return [];
  const result: BandIndicatorPoint[] = [];
  for (let i = period - 1; i < candles.length; i += 1) {
    const window = candles.slice(i - period + 1, i + 1).map((c) => c.close);
    const mean = window.reduce((sum, v) => sum + v, 0) / period;
    const variance = window.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
    const sigma = Math.sqrt(variance);
    const upper = mean + stdDev * sigma;
    const lower = mean - stdDev * sigma;
    const time = toTimestamp(candles[i].time);
    if (!index.has(time)) continue;
    result.push({
      time,
      upper: Number(upper.toFixed(4)),
      middle: Number(mean.toFixed(4)),
      lower: Number(lower.toFixed(4)),
    });
  }
  return result;
};

const computeRSI = (candles: Candle[], period: number, index: Set<UTCTimestamp>): IndicatorPoint[] => {
  if (candles.length < period + 1) return [];
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i += 1) {
    const delta = candles[i].close - candles[i - 1].close;
    if (delta >= 0) gain += delta; else loss -= delta;
  }
  gain /= period;
  loss /= period;
  const result: IndicatorPoint[] = [];
  for (let i = period + 1; i < candles.length; i += 1) {
    const delta = candles[i].close - candles[i - 1].close;
    if (delta >= 0) {
      gain = (gain * (period - 1) + delta) / period;
      loss = (loss * (period - 1)) / period;
    } else {
      gain = (gain * (period - 1)) / period;
      loss = (loss * (period - 1) - delta) / period;
    }
    const rs = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss || 0);
    const time = toTimestamp(candles[i].time);
    if (!index.has(time)) continue;
    result.push({ time, value: Number(rs.toFixed(4)) });
  }
  return result;
};

const derivePositions = (candles: Candle[]): PositionLifecycle[] => {
  if (candles.length < 60) return [];
  const first = Math.floor(candles.length * 0.22);
  const second = Math.floor(candles.length * 0.44);
  const third = Math.floor(candles.length * 0.72);
  const clampIndex = (idx: number) => Math.min(Math.max(idx, 0), candles.length - 1);

  const longEntry = clampIndex(first);
  const longExit = clampIndex(first + 48);
  const shortEntry = clampIndex(third);

  return [
    { id: "pos-long", side: "long", entryIndex: longEntry, exitIndex: longExit },
    { id: "pos-short", side: "short", entryIndex: shortEntry },
  ];
};

const deriveReasoningAnchors = (candles: Candle[], positions: PositionLifecycle[]): ReasoningAnchor[] => {
  if (!candles.length || !positions.length) return [];

  const trendPhrases = ["trend intact", "drift steady", "momentum aligned", "structure balanced"];
  const volatilityPhrases = ["range contained", "vol expansion easing", "calm tape", "measured volatility"];
  const structurePhrases = ["wick absorption", "support respected", "lower-timeframe drift", "prior level held"];

  const anchors: ReasoningAnchor[] = [];

  positions.forEach((position, idx) => {
    const entryCandle = candles[position.entryIndex];
    if (!entryCandle) return;
    const exitIdx = position.exitIndex ?? candles.length - 1;
    const exitCandle = candles[Math.min(exitIdx, candles.length - 1)];

    const pick = (list: string[], offset: number) => list[(idx + offset) % list.length];

    anchors.push({
      id: `${position.id}-entry`,
      positionId: position.id,
      phase: "ENTRY",
      time: toTimestamp(entryCandle.time),
      price: entryCandle.close,
      reasons: [pick(trendPhrases, 0), pick(structurePhrases, 1), pick(volatilityPhrases, 2)],
      confidence: "steady",
    });

    const holdIdx = Math.min(position.entryIndex + 12, candles.length - 1, exitIdx);
    const holdCandle = candles[holdIdx];
    if (holdCandle && holdIdx > position.entryIndex) {
      anchors.push({
        id: `${position.id}-hold`,
        positionId: position.id,
        phase: "HOLD",
        time: toTimestamp(holdCandle.time),
        price: holdCandle.close,
        reasons: [pick(structurePhrases, 2), pick(trendPhrases, 1), "risk contained"],
        confidence: "measured",
      });
    }

    if (position.exitIndex !== undefined && exitCandle) {
      anchors.push({
        id: `${position.id}-exit`,
        positionId: position.id,
        phase: "EXIT",
        time: toTimestamp(exitCandle.time),
        price: exitCandle.close,
        reasons: ["objective met", pick(volatilityPhrases, 3), "pace slowing"],
        confidence: "cautious",
      });
    } else if (exitCandle) {
      anchors.push({
        id: `${position.id}-open`,
        positionId: position.id,
        phase: "HOLD",
        time: toTimestamp(exitCandle.time),
        price: exitCandle.close,
        reasons: [pick(trendPhrases, 2), "monitoring flow", "risk steady"],
        confidence: "measured",
      });
    }
  });

  return anchors;
};

export type ChartCanvasHandle = {
  setTimeframe: (value: string) => void;
  currentTimeframe: string;
};

export const ChartCanvas = forwardRef<ChartCanvasHandle, { initialTimeframe?: string }>(
  function ChartCanvas({ initialTimeframe = DEFAULT_TIMEFRAME }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const indicatorPaneRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ReturnType<IChartApi["addCandlestickSeries"]> | null>(null);
    const volumeSeriesRef = useRef<ReturnType<IChartApi["addHistogramSeries"]> | null>(null);
    const overlaySeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());
    const lifecycleSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());
    const oscillatorChartRef = useRef<IChartApi | null>(null);
    const oscillatorSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());
    const [focusedAnchorId, setFocusedAnchorId] = useState<string | null>(null);
    const [hoverAnchor, setHoverAnchor] = useState<{ anchor: ReasoningAnchor; point: { x: number; y: number } } | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [timeframe, setTimeframe] = useState<string>(initialTimeframe);
    const seed = useMemo(() => hashSeed(`${DEFAULT_SYMBOL}-${timeframe}`), [timeframe]);
    const rng = useMemo(() => createRng(seed), [seed]);
    const [candles, setCandles] = useState<Candle[]>(() => buildHistory(DEFAULT_SYMBOL, timeframe, WINDOW_SIZE, rng));
    const initialHistoryRef = useRef<Candle[]>(candles);
    const [toggleEMA, setToggleEMA] = useState(false);
    const [toggleSMA, setToggleSMA] = useState(false);
    const [toggleVWAP, setToggleVWAP] = useState(false);
    const [toggleBB, setToggleBB] = useState(false);
    const [toggleRSI, setToggleRSI] = useState(false);
    const positions = useMemo(() => derivePositions(candles), [candles]);
    const reasoningAnchors = useMemo(() => deriveReasoningAnchors(candles, positions), [candles, positions]);

    useEffect(() => {
      const history = buildHistory(DEFAULT_SYMBOL, timeframe, WINDOW_SIZE, rng);
      initialHistoryRef.current = history;
      setCandles(history);
    }, [timeframe, rng]);

    useImperativeHandle(
      ref,
      () => ({
        setTimeframe: (value: string) => setTimeframe(value),
        currentTimeframe: timeframe,
      }),
      [timeframe]
    );

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return undefined;

      const chart = createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        layout: {
          background: { type: ColorType.Solid, color: palette.background },
          textColor: palette.textMuted,
        },
        grid: {
          vertLines: { color: palette.gridMinor },
          horzLines: { color: palette.gridMajor },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { width: 1, color: palette.crosshair, style: 1, labelBackgroundColor: "#0b213c" },
          horzLine: { width: 1, color: palette.crosshair, style: 1, labelBackgroundColor: "#0b213c" },
        },
        timeScale: {
          borderVisible: false,
          fixLeftEdge: false,
          fixRightEdge: false,
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderVisible: false,
        },
      });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: palette.priceUp,
      downColor: palette.priceDown,
      wickUpColor: palette.wickUp,
      wickDownColor: palette.wickDown,
      borderUpColor: "rgba(255,255,255,0.12)",
      borderDownColor: "rgba(255,255,255,0.12)",
      borderVisible: true,
      wickVisible: true,
    });

    const volumeSeries = chart.addHistogramSeries({
      priceScaleId: "volume",
      priceFormat: { type: "volume" },
      color: palette.volumeUp,
      base: 0,
    });

    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
      borderVisible: false,
      textColor: "#94a3b8",
    });

    const syncData = (nextCandles: Candle[]) => {
      const candleData = nextCandles.map((candle) => ({
        ...candle,
        time: candle.time as Time,
      }));

      candleSeries.setData(candleData);
      volumeSeries.setData(
        nextCandles.map((candle) => ({
          time: candle.time as Time,
          value: candle.volume,
          color: candle.close >= candle.open ? palette.volumeUp : palette.volumeDown,
        }))
      );
    };

    syncData(initialHistoryRef.current);

    const handleResize = () => {
      if (!container) return;
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener("resize", handleResize);

    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      handleResize();
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    const overlayStore = overlaySeriesRef.current;
    const lifecycleStore = lifecycleSeriesRef.current;

      return () => {
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
        window.removeEventListener("resize", handleResize);
        resizeObserver.disconnect();
        chart.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
        overlayStore.clear();
        lifecycleStore.clear();
      };
    }, []);

  useEffect(() => {
    const container = indicatorPaneRef.current;
    if (!container) return undefined;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#0b1224" },
        textColor: "#cbd5e1",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { width: 1, color: "#38bdf8", style: 1 },
        horzLine: { width: 1, color: "#38bdf8", style: 1 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
    });

    oscillatorChartRef.current = chart;

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener("resize", handleResize);

    const oscStore = oscillatorSeriesRef.current;

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      chart.remove();
      oscillatorChartRef.current = null;
      oscStore.clear();
    };
  }, []);

  useEffect(() => {
    if (!candles.length) return;
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!candleSeries || !volumeSeries) return;

    const candleData = candles.map((candle) => ({ ...candle, time: candle.time as Time }));
    candleSeries.setData(candleData);
    volumeSeries.setData(
      candles.map((candle) => ({
        time: candle.time as Time,
        value: candle.volume,
        color: candle.close >= candle.open ? palette.volumeUp : palette.volumeDown,
      }))
    );
  }, [candles]);

  const ensureSeries = <T extends ISeriesApi<keyof SeriesOptionsMap>>(store: Map<string, T>, id: string, create: () => T) => {
    if (store.has(id)) return store.get(id) as T;
    const series = create();
    store.set(id, series);
    return series;
  };

  const removeSeries = <T extends ISeriesApi<keyof SeriesOptionsMap>>(chart: IChartApi, store: Map<string, T>, id: string) => {
    const series = store.get(id);
    if (series) {
      chart.removeSeries(series);
      store.delete(id);
    }
  };

  useEffect(() => {
    if (!candles.length) return;
    const priceChart = chartRef.current;
    if (!priceChart) return;

    const active = new Set<string>();

    if (!positions.length) {
      removeSeries(priceChart, lifecycleSeriesRef.current, "markers");
      lifecycleSeriesRef.current.forEach((_, id) => {
        if (id.startsWith("band-")) removeSeries(priceChart, lifecycleSeriesRef.current, id);
      });
      return;
    }

    positions.forEach((position) => {
      const entryCandle = candles[position.entryIndex];
      if (!entryCandle) return;
      const exitIdx = position.exitIndex ?? candles.length - 1;
      const exitCandle = candles[Math.min(exitIdx, candles.length - 1)];
      if (!exitCandle) return;

      const bandId = `band-${position.id}`;
      active.add(bandId);

      const baseColor = position.side === "long" ? palette.lifecycleLong : palette.lifecycleShort;
      const emphasis = focusedAnchorId && focusedAnchorId.startsWith(position.id) ? 1.35 : 1;
      const band = ensureSeries(lifecycleSeriesRef.current, bandId, () =>
        priceChart.addLineSeries({
          color: baseColor,
          lineWidth: 4,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
          autoscaleInfoProvider: () => null,
        })
      );
      band.applyOptions({ color: adjustAlpha(baseColor, emphasis) });

      const data = candles
        .slice(position.entryIndex, Math.min(exitIdx, candles.length - 1) + 1)
        .map((candle) => ({ time: candle.time as Time, value: entryCandle.close }));

      band.setData(data);
    });

    const markerSeries = ensureSeries(lifecycleSeriesRef.current, "markers", () =>
      priceChart.addLineSeries({
        color: "transparent",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        autoscaleInfoProvider: () => null,
      })
    );

    const markers: { time: Time; position: "aboveBar" | "belowBar"; color: string; shape: "arrowUp" | "arrowDown" | "circle"; text?: string }[] = [];

    positions.forEach((position) => {
      const entry = candles[position.entryIndex];
      if (entry) {
        markers.push({
          time: entry.time as Time,
          position: position.side === "long" ? "belowBar" : "aboveBar",
          color: position.side === "long" ? palette.markerLong : palette.markerShort,
          shape: position.side === "long" ? "arrowUp" : "arrowDown",
        });
      }

      const exitIdx = position.exitIndex ?? candles.length - 1;
      const exit = candles[Math.min(exitIdx, candles.length - 1)];
      if (exit && position.exitIndex !== undefined) {
        markers.push({
          time: exit.time as Time,
          position: position.side === "long" ? "aboveBar" : "belowBar",
          color: palette.markerExit,
          shape: position.side === "long" ? "arrowDown" : "arrowUp",
        });
      } else if (exit && position.exitIndex === undefined) {
        markers.push({
          time: exit.time as Time,
          position: "aboveBar",
          color: position.side === "long" ? palette.markerLong : palette.markerShort,
          shape: "circle",
          text: "OPEN",
        });
      }
    });

    markerSeries.setMarkers(markers);
    active.add("markers");

    lifecycleSeriesRef.current.forEach((_, id) => {
      if (!active.has(id)) {
        removeSeries(priceChart, lifecycleSeriesRef.current, id);
      }
    });
  }, [candles, focusedAnchorId, positions]);

  useEffect(() => {
    const priceChart = chartRef.current;
    if (!priceChart || !reasoningAnchors.length) {
      const existing = lifecycleSeriesRef.current.get("reasoning-markers");
      if (priceChart && existing) removeSeries(priceChart, lifecycleSeriesRef.current, "reasoning-markers");
      return;
    }

    removeSeries(priceChart, lifecycleSeriesRef.current, "reasoning-markers");

    const markerHost = ensureSeries(lifecycleSeriesRef.current, "reasoning-markers", () =>
      priceChart.addLineSeries({
        color: "transparent",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        autoscaleInfoProvider: () => null,
      })
    );

    const markers = reasoningAnchors.map<SeriesMarker<Time>>((anchor) => ({
      time: anchor.time as Time,
      position: anchor.phase === "ENTRY" ? "belowBar" : anchor.phase === "EXIT" ? "aboveBar" : "aboveBar",
      color: palette.markerReason,
      shape: "circle",
      text: anchor.phase === "ENTRY" ? "EN" : anchor.phase === "EXIT" ? "EX" : "HD",
    }));

    markerHost.setMarkers(markers);
  }, [reasoningAnchors]);

  useEffect(() => {
    if (!candles.length) return;
    const priceChart = chartRef.current;
    if (!priceChart) return;

    const timeIndex = buildTimeIndex(candles);

    const sma = computeSMA(candles, 20, timeIndex);
    const ema = computeEMA(candles, 21, timeIndex);
    const vwap = computeVWAP(candles, timeIndex);
    const bb = computeBollinger(candles, 20, 2, timeIndex);

    const applyLine = (
      id: string,
      data: IndicatorPoint[],
      color: string,
      visible: boolean
    ) => {
      if (!visible || !data.length) {
        removeSeries(priceChart, overlaySeriesRef.current, id);
        return;
      }
      const series = ensureSeries(overlaySeriesRef.current, id, () =>
        priceChart.addLineSeries({
          color,
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          priceLineVisible: false,
          lastValueVisible: false,
          autoscaleInfoProvider: () => null,
        })
      );
      series.setData(data);
    };

    applyLine("sma", sma, palette.overlaySMA, toggleSMA);
    applyLine("ema", ema, palette.overlayEMA, toggleEMA);
    applyLine("vwap", vwap, palette.overlayVWAP, toggleVWAP);

    if (!toggleBB || !bb.length) {
      removeSeries(priceChart, overlaySeriesRef.current, "bb-upper");
      removeSeries(priceChart, overlaySeriesRef.current, "bb-lower");
      removeSeries(priceChart, overlaySeriesRef.current, "bb-mid");
    } else {
      const upper = ensureSeries(overlaySeriesRef.current, "bb-upper", () =>
        priceChart.addLineSeries({
          color: palette.overlayBBEdge,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          autoscaleInfoProvider: () => null,
        })
      );
      const lower = ensureSeries(overlaySeriesRef.current, "bb-lower", () =>
        priceChart.addLineSeries({
          color: palette.overlayBBEdge,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          autoscaleInfoProvider: () => null,
        })
      );
      const mid = ensureSeries(overlaySeriesRef.current, "bb-mid", () =>
        priceChart.addLineSeries({
          color: palette.overlayBBMid,
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          priceLineVisible: false,
          lastValueVisible: false,
          autoscaleInfoProvider: () => null,
        })
      );

      upper.setData(bb.map((row) => ({ time: row.time, value: row.upper })));
      lower.setData(bb.map((row) => ({ time: row.time, value: row.lower })));
      mid.setData(bb.map((row) => ({ time: row.time, value: row.middle ?? (row.upper + row.lower) / 2 })));
    }
  }, [candles, toggleBB, toggleEMA, toggleSMA, toggleVWAP]);

  useEffect(() => {
    if (!candles.length) return;
    const chart = oscillatorChartRef.current;
    if (!chart) return;

    const timeIndex = buildTimeIndex(candles);
    const rsi = computeRSI(candles, 14, timeIndex);

    if (!toggleRSI || !rsi.length) {
      removeSeries(chart, oscillatorSeriesRef.current, "rsi");
      return;
    }

    const series = ensureSeries(oscillatorSeriesRef.current, "rsi", () =>
      chart.addLineSeries({
        color: palette.oscillator,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      })
    );

    series.setData(rsi);
    chart.priceScale("right").applyOptions({
      autoScale: true,
      scaleMargins: { top: 0.12, bottom: 0.12 },
    });
    chart.timeScale().fitContent();
  }, [candles, toggleRSI]);

  useEffect(() => {
    const priceChart = chartRef.current;
    const container = containerRef.current;
    if (!priceChart || !container) return;

    const anchorByTime = new Map<number, ReasoningAnchor>();
    reasoningAnchors.forEach((anchor) => anchorByTime.set(anchor.time as number, anchor));

    const handleMove = (param: any) => {
      if (!param?.time || !param?.point) {
        setHoverAnchor(null);
        return;
      }
      const anchor = anchorByTime.get(param.time as number);
      if (anchor) {
        setHoverAnchor({ anchor, point: { x: param.point.x, y: param.point.y } });
      } else {
        setHoverAnchor(null);
      }
    };

    const handleClick = (param: any) => {
      if (!param?.time) return;
      const anchor = anchorByTime.get(param.time as number);
      if (anchor) {
        setFocusedAnchorId(anchor.id);
      } else {
        setFocusedAnchorId(null);
      }
    };

    priceChart.subscribeCrosshairMove(handleMove);
    priceChart.subscribeClick(handleClick);

    return () => {
      priceChart.unsubscribeCrosshairMove(handleMove);
      priceChart.unsubscribeClick(handleClick);
    };
  }, [reasoningAnchors]);

  useEffect(() => {
    let mounted = true;

    const tick = () => {
      setCandles((current) => {
        if (!mounted || !current.length) return current;
        const nextCandle = appendNextCandle(current[current.length - 1], rng, timeframe);
        const nextSeries = [...current, nextCandle];
        return nextSeries.slice(-WINDOW_SIZE);
      });
    };

    const interval = setInterval(tick, LIVE_TICK_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [rng, timeframe]);

  const toggleFullscreen = () => {
    const host = containerRef.current?.closest("section");
    if (!host) return;
    if (!document.fullscreenElement) {
      host.requestFullscreen?.().catch(() => {
        /* ignore fullscreen errors */
      });
    } else {
      document.exitFullscreen?.();
    }
  };

  const LegendItem = ({ label, color, active, hint }: { label: string; color: string; active: boolean; hint?: string }) => (
    <div className="flex items-center gap-2 text-xs text-slate-200/80">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color, opacity: active ? 1 : 0.35 }} />
      <span className={active ? "" : "text-slate-400/60"}>{label}</span>
      {hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
    </div>
  );

  return (
    <TerminalShell className="stack-gap-lg w-full max-w-full px-0" style={{ minHeight: "calc(100vh - 80px)" }}>
      <header className="stack-gap-xxs w-full">
        <MetricLabel className="text-[color:var(--accent-gold)]">Market Canvas</MetricLabel>
        <h2 className="text-3xl font-semibold leading-tight">Charts</h2>
        <p className="muted-premium">Lightweight Charts foundation with deterministic price, volume, and optional overlays.</p>
      </header>

      <Card title="Price & Volume" subtitle="TradingView-style base canvas">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button className="pill" onClick={() => setToggleSMA((v) => !v)} aria-pressed={toggleSMA}>
              SMA
            </button>
            <button className="pill" onClick={() => setToggleEMA((v) => !v)} aria-pressed={toggleEMA}>
              EMA
            </button>
            <button className="pill" onClick={() => setToggleVWAP((v) => !v)} aria-pressed={toggleVWAP}>
              VWAP
            </button>
            <button className="pill" onClick={() => setToggleBB((v) => !v)} aria-pressed={toggleBB}>
              Bollinger
            </button>
            <button className="pill" onClick={() => setToggleRSI((v) => !v)} aria-pressed={toggleRSI}>
              RSI
            </button>
          </div>

          <section className="relative isolate overflow-hidden rounded-2xl border border-[color:var(--border-soft)]/50 bg-gradient-to-b from-[#0c1224] to-[#060914] shadow-xl shadow-black/30" style={{ height: 620 }}>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap gap-3 p-4 text-xs">
              <div className="rounded-xl bg-white/5 px-3 py-2 backdrop-blur">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Canvas</div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">{DEFAULT_SYMBOL}<span className="text-slate-400">•</span>{timeframe}</div>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-2 backdrop-blur">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Layers</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <LegendItem label="Price" color={palette.priceUp} active />
                  <LegendItem label="Volume" color={palette.volumeUp} active hint="support" />
                  <LegendItem label="SMA" color={palette.overlaySMA} active={toggleSMA} />
                  <LegendItem label="EMA" color={palette.overlayEMA} active={toggleEMA} />
                  <LegendItem label="VWAP" color={palette.overlayVWAP} active={toggleVWAP} />
                  <LegendItem label="Bollinger" color={palette.overlayBBEdge} active={toggleBB} />
                  <LegendItem label="RSI" color={palette.oscillator} active={toggleRSI} />
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 top-0" style={{ height: "65%" }}>
              <div ref={containerRef} className="absolute inset-0" />
            </div>
            <div className="absolute inset-x-0" style={{ bottom: "20%", height: "15%" }}>
              {/* Volume is rendered inside the main chart via scale margins */}
            </div>
            <div className="absolute inset-x-0 bottom-0" style={{ height: "20%" }}>
              <div ref={indicatorPaneRef} className="absolute inset-0" />
            </div>

            {positions.some((pos) => pos.exitIndex === undefined) && (
              <div className="pointer-events-none absolute left-4 bottom-24 z-20 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70 backdrop-blur">
                Managing live position
              </div>
            )}

            {hoverAnchor && (
              <div
                className="pointer-events-none absolute z-30 w-56 rounded-xl border px-3 py-2 text-xs text-slate-100 shadow-lg"
                style={{
                  left: hoverAnchor.point.x + 12,
                  top: Math.max(8, hoverAnchor.point.y - 12),
                  borderColor: palette.reasoningBorder,
                  background: palette.reasoningFill,
                }}
              >
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-300">
                  <span>{hoverAnchor.anchor.phase}</span>
                  <span className="text-slate-400">{hoverAnchor.anchor.confidence}</span>
                </div>
                <ul className="mt-2 space-y-1 text-[12px] text-slate-100/90">
                  {hoverAnchor.anchor.reasons.slice(0, 4).map((reason) => (
                    <li key={reason} className="flex items-start gap-2">
                      <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-white/70" />
                      <span className="leading-snug">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 top-[65%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 top-[80%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <button
              type="button"
              onClick={toggleFullscreen}
              className="absolute right-4 top-4 z-20 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80 backdrop-blur transition hover:border-white/30 hover:text-white"
              aria-pressed={isFullscreen}
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </section>
        </div>
      </Card>
    </TerminalShell>
  );
});

export default ChartCanvas;
