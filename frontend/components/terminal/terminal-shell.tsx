"use client";

import { useState } from "react";
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
  onSnapshotSave?: () => void;
  onSnapshotRestore?: () => void;
  indicators?: ChartIndicator[];
  onIndicatorToggle?: (indicator: ChartIndicator) => void;
  indicatorOptions?: ChartIndicator[];
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
  onSnapshotSave,
  onSnapshotRestore,
  indicators = [],
  onIndicatorToggle,
  indicatorOptions,
}: TerminalShellProps) {
  const [showSignals, setShowSignals] = useState(false);
  const [showBrain, setShowBrain] = useState(false);
  const [showTrades, setShowTrades] = useState(false);
  const [showOrderbook, setShowOrderbook] = useState(false);

  const openSignals = () => setShowSignals(true);
  const closeSignals = () => setShowSignals(false);
  const openBrain = () => setShowBrain(true);
  const closeBrain = () => setShowBrain(false);
  const openTrades = () => setShowTrades(true);
  const closeTrades = () => setShowTrades(false);
  const openOrderbook = () => setShowOrderbook(true);
  const closeOrderbook = () => setShowOrderbook(false);

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
          {onIndicatorToggle ? (
            <IndicatorSelector active={indicators} onToggle={onIndicatorToggle} options={indicatorOptions} />
          ) : null}
          {onSnapshotSave || onSnapshotRestore ? (
            <SnapshotControl onSave={onSnapshotSave} onRestore={onSnapshotRestore} />
          ) : null}
        </div>
      </div>

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
          />
          <div className="relative flex-1 overflow-hidden">{children}</div>
          <SignalsPanel open={showSignals} onClose={closeSignals} />
          <BrainPanel open={showBrain} onClose={closeBrain} />
          <TradesPanel open={showTrades} onClose={closeTrades} />
          <OrderbookPanel open={showOrderbook} onClose={closeOrderbook} />
        </div>
      </div>

      <div
        className="rounded-xl border border-white/5 bg-slate-900/60 backdrop-blur"
        aria-label="Terminal bottom bar"
      >
        <BotStatusBar />
      </div>
    </div>
  );
}
