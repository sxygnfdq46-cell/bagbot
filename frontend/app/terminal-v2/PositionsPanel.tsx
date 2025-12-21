"use client";

import type { FC } from "react";

export type PositionsState = "disconnected" | "flat" | "active";

type PositionRow = {
  id: string;
  instrument: string;
  side: "Long" | "Short";
  size: string;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  risk: string;
};

type PositionsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  state: PositionsState;
  onStateChange: (next: PositionsState) => void;
  activePaneId: string;
  themeMode: "noir" | "light";
};

const mockPositions: PositionRow[] = [
  {
    id: "pos-eth",
    instrument: "ETH-USD",
    side: "Long",
    size: "2.5",
    entryPrice: 2840.5,
    currentPrice: 2876.2,
    unrealizedPnl: 89.25,
    risk: "xVaR 0.8%",
  },
  {
    id: "pos-btc",
    instrument: "BTC-USD",
    side: "Short",
    size: "0.40",
    entryPrice: 43120.0,
    currentPrice: 42875.5,
    unrealizedPnl: 97.8,
    risk: "Stop 43450",
  },
  {
    id: "pos-sol",
    instrument: "SOL-USD",
    side: "Long",
    size: "820",
    entryPrice: 118.4,
    currentPrice: 117.3,
    unrealizedPnl: -902.0,
    risk: "Throttle 1.2%",
  },
];

const stateLabels: Record<PositionsState, string> = {
  disconnected: "Disconnected / No data",
  flat: "Flat (connected)",
  active: "Active positions",
};

const formatPrice = (value: number) => `$${value.toFixed(2)}`;
const formatPnl = (value: number) => {
  const abs = Math.abs(value).toFixed(2);
  return `${value >= 0 ? "+" : "-"}$${abs}`;
};

export const PositionsPanel: FC<PositionsPanelProps> = ({
  isOpen,
  onClose,
  state,
  onStateChange,
  activePaneId,
  themeMode,
}) => {
  if (!isOpen) return null;

  const rows = state === "active" ? mockPositions : [];
  const accent = themeMode === "light" ? "#3366cc" : "#7ac4ff";
  const muted = themeMode === "light" ? "rgba(31, 38, 47, 0.65)" : "rgba(233, 236, 242, 0.65)";

  return (
    <div
      data-positions-panel
      role="complementary"
      aria-label="Positions authority surface (read-only)"
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        width: "380px",
        maxHeight: "78%",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "14px",
        backgroundColor: "var(--terminal-surface)",
        color: "var(--terminal-text)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
        zIndex: 6,
        pointerEvents: "auto",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          <div style={{ fontSize: "14px", fontWeight: 700 }}>Positions — Read-only / Informational</div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", color: muted, fontSize: "12px" }}>
            <span style={{ padding: "4px 8px", borderRadius: "20px", border: `1px solid ${accent}20`, color: accent, fontWeight: 700 }}>
              {stateLabels[state]}
            </span>
            <span>Authority surface only. No order entry.</span>
          </div>
          <div style={{ color: muted, fontSize: "12px" }}>Active pane reference: {activePaneId} (chart stays authoritative)</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close positions panel"
          data-kind="positions-close"
          data-state="default"
          style={{ alignSelf: "flex-start" }}
        >
          Close
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: muted }}>Mock data states (read-only)</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {(["disconnected", "flat", "active"] as PositionsState[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onStateChange(key)}
              aria-label={`Show ${stateLabels[key]}`}
              data-kind="positions-chip"
              data-state={state === key ? "active" : "default"}
            >
              {stateLabels[key]}
            </button>
          ))}
        </div>
        <div style={{ fontSize: "12px", color: muted }}>Static placeholders only. Execution is disabled.</div>
      </div>

      <div
        style={{
          flex: "1 1 auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "10px",
          backgroundColor: "var(--terminal-bg)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.05)",
          overflowY: "auto",
        }}
      >
        {state === "disconnected" && (
          <div data-kind="positions-state" style={{ color: muted, fontSize: "13px", lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: "var(--terminal-text)" }}>No positions. Feed disconnected.</div>
            <div>Bot session not running or data link down. Positions remain informational only.</div>
            <div style={{ marginTop: "8px", padding: "8px", borderRadius: "6px", background: "rgba(255,255,255,0.04)", color: muted }}>
              Placeholder contract fields: Instrument · Side · Size · Entry · Mark · Unrealized PnL · Risk
            </div>
          </div>
        )}

        {state === "flat" && (
          <div data-kind="positions-state" style={{ color: muted, fontSize: "13px", lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: "var(--terminal-text)" }}>Connected, flat.</div>
            <div>No open positions. Monitoring only.</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 0.7fr 0.6fr 0.8fr 0.8fr 0.9fr 0.8fr",
                gap: "6px",
                alignItems: "center",
                marginTop: "10px",
                fontSize: "12px",
                color: muted,
              }}
            >
              {["Instrument", "Side", "Size", "Entry", "Mark", "Unrealized", "Risk"].map((col) => (
                <div key={col} style={{ padding: "6px 8px", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "6px" }}>
                  {col}
                </div>
              ))}
            </div>
          </div>
        )}

        {state === "active" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.7fr 0.6fr 0.8fr 0.8fr 0.9fr 0.8fr", fontSize: "12px", color: muted, fontWeight: 700, gap: "6px" }}>
              <div>Instrument</div>
              <div>Side</div>
              <div>Size</div>
              <div>Entry</div>
              <div>Mark</div>
              <div>Unrealized</div>
              <div>Risk</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {rows.map((position, idx) => {
                const instrument = idx === 0 ? `${position.instrument} · linked to ${activePaneId}` : position.instrument;
                return (
                  <div
                    key={position.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.4fr 0.7fr 0.6fr 0.8fr 0.8fr 0.9fr 0.8fr",
                      gap: "6px",
                      padding: "8px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.04)",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{instrument}</div>
                    <div style={{ color: position.side === "Long" ? "var(--terminal-accent)" : "#f45b69", fontWeight: 700 }}>{position.side}</div>
                    <div>{position.size}</div>
                    <div>{formatPrice(position.entryPrice)}</div>
                    <div>{formatPrice(position.currentPrice)}</div>
                    <div style={{ color: position.unrealizedPnl >= 0 ? "var(--terminal-accent)" : "#f45b69", fontWeight: 700 }}>
                      {formatPnl(position.unrealizedPnl)}
                    </div>
                    <div>{position.risk}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: muted }}>
        <div>Chart remains authoritative on time/price. Positions do not drive execution.</div>
        <div>Panel overlays the workspace and auto-dismisses when fullscreen is active.</div>
      </div>
    </div>
  );
};
