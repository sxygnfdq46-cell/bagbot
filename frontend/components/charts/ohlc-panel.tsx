"use client";

import Skeleton from "@/components/ui/skeleton";
import MetricLabel from "@/components/ui/metric-label";
import type { Candle } from "@/lib/api/charts";

export type OhlcPanelProps = {
  candle: Candle | null;
  loading?: boolean;
};

const fallbackFields: Array<{ label: string; accessor: (candle: Candle) => string }> = [
  { label: "Open", accessor: (candle) => candle.open.toFixed(2) },
  { label: "High", accessor: (candle) => candle.high.toFixed(2) },
  { label: "Low", accessor: (candle) => candle.low.toFixed(2) },
  { label: "Close", accessor: (candle) => candle.close.toFixed(2) },
  { label: "Volume", accessor: (candle) => Intl.NumberFormat().format(Math.round(candle.volume)) }
];

export default function OhlcPanel({ candle, loading = false }: OhlcPanelProps) {
  return (
    <div className="info-tablet stack-gap-sm">
      <MetricLabel>OHLC Panel</MetricLabel>
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : candle ? (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          {fallbackFields.map((field) => (
            <div key={field.label}>
              <dt className="opacity-70">{field.label}</dt>
              <dd className="font-semibold">{field.accessor(candle)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-[color:var(--text-main)] opacity-60">Hover a candle to inspect values.</p>
      )}
    </div>
  );
}
