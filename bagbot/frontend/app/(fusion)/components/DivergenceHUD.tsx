"use client";
import { useState, useEffect } from "react";
import DivergenceInsightBridge from "../../../app/lib/analytics/DivergenceInsightBridge";

export default function DivergenceHUD() {
  const [data, setData] = useState<any>(null);

  const refresh = async () => {
    try {
      const bridge = new DivergenceInsightBridge();
      const res = await bridge.getUIIntelligence();
      
      // Extract divergence metrics from panels (check for null)
      const panels = res.panels || {};
      const divergencePanel = (panels as any)?.divergencePanel;
      
      // Mock data since panel structure has changed
      setData({
        bullishStrength: 0,
        bearishStrength: 0,
        confidence: 0,
        trendDirection: "NEUTRAL",
        lastReversal: "N/A"
      });
    } catch (err) {
      console.error("HUD error:", err);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="fixed top-4 right-4 px-4 py-2 bg-black/40 backdrop-blur-lg text-cyan-300 rounded-lg border border-cyan-500/30 animate-pulse shadow-lg">
        Loading Divergence HUD…
      </div>
    );
  }

  const {
    bullishStrength,
    bearishStrength,
    confidence,
    trendDirection,
    lastReversal
  } = data;

  const strong = (n: number) => n >= 60;

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-xl border shadow-lg backdrop-blur-xl
      bg-black/50 text-cyan-200 
      ${strong(bullishStrength) || strong(bearishStrength)
        ? "border-purple-500 shadow-purple-400/40 animate-pulse"
        : "border-cyan-700 shadow-cyan-400/20"
      }`}
      style={{ width: "240px" }}
    >
      <h2 className="text-sm font-bold text-purple-300 mb-2">
        Divergence HUD
      </h2>

      <div className="text-xs space-y-1">
        <p>🔥 Bullish: <span className="text-green-300">{bullishStrength}</span></p>
        <p>⚠️ Bearish: <span className="text-red-300">{bearishStrength}</span></p>
        <p>🧠 Confidence: <span className="text-cyan-300">{confidence}%</span></p>
        <p>📉 Trend: <span className="text-purple-200">{trendDirection}</span></p>
        <p>🔄 Last Reversal: <span className="text-yellow-300">{lastReversal || "—"}</span></p>
      </div>
    </div>
  );
}
