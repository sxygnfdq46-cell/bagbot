import type { HistogramSeriesPartialOptions, IChartApi } from "lightweight-charts";

export type CandleSeries = ReturnType<IChartApi["addCandlestickSeries"]>;
export type VolumeSeries = ReturnType<IChartApi["addHistogramSeries"]>;

export type TvSeries = {
  candleSeries: CandleSeries;
  volumeSeries: VolumeSeries;
};

export const createPriceVolumeSeries = (chart: IChartApi): TvSeries => {
  const candleSeries = chart.addCandlestickSeries({
    upColor: "rgba(46,199,166,0.9)",
    downColor: "rgba(212,106,106,0.9)",
    borderUpColor: "#2ec7a6",
    borderDownColor: "#d46a6a",
    wickUpColor: "rgba(46,199,166,0.28)",
    wickDownColor: "rgba(212,106,106,0.28)",
  });

  const histogramOptions: HistogramSeriesPartialOptions = {
    priceScaleId: "volume",
    priceFormat: { type: "volume" },
    priceLineVisible: false,
    color: "rgba(46,199,166,0.2)",
  };

  const volumeSeries = chart.addHistogramSeries(histogramOptions);
  chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

  return { candleSeries, volumeSeries };
};
