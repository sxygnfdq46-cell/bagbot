"use client";

import { useEffect, useMemo, useState } from "react";
import { ChartPane } from "./chart/ChartPane";
import { PositionsPanel, type PositionsState } from "./PositionsPanel";

type PaneLayout = "single" | "double" | "quad";
type ThemeMode = "noir" | "light";
type ToolDockItem = { id: string; label: string; disabled?: boolean };
type CommandItem = { id: string; label: string; disabled?: boolean };

const layoutPaneIds: Record<PaneLayout, string[]> = {
  single: ["pane-1"],
  double: ["pane-1", "pane-2"],
  quad: ["pane-1", "pane-2", "pane-3", "pane-4"],
};

// Phase 7 contract: panes remain independent until an explicit sync mode is delivered.
const themeTokens: Record<ThemeMode, Record<string, string>> = {
  noir: {
    "--terminal-bg": "#0b0d10",
    "--terminal-surface": "#14171c",
    "--terminal-chrome": "#1b1f26",
    "--terminal-text": "#e9ecf2",
    "--terminal-text-muted": "rgba(233, 236, 242, 0.72)",
    "--terminal-accent": "#7ac4ff",
  },
  light: {
    "--terminal-bg": "#f4f2ed",
    "--terminal-surface": "#ebe7df",
    "--terminal-chrome": "#dfdbd2",
    "--terminal-text": "#1f262f",
    "--terminal-text-muted": "rgba(31, 38, 47, 0.70)",
    "--terminal-accent": "#3366cc",
  },
};

const toolDockItems: ToolDockItem[] = [
  { id: "tool-cursor", label: "Cursor" },
  { id: "tool-draw", label: "Draw" },
  { id: "tool-alerts", label: "Alerts", disabled: true },
  { id: "tool-config", label: "Config" },
];

export default function TerminalV2Page() {
  const [paneLayout, setPaneLayout] = useState<PaneLayout>("single");
  const [activePaneId, setActivePaneId] = useState<string>(layoutPaneIds.single[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("noir");
  const [activeToolId, setActiveToolId] = useState<string>(toolDockItems[0]?.id ?? "tool-cursor");
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [isPositionsOpen, setIsPositionsOpen] = useState(false);
  const [positionsState, setPositionsState] = useState<PositionsState>("disconnected");

  const paneIds = useMemo(() => layoutPaneIds[paneLayout], [paneLayout]);
  const themeVars = useMemo(() => themeTokens[themeMode], [themeMode]);

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "noir" ? "light" : "noir"));
  };

  const selectLayout = (nextLayout: PaneLayout) => {
    setPaneLayout(nextLayout);
  };

  const setActivePane = (paneId: string) => {
    setActivePaneId(paneId);
  };

  useEffect(() => {
    if (!paneIds.includes(activePaneId)) {
      setActivePaneId(paneIds[0]);
    }
  }, [activePaneId, paneIds]);

  useEffect(() => {
    if (isFullscreen) {
      setIsPositionsOpen(false);
    }
  }, [isFullscreen]);

  const gridTemplate = useMemo(() => {
    if (paneLayout === "double") {
      return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr" };
    }

    if (paneLayout === "quad") {
      return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" };
    }

    return { gridTemplateColumns: "1fr", gridTemplateRows: "1fr" };
  }, [paneLayout]);

  return (
    <div
      data-terminal-v2
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "var(--terminal-bg)",
        color: "var(--terminal-text)",
        ...themeVars,
      }}
    >
      <header
        aria-label="Top command strip"
        style={{
          flex: "0 0 56px",
          display: "flex",
          alignItems: "center",
          padding: 0,
          backgroundColor: "var(--terminal-chrome)",
          color: "var(--terminal-text-muted)",
          fontSize: "13px",
          fontWeight: 600,
          visibility: isFullscreen ? "hidden" : "visible",
          pointerEvents: isFullscreen ? "none" : "auto",
        }}
      >
        <div
          aria-label="Top command strip content"
          style={{ display: "flex", alignItems: "center", width: "100%" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              aria-label="Toggle session"
              data-kind="command"
              data-state={isSessionActive ? "active" : "default"}
              onClick={() => setIsSessionActive((prev) => !prev)}
            >
              {isSessionActive ? "Session: Live" : "Session: Paused"}
            </button>
            <button
              type="button"
              aria-label="Safe mode"
              data-kind="command"
              data-state="disabled"
              disabled
            >
              Safe Mode
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>
            <button
              type="button"
              onClick={() => setIsPositionsOpen((prev) => !prev)}
              aria-label="Toggle positions panel"
              data-kind="command"
              data-state={isPositionsOpen ? "active" : "default"}
            >
              Positions (Read-only)
            </button>
            <span style={{ opacity: 0.7 }} aria-label="Theme indicator">
              Theme: {themeMode === "noir" ? "Noir" : "Light Luxe"}
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              data-kind="command"
              data-state="default"
            >
              {themeMode === "noir" ? "Switch to Light" : "Switch to Noir"}
            </button>
          </div>
        </div>
      </header>

      <div
        aria-label="Workspace"
        style={{
          position: "relative",
          flex: "1 1 auto",
          overflow: "hidden",
          backgroundColor: "var(--terminal-surface)",
        }}
      >
        <nav
          aria-label="Left tool dock"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "64px",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "var(--terminal-chrome)",
            color: "var(--terminal-text-muted)",
            fontSize: "12px",
            visibility: isFullscreen ? "hidden" : "visible",
            pointerEvents: isFullscreen ? "none" : "auto",
          }}
        >
          <div
            aria-label="Tool dock content"
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            {toolDockItems.map((item, index) => {
              const isPrimary = index === 0;
              const isActiveTool = activeToolId === item.id;
              const isDisabled = Boolean(item.disabled);
              return (
                <div
                  key={item.id}
                  aria-label={`Tool ${item.label}`}
                  data-selected={isPrimary || isActiveTool}
                  data-state={isDisabled ? "disabled" : isActiveTool ? "active" : "default"}
                  data-kind="dock-item"
                  style={{
                    width: "100%",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isPrimary || isActiveTool ? "var(--terminal-text)" : "var(--terminal-text-muted)",
                    backgroundColor: isPrimary || isActiveTool ? "var(--terminal-surface)" : "transparent",
                  }}
                  onClick={() => {
                    if (isDisabled) return;
                    setActiveToolId(item.id);
                  }}
                  role="button"
                  tabIndex={isDisabled ? -1 : 0}
                  onKeyDown={(event) => {
                    if (isDisabled) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveToolId(item.id);
                    }
                  }}
                >
                  <span style={{ fontWeight: isPrimary ? 700 : 600 }}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </nav>

        <main
          aria-label="Chart workspace"
          data-pane-sync="independent"
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gap: 0,
            ...gridTemplate,
            backgroundColor: "transparent",
          }}
        >
          {paneIds.map((paneId) => (
            <div
              key={paneId}
              aria-label={`Chart pane ${paneId}`}
              data-pane-id={paneId}
              data-active={paneId === activePaneId}
              role="button"
              tabIndex={0}
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                color: "var(--terminal-text-muted)",
              }}
              onClick={() => setActivePane(paneId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActivePane(paneId);
                }
              }}
            >
              <ChartPane paneId={paneId} themeMode={themeMode} />
            </div>
          ))}
        </main>

        <PositionsPanel
          isOpen={isPositionsOpen && !isFullscreen}
          onClose={() => setIsPositionsOpen(false)}
          state={positionsState}
          onStateChange={setPositionsState}
          activePaneId={activePaneId}
          themeMode={themeMode}
        />

        <aside
          aria-label="Right context panel"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: "320px",
            display: isFullscreen || isPositionsOpen ? "none" : "block",
            backgroundColor: "var(--terminal-surface)",
            color: "var(--terminal-text-muted)",
            visibility: isFullscreen ? "hidden" : "visible",
            pointerEvents: isFullscreen ? "none" : "auto",
          }}
        >
          <div
            aria-label="Right context panel content"
            style={{ padding: "12px", fontSize: "13px", fontWeight: 600, height: "100%", display: "flex", flexDirection: "column" }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button type="button" aria-label="Pin panel (inactive)" data-kind="panel" data-state="disabled" disabled>
                Pin
              </button>
              <button type="button" aria-label="Close panel (inactive)" data-kind="panel" data-state="disabled" disabled>
                Close
              </button>
            </div>
            <div style={{ marginTop: "12px", opacity: 0.8 }}>
              Context panel reserved for inspection modules.
            </div>
          </div>
        </aside>
      </div>

      <footer
        aria-label="Bottom control strip"
        style={{
          flex: "0 0 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 0,
          backgroundColor: "var(--terminal-chrome)",
          color: "var(--terminal-text)",
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        <div aria-label="Bottom control strip content" style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => selectLayout("single")}
            aria-label="Switch to single pane layout"
            data-kind="control"
            data-state={paneLayout === "single" ? "active" : "default"}
            aria-pressed={paneLayout === "single"}
          >
            Single Pane
          </button>
          <button
            type="button"
            onClick={() => selectLayout("double")}
            aria-label="Switch to two pane layout"
            data-kind="control"
            data-state={paneLayout === "double" ? "active" : "default"}
            aria-pressed={paneLayout === "double"}
          >
            Two Panes
          </button>
          <button
            type="button"
            onClick={() => selectLayout("quad")}
            aria-label="Switch to four pane layout"
            data-kind="control"
            data-state={paneLayout === "quad" ? "active" : "default"}
            aria-pressed={paneLayout === "quad"}
          >
            Four Panes
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span aria-label="Active pane indicator" style={{ opacity: 0.8 }}>
            Active pane: {activePaneId}
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
            data-kind="control"
            data-state={isFullscreen ? "active" : "default"}
          >
          {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            data-kind="control"
            data-state="default"
          >
            {themeMode === "noir" ? "Switch to Light" : "Switch to Noir"}
          </button>
        </div>
      </footer>
      <style jsx global>{`
        [data-terminal-v2] button {
          background: transparent;
          border: none;
          padding: 0;
          margin: 0;
          color: inherit;
          font: inherit;
        }

        [data-terminal-v2] [data-kind] {
          cursor: pointer;
        }

        [data-terminal-v2] [data-state="disabled"] {
          opacity: 0.35;
          cursor: not-allowed;
          pointer-events: none;
        }

        [data-terminal-v2] [data-kind]:hover:not([data-state="disabled"]) {
          background-color: var(--terminal-surface);
          color: var(--terminal-text);
        }

        [data-terminal-v2] [data-kind]:active:not([data-state="disabled"]) {
          background-color: var(--terminal-chrome);
          color: var(--terminal-text);
        }

        [data-terminal-v2] [data-kind][data-state="active"] {
          background-color: var(--terminal-surface);
          color: var(--terminal-text);
          font-weight: 700;
        }

        [data-terminal-v2] [data-kind]:focus-visible {
          outline: 1px solid var(--terminal-text-muted);
          outline-offset: -2px;
        }

        [data-terminal-v2] [data-kind="dock-item"] {
          cursor: pointer;
        }

        [data-terminal-v2] [data-kind="dock-item"][data-state="default"]:hover {
          background-color: var(--terminal-surface);
          color: var(--terminal-text);
        }

        [data-terminal-v2] [data-kind="dock-item"][data-state="active"] {
          background-color: var(--terminal-surface);
          color: var(--terminal-text);
          font-weight: 700;
        }

        [data-terminal-v2] [data-kind="dock-item"][data-state="disabled"] {
          background-color: transparent;
        }

        [data-terminal-v2] [data-kind="positions-chip"] {
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid var(--terminal-chrome);
          background: rgba(255, 255, 255, 0.04);
          color: var(--terminal-text-muted);
          font-size: 12px;
        }

        [data-terminal-v2] [data-kind="positions-chip"][data-state="active"] {
          background: var(--terminal-chrome);
          color: var(--terminal-text);
          font-weight: 700;
          border-color: var(--terminal-surface);
        }

        [data-terminal-v2] [data-kind="positions-close"] {
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid var(--terminal-chrome);
          background: rgba(255, 255, 255, 0.04);
          color: var(--terminal-text);
          font-size: 12px;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
