"use client";

import type { Candle } from "@/lib/api/charts";

export type VolumeBarsProps = {
  candles: Candle[];
  bucketWidth: number;
  paddingX: number;
  maxVolume: number;
  height: number;
  baseY: number;
};

const fallingColor = "rgba(255,99,132,0.85)";
const risingColor = "var(--accent-green)";

const round = (value: number) => Math.round(value * 100) / 100;

export function VolumeBars({ candles, bucketWidth, paddingX, maxVolume, height, baseY }: VolumeBarsProps) {
  if (!candles.length || !maxVolume) return null;

  const barWidth = Math.min(Math.max(3, bucketWidth * 0.4), Math.max(bucketWidth - 2, 3));

  return (
    <g data-layer="volume-bars">
      {candles.map((candle, index) => {
        const rising = candle.close >= candle.open;
        const barColor = rising ? risingColor : fallingColor;
        const normalized = Math.max(0.02, candle.volume / maxVolume);
        const barHeight = Math.max(3, normalized * height);
        const barY = round(baseY - barHeight);
        const centerX = round(paddingX + bucketWidth * index + bucketWidth / 2);
        return (
          <rect
            key={`volume-${candle.timestamp}`}
            x={round(centerX - barWidth / 2)}
            y={barY}
            width={round(barWidth)}
            height={round(barHeight)}
            rx={barWidth / 4}
            fill={barColor}
            opacity={0.25}
            style={{ transition: "y 160ms ease-out, height 160ms ease-out" }}
          />
        );
      })}
    </g>
  );
}
