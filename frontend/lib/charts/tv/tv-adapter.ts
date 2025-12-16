import type { BarData, HistogramData, UTCTimestamp } from "lightweight-charts";
import type { Candle } from "@/lib/api/charts";

export const toUtcSeconds = (timestampMs: number): UTCTimestamp =>
  Math.floor(timestampMs / 1000) as UTCTimestamp;

export const adaptCandlesToPriceData = (candles: Candle[]): BarData[] =>
  candles.map((candle) => ({
    time: toUtcSeconds(candle.timestamp),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  }));

export const adaptCandlesToVolumeData = (candles: Candle[]): HistogramData[] =>
  candles.map((candle) => ({
    time: toUtcSeconds(candle.timestamp),
    value: candle.volume,
  }));
