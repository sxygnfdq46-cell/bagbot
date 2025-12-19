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

type TerminalShellProps = {
  children: ReactNode;
  timeframe?: string;
  onTimeframeChange?: (value: string) => void;
  timeframeOptions?: string[];
  instrument?: string;
  onInstrumentChange?: (value: string) => void;
  instrumentOptions?: string[];
};

export default function TerminalShell({
  children,
  timeframe = "1h",
  onTimeframeChange,
  timeframeOptions,
  instrument = "BTC-USD",
  onInstrumentChange,
  instrumentOptions,
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
