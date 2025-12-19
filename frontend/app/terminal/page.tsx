"use client";

import ChartCanvas from "@/components/charts/chart-canvas";
import TerminalShell from "@/components/terminal/terminal-shell";

export default function TerminalPage() {
  return (
    <TerminalShell>
      <ChartCanvas />
    </TerminalShell>
  );
}
