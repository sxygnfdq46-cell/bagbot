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

const BASE_BAR_INTERVAL = 60 * 1000; // 1m bars
const DEFAULT_BAR_COUNT = 120;

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
    };
  }, [containerRef, themeKey]);
}

function drawChart({
  canvas,
  bars,
  colors,
  width,
  height,
}: {
  canvas: HTMLCanvasElement;
  bars: Bar[];
  colors: ReturnType<typeof usePaneColors>;
  width: number;
  height: number;
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

  const padding = { top: 8, right: 64, bottom: 28, left: 12 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
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
  const volumeToY = (volume: number) => volumeTop + volumeHeight - (volume / (maxVolume || 1)) * volumeHeight;

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
    const y = volumeToY(bar.volume);
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
  const [bars, setBars] = useState<Bar[]>(() => generateSeedBars());
  const colors = usePaneColors(containerRef, themeMode);
  const { width, height } = useResize(containerRef);

  useEffect(() => {
    drawChart({ canvas: canvasRef.current as HTMLCanvasElement, bars, colors, width, height });
  }, [bars, colors, width, height]);

  useEffect(() => {
    const id = setInterval(() => {
      setBars((prev) => {
        if (prev.length === 0) {
          return generateSeedBars();
        }
        const latest = prev[prev.length - 1];
        const next = nextBarFrom(latest);
        return [...prev.slice(-DEFAULT_BAR_COUNT + 1), next];
      });
    }, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      ref={containerRef}
      aria-label={`Market structure chart for ${paneId}`}
      style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "transparent" }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
