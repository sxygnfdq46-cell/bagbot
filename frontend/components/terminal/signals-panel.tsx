"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const SignalsPage = dynamic(() => import("@/app/signals/page"), { ssr: false });

type SignalsPanelProps = {
  open: boolean;
  onClose: () => void;
};

export default function SignalsPanel({ open, onClose }: SignalsPanelProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex justify-end"
      aria-hidden={!open}
      style={{ zIndex: 20 }}
    >
      <PanelContainer open={open}>
        {open ? (
          <>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80 backdrop-blur transition hover:border-white/30 hover:text-white"
              aria-label="Close Signals panel"
            >
              Close
            </button>
            <div className="h-full overflow-y-auto pb-8 pr-1">
              <SignalsPage />
            </div>
          </>
        ) : null}
      </PanelContainer>
    </div>
  );
}

function PanelContainer({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className={`pointer-events-auto relative h-full w-[420px] max-w-[90vw] ${open ? "translate-x-0" : "translate-x-full"} overflow-hidden rounded-l-2xl border border-white/10 bg-slate-950/80 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-transform duration-300 ease-out`}
    >
      {children}
    </div>
  );
}
