"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import MetricLabel from "@/components/ui/metric-label";
import Tag from "@/components/ui/tag";

const DEFAULT_OPTIONS = ["EURUSD", "GBPUSD", "XAUUSD", "NAS100", "BTCUSD"] as const;

type SearchOverlayProps = {
  open?: boolean;
  onClose?: () => void;
  onSelect?: (value: string) => void;
  options?: string[];
};

export default function SearchOverlay({ open = false, onClose, onSelect, options }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const list = useMemo(() => (options && options.length ? options : DEFAULT_OPTIONS), [options]);
  const filtered = useMemo(() => {
    if (!query.trim()) return list;
    const needle = query.toLowerCase();
    return list.filter((item) => item.toLowerCase().includes(needle));
  }, [list, query]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      onClose?.();
    };

    if (open) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }

    return undefined;
  }, [open, onClose]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose?.();
    } else if (event.key === "Enter") {
      event.preventDefault();
      const pick = filtered[0];
      if (pick) {
        onSelect?.(pick);
        onClose?.();
      }
    }
  };

  const handleSelect = (value: string) => {
    onSelect?.(value);
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        ref={menuRef}
        className="mt-10 w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl"
      >
        <div className="border-b border-white/5 bg-white/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-200/90">
              <Tag className="text-[11px] uppercase tracking-[0.22em]" variant="default">Search</Tag>
              <span>Instrument</span>
            </div>
            <span className="text-[11px] text-slate-300">Esc to close</span>
          </div>
          <div className="mt-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-slate-400 focus:border-white/25"
              placeholder="Type an instrument (e.g., BTCUSD)"
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto p-3">
          <div className="space-y-1" role="listbox" aria-label="Instrument search results">
            {filtered.length === 0 ? (
              <div className="rounded-md border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-300">
                No matches
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  <span className="uppercase tracking-[0.08em]">{item}</span>
                  <MetricLabel className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Switch</MetricLabel>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
