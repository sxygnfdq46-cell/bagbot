"use client";

import { useRef, useState } from "react";
import ChartCanvas, { type ChartCanvasHandle } from "@/app/charts/chart-canvas";
import TerminalShell from "@/components/terminal/terminal-shell";

const TIMEFRAME_OPTIONS = ["15m", "1h", "4h", "1d"];
const INSTRUMENT_OPTIONS = ["EURUSD", "GBPUSD", "XAUUSD", "NAS100", "BTCUSD"];

export default function TerminalPage() {
  const [timeframe, setTimeframe] = useState<string>("1h");
  const [instrument, setInstrument] = useState<string>("EURUSD");
  const chartRef = useRef<ChartCanvasHandle | null>(null);

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    chartRef.current?.setTimeframe(value);
  };

  const handleInstrumentChange = (value: string) => {
    setInstrument(value);
    chartRef.current?.setInstrument(value);
  };

  return (
    <TerminalShell
      timeframe={timeframe}
      onTimeframeChange={handleTimeframeChange}
      timeframeOptions={TIMEFRAME_OPTIONS}
      instrument={instrument}
      onInstrumentChange={handleInstrumentChange}
      instrumentOptions={INSTRUMENT_OPTIONS}
    >
      <ChartCanvas ref={chartRef} initialInstrument={instrument} />
    </TerminalShell>
  );
}
