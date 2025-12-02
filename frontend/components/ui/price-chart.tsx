'use client';

import { useMemo } from 'react';

type PricePoint = {
  timestamp: number;
  value: number;
};

type PriceChartProps = {
  points: PricePoint[];
};

const HEIGHT = 120;
const WIDTH = 420;

export default function PriceChart({ points }: PriceChartProps) {
  const path = useMemo(() => {
    if (!points.length) return '';
    const min = Math.min(...points.map((p) => p.value));
    const max = Math.max(...points.map((p) => p.value));
    const range = max - min || 1;
    return points
      .map((point, index) => {
        const x = (index / (points.length - 1 || 1)) * WIDTH;
        const y = HEIGHT - ((point.value - min) / range) * HEIGHT;
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }, [points]);

  return (
    <svg
      key={path || 'empty'}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="data-soft-fade h-32 w-full"
      role="img"
      aria-label="Price chart"
    >
      <defs>
        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {path && (
        <>
          <path d={`${path} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`} fill="url(#priceGradient)" opacity="0.3" />
          <path d={path} fill="none" stroke="var(--accent-cyan)" strokeWidth={2} strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
