"use client";

import ChartCanvas from "@/app/charts/page";
import TerminalShell from "@/components/terminal/terminal-shell";

export default function TerminalPage() {
  return (
    <TerminalShell>
      <ChartCanvas />
    </TerminalShell>
  );
}
