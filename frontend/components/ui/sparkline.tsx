'use client';

import { useId, useMemo } from 'react';

type GradientStop = {
  color: string;
  opacity: number;
  offset?: number;
};

type SparklineProps = {
  points: number[];
  width?: number;
  height?: number;
  stroke?: string;
  gradientStops?: GradientStop[];
};

export default function Sparkline({
  points,
  width = 140,
  height = 60,
  stroke = 'var(--accent-cyan)',
  gradientStops
}: SparklineProps) {
  const gradientId = useId();

  const path = useMemo(() => {
    if (!points.length) return '';
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    return points
      .map((value, index) => {
        const x = (index / (points.length - 1 || 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }, [points, width, height]);

  const signature = path || 'sparkline-empty';

  const stops = gradientStops ?? [
    { color: stroke, opacity: 0.8, offset: 0 },
    { color: stroke, opacity: 0.05, offset: 100 }
  ];

  return (
    <svg
      key={signature}
      viewBox={`0 0 ${width} ${height}`}
      className="sparkline-visual h-full w-full"
      role="img"
      aria-label="Sparkline"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          {stops.map(({ color, opacity, offset }, index) => (
            <stop
              key={color + index}
              offset={`${offset ?? (index === 0 ? 0 : 100)}%`}
              stopColor={color}
              stopOpacity={opacity}
            />
          ))}
        </linearGradient>
      </defs>
      {path && (
        <>
          <path d={`${path} L${width},${height} L0,${height} Z`} fill={`url(#${gradientId})`} opacity={0.35} />
          <path d={path} fill="none" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
