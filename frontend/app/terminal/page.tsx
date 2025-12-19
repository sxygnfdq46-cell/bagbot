"use client";

import { useMemo, useState } from "react";
import { ChartCanvas } from "@/app/charts/page";
import TerminalShell from "@/components/terminal/terminal-shell";

const TIMEFRAME_OPTIONS = ["15m", "1h", "4h", "1d"];

export default function TerminalPage() {
  const [timeframe, setTimeframe] = useState<string>("1h");
  const chartKey = useMemo(() => `chart-${timeframe}`, [timeframe]);

  return (
    <TerminalShell timeframe={timeframe} onTimeframeChange={setTimeframe} timeframeOptions={TIMEFRAME_OPTIONS}>
      <ChartCanvas timeframe={timeframe} key={chartKey} />
    </TerminalShell>
  );
}
