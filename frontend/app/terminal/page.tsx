"use client";

import { useRef, useState } from "react";
import ChartCanvas, {
  type ChartCanvasHandle,
  type ChartIndicator,
  type ChartCandleType,
  type ChartTool,
  type ChartSnapshot,
  type ChartProjection,
  type ChartCompare,
} from "@/app/charts/chart-canvas";
import TerminalShell from "@/components/terminal/terminal-shell";

const TIMEFRAME_OPTIONS = ["15m", "1h", "4h", "1d"];
const INSTRUMENT_OPTIONS = ["EURUSD", "GBPUSD", "XAUUSD", "NAS100", "BTCUSD"];
const INDICATOR_OPTIONS: ChartIndicator[] = ["rsi", "ema", "vwap"];
const CANDLE_TYPE_OPTIONS: ChartCandleType[] = ["candles", "heikin-ashi"];
const TOOL_OPTIONS: ChartTool[] = ["off", "trendline", "horizontal"];
const PROJECTION_OPTIONS: ChartProjection[] = ["off", "forward", "trendline"];
const COMPARE_OPTIONS: ChartCompare[] = ["off", "EURUSD", "GBPUSD", "XAUUSD", "NAS100", "BTCUSD"];

export default function TerminalPage() {
  const [timeframe, setTimeframe] = useState<string>("1h");
  const [instrument, setInstrument] = useState<string>("EURUSD");
  const [candleType, setCandleType] = useState<ChartCandleType>("candles");
  const [tool, setTool] = useState<ChartTool>("off");
  const [projection, setProjection] = useState<ChartProjection>("off");
  const [compare, setCompare] = useState<ChartCompare>("off");
  const [indicators, setIndicators] = useState<ChartIndicator[]>([]);
  const chartRef = useRef<ChartCanvasHandle | null>(null);

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    chartRef.current?.setTimeframe(value);
  };

  const handleInstrumentChange = (value: string) => {
    setInstrument(value);
    chartRef.current?.setInstrument(value);
    setCompare("off");
    chartRef.current?.setCompare("off");
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

  const handleToolChange = (value: ChartTool) => {
    chartRef.current?.setTool(value);
  };

  const syncTool = (value: ChartTool) => {
    setTool(value);
  };

  const handleProjectionChange = (value: ChartProjection) => {
    chartRef.current?.setProjection(value);
  };

  const syncProjection = (value: ChartProjection) => {
    setProjection(value);
  };

  const handleCompareChange = (value: ChartCompare) => {
    setCompare(value);
    chartRef.current?.setCompare(value);
  };

  const syncCompare = (value: ChartCompare) => {
    setCompare(value);
  };

  const handleSnapshotSave = () => {
    chartRef.current?.saveSnapshot();
  };

  const handleSnapshotRestore = () => {
    const snapshot: ChartSnapshot | null | undefined = chartRef.current?.loadSnapshot();
    if (!snapshot) return;
    setInstrument(snapshot.instrument);
    setTimeframe(snapshot.timeframe);
    setCandleType(snapshot.candleType);
    setIndicators(snapshot.indicators);
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
      tool={tool}
      onToolChange={handleToolChange}
      toolOptions={TOOL_OPTIONS}
      projection={projection}
      onProjectionChange={handleProjectionChange}
      projectionOptions={PROJECTION_OPTIONS}
      compare={compare}
      onCompareChange={handleCompareChange}
      compareOptions={COMPARE_OPTIONS}
      onSnapshotSave={handleSnapshotSave}
      onSnapshotRestore={handleSnapshotRestore}
      indicators={indicators}
      onIndicatorToggle={handleIndicatorToggle}
      indicatorOptions={INDICATOR_OPTIONS}
    >
      <ChartCanvas
        ref={chartRef}
        initialInstrument={instrument}
        initialCandleType={candleType}
        initialTool={tool}
        initialProjection={projection}
        initialCompare={compare}
        onIndicatorsChange={handleIndicatorsChange}
        onCandleTypeChange={syncCandleType}
        onToolChange={syncTool}
        onProjectionChange={syncProjection}
        onCompareChange={syncCompare}
      />
    </TerminalShell>
  );
}
