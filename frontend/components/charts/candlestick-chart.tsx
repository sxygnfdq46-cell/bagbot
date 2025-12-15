"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Skeleton from "@/components/ui/skeleton";
import type { Candle } from "@/lib/api/charts";
import { VolumeBars } from "@/components/charts/volume-bars";
import { CrosshairLines, CrosshairTooltip } from "@/components/charts/crosshair";

export type ChartHoverPayload = Candle & { index: number; time: number };

export type ChartMarker = {
  id: string;
  action: string;
  timestamp: number;
};

export type CandlestickChartProps = {
  candles: Candle[];
  mode?: "full" | "mini";
  loading?: boolean;
  onHover?: (candle: ChartHoverPayload | null) => void;
  markers?: ChartMarker[];
};

const PRICE_TICKS = 5;
const BASE_TIME_LABELS = 4;
const PADDING_X = 56;
const PADDING_Y = 24;
const AXIS_BOTTOM_GAP = 40;
const MIN_BUCKET_WIDTH = 7;
const MIN_VIEWBOX_WIDTH = 480;
const TOOLTIP_WIDTH = 196;

const fallingColor = "rgba(255,99,132,0.85)";
const risingColor = "var(--accent-green)";
const markerColors: Record<string, string> = {
  buy: "var(--accent-green)",
  sell: "rgba(255,99,132,0.85)",
  hold: "rgba(255,255,255,0.65)",
};

const formatTimeLabel = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 100) / 100;

export default function CandlestickChart({ candles, mode = "full", loading = false, onHover, markers = [] }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [pointerMode, setPointerMode] = useState<"idle" | "hover" | "touch-preview">("idle");

  const chartHeight = mode === "full" ? 340 : 220;
  const volumeHeight = mode === "full" ? 110 : 70;
  const totalHeight = chartHeight + volumeHeight + PADDING_Y * 2 + AXIS_BOTTOM_GAP;

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateWidth = (width: number) => {
      const next = Math.round(width);
      setContainerWidth((current) => (current !== next ? next : current));
    };

    const measure = () => updateWidth(node.getBoundingClientRect().width);
    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      updateWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (hoverIndex != null && hoverIndex >= candles.length) {
      setHoverIndex(null);
      setPointerMode("idle");
    }
  }, [candles.length, hoverIndex]);

  const buildPayload = (index: number): ChartHoverPayload | null => {
    const candle = candles[index];
    if (!candle) return null;
    return { ...candle, index, time: candle.timestamp };
  };

  const hoverPayload = hoverIndex != null ? buildPayload(hoverIndex) : null;

  useEffect(() => {
    onHover?.(hoverPayload ?? null);
  }, [hoverPayload, onHover]);

  const priceExtremes = useMemo(() => {
    if (!candles.length) return { min: 0, max: 1 };
    let min = candles[0].low;
    let max = candles[0].high;
    for (const candle of candles) {
      min = Math.min(min, candle.low);
      max = Math.max(max, candle.high);
    }
    const padding = (max - min || 1) * 0.05;
    return { min: min - padding, max: max + padding };
  }, [candles]);

  const maxVolume = useMemo(() => (candles.length ? Math.max(...candles.map((c) => c.volume)) : 1), [candles]);

  const minSeriesWidth = PADDING_X * 2 + Math.max(candles.length, 1) * MIN_BUCKET_WIDTH;
  const viewWidth = Math.max(containerWidth || 0, minSeriesWidth, MIN_VIEWBOX_WIDTH);
  const availableWidth = viewWidth - PADDING_X * 2;
  const bucketWidth = availableWidth / Math.max(candles.length, 1);
  const candleBodyWidth = Math.min(Math.max(5, bucketWidth * 0.55), Math.max(bucketWidth - 2, 5));
  const priceRange = priceExtremes.max - priceExtremes.min || 1;

  const scaleY = (price: number) => {
    const normalized = (price - priceExtremes.min) / priceRange;
    return round(PADDING_Y + chartHeight - normalized * chartHeight);
  };

  const priceTicks = useMemo(() => {
    const ticks = [] as Array<{ value: number; y: number }>;
    for (let i = 0; i <= PRICE_TICKS; i += 1) {
      const ratio = i / PRICE_TICKS;
      const value = priceExtremes.min + priceRange * (1 - ratio);
      ticks.push({ value, y: round(PADDING_Y + chartHeight * ratio) });
    }
    return ticks;
  }, [priceExtremes.min, priceRange, chartHeight]);

  const dynamicTimeLabels = Math.max(2, containerWidth < 520 ? BASE_TIME_LABELS - 1 : BASE_TIME_LABELS);
  const timeLabels = useMemo(() => {
    if (!candles.length) return [] as Array<{ label: string; x: number }>;
    const labels: Array<{ label: string; x: number }> = [];
    const step = Math.max(1, Math.floor(candles.length / dynamicTimeLabels));
    for (let i = 0; i < candles.length; i += step) {
      const candle = candles[i];
      const centerX = round(PADDING_X + bucketWidth * i + bucketWidth / 2);
      labels.push({ label: formatTimeLabel(candle.timestamp), x: centerX });
    }
    const last = candles[candles.length - 1];
    const lastX = round(PADDING_X + bucketWidth * (candles.length - 1) + bucketWidth / 2);
    if (!labels.find((label) => label.x === lastX)) {
      labels.push({ label: formatTimeLabel(last.timestamp), x: lastX });
    }
    return labels.slice(0, dynamicTimeLabels + 1);
  }, [candles, bucketWidth, dynamicTimeLabels]);

  const volumeBaseY = PADDING_Y + chartHeight + 24 + volumeHeight;

  const crosshairVisible = pointerMode !== "idle" && Boolean(hoverPayload);
  const crosshairIndex = hoverIndex ?? 0;
  const crosshairX = crosshairVisible
    ? clamp(round(PADDING_X + bucketWidth * crosshairIndex + bucketWidth / 2), PADDING_X, viewWidth - PADDING_X)
    : 0;
  const crosshairY = crosshairVisible && hoverPayload ? clamp(scaleY(hoverPayload.close), PADDING_Y, volumeBaseY) : 0;

  const tooltipLeft = useMemo(() => {
    if (!containerWidth || !crosshairVisible) return 16;
    const scaledX = (crosshairX / viewWidth) * containerWidth;
    const halfWidth = TOOLTIP_WIDTH / 2;
    return round(clamp(scaledX - halfWidth, 12, containerWidth - TOOLTIP_WIDTH - 12));
  }, [containerWidth, crosshairVisible, crosshairX, viewWidth]);

  const showSkeleton = candles.length === 0;

  if (showSkeleton) {
    return (
      <div ref={containerRef} className="w-full" style={{ minHeight: totalHeight }}>
        <Skeleton className="w-full" style={{ height: chartHeight + volumeHeight + PADDING_Y * 2 }} />
      </div>
    );
  }

  const updateHoverFromEvent = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !candles.length) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const index = Math.min(candles.length - 1, Math.round(ratio * (candles.length - 1)));
    setHoverIndex(index);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" && event.buttons === 1) {
      setPointerMode("idle");
      setHoverIndex(null);
      return;
    }
    setPointerMode("hover");
    updateHoverFromEvent(event);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    setPointerMode("touch-preview");
    updateHoverFromEvent(event);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    setPointerMode("idle");
    setHoverIndex(null);
  };

  const handlePointerLeave = () => {
    setPointerMode("idle");
    setHoverIndex(null);
  };

  const markerNodes = useMemo(() => {
    if (!markers.length || !candles.length) return null;

    const matchIndex = (timestamp: number) => {
      const idx = candles.findIndex((candle) => candle.timestamp >= timestamp);
      return idx === -1 ? candles.length - 1 : idx;
    };

    return markers.slice(-60).map((marker) => {
      const normalizedAction = marker.action?.toLowerCase?.() || "hold";
      const index = matchIndex(marker.timestamp);
      const candle = candles[index];
      const centerX = round(PADDING_X + bucketWidth * index + bucketWidth / 2);
      const priceY = scaleY(candle?.close ?? candles[candles.length - 1]?.close ?? 0);
      const color = markerColors[normalizedAction] ?? markerColors.hold;
      const size = 10;
      const points = normalizedAction === "sell"
        ? `${centerX},${priceY - size} ${centerX - size},${priceY + size} ${centerX + size},${priceY + size}`
        : `${centerX},${priceY + size} ${centerX - size},${priceY - size} ${centerX + size},${priceY - size}`;

      return (
        <g key={marker.id} aria-label={`decision-${normalizedAction}`}>
          <polygon points={points} fill={color} opacity={0.9} />
          <circle cx={centerX} cy={priceY} r={3} fill="rgba(0,0,0,0.5)" opacity={0.35} />
        </g>
      );
    });
  }, [markers, candles, bucketWidth, priceExtremes.min, priceRange, chartHeight]);

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
        <rect
          x={PADDING_X / 2}
          y={PADDING_Y / 2}
          width={viewWidth - PADDING_X}
          height={chartHeight + volumeHeight + AXIS_BOTTOM_GAP / 2}
          rx={24}
          fill="rgba(255,255,255,0.01)"
          stroke="rgba(255,255,255,0.05)"
        />

        {priceTicks.map((tick) => (
          <g key={`tick-${tick.value}`}>
            <line
              x1={PADDING_X - 12}
              x2={viewWidth - PADDING_X + 12}
              y1={tick.y}
              y2={tick.y}
              stroke="rgba(255,255,255,0.04)"
            />
            <text
              x={PADDING_X - 20}
              y={tick.y + 4}
              fontSize={12}
              textAnchor="end"
              fill="rgba(255,255,255,0.5)"
            >
              {tick.value.toFixed(2)}
            </text>
          </g>
        ))}

        {markerNodes}

        {candles.map((candle, index) => {
          const centerX = round(PADDING_X + bucketWidth * index + bucketWidth / 2);
          const highY = scaleY(candle.high);
          const lowY = scaleY(candle.low);
          const openY = scaleY(candle.open);
          const closeY = scaleY(candle.close);
          const rising = candle.close >= candle.open;
          const candleTop = Math.min(openY, closeY);
          const candleBottom = Math.max(openY, closeY);
          const candleHeight = Math.max(2, candleBottom - candleTop);
          const bodyColor = rising ? risingColor : fallingColor;

          return (
            <g key={candle.timestamp}>
              <line
                x1={centerX}
                x2={centerX}
                y1={highY}
                y2={lowY}
                stroke={bodyColor}
                strokeWidth={1.5}
                style={{ transition: "y1 160ms ease-out, y2 160ms ease-out" }}
              />
              <rect
                x={centerX - candleBodyWidth / 2}
                y={candleTop}
                width={candleBodyWidth}
                height={candleHeight}
                rx={2}
                fill={bodyColor}
                opacity={hoverIndex === index ? 0.95 : 0.75}
                style={{ transition: "y 160ms ease-out, height 160ms ease-out, opacity 120ms ease-out" }}
              />
            </g>
          );
        })}

        <VolumeBars
          candles={candles}
          bucketWidth={bucketWidth}
          paddingX={PADDING_X}
          maxVolume={maxVolume}
          height={volumeHeight}
          baseY={volumeBaseY}
        />

        <line x1={PADDING_X} x2={viewWidth - PADDING_X} y1={volumeBaseY} y2={volumeBaseY} stroke="rgba(255,255,255,0.1)" />

        {timeLabels.map((label) => (
          <text
            key={`time-${label.x}-${label.label}`}
            x={label.x}
            y={volumeBaseY + 24}
            fontSize={12}
            textAnchor="middle"
            fill="rgba(255,255,255,0.5)"
          >
            {label.label}
          </text>
        ))}

        <CrosshairLines
          visible={crosshairVisible}
          x={crosshairX}
          y={crosshairY}
          top={PADDING_Y}
          bottom={volumeBaseY}
          left={PADDING_X}
          right={viewWidth - PADDING_X}
        />
      </svg>

      <div
        className="absolute inset-0 cursor-crosshair"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        aria-hidden="true"
      />

      <CrosshairTooltip candle={crosshairVisible ? hoverPayload : null} left={tooltipLeft} />

      {loading && (
        <span className="pointer-events-none absolute right-4 top-4 rounded-full border border-[color:var(--border-soft)] bg-base/80 px-3 py-1 text-[10px] uppercase tracking-[0.35em] opacity-80">
          Syncing
        </span>
      )}
    </div>
  );
}
