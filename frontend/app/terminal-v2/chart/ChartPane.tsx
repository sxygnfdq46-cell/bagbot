"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { computeIndicators } from "./indicators";

export type Bar = {
  time: number; // epoch millis
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type EventType = "entry" | "exit" | "stop" | "target" | "trade";
type EventSide = "buy" | "sell";

type ChartEvent = {
  id: string;
  type: EventType;
  side: EventSide;
  time: number;
  price: number;
};

type EventRenderPosition = {
  id: string;
  x: number;
  y: number;
  type: EventType;
  side: EventSide;
  time: number;
  price: number;
};

type Intent = "long" | "short" | "neutral";
type Regime = "trend" | "range" | "volatility";
type Confidence = "low" | "medium" | "high";

type ReasoningAnchor = {
  id: string;
  eventId: string;
  intent: Intent;
  regime: Regime;
  confidence: Confidence;
  summary: string;
  time: number;
  price: number;
};

type ReasoningRenderPosition = {
  id: string;
  x: number;
  y: number;
  time: number;
  intent: Intent;
  regime: Regime;
  confidence: Confidence;
  summary: string;
  eventId: string;
};

type SectionKey = "price" | "volume" | "rsi" | "macd" | "stoch" | "mfi" | "flow";

type SectionGeometry = {
  top: number;
  height: number;
};

type ProjectionScenario = {
  id: "continuation" | "reversion" | "range";
  path: { time: number; price: number }[];
};

const DEFAULT_SCENARIO_ORDER: ProjectionScenario["id"][] = ["continuation", "reversion", "range"];

type ConfidencePoint = {
  time: number;
  upper: number;
  lower: number;
  confidencePct: number;
};

type ProjectionEnvelope = {
  base: { time: number; price: number }[];
  upper: { time: number; price: number }[];
  lower: { time: number; price: number }[];
  riskBand: { time: number; upper: number; lower: number }[];
  scenarios: ProjectionScenario[];
  scenarioConfidence: Record<ProjectionScenario["id"], ConfidencePoint[]>;
};

const BASE_BAR_INTERVAL = 60 * 1000; // 1m bars
const DEFAULT_BAR_COUNT = 120;
const MAX_HISTORY = 240;
const EVENT_COUNT = 6;
const HOVER_RADIUS = 12;
const CURSOR_WHEEL_STEP = 3; // bars per wheel tick in replay

function generateSeedBars(): Bar[] {
  const seed: Bar[] = [];
  const start = Date.now() - DEFAULT_BAR_COUNT * BASE_BAR_INTERVAL;
  let lastClose = 134.25;
  for (let i = 0; i < DEFAULT_BAR_COUNT; i += 1) {
    const time = start + i * BASE_BAR_INTERVAL;
    const drift = Math.sin(i / 12) * 0.8;
    const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.6)) * 0.12;
    const open = lastClose;
    const close = open + drift + noise;
    const high = Math.max(open, close) + 0.4;
    const low = Math.min(open, close) - 0.4;
    const volume = 900 + (Math.sin(i / 8) + 1) * 300 + Math.abs(noise) * 420;
    seed.push({ time, open, high, low, close, volume });
    lastClose = close;
  }
  return seed;
}

function nextBarFrom(last: Bar): Bar {
  const time = last.time + BASE_BAR_INTERVAL;
  const drift = Math.sin(time / (BASE_BAR_INTERVAL * 18)) * 0.9;
  const noise = (Math.sin(time / (BASE_BAR_INTERVAL * 2.7)) + Math.cos(time / (BASE_BAR_INTERVAL * 5.1))) * 0.14;
  const open = last.close;
  const close = open + drift + noise;
  const high = Math.max(open, close) + 0.35;
  const low = Math.min(open, close) - 0.35;
  const volume = 950 + (Math.sin(time / (BASE_BAR_INTERVAL * 5)) + 1) * 280 + Math.abs(noise) * 380;
  return { time, open, high, low, close, volume };
}

function deriveMockEvents(bars: Bar[]): ChartEvent[] {
  if (bars.length === 0) return [];
  const picks = [10, 25, 45, 65, 85, 105]
    .map((offset) => bars[Math.max(0, bars.length - 1 - offset)])
    .filter(Boolean) as Bar[];

  const types: EventType[] = ["entry", "stop", "target", "exit", "trade", "entry"];
  return picks.map((bar, idx) => {
    const type = types[idx % types.length];
    const side: EventSide = idx % 2 === 0 ? "buy" : "sell";
    const price = type === "target" ? bar.close + 0.8 : type === "stop" ? bar.close - 0.8 : bar.close;
    return {
      id: `${bar.time}-${type}-${idx}`,
      type,
      side,
      time: bar.time,
      price,
    };
  });
}

function normalizeBars(bars: Bar[] | null | undefined): Bar[] {
  const candidate: Bar[] = Array.isArray(bars) ? bars : [];
  if (candidate.length === 0) return generateSeedBars();
  if (isValidBars(candidate)) return candidate;
  const valid: Bar[] = [];
  for (const bar of candidate) {
    if (isValidBar(bar)) {
      valid.push(bar);
    }
  }
  return valid.length === 0 ? generateSeedBars() : valid;
}

function deriveReasoning(events: ChartEvent[]): ReasoningAnchor[] {
  const intents: Intent[] = ["long", "short", "neutral"];
  const regimes: Regime[] = ["trend", "range", "volatility"];
  const confidences: Confidence[] = ["low", "medium", "high"];

  return events.map((event, idx) => {
    const intent = intents[idx % intents.length];
    const regime = regimes[(idx + 1) % regimes.length];
    const confidence = confidences[(idx + 2) % confidences.length];

    const summary =
      intent === "long"
        ? "Bot bias: accumulation under session VWAP"
        : intent === "short"
        ? "Bot bias: distribution near local high"
        : "Bot bias: neutral hold while volatility normalizes";

    return {
      id: `${event.id}-reason-${idx}`,
      eventId: event.id,
      intent,
      regime,
      confidence,
      summary,
      time: event.time,
      price: event.price,
    };
  });
}

function getDevicePixelRatioSafe() {
  if (typeof window === "undefined") return 1;
  return Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
}

function useResize(ref: React.RefObject<HTMLElement>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

function usePaneColors(ref: React.RefObject<HTMLElement>, themeMode: string) {
  return useMemo(() => {
    const fallbackDark = {
      bg: "#05070d",
      chrome: "#0d1119",
      text: "#e6e9f2",
      muted: "#7c859a",
      up: "#35d49a",
      down: "#f45b69",
      grid: "rgba(255,255,255,0.08)",
      volume: "rgba(124,136,155,0.32)",
      eventEntryBuy: "#3dd598",
      eventEntrySell: "#f45b69",
      eventStop: "#f45b69",
      eventTarget: "#f5a524",
      eventExit: "#9fa6b2",
      eventHighlight: "rgba(255,255,255,0.1)",
      reasoningAnchor: "#7c8cfc",
      reasoningActive: "#b5befc",
    };

    const fallbackLight = {
      bg: "#f7f8fb",
      chrome: "#ffffff",
      text: "#1f2430",
      muted: "#7a859f",
      up: "#1ca672",
      down: "#d14343",
      grid: "rgba(0,0,0,0.08)",
      volume: "rgba(95,105,128,0.22)",
      eventEntryBuy: "#1ca672",
      eventEntrySell: "#d14343",
      eventStop: "#d14343",
      eventTarget: "#d99a1d",
      eventExit: "#5f6978",
      eventHighlight: "rgba(0,0,0,0.08)",
      reasoningAnchor: "#4255ff",
      reasoningActive: "#2c3bd9",
    };

    const fallback = themeMode === "light" ? fallbackLight : fallbackDark;
    const el = ref.current;
    const get = (name: string, fb: string) => {
      if (typeof window === "undefined" || !el) return fb;
      const value = getComputedStyle(el).getPropertyValue(name);
      return value?.trim() || fb;
    };

    return {
      bg: get("--terminal-surface", fallback.bg),
      chrome: get("--terminal-chrome", fallback.chrome),
      text: get("--terminal-text", fallback.text),
      muted: get("--terminal-text-muted", fallback.muted),
      up: get("--terminal-accent", fallback.up),
      down: get("--terminal-danger", fallback.down) || fallback.down,
      grid: get("--terminal-grid", fallback.grid) || get("--terminal-text-muted", fallback.grid),
      volume: get("--terminal-volume", fallback.volume) || get("--terminal-text-muted", fallback.volume),
      eventEntryBuy: get("--terminal-event-entry-buy", fallback.eventEntryBuy) || fallback.eventEntryBuy,
      eventEntrySell: get("--terminal-event-entry-sell", fallback.eventEntrySell) || fallback.eventEntrySell,
      eventStop: get("--terminal-event-stop", fallback.eventStop) || fallback.eventStop,
      eventTarget: get("--terminal-event-target", fallback.eventTarget) || fallback.eventTarget,
      eventExit: get("--terminal-event-exit", fallback.eventExit) || fallback.eventExit,
      eventHighlight: get("--terminal-event-highlight", fallback.eventHighlight) || fallback.eventHighlight,
      reasoningAnchor: get("--terminal-reasoning-anchor", fallback.reasoningAnchor) || fallback.reasoningAnchor,
      reasoningActive: get("--terminal-reasoning-active", fallback.reasoningActive) || fallback.reasoningActive,
    };
  }, [ref, themeMode]);
}

type ChartGeometry = {
  padding: { top: number; right: number; bottom: number; left: number };
  plotWidth: number;
  plotHeight: number;
  sections: Record<SectionKey, SectionGeometry>;
  xAxisY: number;
  minPrice: number;
  maxPrice: number;
  minTime: number;
  maxTime: number;
  maxVolume: number;
  timeToX: (time: number) => number;
  priceToY: (price: number) => number;
  xToTime: (x: number) => number;
};

const isValidBar = (bar: Bar | null | undefined): bar is Bar =>
  Boolean(bar) &&
  Number.isFinite(bar.time) &&
  Number.isFinite(bar.open) &&
  Number.isFinite(bar.high) &&
  Number.isFinite(bar.low) &&
  Number.isFinite(bar.close) &&
  Number.isFinite(bar.volume);

const isValidBars = (bars: Bar[] | null | undefined): bars is Bar[] =>
  Array.isArray(bars) && bars.length > 0 && bars.every(isValidBar);

function computeGeometry(bars: Bar[], width: number, height: number): ChartGeometry | null {
  if (!isValidBars(bars) || width === 0 || height === 0) return null;
  const padding = { top: 8, right: 64, bottom: 36, left: 12 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  if (plotWidth <= 0 || plotHeight <= 0) return null;

  const gap = 8;
  const sectionOrder: SectionKey[] = ["price", "volume", "rsi", "macd", "stoch", "mfi", "flow"];

  const volumeBase = Math.max(32, Math.min(96, Math.round(plotHeight * 0.12)));
  const panelBase = Math.max(52, Math.min(96, Math.round(plotHeight * 0.14)));
  let priceHeight = Math.max(180, Math.round(plotHeight * 0.42));

  const panelTotal = volumeBase + panelBase * 5;
  let remaining = plotHeight - priceHeight - gap * (sectionOrder.length - 1);
  if (remaining < 0) {
    priceHeight = Math.max(140, Math.round(plotHeight * 0.36));
    remaining = plotHeight - priceHeight - gap * (sectionOrder.length - 1);
  }
  const scale = remaining > 0 ? Math.min(1, remaining / panelTotal) : Math.max(0.5, remaining / panelTotal);
  const volumeHeight = Math.max(24, Math.round(volumeBase * (scale || 0.6)));
  const panelHeight = Math.max(48, Math.round(panelBase * (scale || 0.6)));

  const sections: Record<SectionKey, SectionGeometry> = {
    price: { top: padding.top, height: priceHeight },
    volume: { top: 0, height: volumeHeight },
    rsi: { top: 0, height: panelHeight },
    macd: { top: 0, height: panelHeight },
    stoch: { top: 0, height: panelHeight },
    mfi: { top: 0, height: panelHeight },
    flow: { top: 0, height: panelHeight },
  };

  for (let i = 1; i < sectionOrder.length; i += 1) {
    const prevKey = sectionOrder[i - 1];
    const currentKey = sectionOrder[i];
    const prev = sections[prevKey];
    sections[currentKey].top = prev.top + prev.height + gap;
  }

  const minPrice = Math.min(...bars.map((b) => b.low));
  const maxPrice = Math.max(...bars.map((b) => b.high));
  const minTime = bars[0].time;
  const maxTime = bars[bars.length - 1].time;
  const maxVolume = Math.max(...bars.map((b) => b.volume));

  const priceSection = sections.price;
  const timeToX = (time: number) => padding.left + ((time - minTime) / (maxTime - minTime || 1)) * plotWidth;
  const priceToY = (price: number) =>
    priceSection.top + (1 - (price - minPrice) / (maxPrice - minPrice || 1)) * priceSection.height;
  const xToTime = (x: number) => {
    const clampedX = Math.min(Math.max(x, padding.left), padding.left + plotWidth);
    return minTime + ((clampedX - padding.left) / (plotWidth || 1)) * (maxTime - minTime);
  };

  const xAxisY = padding.top + plotHeight + 6;

  return {
    padding,
    plotWidth,
    plotHeight,
    sections,
    xAxisY,
    minPrice,
    maxPrice,
    minTime,
    maxTime,
    maxVolume,
    timeToX,
    priceToY,
    xToTime,
  };
}

function drawChart({
  canvas,
  bars,
  colors,
  width,
  height,
  geometry,
}: {
  canvas: HTMLCanvasElement;
  bars: Bar[];
  colors: ReturnType<typeof usePaneColors>;
  width: number;
  height: number;
  geometry: ChartGeometry;
}) {
  if (!canvas || width === 0 || height === 0 || !isValidBars(bars)) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = getDevicePixelRatioSafe();
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const { padding, plotWidth, sections, minPrice, maxPrice, minTime, maxTime, maxVolume, timeToX, priceToY, xAxisY } = geometry;
  const priceSection = sections.price;
  const volumeSection = sections.volume;

  // background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  // grid (minimal)
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i += 1) {
    const y = priceSection.top + (priceSection.height / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // candles
  const candleWidth = Math.max(3, Math.min(14, plotWidth / bars.length - 2));
  ctx.lineWidth = Math.max(1, Math.min(2, candleWidth * 0.45));
  bars.forEach((bar) => {
    const x = timeToX(bar.time);
    const color = bar.close >= bar.open ? colors.up : colors.down;
    const openY = priceToY(bar.open);
    const closeY = priceToY(bar.close);
    const highY = priceToY(bar.high);
    const lowY = priceToY(bar.low);
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, highY);
    ctx.lineTo(x, lowY);
    ctx.stroke();
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(1, Math.abs(closeY - openY));
    ctx.fillStyle = color;
    ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
  });

  // volume
  bars.forEach((bar) => {
    const x = timeToX(bar.time);
    const barWidth = Math.max(2, candleWidth * 0.8);
    const y = volumeSection.top + volumeSection.height - (bar.volume / (maxVolume || 1)) * volumeSection.height;
    ctx.fillStyle = colors.volume;
    ctx.fillRect(x - barWidth / 2, y, barWidth, volumeSection.top + volumeSection.height - y);
  });

  // axes text
  ctx.fillStyle = colors.muted;
  ctx.font = "11px 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const priceTicks = 4;
  for (let i = 0; i <= priceTicks; i += 1) {
    const price = minPrice + ((maxPrice - minPrice) * i) / priceTicks;
    const y = priceToY(price);
    ctx.fillText(price.toFixed(2), width - 4, y);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const timeTicks = 4;
  for (let i = 0; i <= timeTicks; i += 1) {
    const t = minTime + ((maxTime - minTime) * i) / timeTicks;
    const date = new Date(t);
    const label = `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const x = timeToX(t);
    ctx.fillText(label, x, xAxisY);
  }
}

function computeProjections(bars: Bar[], indicators: ReturnType<typeof computeIndicators>): ProjectionEnvelope | null {
  if (bars.length === 0) return null;
  const horizonBars = 20;
  const lookback = Math.min(24, bars.length);
  const recent = bars.slice(-lookback);
  const times = recent.map((b) => b.time);
  const closes = recent.map((b) => b.close);
  const n = closes.length;
  if (n < 2) return null;

  const meanX = times.reduce((a, b) => a + b, 0) / n;
  const meanY = closes.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = times[i] - meanX;
    num += dx * (closes[i] - meanY);
    den += dx * dx;
  }
  const slopePerMs = den === 0 ? 0 : num / den;
  const slopePerBar = slopePerMs * BASE_BAR_INTERVAL;
  const lastBar = bars[bars.length - 1];
  const startPrice = lastBar.close;

  const atr = indicators.volatility.atr[indicators.volatility.atr.length - 1] ?? 0;
  const std = indicators.volatility.stdDev20[indicators.volatility.stdDev20.length - 1] ?? 0;
  const volatility = Number.isFinite(atr) && atr > 0 ? atr : Math.max(std, 0.1);

  const regime = (() => {
    const ema20 = indicators.trend.ema20[indicators.trend.ema20.length - 1] ?? startPrice;
    const ema50 = indicators.trend.ema50[indicators.trend.ema50.length - 1] ?? startPrice;
    if (startPrice > ema20 && ema20 > ema50) return "trend";
    if (startPrice < ema20 && ema20 < ema50) return "downtrend";
    return "range";
  })();

  const base: { time: number; price: number }[] = [];
  const upper: { time: number; price: number }[] = [];
  const lower: { time: number; price: number }[] = [];
  const riskBand: { time: number; upper: number; lower: number }[] = [];
  const scenarios: ProjectionScenario[] = [
    { id: "continuation", path: [] },
    { id: "reversion", path: [] },
    { id: "range", path: [] },
  ];

  const scenarioConfidence: Record<ProjectionScenario["id"], ConfidencePoint[]> = {
    continuation: [],
    reversion: [],
    range: [],
  };

  for (let i = 1; i <= horizonBars; i += 1) {
    const t = lastBar.time + i * BASE_BAR_INTERVAL;
    const drift = slopePerBar * i;
    const spread = volatility * Math.sqrt(i);
    const basePrice = startPrice + drift;
    base.push({ time: t, price: basePrice });
    upper.push({ time: t, price: basePrice + spread });
    lower.push({ time: t, price: basePrice - spread });
    riskBand.push({ time: t, upper: basePrice + spread * 1.6, lower: basePrice - spread * 1.6 });

    const contSlope = drift;
    const revSlope = -Math.abs(drift) * 0.8;
    const rangeSlope = 0;
    const contPrice = startPrice + contSlope;
    const revPrice = startPrice + revSlope;
    const rangePrice = startPrice + rangeSlope;

    scenarios[0].path.push({ time: t, price: contPrice });
    scenarios[1].path.push({ time: t, price: revPrice });
    scenarios[2].path.push({ time: t, price: rangePrice });

    const decay = Math.max(0.2, 1 - i / horizonBars);
    const width = Math.max(volatility * 0.2, spread * 0.55 * decay);
    const baseConfidence = 92 - Math.sqrt(i) * 4 - (1 - decay) * 32;
    const confidencePct = Math.max(28, Math.min(90, baseConfidence));

    scenarioConfidence.continuation.push({ time: t, upper: contPrice + width, lower: contPrice - width, confidencePct });
    scenarioConfidence.reversion.push({ time: t, upper: revPrice + width, lower: revPrice - width, confidencePct });
    scenarioConfidence.range.push({ time: t, upper: rangePrice + width, lower: rangePrice - width, confidencePct });
  }

  // Regime slight adjustments
  if (regime === "range") {
    scenarios[0].path = scenarios[2].path.map((p) => ({ ...p }));
  }

  return { base, upper, lower, riskBand, scenarios, scenarioConfidence };
}

function drawIndicators({
  canvas,
  bars,
  colors,
  width,
  height,
  geometry,
  indicators,
}: {
  canvas: HTMLCanvasElement;
  bars: Bar[];
  colors: ReturnType<typeof usePaneColors>;
  width: number;
  height: number;
  geometry: ChartGeometry;
  indicators: ReturnType<typeof computeIndicators>;
}) {
  if (!canvas || !geometry || bars.length === 0) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = getDevicePixelRatioSafe();
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const { trend, volatility, momentum, volume, structure, fibonacci } = indicators;
  const { sections, timeToX, priceToY, padding, plotWidth } = geometry;

  const overlayColors = {
    sma: colors.muted,
    ema: colors.text,
    wma: colors.eventTarget,
    hma: colors.eventEntryBuy,
    vwap: colors.eventEntrySell,
    ichimoku: colors.reasoningAnchor,
    bollinger: "rgba(124,136,155,0.35)",
    keltner: "rgba(95,105,128,0.35)",
    donchian: "rgba(180,180,180,0.32)",
    atr: "rgba(255,255,255,0.35)",
    std: "rgba(200,200,200,0.35)",
    pivots: "rgba(255,255,255,0.25)",
    fib: "rgba(255,255,255,0.32)",
  } as const;

  const panelColor = {
    rsi: "#7c8cfc",
    macd: "#1ca672",
    macdSignal: "#f5a524",
    stochK: "#35d49a",
    stochD: "#f45b69",
    mfi: "#2c3bd9",
    obv: "#94a3b8",
    accDist: "#8b5cf6",
    volumeOsc: "#f59e0b",
    cci: "#38bdf8",
    roc: "#e0f2fe",
    williams: "#f97316",
  };

  const finite = (vals: number[]) => vals.filter((v) => Number.isFinite(v));
  const mapPanelY = (panel: SectionKey, value: number, min: number, max: number) => {
    const s = sections[panel];
    return s.top + (1 - (value - min) / (max - min || 1)) * s.height;
  };

  const drawLine = (values: number[], color: string, widthPx = 1, dash: number[] = []) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = widthPx;
    ctx.setLineDash(dash);
    ctx.beginPath();
    let started = false;
    values.forEach((v, i) => {
      if (!Number.isFinite(v)) return;
      const x = timeToX(bars[i].time);
      const y = priceToY(v);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.restore();
  };

  // trend overlays
  drawLine(trend.sma20, overlayColors.sma, 1.1);
  drawLine(trend.sma50, overlayColors.sma, 1);
  drawLine(trend.ema20, overlayColors.ema, 1.2);
  drawLine(trend.ema50, overlayColors.ema, 1.2, [4, 3]);
  drawLine(trend.wma21, overlayColors.wma, 1);
  drawLine(trend.hma21, overlayColors.hma, 1.1);
  drawLine(trend.vwap, overlayColors.vwap, 1.2, [6, 4]);

  // ichimoku lines (outline only)
  drawLine(trend.ichimoku.tenkan, overlayColors.ichimoku, 1);
  drawLine(trend.ichimoku.kijun, overlayColors.ichimoku, 1.1, [3, 3]);
  drawLine(trend.ichimoku.senkouA, overlayColors.ichimoku, 1, [6, 4]);
  drawLine(trend.ichimoku.senkouB, overlayColors.ichimoku, 1, [6, 4]);
  drawLine(trend.ichimoku.chikou, overlayColors.ichimoku, 1, [2, 2]);

  // volatility bands
  drawLine(volatility.bollinger.upper, overlayColors.bollinger, 1);
  drawLine(volatility.bollinger.mid, overlayColors.bollinger, 0.8, [4, 3]);
  drawLine(volatility.bollinger.lower, overlayColors.bollinger, 1);
  drawLine(volatility.keltner.upper, overlayColors.keltner, 1);
  drawLine(volatility.keltner.mid, overlayColors.keltner, 0.8, [4, 3]);
  drawLine(volatility.keltner.lower, overlayColors.keltner, 1);
  drawLine(volatility.donchian.upper, overlayColors.donchian, 1, [3, 4]);
  drawLine(volatility.donchian.lower, overlayColors.donchian, 1, [3, 4]);

  // ATR / Std Dev scaled to lower band of price area
  const atrValues = finite(volatility.atr);
  const stdValues = finite(volatility.stdDev20);
  const rangeMax = Math.max(...atrValues, ...stdValues, 1);
  const priceBandHeight = Math.min(sections.price.height * 0.3, 42);
  const toOverlayY = (v: number) => sections.price.top + sections.price.height - (v / rangeMax) * priceBandHeight;
  const drawOverlayMetric = (values: number[], color: string) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    let started = false;
    values.forEach((v, i) => {
      if (!Number.isFinite(v)) return;
      const x = timeToX(bars[i].time);
      const y = toOverlayY(v);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.restore();
  };
  drawOverlayMetric(volatility.atr, overlayColors.atr);
  drawOverlayMetric(volatility.stdDev20, overlayColors.std);

  // pivot points and high/low bands
  const drawHLine = (price: number, color: string, dash: number[] = []) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash(dash);
    const y = priceToY(price);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + plotWidth, y);
    ctx.stroke();
    ctx.restore();
  };
  const pivots = [structure.classic.pp, structure.classic.r1, structure.classic.s1, structure.classic.r2, structure.classic.s2];
  pivots.forEach((level) => drawHLine(level, overlayColors.pivots, [2, 3]));
  drawHLine(structure.sessionHighLow.high, overlayColors.pivots, [4, 4]);
  drawHLine(structure.sessionHighLow.low, overlayColors.pivots, [4, 4]);
  drawHLine(structure.dailyHighLow.high, overlayColors.pivots, [6, 4]);
  drawHLine(structure.dailyHighLow.low, overlayColors.pivots, [6, 4]);
  drawHLine(structure.weeklyBands.high, overlayColors.pivots, [8, 4]);
  drawHLine(structure.weeklyBands.low, overlayColors.pivots, [8, 4]);

  // opening range box
  const openStartX = timeToX(structure.openingRange.start);
  const openEndX = timeToX(structure.openingRange.end);
  ctx.save();
  ctx.strokeStyle = overlayColors.pivots;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.strokeRect(openStartX, priceToY(structure.openingRange.high), openEndX - openStartX, priceToY(structure.openingRange.low) - priceToY(structure.openingRange.high));
  ctx.restore();

  // volume moving average overlay on volume section
  ctx.save();
  ctx.strokeStyle = colors.eventEntryBuy;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  let volStarted = false;
  volume.volSma.forEach((v, i) => {
    if (!Number.isFinite(v)) return;
    const x = timeToX(bars[i].time);
    const y = sections.volume.top + sections.volume.height - (v / (geometry.maxVolume || 1)) * sections.volume.height;
    if (!volStarted) {
      ctx.moveTo(x, y);
      volStarted = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
  ctx.restore();

  // Fibonacci retracement
  if (fibonacci.retracement) {
    const startX = timeToX(fibonacci.retracement.start.time);
    const endX = timeToX(fibonacci.retracement.end.time);
    fibonacci.retracement.levels.forEach((lvl) => {
      const y = priceToY(lvl.price);
      ctx.save();
      ctx.strokeStyle = overlayColors.fib;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
      ctx.restore();
    });
  }

  // Fibonacci extensions
  if (fibonacci.extension) {
    const endX = timeToX(fibonacci.extension.end.time);
    const futureX = padding.left + plotWidth;
    fibonacci.extension.levels.forEach((lvl) => {
      const y = priceToY(lvl.price);
      ctx.save();
      ctx.strokeStyle = overlayColors.fib;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(endX, y);
      ctx.lineTo(futureX, y);
      ctx.stroke();
      ctx.restore();
    });
  }

  // Fibonacci fan (subtle lines)
  if (fibonacci.fan) {
    const start = fibonacci.fan.start;
    const end = fibonacci.fan.end;
    const startX = timeToX(start.time);
    const endX = timeToX(end.time);
    const deltaY = priceToY(end.close) - priceToY(start.close);
    fibonacci.fan.lines.forEach((line) => {
      const targetY = priceToY(start.close) + (deltaY * line.level) / 100;
      ctx.save();
      ctx.strokeStyle = overlayColors.fib;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(startX, priceToY(start.close));
      ctx.lineTo(endX, targetY);
      ctx.stroke();
      ctx.restore();
    });
  }

  // panel helpers
  const renderOscPanel = (panel: SectionKey, series: { label: string; values: number[]; color: string }[], midLines: number[] = []) => {
    const combined = series.flatMap((s) => finite(s.values));
    const min = Math.min(...combined, -1);
    const max = Math.max(...combined, 1);
    const s = sections[panel];

    // mid/zero lines
    midLines.forEach((level) => {
      const y = mapPanelY(panel, level, min, max);
      ctx.save();
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotWidth, y);
      ctx.stroke();
      ctx.restore();
    });

    series.forEach((serie) => {
      ctx.save();
      ctx.strokeStyle = serie.color;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      let started = false;
      serie.values.forEach((v, i) => {
        if (!Number.isFinite(v)) return;
        const x = timeToX(bars[i].time);
        const y = mapPanelY(panel, v, min, max);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.restore();
    });

    // panel frame
    ctx.save();
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.strokeRect(padding.left, s.top, plotWidth, s.height);
    ctx.restore();
  };

  // RSI panel
  renderOscPanel("rsi", [{ label: "RSI", values: momentum.rsi, color: panelColor.rsi }], [50, 70, 30]);

  // MACD panel
  const macdValues = momentum.macd;
  const macdCombined = finite([...macdValues.line, ...macdValues.signal, ...macdValues.histogram]);
  const macdMin = Math.min(...macdCombined, -1);
  const macdMax = Math.max(...macdCombined, 1);
  const macdZero = mapPanelY("macd", 0, macdMin, macdMax);
  ctx.save();
  ctx.strokeStyle = colors.grid;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(padding.left, macdZero);
  ctx.lineTo(padding.left + plotWidth, macdZero);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  macdValues.histogram.forEach((v, i) => {
    if (!Number.isFinite(v)) return;
    const x = timeToX(bars[i].time) - 2;
    const y = mapPanelY("macd", v, macdMin, macdMax);
    ctx.fillRect(x, v >= 0 ? y : macdZero, 4, Math.abs(y - macdZero));
  });
  ctx.restore();

  renderOscPanel(
    "macd",
    [
      { label: "MACD", values: macdValues.line, color: panelColor.macd },
      { label: "Signal", values: macdValues.signal, color: panelColor.macdSignal },
    ],
    []
  );

  // Stochastic panel
  renderOscPanel(
    "stoch",
    [
      { label: "%K", values: momentum.stoch.k, color: panelColor.stochK },
      { label: "%D", values: momentum.stoch.d, color: panelColor.stochD },
    ],
    [50, 80, 20]
  );

  // MFI panel
  renderOscPanel("mfi", [{ label: "MFI", values: volume.mfi, color: panelColor.mfi }], [50, 80, 20]);

  // Flow panel (OBV, Acc/Dist, Volume Osc, CCI, ROC, Williams %R)
  renderOscPanel(
    "flow",
    [
      { label: "OBV", values: volume.obv, color: panelColor.obv },
      { label: "A/D", values: volume.accDist, color: panelColor.accDist },
      { label: "VolOsc", values: volume.volumeOsc, color: panelColor.volumeOsc },
      { label: "CCI", values: momentum.cci, color: panelColor.cci },
      { label: "ROC", values: momentum.roc, color: panelColor.roc },
      { label: "%R", values: momentum.williamsR, color: panelColor.williams },
    ],
    [0]
  );
}

function drawProjections({
  canvas,
  bars,
  colors,
  width,
  height,
  geometry,
  projections,
  activeScenarioIndex,
  activeScenarioId,
}: {
  canvas: HTMLCanvasElement;
  bars: Bar[];
  colors: ReturnType<typeof usePaneColors>;
  width: number;
  height: number;
  geometry: ChartGeometry;
  projections: ProjectionEnvelope | null;
  activeScenarioIndex: number;
  activeScenarioId: ProjectionScenario["id"];
}) {
  if (!canvas || !geometry || !projections || bars.length === 0) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = getDevicePixelRatioSafe();
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const { padding, plotWidth, minTime } = geometry;
  const baseMaxTime = geometry.maxTime;
  const lastProjectionTime = projections.base[projections.base.length - 1]?.time ?? baseMaxTime;
  const projMaxTime = Math.max(baseMaxTime, lastProjectionTime);
  const timeToXProj = (time: number) => padding.left + ((time - minTime) / (projMaxTime - minTime || 1)) * plotWidth;
  const priceToY = geometry.priceToY;

  const drawPath = (points: { time: number; price: number }[], color: string, widthPx: number, dash: number[], alpha: number) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = widthPx;
    ctx.setLineDash(dash);
    ctx.beginPath();
    let started = false;
    points.forEach((p) => {
      const x = timeToXProj(p.time);
      const y = priceToY(p.price);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.restore();
  };

  // risk envelope
  ctx.save();
  ctx.fillStyle = "rgba(160, 170, 190, 0.08)";
  ctx.strokeStyle = "rgba(160, 170, 190, 0.18)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  projections.riskBand.forEach((pt, idx) => {
    const x = timeToXProj(pt.time);
    const y = priceToY(pt.upper);
    if (idx === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  for (let i = projections.riskBand.length - 1; i >= 0; i -= 1) {
    const pt = projections.riskBand[i];
    const x = timeToXProj(pt.time);
    const y = priceToY(pt.lower);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // base and bounds
  drawPath(projections.base, "rgba(200, 210, 230, 0.8)", 1.2, [6, 5], 0.9);
  drawPath(projections.upper, "rgba(200, 210, 230, 0.6)", 1, [4, 4], 0.7);
  drawPath(projections.lower, "rgba(200, 210, 230, 0.6)", 1, [4, 4], 0.7);

  // active scenario confidence envelope
  const confidencePoints = projections.scenarioConfidence[activeScenarioId];
  if (confidencePoints && confidencePoints.length > 1) {
    drawPath(
      confidencePoints.map((p) => ({ time: p.time, price: p.upper })),
      "rgba(200, 210, 230, 0.55)",
      1,
      [2, 3],
      0.5
    );
    drawPath(
      confidencePoints.map((p) => ({ time: p.time, price: p.lower })),
      "rgba(200, 210, 230, 0.55)",
      1,
      [2, 3],
      0.5
    );
  }

  // scenario forks
  projections.scenarios.forEach((scenario, idx) => {
    const isActive = idx === activeScenarioIndex;
    const alpha = isActive ? 0.9 : 0.4;
    const widthPx = isActive ? 1.4 : 1;
    drawPath(scenario.path, "rgba(180, 190, 210, 1)", widthPx, [2, 3], alpha);
  });
}

export function ChartPane({ paneId, themeMode }: { paneId: string; themeMode: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const indicatorRef = useRef<HTMLCanvasElement>(null);
  const projectionRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const reasoningRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLCanvasElement>(null);
  const [bars, setBars] = useState<Bar[]>(() => generateSeedBars());
  const colors = usePaneColors(containerRef, themeMode);
  const { width, height } = useResize(containerRef);
  const [events, setEvents] = useState<ChartEvent[]>(() => deriveMockEvents(generateSeedBars()));
  const [reasoning, setReasoning] = useState<ReasoningAnchor[]>(() => deriveReasoning(deriveMockEvents(generateSeedBars())));
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null);
  const [isReplay, setIsReplay] = useState(false);
  const [cursorTime, setCursorTime] = useState<number | null>(null);
  const [isDraggingCursor, setIsDraggingCursor] = useState(false);
  const [showProjections, setShowProjections] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<ProjectionScenario["id"]>("continuation");

  const safeBars = useMemo(() => normalizeBars(bars), [bars]);

  const visibleBars = useMemo(() => {
    if (!isReplay || cursorTime === null) return safeBars;
    const filtered = safeBars.filter((bar) => bar.time <= cursorTime);
    if (filtered.length === 0 && safeBars.length > 0) {
      return [safeBars[0]];
    }
    return filtered;
  }, [cursorTime, isReplay, safeBars]);

  const geometry = useMemo(() => computeGeometry(visibleBars, width, height), [visibleBars, width, height]);

  const indicators = useMemo(() => computeIndicators(visibleBars), [visibleBars]);

  const projections = useMemo(() => computeProjections(visibleBars, indicators), [indicators, visibleBars]);

  const scenarioOrder = useMemo(() => projections?.scenarios.map((s) => s.id) ?? DEFAULT_SCENARIO_ORDER, [projections]);

  const activeScenarioIndex = useMemo(() => {
    const idx = scenarioOrder.indexOf(activeScenarioId);
    return idx === -1 ? 0 : idx;
  }, [activeScenarioId, scenarioOrder]);

  useEffect(() => {
    if (!projections) return;
    if (!projections.scenarios.some((s) => s.id === activeScenarioId)) {
      setActiveScenarioId(projections.scenarios[0].id);
    }
  }, [activeScenarioId, projections]);

  const cycleScenario = useCallback(
    (delta: number) => {
      setActiveScenarioId((prev) => {
        const order = scenarioOrder.length > 0 ? scenarioOrder : DEFAULT_SCENARIO_ORDER;
        const currentIdx = order.indexOf(prev);
        const startIdx = currentIdx === -1 ? 0 : currentIdx;
        const nextIdx = (startIdx + delta + order.length) % order.length;
        return order[nextIdx];
      });
    },
    [scenarioOrder]
  );

  useEffect(() => {
    if (!geometry) return;
    drawChart({ canvas: canvasRef.current as HTMLCanvasElement, bars: visibleBars, colors, width, height, geometry });
  }, [colors, geometry, height, visibleBars, width]);

  useEffect(() => {
    if (!geometry || visibleBars.length === 0) {
      setCursorTime(null);
      setIsDraggingCursor(false);
      return;
    }
    setCursorTime((prev) => {
      if (prev === null) return prev;
      return Math.min(Math.max(prev, geometry.minTime), geometry.maxTime);
    });
  }, [geometry, visibleBars.length]);

  useEffect(() => {
    if (!geometry) return;
    drawIndicators({
      canvas: indicatorRef.current as HTMLCanvasElement,
      bars: visibleBars,
      colors,
      width,
      height,
      geometry,
      indicators,
    });
  }, [colors, geometry, height, indicators, visibleBars, width]);

  useEffect(() => {
    if (!geometry) return;
    if (!showProjections) {
      const canvas = projectionRef.current as HTMLCanvasElement;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
      }
      return;
    }
    drawProjections({
      canvas: projectionRef.current as HTMLCanvasElement,
      bars: visibleBars,
      colors,
      width,
      height,
      geometry,
      projections,
      activeScenarioIndex,
      activeScenarioId,
    });
  }, [activeScenarioId, activeScenarioIndex, colors, geometry, height, projections, showProjections, visibleBars, width]);

  const eventPositions = useMemo<EventRenderPosition[]>(() => {
    if (!geometry) return [];
    const { timeToX, priceToY } = geometry;
    return events.map((event) => ({
      id: event.id,
      x: timeToX(event.time),
      y: priceToY(event.price),
      type: event.type,
      side: event.side,
      time: event.time,
      price: event.price,
    }));
  }, [events, geometry]);

  const effectiveEvents = useMemo(() => {
    if (!isReplay || cursorTime === null) return eventPositions;
    return eventPositions.filter((e) => e.time <= cursorTime);
  }, [cursorTime, eventPositions, isReplay]);

  const reasoningPositions = useMemo<ReasoningRenderPosition[]>(() => {
    if (!geometry) return [];
    const { timeToX, priceToY } = geometry;
    return reasoning.map((item) => ({
      id: item.id,
      x: timeToX(item.time),
      y: priceToY(item.price),
      time: item.time,
      intent: item.intent,
      regime: item.regime,
      confidence: item.confidence,
      summary: item.summary,
      eventId: item.eventId,
    }));
  }, [geometry, reasoning]);

  const activeReasoning = useMemo(() => {
    const targetEventId = hoveredEventId ?? selectedEventId;
    if (!targetEventId) return null;
    return reasoningPositions.find((item) => item.eventId === targetEventId) ?? null;
  }, [hoveredEventId, reasoningPositions, selectedEventId]);

  const effectiveReasoning = useMemo<ReasoningRenderPosition[]>(() => {
    if (!isReplay || cursorTime === null) return reasoningPositions;
    return reasoningPositions.filter((r) => r.eventId && r.x >= 0 && r.time <= cursorTime);
  }, [cursorTime, isReplay, reasoningPositions]);

  useEffect(() => {
    if (!isReplay) return;
    if (cursorTime === null) return;
    const nearest = effectiveEvents
      .filter((e) => e.time <= cursorTime)
      .sort((a, b) => Math.abs(b.time - cursorTime) - Math.abs(a.time - cursorTime))
      .pop();
    if (nearest) {
      setHoveredEventId(nearest.id);
      const date = new Date(nearest.time);
      const reasoningLabel = activeReasoning
        ? ` · Intent: ${activeReasoning.intent} · Regime: ${activeReasoning.regime} · Conf: ${activeReasoning.confidence}`
        : "";
      setTooltip({
        x: nearest.x,
        y: nearest.y,
        label: `${nearest.type.toUpperCase()} @ ${nearest.price.toFixed(2)} · ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}${reasoningLabel}`,
      });
    } else {
      setHoveredEventId(null);
      setTooltip(null);
    }
  }, [activeReasoning, cursorTime, effectiveEvents, isReplay]);

  useEffect(() => {
    if (!geometry) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;
    const dpr = getDevicePixelRatioSafe();
    overlay.width = width * dpr;
    overlay.height = height * dpr;
    overlay.style.width = `${width}px`;
    overlay.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = 1.5;
    effectiveEvents.forEach((event) => {
      const isHovered = hoveredEventId === event.id;
      const isSelected = selectedEventId === event.id;
      const baseColor =
        event.type === "entry"
          ? event.side === "buy"
            ? colors.eventEntryBuy
            : colors.eventEntrySell
          : event.type === "stop"
          ? colors.eventStop
          : event.type === "target"
          ? colors.eventTarget
          : colors.eventExit;
      const radius = 6;

      if (isSelected || isHovered) {
        ctx.fillStyle = colors.eventHighlight;
        ctx.beginPath();
        ctx.arc(event.x, event.y, radius + 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = baseColor;
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(event.x, event.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (event.type === "stop" || event.type === "target") {
        ctx.strokeStyle = colors.muted;
        ctx.beginPath();
        ctx.moveTo(event.x + radius + 2, event.y);
        ctx.lineTo(event.x + radius + 28, event.y);
        ctx.stroke();
      }
    });
  }, [colors, effectiveEvents, geometry, height, hoveredEventId, selectedEventId, width]);

  useEffect(() => {
    if (!geometry) return;
    const layer = reasoningRef.current;
    if (!layer) return;
    const ctx = layer.getContext("2d");
    if (!ctx) return;
    const dpr = getDevicePixelRatioSafe();
    layer.width = width * dpr;
    layer.height = height * dpr;
    layer.style.width = `${width}px`;
    layer.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    effectiveReasoning.forEach((anchor) => {
      const isActive = activeReasoning?.id === anchor.id;
      ctx.strokeStyle = isActive ? colors.reasoningActive : colors.reasoningAnchor;
      ctx.fillStyle = isActive ? colors.reasoningActive : colors.reasoningAnchor;
      ctx.lineWidth = isActive ? 1.5 : 1;
      const radius = isActive ? 5 : 4;

      // anchor marker
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      if (isActive) {
        // subtle bracket around price point
        ctx.beginPath();
        ctx.moveTo(anchor.x - 14, anchor.y - 6);
        ctx.lineTo(anchor.x - 6, anchor.y - 6);
        ctx.lineTo(anchor.x - 6, anchor.y + 6);
        ctx.lineTo(anchor.x - 14, anchor.y + 6);
        ctx.moveTo(anchor.x + 14, anchor.y - 6);
        ctx.lineTo(anchor.x + 6, anchor.y - 6);
        ctx.lineTo(anchor.x + 6, anchor.y + 6);
        ctx.lineTo(anchor.x + 14, anchor.y + 6);
        ctx.stroke();
      }
    });
  }, [activeReasoning, colors.reasoningActive, colors.reasoningAnchor, effectiveReasoning, geometry, height, width]);

  useEffect(() => {
    const layer = cursorRef.current;
    if (!layer) return;
    const ctx = layer.getContext("2d");
    if (!ctx) return;
    const dpr = getDevicePixelRatioSafe();
    layer.width = width * dpr;
    layer.height = height * dpr;
    layer.style.width = `${width}px`;
    layer.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (!isReplay || cursorTime === null || !geometry) return;
    const x = geometry.timeToX(Math.min(Math.max(cursorTime, geometry.minTime), geometry.maxTime));
    ctx.strokeStyle = colors.muted;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(x, geometry.padding.top);
    ctx.lineTo(x, height - geometry.padding.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [colors.muted, cursorTime, geometry, height, isReplay, width]);

  useEffect(() => {
    if (isReplay) return undefined;
    const id = setInterval(() => {
      setBars((prev) => {
        const safePrev = normalizeBars(prev);
        if (safePrev.length === 0) {
          return generateSeedBars();
        }
        const latest = safePrev[safePrev.length - 1];
        const next = nextBarFrom(latest);
        return [...safePrev.slice(-Math.max(DEFAULT_BAR_COUNT, MAX_HISTORY) + 1), next];
      });
    }, 8000);
    return () => clearInterval(id);
  }, [isReplay]);

  useEffect(() => {
    setEvents(deriveMockEvents(safeBars));
  }, [safeBars]);

  useEffect(() => {
    setReasoning(deriveReasoning(events));
  }, [events]);

  useEffect(() => {
    if (!isReplay) return;
    if (!geometry) return;
    const lastTime = geometry.maxTime;
    setCursorTime((prev) => (prev === null ? lastTime : Math.min(Math.max(prev, geometry.minTime), geometry.maxTime)));
  }, [geometry, isReplay]);

  useEffect(() => {
    if (!showProjections) return undefined;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        cycleScenario(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        cycleScenario(-1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cycleScenario, showProjections]);

  return (
    <div
      ref={containerRef}
      aria-label={`Market structure chart for ${paneId}`}
      style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "transparent" }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
      <canvas
        ref={indicatorRef}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      <canvas
        ref={projectionRef}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      <canvas
        ref={reasoningRef}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      <canvas
        ref={overlayRef}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
          pointerEvents: "auto",
        }}
        onMouseMove={(event) => {
          if (!geometry) return;
          const rect = (event.currentTarget as HTMLCanvasElement).getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          const fmt = (v: number, dec = 2) => (Number.isFinite(v) ? v.toFixed(dec) : "--");
          if (isReplay && isDraggingCursor) {
            setCursorTime(geometry.xToTime(x));
          }

          // 1) executions
          const pool = isReplay ? effectiveEvents : eventPositions;
          let nearest: EventRenderPosition | null = null;
          let minDist = Number.MAX_VALUE;
          pool.forEach((pos) => {
            const dx = pos.x - x;
            const dy = pos.y - y;
            const dist = Math.hypot(dx, dy);
            if (dist < HOVER_RADIUS && dist < minDist) {
              nearest = pos;
              minDist = dist;
            }
          });
          if (nearest) {
            const hit: EventRenderPosition = nearest;
            setHoveredEventId(hit.id);
            const date = new Date(hit.time);
            const reasoningLabel = activeReasoning
              ? ` · Intent: ${activeReasoning.intent} · Regime: ${activeReasoning.regime} · Conf: ${activeReasoning.confidence}`
              : "";
            const label = `${hit.type.toUpperCase()} @ ${hit.price.toFixed(2)} · ${date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}${reasoningLabel}`;
            setTooltip({ x: hit.x, y: hit.y, label });
            return;
          }

          // 2) reasoning anchors (proximity to anchor points)
          let reasoningHit: ReasoningRenderPosition | null = null;
          let reasoningDist = Number.MAX_VALUE;
          effectiveReasoning.forEach((anchor: ReasoningRenderPosition) => {
            const dx = anchor.x - x;
            const dy = anchor.y - y;
            const dist = Math.hypot(dx, dy);
            if (dist < HOVER_RADIUS && dist < reasoningDist) {
              reasoningHit = anchor;
              reasoningDist = dist;
            }
          });
          if (reasoningHit) {
            const anchor = reasoningHit as ReasoningRenderPosition;
            setHoveredEventId(anchor.eventId);
            setTooltip({
              x: anchor.x,
              y: anchor.y,
              label: `Intent ${anchor.intent} · Regime ${anchor.regime} · Conf ${anchor.confidence}`,
            });
            return;
          }

          // 3) projections (cone + scenarios)
          const distToPolyline = <T extends { time: number }>(
            points: T[],
            getY: (point: T) => number,
            getMeta?: (p1: T, p2: T, tProj: number) => { time: number; confidencePct?: number }
          ) => {
            let best = Number.MAX_VALUE;
            let bestPoint: { x: number; y: number } | null = null;
            let bestMeta: { time: number; confidencePct?: number } | null = null;
            for (let i = 0; i < points.length - 1; i += 1) {
              const p1 = points[i];
              const p2 = points[i + 1];
              const x1 = geometry.timeToX(p1.time);
              const y1 = geometry.priceToY(getY(p1));
              const x2 = geometry.timeToX(p2.time);
              const y2 = geometry.priceToY(getY(p2));
              const dx = x2 - x1;
              const dy = y2 - y1;
              const lenSq = dx * dx + dy * dy || 1;
              const tProj = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lenSq));
              const projX = x1 + tProj * dx;
              const projY = y1 + tProj * dy;
              const dist = Math.hypot(projX - x, projY - y);
              if (dist < best) {
                best = dist;
                bestPoint = { x: projX, y: projY };
                bestMeta = getMeta ? getMeta(p1, p2, tProj) : { time: p1.time + tProj * (p2.time - p1.time) };
              }
            }
            return { dist: best, point: bestPoint, meta: bestMeta };
          };

          if (showProjections && projections) {
            const activeScenario = projections.scenarios[activeScenarioIndex] ?? projections.scenarios[0];
            const originTime = visibleBars[visibleBars.length - 1]?.time ?? geometry.maxTime;

            if (activeScenario) {
              const scenarioHit = distToPolyline(activeScenario.path, (p) => p.price);
              if (scenarioHit.dist < 10 && scenarioHit.point) {
                setTooltip({
                  x: scenarioHit.point.x,
                  y: scenarioHit.point.y,
                  label: `Regime: ${activeScenario.id}`,
                });
                setHoveredEventId(null);
                return;
              }

              const confBand = projections.scenarioConfidence[activeScenario.id];
              if (confBand && confBand.length > 1) {
                const upperHit = distToPolyline(
                  confBand,
                  (p) => p.upper,
                  (p1, p2, tProj) => {
                    const time = p1.time + tProj * (p2.time - p1.time);
                    const conf = p1.confidencePct + tProj * (p2.confidencePct - p1.confidencePct);
                    return { time, confidencePct: conf };
                  }
                );
                const lowerHit = distToPolyline(
                  confBand,
                  (p) => p.lower,
                  (p1, p2, tProj) => {
                    const time = p1.time + tProj * (p2.time - p1.time);
                    const conf = p1.confidencePct + tProj * (p2.confidencePct - p1.confidencePct);
                    return { time, confidencePct: conf };
                  }
                );
                const chosen = upperHit.dist <= lowerHit.dist ? upperHit : lowerHit;
                if (chosen.point && chosen.meta && chosen.dist < 8) {
                  const offsetMin = Math.max(0, (chosen.meta.time - originTime) / 60000);
                  const confLabel = Math.round(chosen.meta.confidencePct ?? 0);
                  setTooltip({
                    x: chosen.point.x,
                    y: chosen.point.y,
                    label: `Confidence ${confLabel}% · +${offsetMin.toFixed(1)}m`,
                  });
                  setHoveredEventId(null);
                  return;
                }
              }
            }

            const baseHit = distToPolyline(projections.base, (p) => p.price);
            if (baseHit.point && baseHit.dist < 8) {
              setTooltip({ x: baseHit.point.x, y: baseHit.point.y, label: "Volatility-weighted forward envelope" });
              setHoveredEventId(null);
              return;
            }
          }

          // 4) fibonacci levels
          if (indicators.fibonacci.retracement) {
            const startX = geometry.timeToX(indicators.fibonacci.retracement.start.time);
            const endX = geometry.timeToX(indicators.fibonacci.retracement.end.time);
            for (const lvl of indicators.fibonacci.retracement.levels) {
              const yLine = geometry.priceToY(lvl.price);
              if (x >= Math.min(startX, endX) && x <= Math.max(startX, endX) && Math.abs(y - yLine) < 6) {
                setHoveredEventId(null);
                setTooltip({ x, y: yLine, label: `Fib ${lvl.level}% · ${lvl.price.toFixed(2)}` });
                return;
              }
            }
          }
          if (indicators.fibonacci.extension) {
            const endX = geometry.timeToX(indicators.fibonacci.extension.end.time);
            for (const lvl of indicators.fibonacci.extension.levels) {
              const yLine = geometry.priceToY(lvl.price);
              if (x >= endX && Math.abs(y - yLine) < 6) {
                setHoveredEventId(null);
                setTooltip({ x, y: yLine, label: `Fib Ext ${lvl.level}% · ${lvl.price.toFixed(2)}` });
                return;
              }
            }
          }

          // 5) indicators & price
          if (visibleBars.length === 0) {
            setHoveredEventId(null);
            setTooltip(null);
            return;
          }
          const time = geometry.xToTime(x);
          let nearestIdx = 0;
          let nearestTimeDist = Number.MAX_VALUE;
          visibleBars.forEach((bar, idx) => {
            const dist = Math.abs(bar.time - time);
            if (dist < nearestTimeDist) {
              nearestIdx = idx;
              nearestTimeDist = dist;
            }
          });
          const bar = visibleBars[nearestIdx];

          const sectionMatch = (key: SectionKey) => {
            const s = geometry.sections[key];
            return y >= s.top && y <= s.top + s.height;
          };

          if (sectionMatch("rsi")) {
            const rsiVal = indicators.momentum.rsi[nearestIdx];
            setTooltip({ x, y, label: `RSI ${Number.isFinite(rsiVal) ? rsiVal.toFixed(2) : "--"}` });
            setHoveredEventId(null);
            return;
          }
          if (sectionMatch("macd")) {
            const macdLine = indicators.momentum.macd.line[nearestIdx];
            const macdSignal = indicators.momentum.macd.signal[nearestIdx];
            const macdHist = indicators.momentum.macd.histogram[nearestIdx];
            setTooltip({
              x,
              y,
              label: `MACD ${fmt(macdLine, 4)} · Signal ${fmt(macdSignal, 4)} · Hist ${fmt(macdHist, 4)}`,
            });
            setHoveredEventId(null);
            return;
          }
          if (sectionMatch("stoch")) {
            const k = indicators.momentum.stoch.k[nearestIdx];
            const dVal = indicators.momentum.stoch.d[nearestIdx];
            setTooltip({ x, y, label: `%K ${fmt(k)} · %D ${fmt(dVal)}` });
            setHoveredEventId(null);
            return;
          }
          if (sectionMatch("mfi")) {
            const mfi = indicators.volume.mfi[nearestIdx];
            setTooltip({ x, y, label: `MFI ${fmt(mfi)}` });
            setHoveredEventId(null);
            return;
          }
          if (sectionMatch("flow")) {
            const obv = indicators.volume.obv[nearestIdx];
            const ad = indicators.volume.accDist[nearestIdx];
            const volOsc = indicators.volume.volumeOsc[nearestIdx];
            const cci = indicators.momentum.cci[nearestIdx];
            const roc = indicators.momentum.roc[nearestIdx];
            const wr = indicators.momentum.williamsR[nearestIdx];
            setTooltip({
              x,
              y,
              label: `OBV ${Number.isFinite(obv) ? Math.round(obv) : 0} · A/D ${Number.isFinite(ad) ? Math.round(ad) : 0} · VolOsc ${fmt(volOsc)} · CCI ${fmt(cci, 1)} · ROC ${fmt(roc)} · %R ${fmt(wr)}`,
            });
            setHoveredEventId(null);
            return;
          }
          if (sectionMatch("volume")) {
            const vol = bar.volume;
            const volMa = indicators.volume.volSma[nearestIdx];
            setTooltip({ x, y, label: `Vol ${vol.toFixed(0)} · VolMA ${fmt(volMa, 0)}` });
            setHoveredEventId(null);
            return;
          }

          // price area indicators
          if (sectionMatch("price")) {
            const t = new Date(bar.time);
            const overlayLabel = [
              `SMA20 ${fmt(indicators.trend.sma20[nearestIdx])}`,
              `EMA20 ${fmt(indicators.trend.ema20[nearestIdx])}`,
              `VWAP ${fmt(indicators.trend.vwap[nearestIdx])}`,
              `BB ${fmt(indicators.volatility.bollinger.upper[nearestIdx])}/${fmt(indicators.volatility.bollinger.lower[nearestIdx])}`,
              `Keltner ${fmt(indicators.volatility.keltner.mid[nearestIdx])}`,
            ].join(" · ");
            setTooltip({
              x,
              y,
              label: `${bar.close.toFixed(2)} @ ${t.getHours().toString().padStart(2, "0")}:${t
                .getMinutes()
                .toString()
                .padStart(2, "0")}` + ` · ${overlayLabel}`,
            });
            setHoveredEventId(null);
            return;
          }

          setHoveredEventId(null);
          setTooltip(null);
        }}
        onMouseLeave={() => {
          setHoveredEventId(null);
          setTooltip(null);
          setIsDraggingCursor(false);
        }}
        onMouseDown={(event) => {
          if (!geometry) return;
          if (!isReplay) return;
          const rect = (event.currentTarget as HTMLCanvasElement).getBoundingClientRect();
          const x = event.clientX - rect.left;
          const time = geometry.xToTime(x);
          setCursorTime(time);
          setIsDraggingCursor(true);
        }}
        onMouseUp={() => {
          setIsDraggingCursor(false);
        }}
        onClick={(event) => {
          if (!geometry) return;
          if (isReplay) {
            const rect = (event.currentTarget as HTMLCanvasElement).getBoundingClientRect();
            const x = event.clientX - rect.left;
            const time = geometry.xToTime(x);
            setCursorTime(time);
          }
          if (hoveredEventId) {
            setSelectedEventId(hoveredEventId);
          }
        }}
        onWheel={(event) => {
          if (!isReplay || !geometry) return;
          event.preventDefault();
          const direction = event.deltaY > 0 ? 1 : -1;
          const step = BASE_BAR_INTERVAL * CURSOR_WHEEL_STEP;
          const nextTime = (cursorTime ?? geometry.maxTime) + direction * step;
          const clamped = Math.min(Math.max(nextTime, geometry.minTime), geometry.maxTime);
          setCursorTime(clamped);
        }}
      />
      <canvas
        ref={cursorRef}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      {tooltip ? (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: "translate(-50%, -100%)",
            backgroundColor: colors.chrome,
            color: colors.text,
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: "11px",
            fontWeight: 600,
            pointerEvents: "none",
            boxShadow: "none",
            whiteSpace: "nowrap",
          }}
        >
          {tooltip.label}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          display: "flex",
          gap: 6,
          pointerEvents: "auto",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setIsReplay(false);
            setCursorTime(null);
            setIsDraggingCursor(false);
            setHoveredEventId(null);
            setTooltip(null);
          }}
          aria-pressed={!isReplay}
          style={{
            padding: "4px 8px",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 12,
            border: `1px solid ${colors.grid}`,
            color: isReplay ? colors.muted : colors.text,
            backgroundColor: isReplay ? colors.chrome : colors.up,
            cursor: "pointer",
          }}
        >
          Live
        </button>
        <button
          type="button"
          onClick={() => {
            setIsReplay(true);
            if (geometry) {
              setCursorTime((prev) => (prev === null ? geometry.maxTime : Math.min(Math.max(prev, geometry.minTime), geometry.maxTime)));
            }
          }}
          aria-pressed={isReplay}
          style={{
            padding: "4px 8px",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 12,
            border: `1px solid ${colors.grid}`,
            color: isReplay ? colors.text : colors.muted,
            backgroundColor: isReplay ? colors.eventTarget : colors.chrome,
            cursor: "pointer",
          }}
        >
          Replay
        </button>
        <button
          type="button"
          onClick={() => {
            setShowProjections((prev) => !prev);
          }}
          aria-pressed={showProjections}
          style={{
            padding: "4px 8px",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 12,
            border: `1px solid ${colors.grid}`,
            color: showProjections ? colors.text : colors.muted,
            backgroundColor: showProjections ? colors.eventHighlight : colors.chrome,
            cursor: "pointer",
          }}
        >
          Projections
        </button>
      </div>
    </div>
  );
}
