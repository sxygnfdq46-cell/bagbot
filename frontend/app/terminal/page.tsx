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
  type ChartReasoningVisibility,
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
  const [reasoningVisibility, setReasoningVisibility] = useState<ChartReasoningVisibility>("on");
  const [indicators, setIndicators] = useState<ChartIndicator[]>([]);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
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

  const handleReasoningVisibilityChange = (value: "on" | "off") => {
    setReasoningVisibility(value);
    chartRef.current?.setReasoningVisibility(value);
  };

  const syncReasoningVisibility = (value: "on" | "off") => {
    setReasoningVisibility(value);
  };

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => setSearchOpen(false);

  const handleSearchSelect = (value: string) => {
    handleInstrumentChange(value);
    setSearchOpen(false);
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
      searchOpen={searchOpen}
      onSearchOpen={openSearch}
      onSearchClose={closeSearch}
      onSearchSelect={handleSearchSelect}
      searchOptions={INSTRUMENT_OPTIONS}
      reasoningVisibility={reasoningVisibility}
      onReasoningVisibilityChange={handleReasoningVisibilityChange}
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
        initialReasoningVisibility={reasoningVisibility}
        onIndicatorsChange={handleIndicatorsChange}
        onCandleTypeChange={syncCandleType}
        onToolChange={syncTool}
        onProjectionChange={syncProjection}
        onReasoningVisibilityChange={syncReasoningVisibility}
        onCompareChange={syncCompare}
      />
    </TerminalShell>
  );
}
