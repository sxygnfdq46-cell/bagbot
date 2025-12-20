"use client";

import { useMemo, useState } from "react";
import MetricLabel from "@/components/ui/metric-label";
import Tag from "@/components/ui/tag";
import Button from "@/components/ui/button";
import { useRuntimeSnapshot } from "@/lib/runtime/use-runtime-snapshot";
import { botApi, type BotStatus } from "@/lib/api/bot";
import { applyRuntimeIntent } from "@/lib/runtime/runtime-intents";
import { updateRuntimeSnapshot } from "@/lib/runtime/runtime-store";

type BotStatusBarProps = {
  replayMode?: "live" | "replay";
  layoutMode?: "single" | "split";
  activePaneLabel?: string;
  activeInstrument?: string;
};

export default function BotStatusBar({ replayMode = "live", layoutMode = "single", activePaneLabel, activeInstrument }: BotStatusBarProps) {
  const { snapshot, loading } = useRuntimeSnapshot();
  const [pending, setPending] = useState<BotStatus | null>(null);
  const status = snapshot.bot.status ?? null;
  const lastAction = snapshot.bot.lastAction ?? null;
  const heartbeatTs = snapshot.bot.lastUpdateTs ?? null;
  const state = snapshot.bot.state ?? null;

  const isRunning = status === "running" || state === "RUNNING";
  const isStopped = status === "stopped" || state === "STOPPED";
  const inReplay = replayMode === "replay";

  const tone = useMemo(() => {
    if (status === "running") return "success";
    if (status === "stopped") return "warning";
    if (status === "error") return "danger";
    return "default";
  }, [status]);

  const heartbeat = useMemo(() => {
    if (!heartbeatTs) return "Awaiting heartbeat";
    const delta = Date.now() - heartbeatTs;
    const seconds = Math.max(0, Math.floor(delta / 1000));
    if (seconds < 10) return "Live";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }, [heartbeatTs]);

  const handleCommand = async (command: BotStatus) => {
    setPending(command);

    if (command === "running" || command === "stopped") {
      applyRuntimeIntent({ type: "SET_BOT_STATE", state: command === "running" ? "RUNNING" : "STOPPED", source: "bot-page" });
    }

    try {
      const next = await botApi.issueCommand(command);
      updateRuntimeSnapshot((prev) => ({
        ...prev,
        bot: {
          ...prev.bot,
          status: next.status ?? prev.bot.status ?? null,
          lastAction: next.lastAction ?? prev.bot.lastAction ?? null,
          health: next.health ?? prev.bot.health ?? null,
          state: next.status ? (next.status === "running" ? "RUNNING" : next.status === "stopped" ? "STOPPED" : prev.bot.state ?? null) : prev.bot.state ?? null,
          lastUpdateTs: Date.now(),
        },
      }));
    } catch (_error) {
      /* keep prior snapshot on failure */
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100/90 backdrop-blur">
      <div className="flex items-center gap-3">
        <Tag variant={tone}>{loading ? "SYNCING" : (status ?? "unknown").toUpperCase()}</Tag>
        <div className="min-w-0">
          <MetricLabel className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Bot</MetricLabel>
          <p className="truncate text-sm font-semibold text-white/90">{lastAction ?? "Observing fabric"}</p>
          <p className="text-[11px] text-slate-400">
            {layoutMode === "split" ? `Active pane: ${activePaneLabel ?? "1"}` : "Single pane"}
            {activeInstrument ? ` • Instrument: ${activeInstrument}` : null}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-300/80">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${status === "running" ? "bg-emerald-400" : status === "error" ? "bg-red-400" : "bg-amber-300"}`} aria-hidden />
          <span>{heartbeat}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">State</span>
          <span className="font-semibold text-slate-100/90">{state ?? "UNSET"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="px-3 py-2 text-[11px]"
            onClick={() => handleCommand("running")}
            disabled={pending !== null || isRunning || inReplay}
            isLoading={pending === "running"}
          >
            {inReplay ? "Start (locked)" : "Start"}
          </Button>
          <Button
            variant="ghost"
            className="px-3 py-2 text-[11px]"
            onClick={() => handleCommand("stopped")}
            disabled={pending !== null || isStopped}
            isLoading={pending === "stopped"}
          >
            Pause
          </Button>
          <Button
            variant="ghost"
            className="px-3 py-2 text-[11px]"
            onClick={() => handleCommand("stopped")}
            disabled={pending !== null || isStopped}
            isLoading={pending === "stopped"}
          >
            Stop
          </Button>
        </div>
        {inReplay ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-100/90">
            <span className="h-2 w-2 rounded-full bg-amber-300" aria-hidden />
            <span>Replay mode — execution disabled</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
