"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
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
import { useRuntimeSnapshot } from "@/lib/runtime/use-runtime-snapshot";

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

export type ReasoningPhase = "ENTRY" | "HOLD" | "EXIT";

type ReasoningAnchor = {
  id: string;
  positionId: string;
  phase: ReasoningPhase;
  time: UTCTimestamp;
  price: number;
  reasons: string[];
  confidence: "steady" | "cautious" | "measured";
};

export type ChartIndicator = "ema" | "vwap" | "rsi";
export type ChartCandleType = "candles" | "heikin-ashi";
export type ChartTool = "off" | "trendline" | "horizontal";
export type ChartProjection = "off" | "forward" | "trendline";
export type ChartCompare = "off" | "EURUSD" | "GBPUSD" | "XAUUSD" | "NAS100" | "BTCUSD";
export type ChartReasoningVisibility = "on" | "off";
export type ChartReplayMode = "live" | "replay";
export type ChartDecisionEvent = {
  id: string;
  time: number;
  phase: ReasoningPhase;
  label: string;
};
export type ChartSnapshot = {
  instrument: string;
  timeframe: string;
  candleType: ChartCandleType;
  indicators: ChartIndicator[];
  drawings: Drawing[];
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
  background: "#060a14",
  gridMinor: "rgba(255,255,255,0.035)",
  gridMajor: "rgba(255,255,255,0.055)",
  textMuted: "#d7deea",
  priceUp: "#31c48d",
  priceDown: "#f0817a",
  wickUp: "#7be7c3",
  wickDown: "#f4b8a7",
  volumeUp: "rgba(49,196,139,0.18)",
  volumeDown: "rgba(240,129,122,0.16)",
  overlaySMA: "rgba(234,179,8,0.62)",
  overlayEMA: "rgba(56,189,248,0.7)",
  overlayVWAP: "rgba(167,139,250,0.65)",
  overlayBBEdge: "rgba(148,163,184,0.5)",
  overlayBBMid: "rgba(148,163,184,0.32)",
  overlayCompare: "rgba(148,163,184,0.48)",
  oscillator: "rgba(94,234,212,0.72)",
  crosshair: "rgba(152,199,255,0.8)",
  crosshairLabel: "rgba(12,21,36,0.92)",
  lifecycleLong: "rgba(49,196,139,0.24)",
  lifecycleShort: "rgba(240,129,122,0.22)",
  markerLong: "#2fd3a1",
  markerShort: "#f18b82",
  markerExit: "#e8c26a",
  markerReason: "#e2e8f0",
  reasoningFill: "rgba(255,255,255,0.06)",
  reasoningBorder: "rgba(255,255,255,0.14)",
  candleBorder: "rgba(255,255,255,0.14)",
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

const buildHeikinAshi = (candles: Candle[]): Candle[] => {
  if (!candles.length) return [];

  const series: Candle[] = [];
  let prevOpen = (candles[0].open + candles[0].close) / 2;
  let prevClose = (candles[0].open + candles[0].high + candles[0].low + candles[0].close) / 4;

  candles.forEach((candle, idx) => {
    const haClose = (candle.open + candle.high + candle.low + candle.close) / 4;
    const haOpen = idx === 0 ? (candle.open + candle.close) / 2 : (prevOpen + prevClose) / 2;
    const haHigh = Math.max(candle.high, haOpen, haClose);
    const haLow = Math.min(candle.low, haOpen, haClose);

    prevOpen = haOpen;
    prevClose = haClose;

    series.push({
      time: candle.time,
      open: Number(haOpen.toFixed(4)),
      high: Number(haHigh.toFixed(4)),
      low: Number(haLow.toFixed(4)),
      close: Number(haClose.toFixed(4)),
      volume: candle.volume,
    });
  });

  return series;
};

type NormalizedPoint = { x: number; y: number };

type Drawing =
  | { id: string; type: "horizontal"; y: number }
  | { id: string; type: "trendline"; start: NormalizedPoint; end: NormalizedPoint };

const SNAPSHOT_STORAGE_KEY = "bagbot-terminal-snapshot";

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
  setInstrument: (value: string) => void;
  setCandleType: (value: ChartCandleType) => void;
  setTool: (value: ChartTool) => void;
  setProjection: (value: ChartProjection) => void;
  setCompare: (value: ChartCompare) => void;
  setReasoningVisibility: (value: ChartReasoningVisibility) => void;
  setReplayMode: (value: ChartReplayMode) => void;
  setReplayCursor: (value: number | null) => void;
  saveSnapshot: () => ChartSnapshot | null;
  loadSnapshot: () => ChartSnapshot | null;
  currentTimeframe: string;
  currentInstrument: string;
  currentCandleType: ChartCandleType;
  currentTool: ChartTool;
  currentProjection: ChartProjection;
  currentCompare: ChartCompare;
  currentReasoningVisibility: ChartReasoningVisibility;
  currentReplayMode: ChartReplayMode;
  currentReplayCursor: number | null;
  currentReplayMax: number;
  setIndicator: (indicator: ChartIndicator, enabled: boolean) => void;
  currentIndicators: ChartIndicator[];
  focusDecision: (id: string | null, options?: { syncReplay?: boolean }) => void;
};

export const ChartCanvas = forwardRef<
  ChartCanvasHandle,
  {
    initialTimeframe?: string;
    initialInstrument?: string;
    initialCandleType?: ChartCandleType;
    initialTool?: ChartTool;
    initialProjection?: ChartProjection;
    initialCompare?: ChartCompare;
    initialReasoningVisibility?: ChartReasoningVisibility;
    initialReplayMode?: ChartReplayMode;
    initialReplayCursor?: number | null;
    initialIndicators?: ChartIndicator[];
    onCandleTypeChange?: (value: ChartCandleType) => void;
    onToolChange?: (value: ChartTool) => void;
    onProjectionChange?: (value: ChartProjection) => void;
    onCompareChange?: (value: ChartCompare) => void;
    onReasoningVisibilityChange?: (value: ChartReasoningVisibility) => void;
    onReplayUpdate?: (info: { mode: ChartReplayMode; cursor: number; max: number }) => void;
    onIndicatorsChange?: (active: ChartIndicator[]) => void;
    onDecisionTimelineUpdate?: (events: ChartDecisionEvent[]) => void;
    onDecisionActiveChange?: (id: string | null) => void;
  }
>(
  function ChartCanvas(
    {
      initialTimeframe = DEFAULT_TIMEFRAME,
      initialInstrument = DEFAULT_SYMBOL,
      initialCandleType = "candles",
      initialTool = "off",
      initialProjection = "off",
      initialCompare = "off",
      initialReasoningVisibility = "on",
      initialReplayMode = "live",
      initialReplayCursor = null,
      initialIndicators,
      onCandleTypeChange,
      onToolChange,
      onProjectionChange,
      onCompareChange,
      onReasoningVisibilityChange,
      onReplayUpdate,
      onIndicatorsChange,
      onDecisionTimelineUpdate,
      onDecisionActiveChange,
    },
    ref
  ) {
      const { snapshot } = useRuntimeSnapshot();
      const botStatus = snapshot.bot.status ?? "unknown";
    const containerRef = useRef<HTMLDivElement | null>(null);
    const indicatorPaneRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ReturnType<IChartApi["addCandlestickSeries"]> | null>(null);
    const volumeSeriesRef = useRef<ReturnType<IChartApi["addHistogramSeries"]> | null>(null);
    const overlaySeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());
    const lifecycleSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());
    const drawingSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());
    const projectionSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());
    const compareSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());
    const snapshotRef = useRef<ChartSnapshot | null>(null);
    const oscillatorChartRef = useRef<IChartApi | null>(null);
    const oscillatorSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());
    const [focusedAnchorId, setFocusedAnchorId] = useState<string | null>(null);
    const [hoverAnchor, setHoverAnchor] = useState<{ anchor: ReasoningAnchor; point: { x: number; y: number } } | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [instrument, setInstrument] = useState<string>(initialInstrument);
    const [timeframe, setTimeframe] = useState<string>(initialTimeframe);
    const [candleType, setCandleType] = useState<ChartCandleType>(initialCandleType);
    const seed = useMemo(() => hashSeed(`${instrument}-${timeframe}`), [instrument, timeframe]);
    const rng = useMemo(() => createRng(seed), [seed]);
    const [candles, setCandles] = useState<Candle[]>(() => buildHistory(instrument, timeframe, WINDOW_SIZE, rng));
    const [projectionMode, setProjectionMode] = useState<ChartProjection>(initialProjection);
    const [compareInstrument, setCompareInstrument] = useState<ChartCompare>(initialCompare);
    const [reasoningVisibility, setReasoningVisibility] = useState<ChartReasoningVisibility>(initialReasoningVisibility);
    const [replayMode, setReplayMode] = useState<ChartReplayMode>(initialReplayMode);
    const [replayCursor, setReplayCursor] = useState<number | null>(initialReplayCursor);
    const activeCandles = useMemo<Candle[]>(() => {
      if (!candles.length) return [];
      if (replayMode === "replay") {
        const max = candles.length;
        const cursor = clamp(replayCursor ?? max, 1, max);
        return candles.slice(0, cursor);
      }
      return candles;
    }, [candles, replayCursor, replayMode]);
    const visualCandles = useMemo<Candle[]>(
      () => (candleType === "heikin-ashi" ? buildHeikinAshi(activeCandles) : activeCandles),
      [activeCandles, candleType]
    );
    const initialHistoryRef = useRef<Candle[]>(candles);
    const [activeTool, setActiveTool] = useState<ChartTool>(initialTool);
    const compareSeed = useMemo(() => hashSeed(`compare-${compareInstrument}-${timeframe}`), [compareInstrument, timeframe]);
    const compareRng = useMemo(() => createRng(compareSeed), [compareSeed]);
    const [compareCandles, setCompareCandles] = useState<Candle[]>([]);
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [draftPoint, setDraftPoint] = useState<NormalizedPoint | null>(null);
    const drawingIdRef = useRef(0);
    const [toggleEMA, setToggleEMA] = useState<boolean>(() => initialIndicators?.includes("ema") ?? false);
    const [toggleSMA, setToggleSMA] = useState(false);
    const [toggleVWAP, setToggleVWAP] = useState<boolean>(() => initialIndicators?.includes("vwap") ?? false);
    const [toggleBB, setToggleBB] = useState(false);
    const [toggleRSI, setToggleRSI] = useState<boolean>(() => initialIndicators?.includes("rsi") ?? false);
    const positions = useMemo(() => derivePositions(activeCandles), [activeCandles]);
    const reasoningAnchors = useMemo(() => deriveReasoningAnchors(activeCandles, positions), [activeCandles, positions]);
    const indicatorState = useMemo<ChartIndicator[]>(() => {
      const active: ChartIndicator[] = [];
      if (toggleEMA) active.push("ema");
      if (toggleVWAP) active.push("vwap");
      if (toggleRSI) active.push("rsi");
      return active;
    }, [toggleEMA, toggleRSI, toggleVWAP]);

    const decisionEvents = useMemo<ChartDecisionEvent[]>(
      () =>
        reasoningAnchors.map((anchor) => ({
          id: anchor.id,
          time: anchor.time as number,
          phase: anchor.phase,
          label: anchor.reasons[0] ?? anchor.phase,
        })),
      [reasoningAnchors]
    );

    const cursorDecisionId = useMemo(() => {
      if (!reasoningAnchors.length) return null;
      return reasoningAnchors[reasoningAnchors.length - 1]?.id ?? null;
    }, [reasoningAnchors]);

    useEffect(() => {
      if (replayMode !== "replay") return;
      if (replayCursor === null && candles.length) {
        setReplayCursor(candles.length);
        return;
      }
      const max = candles.length || 1;
      const next = clamp(replayCursor ?? max, 1, max);
      if (next !== (replayCursor ?? max)) {
        setReplayCursor(next);
      }
    }, [candles.length, replayCursor, replayMode]);

    useEffect(() => {
      const max = candles.length;
      const cursor = replayMode === "replay" ? clamp(replayCursor ?? max, 1, Math.max(1, max)) : max;
      onReplayUpdate?.({ mode: replayMode, cursor, max });
    }, [candles.length, onReplayUpdate, replayCursor, replayMode]);

    useEffect(() => {
      onDecisionTimelineUpdate?.(decisionEvents);
    }, [decisionEvents, onDecisionTimelineUpdate]);

    useEffect(() => {
      onDecisionActiveChange?.(cursorDecisionId);
    }, [cursorDecisionId, onDecisionActiveChange]);

    const priceRange = useMemo(() => {
      if (!visualCandles.length) return { min: 0, max: 1, span: 1 };
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      visualCandles.forEach((candle) => {
        min = Math.min(min, candle.low);
        max = Math.max(max, candle.high);
      });
      const span = max - min || 1;
      return { min, max, span };
    }, [visualCandles]);

    const priceMin = priceRange.min;
    const priceSpan = priceRange.span;
    const candleCount = visualCandles.length;

    const timeIndexMap = useMemo(() => {
      const map = new Map<number, number>();
      visualCandles.forEach((candle, idx) => {
        map.set(candle.time, idx);
      });
      return map;
    }, [visualCandles]);

    useEffect(() => {
      const history = buildHistory(instrument, timeframe, WINDOW_SIZE, rng);
      initialHistoryRef.current = history;
      setCandles(history);
      setReplayMode("live");
      setReplayCursor(null);
    }, [instrument, timeframe, rng]);

    useEffect(() => {
      setCompareInstrument("off");
      setCompareCandles([]);
    }, [instrument]);

    useEffect(() => {
      if (compareInstrument === "off") {
        setCompareCandles([]);
        return;
      }
      const history = buildHistory(compareInstrument, timeframe, WINDOW_SIZE, compareRng);
      setCompareCandles(history);
    }, [compareInstrument, timeframe, compareRng]);

    const setIndicatorState = (indicator: ChartIndicator, enabled: boolean) => {
      switch (indicator) {
        case "ema":
          setToggleEMA(enabled);
          break;
        case "vwap":
          setToggleVWAP(enabled);
          break;
        case "rsi":
          setToggleRSI(enabled);
          break;
        default:
          break;
      }
    };

    const setToolState = (tool: ChartTool) => {
      setActiveTool(tool);
      setDraftPoint(null);
    };

    const setProjectionState = (mode: ChartProjection) => {
      setProjectionMode(mode);
    };

    const setCompareState = (value: ChartCompare) => {
      setCompareInstrument(value);
    };

    const setReasoningVisibilityState = (value: ChartReasoningVisibility) => {
      setReasoningVisibility(value);
    };

    const setReplayModeState = useCallback(
      (value: ChartReplayMode) => {
        setReplayMode(value);
        if (value === "live") {
          setReplayCursor(null);
        } else {
          setReplayCursor((cursor) => cursor ?? candles.length);
        }
      },
      [candles.length]
    );

    const setReplayCursorState = useCallback((value: number | null) => {
      setReplayCursor(value);
      if (value !== null) {
        setReplayMode("replay");
      }
    }, []);

    const focusDecision = useCallback(
      (id: string | null, options?: { syncReplay?: boolean }) => {
        setFocusedAnchorId(id);
        if (!id) return;
        if (options?.syncReplay && replayMode === "replay") {
          const anchor = reasoningAnchors.find((candidate) => candidate.id === id);
          if (!anchor) return;
          const idx = timeIndexMap.get(anchor.time as number);
          if (idx !== undefined) {
            const cursor = clamp(idx + 1, 1, candles.length || 1);
            setReplayCursor(cursor);
          }
        }
      },
      [candles.length, reasoningAnchors, replayMode, timeIndexMap]
    );

    const persistSnapshot = useCallback((snapshot: ChartSnapshot) => {
      snapshotRef.current = snapshot;
      if (typeof window !== "undefined") {
        try {
          window.localStorage?.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
        } catch {
          /* ignore persistence errors */
        }
      }
    }, []);

    const readSnapshot = useCallback((): ChartSnapshot | null => {
      if (snapshotRef.current) return snapshotRef.current;
      if (typeof window === "undefined") return null;
      try {
        const raw = window.localStorage?.getItem(SNAPSHOT_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as ChartSnapshot | null;
        return parsed ?? null;
      } catch {
        return null;
      }
    }, []);

    const applySnapshot = useCallback(
      (snapshot: ChartSnapshot | null) => {
        if (!snapshot) return null;
        setInstrument(snapshot.instrument);
        setTimeframe(snapshot.timeframe);
        setCandleType(snapshot.candleType);
        setIndicatorState("ema", snapshot.indicators.includes("ema"));
        setIndicatorState("vwap", snapshot.indicators.includes("vwap"));
        setIndicatorState("rsi", snapshot.indicators.includes("rsi"));
        setDrawings(snapshot.drawings);
        setActiveTool("off");
        setDraftPoint(null);
        return snapshot;
      },
      []
    );

    const saveSnapshot = useCallback(() => {
      const snapshot: ChartSnapshot = {
        instrument,
        timeframe,
        candleType,
        indicators: indicatorState,
        drawings,
      };
      persistSnapshot(snapshot);
      return snapshot;
    }, [candleType, drawings, indicatorState, instrument, persistSnapshot, timeframe]);

    const loadSnapshot = useCallback(() => {
      const snapshot = readSnapshot();
      return applySnapshot(snapshot);
    }, [applySnapshot, readSnapshot]);

    useImperativeHandle(
      ref,
      () => ({
        setTimeframe: (value: string) => setTimeframe(value),
        setInstrument: (value: string) => setInstrument(value),
        setCandleType: (value: ChartCandleType) => setCandleType(value),
        setTool: (value: ChartTool) => setToolState(value),
        setProjection: (value: ChartProjection) => setProjectionState(value),
        setCompare: (value: ChartCompare) => setCompareState(value),
        setReasoningVisibility: (value: ChartReasoningVisibility) => setReasoningVisibilityState(value),
        setReplayMode: (value: ChartReplayMode) => setReplayModeState(value),
        setReplayCursor: (value: number | null) => setReplayCursorState(value),
        saveSnapshot: () => saveSnapshot(),
        loadSnapshot: () => loadSnapshot(),
        setIndicator: (indicator, enabled) => setIndicatorState(indicator, enabled),
        currentTimeframe: timeframe,
        currentInstrument: instrument,
        currentCandleType: candleType,
        currentTool: activeTool,
        currentProjection: projectionMode,
        currentCompare: compareInstrument,
        currentReasoningVisibility: reasoningVisibility,
        currentReplayMode: replayMode,
        currentReplayCursor: replayCursor,
        currentReplayMax: candles.length,
        currentIndicators: indicatorState,
        focusDecision: (id, options) => focusDecision(id, options),
      }),
      [activeTool, candles.length, candleType, compareInstrument, focusDecision, indicatorState, instrument, loadSnapshot, projectionMode, reasoningVisibility, replayCursor, replayMode, saveSnapshot, setReplayCursorState, setReplayModeState, timeframe]
    );

    useEffect(() => {
      onIndicatorsChange?.(indicatorState);
    }, [indicatorState, onIndicatorsChange]);

    useEffect(() => {
      onCandleTypeChange?.(candleType);
    }, [candleType, onCandleTypeChange]);

    useEffect(() => {
      onToolChange?.(activeTool);
    }, [activeTool, onToolChange]);

    useEffect(() => {
      onProjectionChange?.(projectionMode);
    }, [onProjectionChange, projectionMode]);

    useEffect(() => {
      onCompareChange?.(compareInstrument);
    }, [compareInstrument, onCompareChange]);

    useEffect(() => {
      onReasoningVisibilityChange?.(reasoningVisibility);
    }, [onReasoningVisibilityChange, reasoningVisibility]);

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
          vertLine: { width: 1, color: palette.crosshair, style: 1, labelBackgroundColor: palette.crosshairLabel },
          horzLine: { width: 1, color: palette.crosshair, style: 1, labelBackgroundColor: palette.crosshairLabel },
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
      borderUpColor: palette.candleBorder,
      borderDownColor: palette.candleBorder,
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
      textColor: palette.textMuted,
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

    const initialView = initialCandleType === "heikin-ashi" ? buildHeikinAshi(initialHistoryRef.current) : initialHistoryRef.current;
    syncData(initialView);

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
    const drawingStore = drawingSeriesRef.current;
    const projectionStore = projectionSeriesRef.current;
    const compareStore = compareSeriesRef.current;

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
        drawingStore.clear();
        projectionStore.clear();
        compareStore.clear();
      };
    }, [initialCandleType]);

  useEffect(() => {
    const container = indicatorPaneRef.current;
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
        vertLine: { width: 1, color: palette.crosshair, style: 1 },
        horzLine: { width: 1, color: palette.crosshair, style: 1 },
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
    if (!visualCandles.length) return;
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!candleSeries || !volumeSeries) return;

    const candleData = visualCandles.map((candle) => ({ ...candle, time: candle.time as Time }));
    candleSeries.setData(candleData);
    volumeSeries.setData(
      visualCandles.map((candle) => ({
        time: candle.time as Time,
        value: candle.volume,
        color: candle.close >= candle.open ? palette.volumeUp : palette.volumeDown,
      }))
    );
  }, [visualCandles]);

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
    if (!activeCandles.length) return;
    const priceChart = chartRef.current;
    if (!priceChart) return;

    const active = new Set<string>();

    if (!positions.length || reasoningVisibility === "off") {
      removeSeries(priceChart, lifecycleSeriesRef.current, "markers");
      lifecycleSeriesRef.current.forEach((_, id) => {
        if (id.startsWith("band-")) removeSeries(priceChart, lifecycleSeriesRef.current, id);
      });
      return;
    }

    positions.forEach((position) => {
      const entryCandle = activeCandles[position.entryIndex];
      if (!entryCandle) return;
      const exitIdx = position.exitIndex ?? activeCandles.length - 1;
      const exitCandle = activeCandles[Math.min(exitIdx, activeCandles.length - 1)];
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

      const data = activeCandles
        .slice(position.entryIndex, Math.min(exitIdx, activeCandles.length - 1) + 1)
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
      const entry = activeCandles[position.entryIndex];
      if (entry) {
        markers.push({
          time: entry.time as Time,
          position: position.side === "long" ? "belowBar" : "aboveBar",
          color: position.side === "long" ? palette.markerLong : palette.markerShort,
          shape: position.side === "long" ? "arrowUp" : "arrowDown",
        });
      }

      const exitIdx = position.exitIndex ?? activeCandles.length - 1;
      const exit = activeCandles[Math.min(exitIdx, activeCandles.length - 1)];
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
  }, [activeCandles, focusedAnchorId, positions, reasoningVisibility]);

  useEffect(() => {
    const priceChart = chartRef.current;
    if (!priceChart || !reasoningAnchors.length || reasoningVisibility === "off") {
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
      color: focusedAnchorId === anchor.id ? palette.markerExit : palette.markerReason,
      shape: "circle",
      text: anchor.phase === "ENTRY" ? "EN" : anchor.phase === "EXIT" ? "EX" : "HD",
    }));

    markerHost.setMarkers(markers);
  }, [activeTool, candleCount, draftPoint, focusedAnchorId, priceMin, priceSpan, reasoningAnchors, reasoningVisibility, timeIndexMap]);

  useEffect(() => {
    if (!visualCandles.length) return;
    const priceChart = chartRef.current;
    if (!priceChart) return;

    const timeIndex = buildTimeIndex(visualCandles);

    const sma = computeSMA(visualCandles, 20, timeIndex);
    const ema = computeEMA(visualCandles, 21, timeIndex);
    const vwap = computeVWAP(visualCandles, timeIndex);
    const bb = computeBollinger(visualCandles, 20, 2, timeIndex);

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
  }, [toggleBB, toggleEMA, toggleSMA, toggleVWAP, visualCandles]);

  useEffect(() => {
    if (!visualCandles.length) return;
    const chart = oscillatorChartRef.current;
    if (!chart) return;

    const timeIndex = buildTimeIndex(visualCandles);
    const rsi = computeRSI(visualCandles, 14, timeIndex);

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
  }, [toggleRSI, visualCandles]);

  useEffect(() => {
    const priceChart = chartRef.current;
    const container = containerRef.current;
    if (!priceChart || !container || reasoningVisibility === "off") {
      setHoverAnchor(null);
      return;
    }

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

      const priceChart = chartRef.current;
      const candleSeries = candleSeriesRef.current;
      if (activeTool !== "off" && priceChart && candleSeries) {
        const idx = timeIndexMap.get(param.time as number);
        if (idx !== undefined && candleCount) {
          const price = candleSeries.coordinateToPrice(param.point?.y ?? 0);
          if (price !== undefined && price !== null) {
            const normX = candleCount > 1 ? clamp(idx / (candleCount - 1), 0, 1) : 0;
            const normY = clamp((price - priceMin) / priceSpan, 0, 1);

            if (activeTool === "horizontal") {
              const id = `draw-${drawingIdRef.current += 1}`;
              setDrawings((current) => [...current, { id, type: "horizontal", y: normY }]);
            } else if (activeTool === "trendline") {
              if (!draftPoint) {
                setDraftPoint({ x: normX, y: normY });
              } else {
                const id = `draw-${drawingIdRef.current += 1}`;
                setDrawings((current) => [...current, { id, type: "trendline", start: draftPoint, end: { x: normX, y: normY } }]);
                setDraftPoint(null);
              }
            }
            return; // do not toggle anchors when drawing
          }
        }
      }

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
  }, [activeTool, candleCount, draftPoint, priceMin, priceSpan, reasoningAnchors, reasoningVisibility, timeIndexMap]);

  useEffect(() => {
    let mounted = true;

    const tick = () => {
      setCandles((current) => {
        if (!mounted || replayMode === "replay") return current;
        if (!mounted || !current.length) return current;
        const nextCandle = appendNextCandle(current[current.length - 1], rng, timeframe);
        const nextSeries = [...current, nextCandle];
        return nextSeries.slice(-WINDOW_SIZE);
      });

      setCompareCandles((current) => {
        if (!mounted || compareInstrument === "off" || replayMode === "replay" || !current.length) return current;
        const nextCandle = appendNextCandle(current[current.length - 1], compareRng, timeframe);
        const nextSeries = [...current, nextCandle];
        return nextSeries.slice(-WINDOW_SIZE);
      });
    };

    const interval = setInterval(tick, LIVE_TICK_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [compareInstrument, compareRng, replayMode, rng, timeframe]);

  useEffect(() => {
    const priceChart = chartRef.current;
    if (!priceChart || !visualCandles.length) return;

    const activeIds = new Set<string>();
    const len = visualCandles.length;
    const firstTime = visualCandles[0].time as Time;
    const lastTime = visualCandles[len - 1].time as Time;

    drawings.forEach((drawing) => {
      if (drawing.type === "horizontal") {
        const price = priceMin + drawing.y * priceSpan;
        const series = ensureSeries(drawingSeriesRef.current, drawing.id, () =>
          priceChart.addLineSeries({
            color: "rgba(94,234,212,0.75)",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          })
        );
        series.setData([
          { time: firstTime, value: price },
          { time: lastTime, value: price },
        ]);
        activeIds.add(drawing.id);
      } else if (drawing.type === "trendline") {
        const startIdx = clamp(Math.round(drawing.start.x * (len - 1)), 0, len - 1);
        const endIdx = clamp(Math.round(drawing.end.x * (len - 1)), 0, len - 1);
        const startTime = visualCandles[startIdx]?.time as Time;
        const endTime = visualCandles[endIdx]?.time as Time;
        if (!startTime || !endTime) return;
        const startPrice = priceMin + drawing.start.y * priceSpan;
        const endPrice = priceMin + drawing.end.y * priceSpan;

        const series = ensureSeries(drawingSeriesRef.current, drawing.id, () =>
          priceChart.addLineSeries({
            color: "rgba(94,234,212,0.85)",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          })
        );
        series.setData([
          { time: startTime, value: startPrice },
          { time: endTime, value: endPrice },
        ]);
        activeIds.add(drawing.id);
      }
    });

    drawingSeriesRef.current.forEach((series, id) => {
      if (!activeIds.has(id)) {
        priceChart.removeSeries(series);
        drawingSeriesRef.current.delete(id);
      }
    });
  }, [drawings, priceMin, priceSpan, visualCandles]);

  useEffect(() => {
    const priceChart = chartRef.current;
    if (!priceChart || !visualCandles.length) return;

    const spacing = TIMEFRAME_SECONDS[timeframe] ?? TIMEFRAME_SECONDS[DEFAULT_TIMEFRAME];
    const last = visualCandles[visualCandles.length - 1];
    const secondLast = visualCandles[visualCandles.length - 2] ?? last;
    const projectionStore = projectionSeriesRef.current;

    const forwardId = "projection-forward";
    const trendId = "projection-trend";

    const clearProjection = () => {
      projectionStore.forEach((series, id) => {
        priceChart.removeSeries(series);
        projectionStore.delete(id);
      });
    };

    if (projectionMode === "off") {
      clearProjection();
      return;
    }

    const ensureProjectionSeries = (id: string, color: string) =>
      ensureSeries(projectionStore, id, () =>
        priceChart.addLineSeries({
          color,
          lineWidth: 2,
          lineStyle: LineStyle.LargeDashed,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
      );

    const horizonSteps = 16;
    const horizon = spacing * horizonSteps;
    const baseTime = last.time as Time;

    if (projectionMode === "forward") {
      const slope = last.close - secondLast.close;
      const projected = last.close + slope * horizonSteps * 0.25;
      const series = ensureProjectionSeries(forwardId, "rgba(59,130,246,0.65)");
      series.setData([
        { time: baseTime, value: last.close },
        { time: (last.time + horizon) as Time, value: projected },
      ]);
      projectionStore.forEach((_, id) => {
        if (id !== forwardId) {
          const extra = projectionStore.get(id);
          if (extra) {
            priceChart.removeSeries(extra);
            projectionStore.delete(id);
          }
        }
      });
      return;
    }

    if (projectionMode === "trendline") {
      const trendDrawings = drawings.filter((d) => d.type === "trendline") as Extract<Drawing, { type: "trendline" }>[];
      const latest = trendDrawings[trendDrawings.length - 1];
      if (!latest) {
        clearProjection();
        return;
      }

      const len = visualCandles.length;
      const startIdx = clamp(Math.round(latest.start.x * (len - 1)), 0, len - 1);
      const endIdx = clamp(Math.round(latest.end.x * (len - 1)), 0, len - 1);
      const startTime = visualCandles[startIdx]?.time as Time;
      const endTime = visualCandles[endIdx]?.time as Time;
      if (!startTime || !endTime) {
        clearProjection();
        return;
      }

      const startPrice = priceMin + latest.start.y * priceSpan;
      const endPrice = priceMin + latest.end.y * priceSpan;
      const timeDelta = Math.max(1, (endTime as number) - (startTime as number));
      const slope = (endPrice - startPrice) / timeDelta;
      const projectedTime = (last.time + horizon) as Time;
      const projectedPrice = endPrice + slope * ((projectedTime as number) - (endTime as number));

      const series = ensureProjectionSeries(trendId, "rgba(94,234,212,0.7)");
      series.setData([
        { time: endTime, value: endPrice },
        { time: projectedTime, value: projectedPrice },
      ]);

      projectionStore.forEach((_, id) => {
        if (id !== trendId) {
          const extra = projectionStore.get(id);
          if (extra) {
            priceChart.removeSeries(extra);
            projectionStore.delete(id);
          }
        }
      });
      return;
    }

    clearProjection();
  }, [drawings, priceMin, priceSpan, projectionMode, timeframe, visualCandles]);

  useEffect(() => {
    const priceChart = chartRef.current;
    if (!priceChart) return;

    const clearCompare = () => {
      compareSeriesRef.current.forEach((series, id) => {
        priceChart.removeSeries(series);
        compareSeriesRef.current.delete(id);
      });
    };

    if (compareInstrument === "off" || !compareCandles.length || !visualCandles.length) {
      clearCompare();
      return;
    }

    const len = Math.min(compareCandles.length, visualCandles.length);
    if (!len) {
      clearCompare();
      return;
    }

    const baseSlice = replayMode === "replay" ? visualCandles.slice(0, len) : visualCandles.slice(-len);
    const overlaySlice = replayMode === "replay" ? compareCandles.slice(0, len) : compareCandles.slice(-len);
    const baseAnchor = baseSlice[0]?.close ?? 0;
    const compareAnchor = overlaySlice[0]?.close ?? 0;

    if (!baseAnchor || !compareAnchor) {
      clearCompare();
      return;
    }

    const data = baseSlice.map((candle, idx) => ({
      time: candle.time as Time,
      value: Number((baseAnchor * (overlaySlice[idx].close / compareAnchor)).toFixed(4)),
    }));

    const series = ensureSeries(compareSeriesRef.current, "compare-overlay", () =>
      priceChart.addLineSeries({
        color: palette.overlayCompare,
        lineWidth: 2,
        lineStyle: LineStyle.LargeDashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        autoscaleInfoProvider: () => null,
      })
    );

    series.setData(data);

    compareSeriesRef.current.forEach((_, id) => {
      if (id !== "compare-overlay") {
        removeSeries(priceChart, compareSeriesRef.current, id);
      }
    });
  }, [compareCandles, compareInstrument, replayMode, visualCandles]);

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
            <button className="pill" onClick={() => setIndicatorState("ema", !toggleEMA)} aria-pressed={toggleEMA}>
              EMA
            </button>
            <button className="pill" onClick={() => setIndicatorState("vwap", !toggleVWAP)} aria-pressed={toggleVWAP}>
              VWAP
            </button>
            <button className="pill" onClick={() => setToggleBB((v) => !v)} aria-pressed={toggleBB}>
              Bollinger
            </button>
            <button className="pill" onClick={() => setIndicatorState("rsi", !toggleRSI)} aria-pressed={toggleRSI}>
              RSI
            </button>
          </div>

          <section className="relative isolate overflow-hidden rounded-2xl border border-[color:var(--border-soft)]/50 bg-gradient-to-b from-[#0c1224] to-[#060914] shadow-xl shadow-black/30" style={{ height: 620 }}>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap gap-3 p-4 text-xs">
              <div className="rounded-xl bg-white/5 px-3 py-2 backdrop-blur">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Canvas</div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">{instrument}<span className="text-slate-400">•</span>{timeframe}</div>
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

            <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: "65%" }}>
              <div ref={containerRef} className="absolute inset-0" />
              <div className="absolute left-4 top-4 z-30 flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/80 backdrop-blur">
                <span className={`h-2 w-2 rounded-full ${botStatus === "running" ? "bg-emerald-300" : botStatus === "stopped" ? "bg-amber-300" : "bg-slate-300"}`} aria-hidden />
                <span>{`Bot ${botStatus}`}</span>
                <span className={`h-2 w-2 rounded-full ${replayMode === "replay" ? "bg-amber-300" : "bg-emerald-300"}`} aria-hidden />
                <span>{replayMode === "replay" ? "Replay — execution disabled" : "Live"}</span>
              </div>
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
