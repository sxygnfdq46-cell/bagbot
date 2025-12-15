"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
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
  coachEnabled?: boolean;
};

const PRICE_TICKS = 5;
const BASE_TIME_LABELS = 4;
const PADDING_X = 56;
const PADDING_Y = 14;
const AXIS_BOTTOM_GAP = 32;
const MIN_BUCKET_WIDTH = 9;
const MIN_VIEWBOX_WIDTH = 480;
const TOOLTIP_WIDTH = 196;
const MIN_VISIBLE_CANDLES = 20;
const BASE_VISIBLE_CANDLES = 120;
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 3.2;
const ZOOM_STEP = 0.08;

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
const round = (value: number) => Math.round(value * 1000) / 1000;

export default function CandlestickChart({ candles, mode = "full", loading = false, onHover, markers = [], coachEnabled = true }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerCache = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ distance: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [pointerMode, setPointerMode] = useState<"idle" | "hover" | "touch-preview">("idle");
  const [panOffset, setPanOffset] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isLive, setIsLive] = useState(true);
  const dragState = useRef<{ active: boolean; startX: number; startOffset: number }>({ active: false, startX: 0, startOffset: 0 });

  const chartHeight = mode === "full" ? 340 : 220;
  const volumeHeight = mode === "full" ? 110 : 70;
  const totalHeight = chartHeight + volumeHeight + PADDING_Y * 2 + AXIS_BOTTOM_GAP;

  const totalCandles = Math.max(candles.length, 1);
  const desiredVisible = Math.round(
    Math.min(BASE_VISIBLE_CANDLES, Math.max(candles.length, MIN_VISIBLE_CANDLES)) / Math.max(zoom, ZOOM_MIN)
  );
  const visibleCount = clamp(desiredVisible, 1, totalCandles);
  const maxOffset = Math.max(0, candles.length - visibleCount);
  const effectiveOffset = clamp(panOffset, 0, maxOffset);
  const startIndex = Math.max(0, candles.length - visibleCount - effectiveOffset);
  const endIndex = Math.min(candles.length, startIndex + visibleCount);
  const renderCandles = candles.slice(startIndex, endIndex);

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
    if (hoverIndex != null && hoverIndex >= renderCandles.length) {
      setHoverIndex(null);
      setPointerMode("idle");
    }
  }, [renderCandles.length, hoverIndex]);

  useEffect(() => {
    if (isLive) {
      setPanOffset(0);
    }
  }, [candles.length, isLive]);

  useEffect(() => {
    if (panOffset === 0 && !isLive) {
      setIsLive(true);
    }
  }, [panOffset, isLive]);

  const buildPayload = (index: number): ChartHoverPayload | null => {
    const candle = renderCandles[index];
    if (!candle) return null;
    return { ...candle, index: startIndex + index, time: candle.timestamp };
  };

  const hoverPayload = hoverIndex != null ? buildPayload(hoverIndex) : null;

  useEffect(() => {
    onHover?.(hoverPayload ?? null);
  }, [hoverPayload, onHover]);

  const priceExtremes = useMemo(() => {
    if (!renderCandles.length) return { min: 0, max: 1 };
    let min = renderCandles[0].low;
    let max = renderCandles[0].high;
    for (const candle of renderCandles) {
      min = Math.min(min, candle.low);
      max = Math.max(max, candle.high);
    }
    const rawRange = max - min;
    const guardRange = rawRange || Math.max(Math.abs(max), 1) * 0.0005;
    const padding = guardRange * 0.01;
    const midpoint = (max + min) / 2;
    const halfRange = Math.max(rawRange / 2, guardRange * 0.4);
    return { min: midpoint - halfRange - padding, max: midpoint + halfRange + padding };
  }, [renderCandles]);

  const maxVolume = useMemo(() => (renderCandles.length ? Math.max(...renderCandles.map((c) => c.volume)) : 1), [renderCandles]);

  const minSeriesWidth = PADDING_X * 2 + Math.max(renderCandles.length, 1) * MIN_BUCKET_WIDTH;
  const viewWidth = Math.max(containerWidth || 0, minSeriesWidth, MIN_VIEWBOX_WIDTH);
  const availableWidth = viewWidth - PADDING_X * 2;
  const bucketWidth = availableWidth / Math.max(renderCandles.length, 1);
  const candleBodyWidth = Math.min(Math.max(8, bucketWidth * 0.78), Math.max(bucketWidth - 1, 8));
  const priceRange = priceExtremes.max - priceExtremes.min || 1;

  const scaleY = useCallback(
    (price: number) => {
      const normalized = (price - priceExtremes.min) / priceRange;
      const position = PADDING_Y + chartHeight - normalized * chartHeight;
      return Math.round(position * 1000) / 1000;
    },
    [priceExtremes.min, priceRange, chartHeight]
  );

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
    if (!renderCandles.length) return [] as Array<{ label: string; x: number }>;
    const labels: Array<{ label: string; x: number }> = [];
    const step = Math.max(1, Math.floor(renderCandles.length / dynamicTimeLabels));
    for (let i = 0; i < renderCandles.length; i += step) {
      const candle = renderCandles[i];
      const centerX = round(PADDING_X + bucketWidth * i + bucketWidth / 2);
      labels.push({ label: formatTimeLabel(candle.timestamp), x: centerX });
    }
    const last = renderCandles[renderCandles.length - 1];
    const lastX = round(PADDING_X + bucketWidth * (renderCandles.length - 1) + bucketWidth / 2);
    if (!labels.find((label) => label.x === lastX)) {
      labels.push({ label: formatTimeLabel(last.timestamp), x: lastX });
    }
    return labels.slice(0, dynamicTimeLabels + 1);
  }, [renderCandles, bucketWidth, dynamicTimeLabels]);

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

  const applyPanDelta = (deltaCandles: number) => {
    if (!deltaCandles) return;
    setPanOffset((current) => {
      const next = clamp(current + deltaCandles, 0, maxOffset);
      setIsLive(next === 0);
      return next;
    });
  };

  const updateHoverFromEvent = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !renderCandles.length) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const index = Math.min(renderCandles.length - 1, Math.round(ratio * (renderCandles.length - 1)));
    setHoverIndex(index);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (pointerCache.current.has(event.pointerId)) {
      pointerCache.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }

    if (pointerCache.current.size >= 2 && pinchRef.current) {
      const points = Array.from(pointerCache.current.values());
      const dx = points[0].x - points[1].x;
      const dy = points[0].y - points[1].y;
      const nextDistance = Math.hypot(dx, dy);
      if (nextDistance && pinchRef.current.distance) {
        const ratio = nextDistance / pinchRef.current.distance;
        setZoom((current) => clamp(current * ratio, ZOOM_MIN, ZOOM_MAX));
        pinchRef.current = { distance: nextDistance };
        setPointerMode("idle");
        setHoverIndex(null);
        setIsLive(false);
      }
      return;
    }

    if (dragState.current.active) {
      const deltaX = event.clientX - dragState.current.startX;
      const deltaCandles = Math.round(deltaX / Math.max(bucketWidth, 6));
      const next = clamp(dragState.current.startOffset + deltaCandles, 0, maxOffset);
      setPanOffset(next);
      setIsLive(next === 0);
      setPointerMode("idle");
      setHoverIndex(null);
      return;
    }

    if (event.pointerType === "touch" && event.buttons === 1) {
      setPointerMode("idle");
      setHoverIndex(null);
      return;
    }
    setPointerMode("hover");
    updateHoverFromEvent(event);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const startOffset = effectiveOffset;
    dragState.current = { active: true, startX: event.clientX, startOffset };
    pointerCache.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointerCache.current.size === 2) {
      const points = Array.from(pointerCache.current.values());
      const dx = points[0].x - points[1].x;
      const dy = points[0].y - points[1].y;
      pinchRef.current = { distance: Math.hypot(dx, dy) };
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (_error) {
      /* ignore capture errors */
    }

    if (event.pointerType === "touch") {
      setPointerMode("touch-preview");
      updateHoverFromEvent(event);
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragState.current = { active: false, startX: 0, startOffset: 0 };
    pointerCache.current.delete(event.pointerId);
    if (pointerCache.current.size < 2) {
      pinchRef.current = null;
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch (_error) {
      /* ignore release errors */
    }

    if (event.pointerType === "touch") {
      setPointerMode("idle");
      setHoverIndex(null);
    }
  };

  const handlePointerLeave = () => {
    dragState.current = { active: false, startX: 0, startOffset: 0 };
    pointerCache.current.clear();
    pinchRef.current = null;
    setPointerMode("idle");
    setHoverIndex(null);
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!renderCandles.length) return;
    const step = Math.max(bucketWidth, 6);

    const isZoomGesture = event.ctrlKey || event.metaKey || Math.abs(event.deltaY) >= Math.abs(event.deltaX);
    if (isZoomGesture) {
      const direction = event.deltaY > 0 ? 1 : -1;
      setZoom((current) => clamp(current * (1 + direction * ZOOM_STEP), ZOOM_MIN, ZOOM_MAX));
      return;
    }

    const deltaCandles = Math.round(event.deltaX / step);
    if (deltaCandles) {
      applyPanDelta(deltaCandles);
    }
  };

  const resolvedMarkers = useMemo(() => {
    if (!markers.length || !candles.length) return [] as Array<ChartMarker & { index: number; action: string }>;

    const matchIndex = (timestamp: number) => {
      const idx = candles.findIndex((candle) => candle.timestamp >= timestamp);
      return idx === -1 ? candles.length - 1 : idx;
    };

    const priority: Record<string, number> = { buy: 2, sell: 1, hold: 0 };
    const chosen = new Map<number, ChartMarker & { action: string }>();

    markers.forEach((marker) => {
      const normalizedAction = marker.action?.toLowerCase?.() || "hold";
      const index = matchIndex(marker.timestamp);
      const existing = chosen.get(index);
      const hasPriority = !existing || priority[normalizedAction] > (priority[existing.action] ?? 0);
      const isNewer = existing ? marker.timestamp >= existing.timestamp : true;
      if (hasPriority || (!hasPriority && isNewer && priority[normalizedAction] === (priority[existing?.action] ?? 0))) {
        chosen.set(index, { ...marker, action: normalizedAction });
      }
    });

    return Array.from(chosen.entries()).map(([index, marker]) => ({ ...marker, index }));
  }, [markers, candles]);

  const windowedMarkers = useMemo(
    () => resolvedMarkers.filter((marker) => marker.index >= startIndex && marker.index < endIndex),
    [resolvedMarkers, startIndex, endIndex]
  );

  const markerNodes = useMemo(() => {
    if (!windowedMarkers.length || !renderCandles.length) return null;

    return windowedMarkers.map((marker) => {
      const normalizedAction = marker.action || "hold";
      const localIndex = marker.index - startIndex;
      const candle = renderCandles[localIndex];
      if (!candle) return null;

      const centerX = round(PADDING_X + bucketWidth * localIndex + bucketWidth / 2);
      const priceY = scaleY(candle.close);
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
  }, [windowedMarkers, renderCandles, bucketWidth, scaleY, startIndex]);

  const insightWindow = useMemo(() => renderCandles.slice(-28), [renderCandles]);

  const biasSummary = useMemo(() => {
    if (insightWindow.length < 2) {
      return { bias: "Neutral", slope: 0, rationale: "Awaiting movement" } as const;
    }
    const first = insightWindow[0].close;
    const last = insightWindow[insightWindow.length - 1].close;
    const slope = last - first;
    const threshold = Math.max(first * 0.0006, 0.01);
    const bias = slope > threshold ? "Bullish" : slope < -threshold ? "Bearish" : "Ranging";
    const rationale = bias === "Ranging" ? "Sideways liquidity build" : `${bias} momentum over last ${insightWindow.length} bars`;
    return { bias, slope, rationale } as const;
  }, [insightWindow]);

  const keyLevels = useMemo(() => {
    if (!insightWindow.length) return null;
    const support = Math.min(...insightWindow.map((c) => c.low));
    const resistance = Math.max(...insightWindow.map((c) => c.high));
    return { support, resistance };
  }, [insightWindow]);

  const latestMarker = windowedMarkers[windowedMarkers.length - 1];
  const markerRationale = useMemo(() => {
    if (!latestMarker || !renderCandles.length) return "Watching order flow";
    const localIndex = latestMarker.index - startIndex;
    const candle = renderCandles[localIndex];
    if (!candle) return "Watching order flow";
    const bias = biasSummary.bias.toLowerCase();
    const levelText = keyLevels ? `near ${latestMarker.action === "buy" ? "support" : "resistance"}` : "at local level";
    return `${latestMarker.action.toUpperCase()} ${levelText} with ${bias} context`;
  }, [latestMarker, renderCandles, startIndex, biasSummary.bias, keyLevels]);

  const confidence = useMemo(() => {
    if (!insightWindow.length) return 0.42;
    const closes = insightWindow.map((c) => c.close);
    const mean = closes.reduce((sum, v) => sum + v, 0) / closes.length;
    const variance = closes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / closes.length;
    const vol = Math.sqrt(variance);
    const slope = Math.abs(biasSummary.slope);
    const normalized = mean ? clamp((slope / Math.max(mean * 0.0025, vol || 1)), 0, 1.4) : 0.4;
    return Math.min(1, normalized);
  }, [biasSummary.slope, insightWindow]);

  const lastClose = renderCandles.at(-1)?.close;

  const showSkeleton = candles.length === 0;

  if (showSkeleton) {
    return (
      <div ref={containerRef} className="w-full" style={{ minHeight: totalHeight }}>
        <Skeleton className="w-full" style={{ height: chartHeight + volumeHeight + PADDING_Y * 2 }} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full" style={{ minHeight: totalHeight }}>
      {coachEnabled && (
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap gap-3 text-xs text-[color:var(--text-main)] opacity-80">
          <div className="rounded-lg bg-base/80 px-3 py-2 shadow-lg ring-1 ring-[color:var(--border-soft)]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--accent-cyan)]">Strategy</p>
            <p className="font-semibold">Observation Brain</p>
            <p className="text-[11px] text-[color:var(--accent-gold)]">{biasSummary.bias} bias</p>
          </div>
          <div className="rounded-lg bg-base/80 px-3 py-2 shadow-lg ring-1 ring-[color:var(--border-soft)]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--accent-cyan)]">Rationale</p>
            <p className="font-semibold">{markerRationale}</p>
            <p className="text-[11px] text-[color:var(--text-dim)]">{biasSummary.rationale}</p>
          </div>
          {keyLevels && (
            <div className="rounded-lg bg-base/80 px-3 py-2 shadow-lg ring-1 ring-[color:var(--border-soft)]">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--accent-cyan)]">Key levels</p>
              <p className="font-semibold">Res {keyLevels.resistance.toFixed(2)}</p>
              <p className="font-semibold">Sup {keyLevels.support.toFixed(2)}</p>
            </div>
          )}
          <div className="rounded-lg bg-base/80 px-3 py-2 shadow-lg ring-1 ring-[color:var(--border-soft)]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--accent-cyan)]">Conviction</p>
            <p className="font-semibold">{Math.round(confidence * 100)}%</p>
            <p className="text-[11px] text-[color:var(--text-dim)]">Derived from price slope + variability</p>
          </div>
          {lastClose && (
            <div className="rounded-lg bg-base/80 px-3 py-2 shadow-lg ring-1 ring-[color:var(--border-soft)]">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--accent-cyan)]">Last price</p>
              <p className="font-semibold">{lastClose.toFixed(2)}</p>
            </div>
          )}
        </div>
      )}

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

        {renderCandles.map((candle, index) => {
          const centerX = round(PADDING_X + bucketWidth * index + bucketWidth / 2);
          const highY = scaleY(candle.high);
          const lowY = scaleY(candle.low);
          const openY = scaleY(candle.open);
          const closeY = scaleY(candle.close);
          const rising = candle.close >= candle.open;
          const candleTop = Math.min(openY, closeY);
          const candleBottom = Math.max(openY, closeY);
          const candleHeight = Math.max(6, (candleBottom - candleTop) * 1.08 + 2);
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
          candles={renderCandles}
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
        className="absolute inset-0 cursor-crosshair select-none"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onWheel={handleWheel}
        style={{ touchAction: "none" }}
        aria-hidden="true"
      />

      {!isLive && renderCandles.length > 0 && (
        <button
          type="button"
          className="absolute right-4 bottom-4 rounded-full border border-[color:var(--border-soft)] bg-base/90 px-3 py-1 text-xs uppercase tracking-[0.25em] text-[color:var(--accent-cyan)] shadow-lg"
          onClick={() => {
            setPanOffset(0);
            setZoom(1);
            setIsLive(true);
          }}
        >
          Return to live
        </button>
      )}

      <CrosshairTooltip candle={crosshairVisible ? hoverPayload : null} left={tooltipLeft} />

      {loading && (
        <span className="pointer-events-none absolute right-4 top-4 rounded-full border border-[color:var(--border-soft)] bg-base/80 px-3 py-1 text-[10px] uppercase tracking-[0.35em] opacity-80">
          Syncing
        </span>
      )}
    </div>
  );
}
