"use client";

import type { ReactNode } from "react";
import type { ChartDecisionEvent } from "@/app/charts/chart-canvas";
import MetricLabel from "@/components/ui/metric-label";
import Tag from "@/components/ui/tag";

const PanelContainer = ({ open, children }: { open: boolean; children: ReactNode }) => (
  <div
    className={`pointer-events-auto relative h-full w-[380px] max-w-[90vw] ${open ? "translate-x-0" : "translate-x-full"} overflow-hidden rounded-l-2xl border border-white/10 bg-slate-950/80 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-transform duration-300 ease-out`}
  >
    {children}
  </div>
);

const formatTimestamp = (seconds: number) => {
  const date = new Date(seconds * 1000);
  return date.toISOString().replace("T", " ").slice(0, 16);
};

export default function DecisionTimelinePanel({
  open,
  onClose,
  events,
  activeId,
  selectedId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  events: ChartDecisionEvent[];
  activeId?: string | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const ordered = [...events].sort((a, b) => a.time - b.time);

  return (
    <div
      className="pointer-events-none absolute inset-0 flex justify-end"
      aria-hidden={!open}
      style={{ zIndex: 22 }}
    >
      <PanelContainer open={open}>
        {open ? (
          <div className="flex h-full flex-col overflow-hidden">
            <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="space-y-1">
                <MetricLabel className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Decision Timeline</MetricLabel>
                <p className="text-lg font-semibold text-white/90">Chronological bot intents</p>
                <p className="text-sm text-slate-300/80">Read-only review; selections sync replay cursor only.</p>
              </div>
              <div className="flex items-center gap-2">
                <Tag variant="default">View</Tag>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80 backdrop-blur transition hover:border-white/30 hover:text-white"
                  aria-label="Close Decision Timeline"
                >
                  Close
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4 pr-2">
              {ordered.length === 0 ? (
                <p className="text-sm text-slate-300/70">Waiting for chart-aligned decisions…</p>
              ) : (
                <ul className="space-y-3" aria-label="Decision timeline entries">
                  {ordered.map((event) => {
                    const isActive = activeId === event.id;
                    const isSelected = selectedId === event.id;
                    return (
                      <li key={event.id}>
                        <button
                          type="button"
                          onClick={() => onSelect?.(event.id)}
                          className={`group w-full rounded-xl border px-3 py-2 text-left transition ${
                            isSelected
                              ? "border-emerald-300/30 bg-emerald-500/10"
                              : isActive
                              ? "border-cyan-300/30 bg-cyan-500/10"
                              : "border-white/10 bg-white/5 hover:border-white/20"
                          }`}
                          aria-pressed={isSelected}
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-300">
                            <span>{formatTimestamp(event.time)}</span>
                            <span className="text-slate-200/90">{event.phase}</span>
                          </div>
                          <p className="mt-1 text-base font-semibold text-white/90">{event.label}</p>
                          <p className="text-[11px] text-slate-400">Review-only — no execution</p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </PanelContainer>
    </div>
  );
}
