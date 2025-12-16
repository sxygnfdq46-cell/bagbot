import { createChart, LineStyle, type IChartApi } from "lightweight-charts";

export type TvChartHandle = {
  chart: IChartApi;
  cleanup: () => void;
};

export const createTvChart = (container: HTMLElement): TvChartHandle => {
  const chart = createChart(container, {
    width: container.clientWidth,
    height: container.clientHeight,
    layout: {
      background: { color: "#0c111a" },
      textColor: "#9aa3b5",
    },
    grid: {
      vertLines: { color: "rgba(255,255,255,0.04)" },
      horzLines: { color: "rgba(255,255,255,0.04)" },
    },
    crosshair: {
      vertLine: {
        color: "rgba(180,195,210,0.6)",
        style: LineStyle.Dashed,
        width: 1,
      },
      horzLine: {
        color: "rgba(180,195,210,0.6)",
        style: LineStyle.Dashed,
        width: 1,
      },
    },
    watermark: { visible: false },
    rightPriceScale: {
      borderVisible: false,
    },
    timeScale: {
      borderVisible: false,
    },
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
