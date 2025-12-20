export default function TerminalV2Page() {
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
          justifyContent: "space-between",
          padding: 0,
        }}
      >
        <span>Top Command Strip (instrument, timeframe, candle, indicators, snapshot, compare, search, theme)</span>
        <span>Fixed height</span>
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
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <span>Tool Dock (icons)</span>
        </nav>

        <main
          aria-label="Chart workspace"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div>ChartWorkspace placeholder (dominant, edge-to-edge)</div>
        </main>

        <aside
          aria-label="Right context panel"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: "320px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span>Right context panel (overlays, one at a time)</span>
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
        <span>Bottom Control Strip (bot status, start/pause/stop, broker, execution, replay)</span>
        <span>Fixed height</span>
      </footer>
    </div>
  );
}
