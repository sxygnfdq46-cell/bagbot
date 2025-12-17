import type {
  IChartApi,
  ISeriesApi,
  LineSeriesPartialOptions,
  HistogramSeriesPartialOptions,
  SeriesType,
  Time,
} from "lightweight-charts";

// Lightweight, read-only indicator renderer built atop an existing chart instance.
// Consumes precomputed series supplied by the backend; does not calculate indicators.

type SeriesPoint = { time: Time; value: number };
type MacdPoint = { time: number; macd: number; signal: number; histogram: number };
type IndicatorSeries = Array<Record<string, number>>;
type IndicatorMap = Record<string, IndicatorSeries>;

type IndicatorSeriesRef = Record<string, ISeriesApi<SeriesType>>;

const OVERLAY_LINE: LineSeriesPartialOptions = {
  color: "rgba(94, 211, 255, 0.65)",
  lineWidth: 2,
  priceLineVisible: false,
};

const RSI_LINE: LineSeriesPartialOptions = {
  color: "rgba(245, 196, 106, 0.65)",
  lineWidth: 2,
  priceLineVisible: false,
};

const MACD_LINE: LineSeriesPartialOptions = {
  color: "rgba(147, 197, 253, 0.7)",
  lineWidth: 2,
  priceLineVisible: false,
};

const MACD_SIGNAL_LINE: LineSeriesPartialOptions = {
  color: "rgba(94, 234, 212, 0.7)",
  lineWidth: 2,
  priceLineVisible: false,
};

const MACD_HISTOGRAM: HistogramSeriesPartialOptions = {
  color: "rgba(94, 234, 212, 0.25)",
  priceFormat: { type: "price", precision: 2, minMove: 0.01 },
  priceLineVisible: false,
  priceScaleId: "macd-pane",
};

const RSI_SCALE_ID = "rsi-pane";
const MACD_SCALE_ID = "macd-pane";

export type IndicatorRenderer = {
  setIndicators: (series: IndicatorMap | undefined) => void;
  clear: () => void;
};

const isMacdPoint = (row: Record<string, number>): row is MacdPoint =>
  "macd" in row && "signal" in row && "histogram" in row;

const toLinePoints = (rows: IndicatorSeries): SeriesPoint[] =>
  rows
    .map((row) => ({ time: row.time as unknown as Time, value: row.value as number }))
    .filter((p) => Number.isFinite(p.time as number) && Number.isFinite(p.value));

const toMacdLines = (rows: IndicatorSeries) => {
  const macd: SeriesPoint[] = [];
  const signal: SeriesPoint[] = [];
  const histogram: Array<{ time: Time; value: number }> = [];
  rows.forEach((row) => {
    if (!isMacdPoint(row)) return;
    const time = row.time as unknown as Time;
    if (!Number.isFinite(row.time as number)) return;
    if (Number.isFinite(row.macd)) macd.push({ time, value: row.macd });
    if (Number.isFinite(row.signal)) signal.push({ time, value: row.signal });
    if (Number.isFinite(row.histogram)) histogram.push({ time, value: row.histogram });
  });
  return { macd, signal, histogram };
};

export const createIndicatorRenderer = (chart: IChartApi): IndicatorRenderer => {
  const seriesRef: IndicatorSeriesRef = {};

  const ensurePaneScales = () => {
    chart.priceScale(RSI_SCALE_ID).applyOptions({
      scaleMargins: { top: 0.7, bottom: 0 },
      borderVisible: false,
    });
    chart.priceScale(MACD_SCALE_ID).applyOptions({
      scaleMargins: { top: 0.7, bottom: 0 },
      borderVisible: false,
    });
  };

  const clear = () => {
    Object.values(seriesRef).forEach((series) => chart.removeSeries(series));
    Object.keys(seriesRef).forEach((key) => delete seriesRef[key]);
  };

  const setIndicators = (indicatorSeries: IndicatorMap | undefined) => {
    clear();
    if (!indicatorSeries || Object.keys(indicatorSeries).length === 0) return;

    ensurePaneScales();

    Object.entries(indicatorSeries).forEach(([key, rows]) => {
      const upperKey = key.toUpperCase();
      if (upperKey.startsWith("RSI")) {
        const line = chart.addLineSeries({ ...RSI_LINE, priceScaleId: RSI_SCALE_ID });
        seriesRef[key] = line;
        line.setData(toLinePoints(rows));
        return;
      }

      if (upperKey.startsWith("MACD")) {
        const { macd, signal, histogram } = toMacdLines(rows);
        const macdLine = chart.addLineSeries({ ...MACD_LINE, priceScaleId: MACD_SCALE_ID });
        macdLine.setData(macd);
        seriesRef[`${key}-macd`] = macdLine;

        const signalLine = chart.addLineSeries({ ...MACD_SIGNAL_LINE, priceScaleId: MACD_SCALE_ID });
        signalLine.setData(signal);
        seriesRef[`${key}-signal`] = signalLine;

        const hist = chart.addHistogramSeries({ ...MACD_HISTOGRAM, priceScaleId: MACD_SCALE_ID });
        hist.setData(histogram);
        seriesRef[`${key}-histogram`] = hist;
        return;
      }

      // Default overlay line (EMA/SMA/VWAP/etc.).
      const line = chart.addLineSeries(OVERLAY_LINE);
      seriesRef[key] = line;
      line.setData(toLinePoints(rows));
    });
  };

  return { setIndicators, clear };
};

export type { IndicatorSeries, IndicatorMap };
