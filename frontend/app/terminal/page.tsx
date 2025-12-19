"use client";

import { useRef, useState } from "react";
import ChartCanvas, { type ChartCanvasHandle, type ChartIndicator, type ChartCandleType } from "@/app/charts/chart-canvas";
import TerminalShell from "@/components/terminal/terminal-shell";

const TIMEFRAME_OPTIONS = ["15m", "1h", "4h", "1d"];
const INSTRUMENT_OPTIONS = ["EURUSD", "GBPUSD", "XAUUSD", "NAS100", "BTCUSD"];
const INDICATOR_OPTIONS: ChartIndicator[] = ["rsi", "ema", "vwap"];
const CANDLE_TYPE_OPTIONS: ChartCandleType[] = ["candles", "heikin-ashi"];

export default function TerminalPage() {
  const [timeframe, setTimeframe] = useState<string>("1h");
  const [instrument, setInstrument] = useState<string>("EURUSD");
  const [candleType, setCandleType] = useState<ChartCandleType>("candles");
  const [indicators, setIndicators] = useState<ChartIndicator[]>([]);
  const chartRef = useRef<ChartCanvasHandle | null>(null);

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    chartRef.current?.setTimeframe(value);
  };

  const handleInstrumentChange = (value: string) => {
    setInstrument(value);
    chartRef.current?.setInstrument(value);
  };

  const handleCandleTypeChange = (value: ChartCandleType) => {
    setCandleType(value);
    chartRef.current?.setCandleType(value);
  };

  const handleIndicatorToggle = (indicator: ChartIndicator) => {
    const nextEnabled = !indicators.includes(indicator);
    chartRef.current?.setIndicator(indicator, nextEnabled);
  };

  const handleIndicatorsChange = (active: ChartIndicator[]) => {
    setIndicators(active);
  };

  const syncCandleType = (value: ChartCandleType) => {
    setCandleType(value);
  };

  return (
    <TerminalShell
      timeframe={timeframe}
      onTimeframeChange={handleTimeframeChange}
      timeframeOptions={TIMEFRAME_OPTIONS}
      instrument={instrument}
      onInstrumentChange={handleInstrumentChange}
      instrumentOptions={INSTRUMENT_OPTIONS}
      candleType={candleType}
      onCandleTypeChange={handleCandleTypeChange}
      candleTypeOptions={CANDLE_TYPE_OPTIONS}
      indicators={indicators}
      onIndicatorToggle={handleIndicatorToggle}
      indicatorOptions={INDICATOR_OPTIONS}
    >
      <ChartCanvas
        ref={chartRef}
        initialInstrument={instrument}
        initialCandleType={candleType}
        onIndicatorsChange={handleIndicatorsChange}
        onCandleTypeChange={syncCandleType}
      />
    </TerminalShell>
  );
}
