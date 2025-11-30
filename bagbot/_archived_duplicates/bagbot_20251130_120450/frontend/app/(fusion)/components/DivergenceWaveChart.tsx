"use client";

import { useEffect, useState } from "react";
import DivergenceInsightBridge from "@/app/lib/analytics/DivergenceInsightBridge";

export default function DivergenceWaveChart() {
  const [history, setHistory] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const bridge = new DivergenceInsightBridge();

  async function refresh() {
    try {
      const insight = await bridge.getUIIntelligence();
      if (!insight || !insight.panels) return;

      // Extract strength data from panels
      const bullish = insight.panels.find((p: any) => p.title?.includes("Bullish"));
      const bearish = insight.panels.find((p: any) => p.title?.includes("Bearish"));
      
      const bullishVal = bullish ? parseFloat(bullish.value) || 0 : 0;
      const bearishVal = bearish ? parseFloat(bearish.value) || 0 : 0;
      const strength = Math.max(bullishVal, bearishVal);

      setHistory((prev) => {
        const updated = [...prev, strength].slice(-50);
        return updated;
      });
      setLoading(false);
    } catch (err) {
      console.error("WaveChart error:", err);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, []); // no history dependency (prevents infinite loops)

  if (loading) {
    return (
      <div className="w-full h-40 flex items-center justify-center text-purple-300">
        Loading divergence waves…
      </div>
    );
  }

  const points = history
    .map((v, i) => `${i * 4},${80 - (v * 0.8)}`)
    .join(" ");

  return (
    <div className="w-full p-4 bg-black/40 rounded-xl border border-purple-600 shadow-xl">
      <h2 className="text-xl font-bold text-purple-300 mb-3">
        Divergence Wave Chart
      </h2>

      <svg width="200" height="80" className="w-full">
        <polyline
          fill="none"
          stroke="url(#grad)"
          strokeWidth="3"
          points={points}
        />

        <defs>
          <linearGradient id="grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#00fff5" />
            <stop offset="100%" stopColor="#8a2be2" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
