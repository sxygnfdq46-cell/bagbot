// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUSION TELEMETRY BARS — Step 18
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Displays real-time weight contributions with glowing sci-fi bars
// Auto-refreshes every 2 seconds
// Shows: Fusion Core, Divergence, Stabilizer + Final Fusion Score

'use client';

import { useEffect, useState } from 'react';
import DivergenceInsightBridge from '@/app/lib/analytics/DivergenceInsightBridge';

interface FusionTelemetry {
  core: number;
  divergence: number;
  stabilizer: number;
}

export default function FusionTelemetryBars() {
  const [telemetry, setTelemetry] = useState<FusionTelemetry>({
    core: 0,
    divergence: 0,
    stabilizer: 0,
  });

  const finalFusion = telemetry.core + telemetry.divergence + telemetry.stabilizer;

  useEffect(() => {
    const bridge = new DivergenceInsightBridge();

    const loadTelemetry = async () => {
      try {
        const data = await bridge.getUIIntelligence();
        if (data.fusionTelemetry) {
          setTelemetry(data.fusionTelemetry);
        }
      } catch (err) {
        console.error('[FusionTelemetryBars] Load error:', err);
      }
    };

    loadTelemetry();
    const interval = setInterval(loadTelemetry, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3 font-mono text-sm">
      {/* Fusion Core Bar */}
      <TelemetryBar
        label="Fusion Core"
        value={telemetry.core}
        color="cyan"
        maxValue={1.0}
      />

      {/* Divergence Bar */}
      <TelemetryBar
        label="Divergence"
        value={telemetry.divergence}
        color="purple"
        maxValue={1.0}
      />

      {/* Stabilizer Bar */}
      <TelemetryBar
        label="Stabilizer"
        value={telemetry.stabilizer}
        color="yellow"
        maxValue={1.0}
      />

      {/* Divider */}
      <div className="border-t border-gray-700/50 pt-3 mt-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 tracking-wider">FINAL FUSION:</span>
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-yellow-400">
            {finalFusion.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TELEMETRY BAR COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TelemetryBarProps {
  label: string;
  value: number;
  color: 'cyan' | 'purple' | 'yellow';
  maxValue: number;
}

function TelemetryBar({ label, value, color, maxValue }: TelemetryBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  const colorMap = {
    cyan: {
      bg: 'bg-cyan-500/20',
      fill: 'bg-gradient-to-r from-cyan-500 to-cyan-400',
      glow: 'shadow-[0_0_15px_rgba(6,182,212,0.5)]',
      text: 'text-cyan-400',
    },
    purple: {
      bg: 'bg-purple-500/20',
      fill: 'bg-gradient-to-r from-purple-500 to-purple-400',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]',
      text: 'text-purple-400',
    },
    yellow: {
      bg: 'bg-yellow-500/20',
      fill: 'bg-gradient-to-r from-yellow-500 to-yellow-400',
      glow: 'shadow-[0_0_15px_rgba(234,179,8,0.5)]',
      text: 'text-yellow-400',
    },
  };

  const theme = colorMap[color];

  return (
    <div className="space-y-1">
      {/* Label + Value */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400 tracking-wider text-xs uppercase">
          {label}
        </span>
        <span className={`${theme.text} font-bold`}>
          {value.toFixed(2)}
        </span>
      </div>

      {/* Bar Container */}
      <div className={`relative h-3 rounded-full ${theme.bg} overflow-hidden border border-gray-700/50`}>
        {/* Fill */}
        <div
          className={`absolute inset-y-0 left-0 ${theme.fill} ${theme.glow} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)',
          }}
        />
      </div>
    </div>
  );
}
