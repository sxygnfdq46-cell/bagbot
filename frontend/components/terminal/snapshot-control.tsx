"use client";

import Tag from "@/components/ui/tag";
import MetricLabel from "@/components/ui/metric-label";

type SnapshotControlProps = {
  onSave?: () => void;
  onRestore?: () => void;
};

export default function SnapshotControl({ onSave, onRestore }: SnapshotControlProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/90">
      <div className="flex items-center gap-2">
        <Tag className="text-[11px] uppercase tracking-[0.22em]" variant="default">Snapshot</Tag>
        <MetricLabel className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Local</MetricLabel>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          className="rounded-md border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/90 transition hover:border-white/25 hover:bg-white/15"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onRestore}
          className="rounded-md border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/90 transition hover:border-white/25 hover:bg-white/15"
        >
          Recall
        </button>
      </div>
    </div>
  );
}
