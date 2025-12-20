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
  type ChartReplayMode,
  type ChartDecisionEvent,
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
  const PANE_COUNT = 2;
  const updateAt = <T,>(list: T[], idx: number, value: T): T[] => list.map((item, i) => (i === idx ? value : item));

  const [layoutMode, setLayoutMode] = useState<"single" | "split">("single");
  const [activePane, setActivePane] = useState<number>(0);
  const [timeframes, setTimeframes] = useState<string[]>(["1h", "1h"]);
  const [instruments, setInstruments] = useState<string[]>(["EURUSD", "GBPUSD"]);
  const [candleTypes, setCandleTypes] = useState<ChartCandleType[]>(["candles", "candles"]);
  const [tools, setTools] = useState<ChartTool[]>(["off", "off"]);
  const [projections, setProjections] = useState<ChartProjection[]>(["off", "off"]);
  const [compares, setCompares] = useState<ChartCompare[]>(["off", "off"]);
  const [reasoningVisibility, setReasoningVisibility] = useState<ChartReasoningVisibility[]>(["on", "on"]);
  const [replayModes, setReplayModes] = useState<ChartReplayMode[]>(["live", "live"]);
  const [replayCursors, setReplayCursors] = useState<(number | null)[]>([null, null]);
  const [replayMaxes, setReplayMaxes] = useState<number[]>([1, 1]);
  const [indicators, setIndicators] = useState<ChartIndicator[][]>([[], []]);
  const [decisionEvents, setDecisionEvents] = useState<ChartDecisionEvent[][]>([[], []]);
  const [activeDecisionIds, setActiveDecisionIds] = useState<(string | null)[]>([null, null]);
  const [selectedDecisionIds, setSelectedDecisionIds] = useState<(string | null)[]>([null, null]);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const chartRefs = useRef<Array<ChartCanvasHandle | null>>(Array(PANE_COUNT).fill(null));

  const handleTimeframeChange = (value: string) => {
    setTimeframes((current) => updateAt(current, activePane, value));
    chartRefs.current[activePane]?.setTimeframe(value);
    setSelectedDecisionIds((current) => updateAt(current, activePane, null));
  };

  const handleInstrumentChange = (value: string) => {
    setInstruments((current) => updateAt(current, activePane, value));
    chartRefs.current[activePane]?.setInstrument(value);
    setCompares((current) => updateAt(current, activePane, "off"));
    chartRefs.current[activePane]?.setCompare("off");
    setSelectedDecisionIds((current) => updateAt(current, activePane, null));
  };

  const handleCandleTypeChange = (value: ChartCandleType) => {
    setCandleTypes((current) => updateAt(current, activePane, value));
    chartRefs.current[activePane]?.setCandleType(value);
  };

  const handleIndicatorToggle = (indicator: ChartIndicator) => {
    const nextEnabled = !indicators[activePane]?.includes(indicator);
    chartRefs.current[activePane]?.setIndicator(indicator, nextEnabled);
  };

  const handleIndicatorsChange = (pane: number, active: ChartIndicator[]) => {
    setIndicators((current) => updateAt(current, pane, active));
  };

  const syncCandleType = (pane: number, value: ChartCandleType) => {
    setCandleTypes((current) => updateAt(current, pane, value));
  };

  const handleToolChange = (value: ChartTool) => {
    setTools((current) => updateAt(current, activePane, value));
    chartRefs.current[activePane]?.setTool(value);
  };

  const syncTool = (pane: number, value: ChartTool) => {
    setTools((current) => updateAt(current, pane, value));
  };

  const handleProjectionChange = (value: ChartProjection) => {
    setProjections((current) => updateAt(current, activePane, value));
    chartRefs.current[activePane]?.setProjection(value);
  };

  const syncProjection = (pane: number, value: ChartProjection) => {
    setProjections((current) => updateAt(current, pane, value));
  };

  const handleCompareChange = (value: ChartCompare) => {
    setCompares((current) => updateAt(current, activePane, value));
    chartRefs.current[activePane]?.setCompare(value);
  };

  const syncCompare = (pane: number, value: ChartCompare) => {
    setCompares((current) => updateAt(current, pane, value));
  };

  const handleReasoningVisibilityChange = (value: ChartReasoningVisibility) => {
    setReasoningVisibility((current) => updateAt(current, activePane, value));
    chartRefs.current[activePane]?.setReasoningVisibility(value);
  };

  const syncReasoningVisibility = (pane: number, value: ChartReasoningVisibility) => {
    setReasoningVisibility((current) => updateAt(current, pane, value));
  };

  const handleReplayModeChange = (value: ChartReplayMode) => {
    setReplayModes((current) => updateAt(current, activePane, value));
    chartRefs.current[activePane]?.setReplayMode(value);
  };

  const handleReplayScrub = (value: number) => {
    setReplayCursors((current) => updateAt(current, activePane, value));
    chartRefs.current[activePane]?.setReplayCursor(value);
  };

  const syncReplayUpdate = (
    pane: number,
    { mode, cursor, max }: { mode: ChartReplayMode; cursor: number; max: number }
  ) => {
    setReplayModes((current) => updateAt(current, pane, mode));
    setReplayMaxes((current) => updateAt(current, pane, max || 1));
    setReplayCursors((current) => updateAt(current, pane, mode === "replay" ? cursor : null));
  };

  const syncDecisionTimeline = (pane: number, events: ChartDecisionEvent[]) => {
    setDecisionEvents((current) => updateAt(current, pane, events));
    if (events.length === 0) {
      setActiveDecisionIds((current) => updateAt(current, pane, null));
      setSelectedDecisionIds((current) => updateAt(current, pane, null));
    }
  };

  const syncDecisionActive = (pane: number, id: string | null) => {
    setActiveDecisionIds((current) => updateAt(current, pane, id));
    if (replayModes[pane] === "replay") {
      setSelectedDecisionIds((current) => updateAt(current, pane, current[pane] && current[pane] === id ? current[pane] : null));
    }
  };

  const handleDecisionSelect = (id: string) => {
    setSelectedDecisionIds((current) => updateAt(current, activePane, id));
    const syncReplay = replayModes[activePane] === "replay";
    chartRefs.current[activePane]?.focusDecision(id, { syncReplay });
  };

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => setSearchOpen(false);

  const handleSearchSelect = (value: string) => {
    handleInstrumentChange(value);
    setSearchOpen(false);
  };

  const handleSnapshotSave = () => {
    chartRefs.current[activePane]?.saveSnapshot();
  };

  const handleSnapshotRestore = () => {
    const snapshot: ChartSnapshot | null | undefined = chartRefs.current[activePane]?.loadSnapshot();
    if (!snapshot) return;
    setInstruments((current) => updateAt(current, activePane, snapshot.instrument));
    setTimeframes((current) => updateAt(current, activePane, snapshot.timeframe));
    setCandleTypes((current) => updateAt(current, activePane, snapshot.candleType));
    setIndicators((current) => updateAt(current, activePane, snapshot.indicators ?? []));
  };

  const renderPane = (pane: number) => (
    <div
      key={`pane-${pane}`}
      className={`relative flex-1 min-h-0 overflow-hidden ${layoutMode === "single" && pane !== activePane ? "hidden" : "block"}`}
      onClick={() => setActivePane(pane)}
    >
      <div className={`absolute inset-0 ring-inset ${activePane === pane ? "ring-1 ring-sky-200/50" : "ring-1 ring-white/6"}`}>
        <ChartCanvas
          ref={(node) => {
            chartRefs.current[pane] = node;
          }}
          initialInstrument={instruments[pane]}
          initialCandleType={candleTypes[pane]}
          initialTool={tools[pane]}
          initialProjection={projections[pane]}
          initialCompare={compares[pane]}
          initialReasoningVisibility={reasoningVisibility[pane]}
          initialReplayMode={replayModes[pane]}
          initialReplayCursor={replayCursors[pane]}
          onIndicatorsChange={(active) => handleIndicatorsChange(pane, active)}
          onCandleTypeChange={(value) => syncCandleType(pane, value)}
          onToolChange={(value) => syncTool(pane, value)}
          onProjectionChange={(value) => syncProjection(pane, value)}
          onReasoningVisibilityChange={(value) => syncReasoningVisibility(pane, value)}
          onCompareChange={(value) => syncCompare(pane, value)}
          onReplayUpdate={(info) => syncReplayUpdate(pane, info)}
          onDecisionTimelineUpdate={(events) => syncDecisionTimeline(pane, events)}
          onDecisionActiveChange={(id) => syncDecisionActive(pane, id)}
        />
      </div>
    </div>
  );

  return (
    <TerminalShell
      timeframe={timeframes[activePane]}
      onTimeframeChange={handleTimeframeChange}
      timeframeOptions={TIMEFRAME_OPTIONS}
      instrument={instruments[activePane]}
      onInstrumentChange={handleInstrumentChange}
      instrumentOptions={INSTRUMENT_OPTIONS}
      candleType={candleTypes[activePane]}
      onCandleTypeChange={handleCandleTypeChange}
      candleTypeOptions={CANDLE_TYPE_OPTIONS}
      tool={tools[activePane]}
      onToolChange={handleToolChange}
      toolOptions={TOOL_OPTIONS}
      projection={projections[activePane]}
      onProjectionChange={handleProjectionChange}
      projectionOptions={PROJECTION_OPTIONS}
      compare={compares[activePane]}
      onCompareChange={handleCompareChange}
      compareOptions={COMPARE_OPTIONS}
      searchOpen={searchOpen}
      onSearchOpen={openSearch}
      onSearchClose={closeSearch}
      onSearchSelect={handleSearchSelect}
      searchOptions={INSTRUMENT_OPTIONS}
      reasoningVisibility={reasoningVisibility[activePane]}
      onReasoningVisibilityChange={handleReasoningVisibilityChange}
      replayMode={replayModes[activePane]}
      onReplayModeChange={handleReplayModeChange}
      replayCursor={replayCursors[activePane] ?? replayMaxes[activePane]}
      replayMax={replayMaxes[activePane]}
      onReplayScrub={handleReplayScrub}
      onSnapshotSave={handleSnapshotSave}
      onSnapshotRestore={handleSnapshotRestore}
      indicators={indicators[activePane]}
      onIndicatorToggle={handleIndicatorToggle}
      indicatorOptions={INDICATOR_OPTIONS}
      decisionEvents={decisionEvents[activePane]}
      activeDecisionId={activeDecisionIds[activePane]}
      selectedDecisionId={selectedDecisionIds[activePane]}
      onDecisionSelect={handleDecisionSelect}
      layoutMode={layoutMode}
      onLayoutModeChange={setLayoutMode}
      activePaneLabel={`Pane ${activePane + 1}${layoutMode === "split" ? " • bot controls" : ""}`}
      activeInstrument={instruments[activePane]}
    >
      <div className="chart-workspace flex h-full min-h-0 gap-3">
        {Array.from({ length: PANE_COUNT }).map((_, pane) => renderPane(pane))}
      </div>
      <style jsx global>{`
        .chart-workspace header.stack-gap-xxs,
        .chart-workspace h2,
        .chart-workspace .muted-premium {
          display: none !important;
        }

        .chart-workspace [data-card],
        .chart-workspace .rounded-2xl,
        .chart-workspace .border,
        .chart-workspace .shadow-xl {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .chart-workspace section {
          margin: 0 !important;
        }
      `}</style>
    </TerminalShell>
  );
}
