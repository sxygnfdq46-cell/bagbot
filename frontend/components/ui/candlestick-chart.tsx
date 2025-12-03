"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Skeleton from "@/components/ui/skeleton";
import type { Candle } from "@/lib/api/charts";

export type CandlestickChartProps = {
  candles: Candle[];
  mode?: "full" | "mini";
  loading?: boolean;
  onHover?: (candle: Candle | null) => void;
};

const PADDING_X = 28;
const PADDING_Y = 16;

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  const timePart = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${datePart} • ${timePart}`;
};

export default function CandlestickChart({ candles, mode = "full", loading = false, onHover }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const entry = entries[0];
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const chartHeight = mode === "full" ? 320 : 220;
  const volumeHeight = mode === "full" ? 90 : 60;
  const totalHeight = chartHeight + volumeHeight + PADDING_Y * 2 + 24;

  const fallbackCandle = useMemo(() => (candles.length ? candles[candles.length - 1] : null), [candles]);
  const activeCandle = hoverIndex != null && candles[hoverIndex] ? candles[hoverIndex] : fallbackCandle;

  useEffect(() => {
    onHover?.(activeCandle ?? null);
  }, [activeCandle, onHover]);

  useEffect(() => {
    if (hoverIndex != null && hoverIndex >= candles.length) {
      setHoverIndex(null);
    }
  }, [candles.length, hoverIndex]);

  const priceExtremes = useMemo(() => {
    if (!candles.length) return { min: 0, max: 1 };
    const lows = candles.map((candle) => candle.low);
    const highs = candles.map((candle) => candle.high);
    return { min: Math.min(...lows), max: Math.max(...highs) };
  }, [candles]);

  const maxVolume = useMemo(() => (candles.length ? Math.max(...candles.map((c) => c.volume)) : 1), [candles]);

  if (!candles.length) {
    return <Skeleton className="w-full" style={{ height: totalHeight }} />;
  }

  const viewWidth = Math.max(candles.length * 10 + PADDING_X * 2, 640);
  const availableWidth = viewWidth - PADDING_X * 2;
  const bucketWidth = availableWidth / candles.length;
  const candleBodyWidth = Math.max(4, bucketWidth * 0.5);
  const priceRange = priceExtremes.max - priceExtremes.min || 1;

  const scaleY = (price: number) => {
    const normalized = (price - priceExtremes.min) / priceRange;
    return PADDING_Y + chartHeight - normalized * chartHeight;
  };

  const volumeBaseY = PADDING_Y + chartHeight + 24 + volumeHeight;

  const resolvedIndex = hoverIndex != null ? hoverIndex : candles.length - 1;
  const crosshairX = PADDING_X + bucketWidth * resolvedIndex + bucketWidth / 2;
  const crosshairY = scaleY(activeCandle?.close ?? priceExtremes.min);
  const tooltipLeft = containerWidth
    ? Math.min(containerWidth - 180, Math.max(16, (crosshairX / viewWidth) * containerWidth - 90))
    : 16;

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !candles.length) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, ratio));
    const index = Math.min(candles.length - 1, Math.round(clamped * (candles.length - 1)));
    setHoverIndex(index);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div ref={containerRef} className="relative w-full" style={{ minHeight: totalHeight }}>
      <svg
        role="img"
        aria-label="Candlestick chart"
        viewBox={`0 0 ${viewWidth} ${totalHeight}`}
        preserveAspectRatio="none"
        className="w-full"
        height={totalHeight}
      >
        <defs>
          <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <rect
          x={PADDING_X / 2}
          y={PADDING_Y / 2}
          width={viewWidth - PADDING_X}
          height={chartHeight + volumeHeight + 32}
          rx={24}
          fill="rgba(255,255,255,0.01)"
          stroke="rgba(255,255,255,0.05)"
        />

        {candles.map((candle, index) => {
          const centerX = PADDING_X + bucketWidth * index + bucketWidth / 2;
          const highY = scaleY(candle.high);
          const lowY = scaleY(candle.low);
          const openY = scaleY(candle.open);
          const closeY = scaleY(candle.close);
          const rising = candle.close >= candle.open;
          const candleTop = rising ? closeY : openY;
          const candleBottom = rising ? openY : closeY;
          const candleHeight = Math.max(2, candleBottom - candleTop);
          const volumeHeightPx = Math.max(4, (candle.volume / maxVolume) * volumeHeight);
          const volumeY = volumeBaseY - volumeHeightPx;
          const volumeColor = rising ? "var(--accent-green)" : "rgba(255,99,132,0.8)";

          return (
            <g key={candle.timestamp}>
              <line
                x1={centerX}
                x2={centerX}
                y1={highY}
                y2={lowY}
                stroke={rising ? "var(--accent-green)" : "rgba(255,99,132,0.85)"}
                strokeWidth={1.5}
              />
              <rect
                x={centerX - candleBodyWidth / 2}
                y={candleTop}
                width={candleBodyWidth}
                height={candleHeight}
                rx={1.5}
                fill={rising ? "var(--accent-green)" : "rgba(255,99,132,0.85)"}
                opacity={hoverIndex === index ? 0.9 : 0.7}
              />
              <rect
                x={centerX - (bucketWidth * 0.35) / 2}
                y={volumeY}
                width={bucketWidth * 0.35}
                height={volumeHeightPx}
                fill={volumeColor}
                opacity={0.25}
              />
            </g>
          );
        })}

        {activeCandle && (
          <g>
            <line
              x1={crosshairX}
              x2={crosshairX}
              y1={PADDING_Y}
              y2={volumeBaseY}
              stroke="rgba(255,255,255,0.25)"
              strokeDasharray="6 4"
            />
            <line
              x1={PADDING_X}
              x2={viewWidth - PADDING_X}
              y1={crosshairY}
              y2={crosshairY}
              stroke="rgba(255,255,255,0.25)"
              strokeDasharray="6 4"
            />
          </g>
        )}
      </svg>

      <div
        className="absolute inset-0 cursor-crosshair"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        aria-hidden="true"
      />

      {activeCandle && (
        <div
          className="pointer-events-none absolute top-4 w-44 rounded-xl border border-[color:var(--border-soft)] bg-base/85 p-3 text-xs shadow-card"
          style={{ left: tooltipLeft }}
        >
          <p className="text-[color:var(--accent-gold)]">{formatTimestamp(activeCandle.timestamp)}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
            <span className="opacity-70">Open</span>
            <span className="text-right font-semibold">{activeCandle.open.toFixed(2)}</span>
            <span className="opacity-70">High</span>
            <span className="text-right font-semibold">{activeCandle.high.toFixed(2)}</span>
            <span className="opacity-70">Low</span>
            <span className="text-right font-semibold">{activeCandle.low.toFixed(2)}</span>
            <span className="opacity-70">Close</span>
            <span className="text-right font-semibold">{activeCandle.close.toFixed(2)}</span>
          </div>
        </div>
      )}
      {loading && (
        <span className="pointer-events-none absolute right-4 top-4 rounded-full border border-[color:var(--border-soft)] bg-base/70 px-3 py-1 text-[10px] uppercase tracking-[0.35em] opacity-80">
          Syncing
        </span>
      )}
    </div>
  );
}
