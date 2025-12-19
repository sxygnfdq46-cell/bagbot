"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { brainApi, type BrainActivityEvent, type BrainDecision } from "@/lib/api/brain";
import { useRuntimeSnapshot } from "@/lib/runtime/use-runtime-snapshot";
import MetricLabel from "@/components/ui/metric-label";
import Tag from "@/components/ui/tag";

const REFRESH_MS = 6500;

export default function BrainPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { snapshot } = useRuntimeSnapshot();
  const runtimeBrain = snapshot.brain ?? {};
  const [decisions, setDecisions] = useState<BrainDecision[]>([]);
  const [activity, setActivity] = useState<BrainActivityEvent[]>([]);
  const [status, setStatus] = useState<"loading" | "live" | "offline">("loading");

  const normalizeDecision = useCallback((input: any): BrainDecision => ({
    id: String(input?.request_id ?? input?.id ?? `decision-${Date.now()}`),
    timestamp: String(input?.timestamp ?? input?.time ?? new Date().toISOString()),
    outcome: String(input?.outcome ?? input?.label ?? input?.action ?? input?.reason ?? "decision"),
    confidence: Math.min(1, Math.max(0, Number.isFinite(Number(input?.confidence ?? input?.intensity)) ? Number(input.confidence ?? input.intensity) : 0))
  }), []);

  const normalizeActivity = useCallback((event: any): BrainActivityEvent => ({
    id: String(event?.id ?? `activity-${Date.now()}`),
    label: String(event?.label ?? "Signal"),
    location: String(event?.location ?? "Neuron"),
    intensity: Number.isFinite(Number(event?.intensity)) ? Number(event.intensity) : 0,
    status: (typeof event?.status === "string" ? event.status : "stable") as BrainActivityEvent["status"],
    timestamp: String(event?.timestamp ?? "")
  }), []);

  const loadData = useCallback(async () => {
    try {
      const [decisionResponse, activityResponse] = await Promise.all([
        brainApi.getRecentDecisions(),
        brainApi.getActivityMap()
      ]);
      setDecisions(Array.isArray(decisionResponse?.decisions) ? decisionResponse.decisions.map(normalizeDecision) : []);
      setActivity(Array.isArray(activityResponse?.events) ? activityResponse.events.map(normalizeActivity) : []);
      setStatus(activityResponse?.status === "offline" ? "offline" : "live");
    } catch (_error) {
      setStatus("offline");
    }
  }, [normalizeActivity, normalizeDecision]);

  useEffect(() => {
    if (!open) return undefined;
    let mounted = true;
    const hydrate = async () => {
      await loadData();
      if (!mounted) return;
    };
    hydrate();
    const interval = setInterval(loadData, REFRESH_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [loadData, open]);

  const latestDecision = useMemo(() => decisions[0], [decisions]);
  const recentDecisions = useMemo(() => decisions.slice(0, 5), [decisions]);
  const focusEvents = useMemo(() => activity.slice(0, 4), [activity]);

  const brainStatus = useMemo(() => {
    if (status === "offline") return { label: "OFFLINE", tone: "warning" as const };
    const normalized = runtimeBrain.status ? String(runtimeBrain.status) : "live";
    const tone = normalized.toLowerCase() === "error" ? ("danger" as const) : ("default" as const);
    return { label: normalized.toUpperCase(), tone };
  }, [runtimeBrain.status, status]);

  return (
    <div
      className="pointer-events-none absolute inset-0 flex justify-end"
      aria-hidden={!open}
      style={{ zIndex: 24 }}
    >
      <PanelContainer open={open}>
        {open ? (
          <div className="flex h-full flex-col overflow-hidden">
            <header className="relative flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="space-y-1">
                <MetricLabel className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Brain</MetricLabel>
                <p className="text-lg font-semibold text-white/90">Live reasoning</p>
                <p className="text-sm text-slate-300/80">Explains current intent and focus. Read-only.</p>
              </div>
              <div className="flex items-center gap-2">
                <Tag variant={brainStatus.tone}>{brainStatus.label}</Tag>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80 backdrop-blur transition hover:border-white/30 hover:text-white"
                  aria-label="Close Brain panel"
                >
                  Close
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 pr-2">
              <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-inner shadow-black/30">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <MetricLabel className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Current Intent</MetricLabel>
                    <p className="mt-1 text-xl font-semibold text-white/90">{latestDecision?.outcome ?? "Synthesizing context"}</p>
                    <p className="text-sm text-slate-300/80">Confidence {(latestDecision?.confidence ?? 0) * 100 > 0 ? `${Math.round((latestDecision?.confidence ?? 0) * 100)}%` : "pending"}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>Last decision</p>
                    <p className="font-mono text-slate-200/80">{latestDecision?.timestamp ?? "–"}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between">
                  <MetricLabel className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Reasoning Stream</MetricLabel>
                  <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Recent</span>
                </div>
                <ul className="mt-3 space-y-3">
                  {recentDecisions.length === 0 ? (
                    <li className="text-sm text-slate-300/70">Waiting for neural intent…</li>
                  ) : (
                    recentDecisions.map((decision) => (
                      <li
                        key={decision.id}
                        className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-200/90"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                          <span>{decision.timestamp}</span>
                          <span className="text-[color:var(--accent-green)]">{Math.round(decision.confidence * 100)}% conf.</span>
                        </div>
                        <p className="mt-1 text-base font-semibold text-white/90">{decision.outcome}</p>
                      </li>
                    ))
                  )}
                </ul>
              </section>

              <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between">
                  <MetricLabel className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Attention Map</MetricLabel>
                  <span className={`text-[11px] uppercase tracking-[0.24em] ${status === "offline" ? "text-red-300" : "text-slate-400"}`}>
                    {status === "offline" ? "Offline" : "Live"}
                  </span>
                </div>
                <ul className="mt-3 space-y-3">
                  {focusEvents.length === 0 ? (
                    <li className="text-sm text-slate-300/70">Listening for neural activity…</li>
                  ) : (
                    focusEvents.map((event) => (
                      <li key={event.id} className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-200/90">
                        <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                          <span>{event.location}</span>
                          <span>{event.timestamp}</span>
                        </div>
                        <p className="mt-1 text-base font-semibold text-white/90">{event.label}</p>
                        <p className="text-xs text-slate-300/80">Intensity {Math.round(Math.min(1, Math.max(0, event.intensity)) * 100)}% • {event.status}</p>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>
          </div>
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
