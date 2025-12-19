"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import IconRail from "@/components/terminal/icon-rail";
import SignalsPanel from "@/components/terminal/signals-panel";
import BotStatusBar from "@/components/terminal/bot-status-bar";
import BrainPanel from "@/components/terminal/brain-panel";

export default function TerminalShell({ children }: { children: ReactNode }) {
  const [showSignals, setShowSignals] = useState(false);
  const [showBrain, setShowBrain] = useState(false);

  const openSignals = () => setShowSignals(true);
  const closeSignals = () => setShowSignals(false);
  const openBrain = () => setShowBrain(true);
  const closeBrain = () => setShowBrain(false);

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col gap-4 p-4">
      <div
        className="h-12 rounded-xl border border-white/5 bg-slate-900/50 backdrop-blur"
        aria-label="Terminal top bar"
      />

      <div className="flex-1 overflow-hidden rounded-2xl border border-white/5 bg-slate-900/30">
        <div className="relative flex h-full">
          <IconRail
            onOpenSignals={openSignals}
            signalsActive={showSignals}
            onOpenBrain={openBrain}
            brainActive={showBrain}
          />
          <div className="relative flex-1 overflow-hidden">{children}</div>
          <SignalsPanel open={showSignals} onClose={closeSignals} />
          <BrainPanel open={showBrain} onClose={closeBrain} />
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
