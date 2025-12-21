"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

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
  intent: Intent;
  regime: Regime;
  confidence: Confidence;
  summary: string;
  eventId: string;
};

const BASE_BAR_INTERVAL = 60 * 1000; // 1m bars
const DEFAULT_BAR_COUNT = 120;
const MAX_HISTORY = 240;
const EVENT_COUNT = 6;
const HOVER_RADIUS = 12;

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
      setSize({ width, height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

function usePaneColors(containerRef: React.RefObject<HTMLElement>, themeKey: string) {
  return useMemo(() => {
    // themeKey ensures recompute on theme toggle
    void themeKey;
    const fallback = {
      bg: "#14171c",
      chrome: "#1b1f26",
      text: "#e9ecf2",
      muted: "rgba(233,236,242,0.72)",
      up: "#7ac4ff",
      down: "#e47272",
      grid: "rgba(233,236,242,0.08)",
      volume: "#9fb3c8",
      eventEntryBuy: "#7ac4ff",
      eventEntrySell: "#e47272",
      eventStop: "#f59f9f",
      eventTarget: "#8fd19e",
      eventExit: "#c7cfdc",
      eventHighlight: "rgba(233,236,242,0.22)",
      reasoningAnchor: "rgba(233,236,242,0.55)",
      reasoningActive: "rgba(122,196,255,0.8)",
    };
    if (typeof window === "undefined") return fallback;
    const node = containerRef.current ?? document.documentElement;
    const style = getComputedStyle(node);
    const get = (name: string, alt: string) => style.getPropertyValue(name).trim() || alt;
    return {
      bg: get("--terminal-surface", fallback.bg),
      chrome: get("--terminal-chrome", fallback.chrome),
      text: get("--terminal-text", fallback.text),
      muted: get("--terminal-text-muted", fallback.muted),
      up: get("--terminal-accent", fallback.up),
      down: get("--terminal-text", fallback.down),
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
  }, [containerRef, themeKey]);
}

type ChartGeometry = {
  padding: { top: number; right: number; bottom: number; left: number };
  plotWidth: number;
  plotHeight: number;
  priceHeight: number;
  volumeHeight: number;
  volumeTop: number;
  minPrice: number;
  maxPrice: number;
  minTime: number;
  maxTime: number;
  maxVolume: number;
  timeToX: (time: number) => number;
  priceToY: (price: number) => number;
};

function computeGeometry(bars: Bar[], width: number, height: number): ChartGeometry | null {
  if (bars.length === 0 || width === 0 || height === 0) return null;
  const padding = { top: 8, right: 64, bottom: 28, left: 12 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  if (plotWidth <= 0 || plotHeight <= 0) return null;
  const volumeHeight = Math.max(32, Math.min(120, Math.round(plotHeight * 0.22)));
  const priceHeight = plotHeight - volumeHeight - 6;
  const volumeTop = padding.top + priceHeight + 6;

  const minPrice = Math.min(...bars.map((b) => b.low));
  const maxPrice = Math.max(...bars.map((b) => b.high));
  const minTime = bars[0].time;
  const maxTime = bars[bars.length - 1].time;
  const maxVolume = Math.max(...bars.map((b) => b.volume));

  const timeToX = (time: number) => padding.left + ((time - minTime) / (maxTime - minTime || 1)) * plotWidth;
  const priceToY = (price: number) => padding.top + (1 - (price - minPrice) / (maxPrice - minPrice || 1)) * priceHeight;

  return {
    padding,
    plotWidth,
    plotHeight,
    priceHeight,
    volumeHeight,
    volumeTop,
    minPrice,
    maxPrice,
    minTime,
    maxTime,
    maxVolume,
    timeToX,
    priceToY,
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
  if (!canvas || width === 0 || height === 0 || bars.length === 0) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = getDevicePixelRatioSafe();
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const { padding, plotWidth, priceHeight, volumeHeight, volumeTop, minPrice, maxPrice, minTime, maxTime, maxVolume, timeToX, priceToY } = geometry;

  // background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  // grid (minimal)
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i += 1) {
    const y = padding.top + (priceHeight / gridLines) * i;
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
    const y = volumeTop + volumeHeight - (bar.volume / (maxVolume || 1)) * volumeHeight;
    ctx.fillStyle = colors.volume;
    ctx.fillRect(x - barWidth / 2, y, barWidth, volumeTop + volumeHeight - y);
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
    ctx.fillText(label, x, volumeTop + volumeHeight + 6);
  }
}

export function ChartPane({ paneId, themeMode }: { paneId: string; themeMode: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const reasoningRef = useRef<HTMLCanvasElement>(null);
  const [bars, setBars] = useState<Bar[]>(() => generateSeedBars());
  const colors = usePaneColors(containerRef, themeMode);
  const { width, height } = useResize(containerRef);
  const [events, setEvents] = useState<ChartEvent[]>(() => deriveMockEvents(generateSeedBars()));
  const [reasoning, setReasoning] = useState<ReasoningAnchor[]>(() => deriveReasoning(deriveMockEvents(generateSeedBars())));
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null);

  const geometry = useMemo(() => computeGeometry(bars, width, height), [bars, width, height]);

  useEffect(() => {
    if (!geometry) return;
    drawChart({ canvas: canvasRef.current as HTMLCanvasElement, bars, colors, width, height, geometry });
  }, [bars, colors, geometry, height, width]);

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

  const reasoningPositions = useMemo<ReasoningRenderPosition[]>(() => {
    if (!geometry) return [];
    const { timeToX, priceToY } = geometry;
    return reasoning.map((item) => ({
      id: item.id,
      x: timeToX(item.time),
      y: priceToY(item.price),
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
    eventPositions.forEach((event) => {
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
  }, [colors, eventPositions, geometry, height, hoveredEventId, selectedEventId, width]);

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

    reasoningPositions.forEach((anchor) => {
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
  }, [activeReasoning, colors.reasoningActive, colors.reasoningAnchor, geometry, height, reasoningPositions, width]);

  useEffect(() => {
    const id = setInterval(() => {
      setBars((prev) => {
        if (prev.length === 0) {
          return generateSeedBars();
        }
        const latest = prev[prev.length - 1];
        const next = nextBarFrom(latest);
        return [...prev.slice(-Math.max(DEFAULT_BAR_COUNT, MAX_HISTORY) + 1), next];
      });
    }, 8000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setEvents(deriveMockEvents(bars));
  }, [bars]);

  useEffect(() => {
    setReasoning(deriveReasoning(events));
  }, [events]);

  return (
    <div
      ref={containerRef}
      aria-label={`Market structure chart for ${paneId}`}
      style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "transparent" }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
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
          let nearest: EventRenderPosition | null = null;
          let minDist = Number.MAX_VALUE;
          eventPositions.forEach((pos) => {
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
          } else {
            setHoveredEventId(null);
            setTooltip(null);
          }
        }}
        onMouseLeave={() => {
          setHoveredEventId(null);
          setTooltip(null);
        }}
        onClick={() => {
          if (hoveredEventId) {
            setSelectedEventId(hoveredEventId);
          }
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
    </div>
  );
}
