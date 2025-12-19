"use client";

import { useRef, useState } from "react";
import ChartCanvas, { type ChartCanvasHandle } from "@/app/charts/chart-canvas";
import TerminalShell from "@/components/terminal/terminal-shell";

const TIMEFRAME_OPTIONS = ["15m", "1h", "4h", "1d"];

export default function TerminalPage() {
  const [timeframe, setTimeframe] = useState<string>("1h");
  const chartRef = useRef<ChartCanvasHandle | null>(null);

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    chartRef.current?.setTimeframe(value);
  };

  return (
    <TerminalShell timeframe={timeframe} onTimeframeChange={handleTimeframeChange} timeframeOptions={TIMEFRAME_OPTIONS}>
      <ChartCanvas ref={chartRef} />
    </TerminalShell>
  );
}
