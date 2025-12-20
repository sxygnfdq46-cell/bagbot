"use client";

import { useEffect, useMemo, useState } from "react";

type PaneLayout = "single" | "double" | "quad";

const layoutPaneIds: Record<PaneLayout, string[]> = {
  single: ["pane-1"],
  double: ["pane-1", "pane-2"],
  quad: ["pane-1", "pane-2", "pane-3", "pane-4"],
};

export default function TerminalV2Page() {
  const [paneLayout, setPaneLayout] = useState<PaneLayout>("single");
  const [activePaneId, setActivePaneId] = useState<string>(layoutPaneIds.single[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const paneIds = useMemo(() => layoutPaneIds[paneLayout], [paneLayout]);

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

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
      }}
    >
      <header
        aria-label="Top command strip"
        style={{
          flex: "0 0 56px",
          display: "flex",
          alignItems: "center",
          padding: 0,
          visibility: isFullscreen ? "hidden" : "visible",
          pointerEvents: isFullscreen ? "none" : "auto",
        }}
      >
        <div aria-label="Top command strip content" />
      </header>

      <div
        aria-label="Workspace"
        style={{ position: "relative", flex: "1 1 auto", overflow: "hidden" }}
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
      </footer>
    </div>
  );
}
