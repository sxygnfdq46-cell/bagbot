import type { HistogramSeriesPartialOptions, IChartApi } from "lightweight-charts";

export type CandleSeries = ReturnType<IChartApi["addCandlestickSeries"]>;
export type VolumeSeries = ReturnType<IChartApi["addHistogramSeries"]>;

export type TvSeries = {
  candleSeries: CandleSeries;
  volumeSeries: VolumeSeries;
};

export const createPriceVolumeSeries = (chart: IChartApi): TvSeries => {
  const candleSeries = chart.addCandlestickSeries();

  const histogramOptions: HistogramSeriesPartialOptions = {
    priceScaleId: "volume",
    priceFormat: { type: "volume" },
    priceLineVisible: false,
  };

  const volumeSeries = chart.addHistogramSeries(histogramOptions);
  chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

  return { candleSeries, volumeSeries };
};
