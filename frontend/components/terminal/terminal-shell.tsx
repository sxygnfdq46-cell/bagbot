"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import IconRail from "@/components/terminal/icon-rail";
import SignalsPanel from "@/components/terminal/signals-panel";
import BotStatusBar from "@/components/terminal/bot-status-bar";
import BrainPanel from "@/components/terminal/brain-panel";
import TradesPanel from "@/components/terminal/trades-panel";
import OrderbookPanel from "@/components/terminal/orderbook-panel";
import InstrumentDisplay from "@/components/terminal/instrument-display";
import TimeframeSelector from "@/components/terminal/timeframe-selector";
import InstrumentSelector from "@/components/terminal/instrument-selector";
import IndicatorSelector from "@/components/terminal/indicator-selector";
import type { ChartIndicator } from "@/app/charts/chart-canvas";
import CandleTypeSelector from "@/components/terminal/candle-type-selector";
import type { ChartCandleType } from "@/app/charts/chart-canvas";
import ToolsSelector from "@/components/terminal/tools-selector";
import type { ChartTool } from "@/app/charts/chart-canvas";
import SnapshotControl from "@/components/terminal/snapshot-control";
import ProjectionSelector from "@/components/terminal/projection-selector";
import type { ChartProjection } from "@/app/charts/chart-canvas";
import CompareSelector from "@/components/terminal/compare-selector";
import type { ChartCompare } from "@/app/charts/chart-canvas";
import SearchOverlay from "@/components/terminal/search-overlay";
import Tag from "@/components/ui/tag";
import type { ChartReasoningVisibility } from "@/app/charts/chart-canvas";
import type { ChartReplayMode } from "@/app/charts/chart-canvas";
import type { ChartDecisionEvent } from "@/app/charts/chart-canvas";
import DecisionTimelinePanel from "@/components/terminal/decision-timeline-panel";

type TerminalShellProps = {
  children: ReactNode;
  timeframe?: string;
  onTimeframeChange?: (value: string) => void;
  timeframeOptions?: string[];
  instrument?: string;
  onInstrumentChange?: (value: string) => void;
  instrumentOptions?: string[];
  candleType?: ChartCandleType;
  onCandleTypeChange?: (value: ChartCandleType) => void;
  candleTypeOptions?: ChartCandleType[];
  tool?: ChartTool;
  onToolChange?: (value: ChartTool) => void;
  toolOptions?: ChartTool[];
  projection?: ChartProjection;
  onProjectionChange?: (value: ChartProjection) => void;
  projectionOptions?: ChartProjection[];
  compare?: ChartCompare;
  onCompareChange?: (value: ChartCompare) => void;
  compareOptions?: ChartCompare[];
  searchOpen?: boolean;
  onSearchOpen?: () => void;
  onSearchClose?: () => void;
  onSearchSelect?: (value: string) => void;
  searchOptions?: string[];
  reasoningVisibility?: ChartReasoningVisibility;
  onReasoningVisibilityChange?: (value: ChartReasoningVisibility) => void;
  replayMode?: ChartReplayMode;
  onReplayModeChange?: (value: ChartReplayMode) => void;
  replayCursor?: number | null;
  replayMax?: number;
  onReplayScrub?: (value: number) => void;
  onSnapshotSave?: () => void;
  onSnapshotRestore?: () => void;
  indicators?: ChartIndicator[];
  onIndicatorToggle?: (indicator: ChartIndicator) => void;
  indicatorOptions?: ChartIndicator[];
  decisionEvents?: ChartDecisionEvent[];
  activeDecisionId?: string | null;
  selectedDecisionId?: string | null;
  onDecisionSelect?: (id: string) => void;
  layoutMode?: "single" | "split";
  onLayoutModeChange?: (mode: "single" | "split") => void;
};

export default function TerminalShell({
  children,
  timeframe = "1h",
  onTimeframeChange,
  timeframeOptions,
  instrument = "BTC-USD",
  onInstrumentChange,
  instrumentOptions,
  candleType = "candles",
  onCandleTypeChange,
  candleTypeOptions,
  tool = "off",
  onToolChange,
  toolOptions,
  projection = "off",
  onProjectionChange,
  projectionOptions,
  compare = "off",
  onCompareChange,
  compareOptions,
  searchOpen = false,
  onSearchOpen,
  onSearchClose,
  onSearchSelect,
  searchOptions,
  reasoningVisibility = "on",
  onReasoningVisibilityChange,
  replayMode = "live",
  onReplayModeChange,
  replayCursor,
  replayMax,
  onReplayScrub,
  onSnapshotSave,
  onSnapshotRestore,
  indicators = [],
  onIndicatorToggle,
  indicatorOptions,
  decisionEvents = [],
  activeDecisionId,
  selectedDecisionId,
  onDecisionSelect,
  layoutMode = "single",
  onLayoutModeChange,
}: TerminalShellProps) {
  const [showSignals, setShowSignals] = useState(false);
  const [showBrain, setShowBrain] = useState(false);
  const [showTrades, setShowTrades] = useState(false);
  const [showOrderbook, setShowOrderbook] = useState(false);
  const [showDecisionTimeline, setShowDecisionTimeline] = useState(false);

  const openSignals = () => setShowSignals(true);
  const closeSignals = () => setShowSignals(false);
  const openBrain = () => setShowBrain(true);
  const closeBrain = () => setShowBrain(false);
  const openTrades = () => setShowTrades(true);
  const closeTrades = () => setShowTrades(false);
  const openOrderbook = () => setShowOrderbook(true);
  const closeOrderbook = () => setShowOrderbook(false);
  const openDecisionTimeline = () => setShowDecisionTimeline(true);
  const closeDecisionTimeline = () => setShowDecisionTimeline(false);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!onSearchOpen) return;
      const isK = event.key.toLowerCase() === "k";
      if ((event.metaKey || event.ctrlKey) && isK) {
        event.preventDefault();
        onSearchOpen();
      } else if (event.key === "Escape" && searchOpen) {
        onSearchClose?.();
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [onSearchClose, onSearchOpen, searchOpen]);

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col gap-4 p-4">
      <div
        className="flex h-12 items-center rounded-xl border border-white/5 bg-slate-900/50 px-3 backdrop-blur"
        aria-label="Terminal top bar"
      >
        <div className="flex items-center gap-3">
          <InstrumentDisplay timeframe={timeframe} instrument={instrument} />
          {onInstrumentChange ? (
            <InstrumentSelector instrument={instrument} onSelect={onInstrumentChange} options={instrumentOptions} />
          ) : null}
          {onSearchOpen ? (
            <button
              type="button"
              onClick={onSearchOpen}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white/90 transition hover:border-white/25"
              aria-label="Open search"
            >
              <Tag className="text-[11px] uppercase tracking-[0.22em]" variant="default">Search</Tag>
              <span className="text-xs uppercase tracking-[0.08em] text-slate-200/90">⌘K</span>
            </button>
          ) : null}
          {onTimeframeChange ? (
            <TimeframeSelector timeframe={timeframe} onSelect={onTimeframeChange} options={timeframeOptions} />
          ) : null}
          {onCandleTypeChange ? (
            <CandleTypeSelector candleType={candleType} onSelect={onCandleTypeChange} options={candleTypeOptions} />
          ) : null}
          {onToolChange ? (
            <ToolsSelector tool={tool} onSelect={onToolChange} options={toolOptions} />
          ) : null}
          {onProjectionChange ? (
            <ProjectionSelector projection={projection} onSelect={onProjectionChange} options={projectionOptions} />
          ) : null}
          {onCompareChange ? (
            <CompareSelector compare={compare} onSelect={onCompareChange} options={compareOptions} />
          ) : null}
          {onReasoningVisibilityChange ? (
            <button
              type="button"
              onClick={() => onReasoningVisibilityChange(reasoningVisibility === "on" ? "off" : "on")}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                reasoningVisibility === "on"
                  ? "border-emerald-300/30 bg-emerald-500/10 text-white"
                  : "border-white/10 bg-white/5 text-white/90 hover:border-white/25"
              }`}
            >
              <Tag className="text-[11px] uppercase tracking-[0.22em]" variant="default">Reasoning</Tag>
              <span className="text-xs uppercase tracking-[0.08em] text-slate-200/90">{reasoningVisibility === "on" ? "On" : "Off"}</span>
            </button>
          ) : null}
          {onReplayModeChange ? (
            <button
              type="button"
              onClick={() => onReplayModeChange(replayMode === "replay" ? "live" : "replay")}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                replayMode === "replay"
                  ? "border-amber-300/30 bg-amber-500/10 text-white"
                  : "border-white/10 bg-white/5 text-white/90 hover:border-white/25"
              }`}
            >
              <Tag className="text-[11px] uppercase tracking-[0.22em]" variant="default">Replay</Tag>
              <span className="text-xs uppercase tracking-[0.08em] text-slate-200/90">{replayMode === "replay" ? "On" : "Off"}</span>
            </button>
          ) : null}
          {onLayoutModeChange ? (
            <button
              type="button"
              onClick={() => onLayoutModeChange(layoutMode === "split" ? "single" : "split")}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                layoutMode === "split"
                  ? "border-sky-300/30 bg-sky-500/10 text-white"
                  : "border-white/10 bg-white/5 text-white/90 hover:border-white/25"
              }`}
              aria-label="Toggle layout"
            >
              <Tag className="text-[11px] uppercase tracking-[0.22em]" variant="default">Layout</Tag>
              <span className="text-xs uppercase tracking-[0.08em] text-slate-200/90">{layoutMode === "split" ? "Split" : "Single"}</span>
            </button>
          ) : null}
          {onIndicatorToggle ? (
            <IndicatorSelector active={indicators} onToggle={onIndicatorToggle} options={indicatorOptions} />
          ) : null}
          {onSnapshotSave || onSnapshotRestore ? (
            <SnapshotControl onSave={onSnapshotSave} onRestore={onSnapshotRestore} />
          ) : null}
        </div>
      </div>

      {replayMode === "replay" ? (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-100">
          <Tag className="text-[10px] uppercase tracking-[0.2em]" variant="default">Replay</Tag>
          <input
            type="range"
            min={1}
            max={Math.max(1, replayMax ?? 1)}
            value={Math.min(Math.max(1, replayCursor ?? (replayMax ?? 1)), Math.max(1, replayMax ?? 1))}
            onChange={(event) => onReplayScrub?.(Number(event.target.value))}
            className="flex-1 accent-amber-300"
            aria-label="Replay scrubber"
          />
          <span className="text-[11px] text-amber-100/80">{replayCursor ?? replayMax ?? 1} / {replayMax ?? 1}</span>
        </div>
      ) : null}

      <div className="flex-1 overflow-hidden rounded-2xl border border-white/5 bg-slate-900/30">
        <div className="relative flex h-full">
          <IconRail
            onOpenSignals={openSignals}
            signalsActive={showSignals}
            onOpenBrain={openBrain}
            brainActive={showBrain}
            onOpenTrades={openTrades}
            tradesActive={showTrades}
            onOpenOrderbook={openOrderbook}
            orderbookActive={showOrderbook}
            onOpenTimeline={openDecisionTimeline}
            timelineActive={showDecisionTimeline}
          />
          <div className="relative flex-1 overflow-hidden">{children}</div>
          <SignalsPanel open={showSignals} onClose={closeSignals} />
          <BrainPanel open={showBrain} onClose={closeBrain} />
          <TradesPanel open={showTrades} onClose={closeTrades} />
          <OrderbookPanel open={showOrderbook} onClose={closeOrderbook} />
          <DecisionTimelinePanel
            open={showDecisionTimeline}
            onClose={closeDecisionTimeline}
            events={decisionEvents}
            activeId={activeDecisionId}
            selectedId={selectedDecisionId}
            onSelect={(id) => {
              onDecisionSelect?.(id);
              setShowDecisionTimeline(true);
            }}
          />
        </div>
      </div>

      <div
        className="rounded-xl border border-white/5 bg-slate-900/60 backdrop-blur"
        aria-label="Terminal bottom bar"
      >
        <BotStatusBar />
      </div>

      <SearchOverlay
        open={searchOpen}
        onClose={onSearchClose}
        onSelect={onSearchSelect}
        options={searchOptions}
      />
    </div>
  );
}
