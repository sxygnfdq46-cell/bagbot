"use client";

import { useEffect, useMemo, useState } from "react";

type PaneLayout = "single" | "double" | "quad";
type ThemeMode = "noir" | "light";
type ToolDockItem = { id: string; label: string };

const layoutPaneIds: Record<PaneLayout, string[]> = {
  single: ["pane-1"],
  double: ["pane-1", "pane-2"],
  quad: ["pane-1", "pane-2", "pane-3", "pane-4"],
};

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
  { id: "tool-alerts", label: "Alerts" },
  { id: "tool-config", label: "Config" },
];

export default function TerminalV2Page() {
  const [paneLayout, setPaneLayout] = useState<PaneLayout>("single");
  const [activePaneId, setActivePaneId] = useState<string>(layoutPaneIds.single[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("noir");

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
          <span aria-label="Session status" style={{ opacity: 0.9 }}>
            Session: Connected · Latency nominal
          </span>
          <span style={{ marginLeft: "auto", opacity: 0.7 }} aria-label="Theme indicator">
            Theme: {themeMode === "noir" ? "Noir" : "Light Luxe"}
          </span>
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
              return (
                <div
                  key={item.id}
                  aria-label={`Tool ${item.label}`}
                  data-selected={isPrimary}
                  style={{
                    width: "100%",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isPrimary ? "var(--terminal-text)" : "var(--terminal-text-muted)",
                    backgroundColor: isPrimary ? "var(--terminal-surface)" : "transparent",
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
              <div aria-label={`Chart pane placeholder for ${paneId}`} />
            </div>
          ))}
        </main>

        <aside
          aria-label="Right context panel"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: "320px",
            display: "block",
            backgroundColor: "var(--terminal-surface)",
            color: "var(--terminal-text-muted)",
            visibility: isFullscreen ? "hidden" : "visible",
            pointerEvents: isFullscreen ? "none" : "auto",
          }}
        >
          <div
            aria-label="Right context panel content"
            style={{ padding: "12px", fontSize: "13px", fontWeight: 600 }}
          >
            Context panel reserved for inspection modules.
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
            style={{ background: "transparent", color: "inherit", border: "none", fontWeight: 700, cursor: "pointer" }}
          >
            Single Pane
          </button>
          <button
            type="button"
            onClick={() => selectLayout("double")}
            aria-label="Switch to two pane layout"
            style={{ background: "transparent", color: "inherit", border: "none", fontWeight: 700, cursor: "pointer" }}
          >
            Two Panes
          </button>
          <button
            type="button"
            onClick={() => selectLayout("quad")}
            aria-label="Switch to four pane layout"
            style={{ background: "transparent", color: "inherit", border: "none", fontWeight: 700, cursor: "pointer" }}
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
            style={{ background: "transparent", color: "inherit", border: "none", fontWeight: 700, cursor: "pointer" }}
          >
          {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{ background: "transparent", color: "inherit", border: "none", fontWeight: 700, cursor: "pointer" }}
          >
            {themeMode === "noir" ? "Switch to Light" : "Switch to Noir"}
          </button>
        </div>
      </footer>
    </div>
  );
}
