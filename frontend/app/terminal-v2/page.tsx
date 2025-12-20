"use client";

import { useEffect, useMemo, useState } from "react";

type PaneLayout = "single" | "double" | "quad";
type ThemeMode = "noir" | "light";

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
          visibility: isFullscreen ? "hidden" : "visible",
          pointerEvents: isFullscreen ? "none" : "auto",
        }}
      >
        <div aria-label="Top command strip content" />
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
            visibility: isFullscreen ? "hidden" : "visible",
            pointerEvents: isFullscreen ? "none" : "auto",
          }}
        >
          <div aria-label="Tool dock content" />
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
            backgroundColor: "var(--terminal-chrome)",
            visibility: isFullscreen ? "hidden" : "visible",
            pointerEvents: isFullscreen ? "none" : "auto",
          }}
        >
          <div aria-label="Right context panel content" />
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
        }}
      >
        <div aria-label="Bottom control strip content" style={{ display: "flex", gap: "8px" }}>
          <button type="button" onClick={() => selectLayout("single")} aria-label="Switch to single pane layout">
            Single Pane
          </button>
          <button type="button" onClick={() => selectLayout("double")} aria-label="Switch to two pane layout">
            Two Panes
          </button>
          <button type="button" onClick={() => selectLayout("quad")} aria-label="Switch to four pane layout">
            Four Panes
          </button>
        </div>
        <button type="button" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        </button>
        <button type="button" onClick={toggleTheme} aria-label="Toggle theme">
          {themeMode === "noir" ? "Switch to Light" : "Switch to Noir"}
        </button>
      </footer>
    </div>
  );
}
