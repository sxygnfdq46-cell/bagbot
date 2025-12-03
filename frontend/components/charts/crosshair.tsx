"use client";

import type { Candle } from "@/lib/api/charts";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatTooltipTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const day = date.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${day} • ${time}`;
};

export type CrosshairLinesProps = {
  visible: boolean;
  x: number;
  y: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export function CrosshairLines({ visible, x, y, top, bottom, left, right }: CrosshairLinesProps) {
  if (!visible) return null;
  const clampedX = clamp(x, left, right);
  const clampedY = clamp(y, top, bottom);
  return (
    <g data-layer="crosshair-lines">
      <line x1={clampedX} x2={clampedX} y1={top} y2={bottom} stroke="rgba(255,255,255,0.3)" strokeDasharray="6 4" />
      <line x1={left} x2={right} y1={clampedY} y2={clampedY} stroke="rgba(255,255,255,0.3)" strokeDasharray="6 4" />
    </g>
  );
}

export type CrosshairTooltipProps = {
  candle: Candle | null;
  left: number;
  top?: number;
};

export function CrosshairTooltip({ candle, left, top = 16 }: CrosshairTooltipProps) {
  if (!candle) return null;
  return (
    <div
      className="pointer-events-none absolute w-48 rounded-xl border border-[color:var(--border-soft)] bg-base/85 p-3 text-xs shadow-card transition-opacity"
      style={{ left, top, opacity: candle ? 1 : 0, transform: "translateZ(0)" }}
    >
      <p className="text-[color:var(--accent-gold)]">{formatTooltipTimestamp(candle.timestamp)}</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
        <span className="opacity-70">Open</span>
        <span className="text-right font-semibold">{candle.open.toFixed(2)}</span>
        <span className="opacity-70">High</span>
        <span className="text-right font-semibold">{candle.high.toFixed(2)}</span>
        <span className="opacity-70">Low</span>
        <span className="text-right font-semibold">{candle.low.toFixed(2)}</span>
        <span className="opacity-70">Close</span>
        <span className="text-right font-semibold">{candle.close.toFixed(2)}</span>
        <span className="opacity-70">Volume</span>
        <span className="text-right font-semibold">{Intl.NumberFormat(undefined, { notation: "compact" }).format(candle.volume)}</span>
      </dl>
    </div>
  );
}
