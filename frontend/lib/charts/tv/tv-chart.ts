import { createChart, type IChartApi } from "lightweight-charts";

export type TvChartHandle = {
  chart: IChartApi;
  cleanup: () => void;
};

export const createTvChart = (container: HTMLElement): TvChartHandle => {
  const chart = createChart(container, {
    width: container.clientWidth,
    height: container.clientHeight,
  });

  const resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    const { width, height } = entry.contentRect;
    chart.applyOptions({
      width: Math.max(0, Math.floor(width)),
      height: Math.max(0, Math.floor(height)),
    });
  });

  resizeObserver.observe(container);

  const cleanup = () => {
    resizeObserver.disconnect();
    chart.remove();
  };

  return { chart, cleanup };
};
