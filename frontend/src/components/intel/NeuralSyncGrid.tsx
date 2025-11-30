// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NEURAL SYNC GRID — Step 19 (Option B)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Holographic 12x12 grid with reactive animations
// - Fusion: Horizontal wave pulses
// - Stability: Overall brightness
// - Divergence: Red flicker on unstable cells

'use client';

import { useEffect, useRef, useState } from 'react';

interface CellState {
  brightness: number;
  flicker: boolean;
  wavePhase: number;
}

interface NeuralSyncGridProps {
  fusion: number;        // 0-100
  stability: number;     // 0-100
  divergence: number;    // 0-100
}

export default function NeuralSyncGrid({ fusion, stability, divergence }: NeuralSyncGridProps) {
  const [grid, setGrid] = useState<CellState[][]>([]);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef<number>(0);

  const GRID_SIZE = 12;

  // Initialize grid
  useEffect(() => {
    const initialGrid: CellState[][] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      const rowCells: CellState[] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        rowCells.push({
          brightness: 0.3,
          flicker: false,
          wavePhase: 0,
        });
      }
      initialGrid.push(rowCells);
    }
    setGrid(initialGrid);
  }, []);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      timeRef.current += 0.016; // ~60fps

      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            // Calculate wave phase based on fusion (horizontal waves)
            const fusionWave = Math.sin(
              (colIndex * 0.3) + (timeRef.current * (fusion / 50)) + (rowIndex * 0.1)
            );

            // Base brightness from stability
            const baseBrightness = 0.2 + (stability / 100) * 0.6;

            // Wave brightness modulation
            const waveBrightness = baseBrightness + (fusionWave * 0.2);

            // Divergence flicker (more unstable = more flicker)
            const shouldFlicker =
              divergence > 50 &&
              Math.random() < (divergence - 50) / 200;

            return {
              brightness: Math.max(0.1, Math.min(1, waveBrightness)),
              flicker: shouldFlicker,
              wavePhase: fusionWave,
            };
          })
        );
        return newGrid;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [fusion, stability, divergence]);

  return (
    <div className="space-y-4">
      {/* Hologram Title */}
      <div className="text-center relative">
        <h3 className="text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 animate-pulse">
          NEURAL SYNC MATRIX
        </h3>
        <div className="absolute inset-0 blur-xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 -z-10" />
      </div>

      {/* Grid Container */}
      <div className="relative">
        {/* Holographic overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 rounded-lg pointer-events-none" />
        
        {/* Grid */}
        <div
          className="grid gap-1 p-4 bg-black/40 rounded-lg border border-cyan-500/30 backdrop-blur-sm"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <GridCell
                key={`${rowIndex}-${colIndex}`}
                brightness={cell.brightness}
                flicker={cell.flicker}
                wavePhase={cell.wavePhase}
              />
            ))
          )}
        </div>

        {/* Scan line effect */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6, 182, 212, 0.03) 2px, rgba(6, 182, 212, 0.03) 4px)',
          }}
        />
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-3 gap-3 text-xs font-mono">
        <div className="text-center">
          <div className="text-gray-500 uppercase tracking-wider mb-1">Fusion</div>
          <div className="text-cyan-400 font-bold">{fusion.toFixed(0)}%</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500 uppercase tracking-wider mb-1">Stability</div>
          <div className="text-green-400 font-bold">{stability.toFixed(0)}%</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500 uppercase tracking-wider mb-1">Divergence</div>
          <div className="text-purple-400 font-bold">{divergence.toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GRID CELL COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface GridCellProps {
  brightness: number;
  flicker: boolean;
  wavePhase: number;
}

function GridCell({ brightness, flicker, wavePhase }: GridCellProps) {
  // Color based on wave phase
  const getCellColor = () => {
    if (flicker) {
      return 'rgba(239, 68, 68, 0.8)'; // Red flicker for divergence
    }

    // Cyan to purple gradient based on wave phase
    const phase = (wavePhase + 1) / 2; // Normalize to 0-1
    const r = Math.floor(6 + phase * (168 - 6));
    const g = Math.floor(182 + phase * (85 - 182));
    const b = Math.floor(212 + phase * (247 - 212));

    return `rgba(${r}, ${g}, ${b}, ${brightness})`;
  };

  const cellColor = getCellColor();
  const glowIntensity = brightness * (flicker ? 1.5 : 1);

  return (
    <div
      className="aspect-square rounded-sm transition-all duration-75 ease-out"
      style={{
        backgroundColor: cellColor,
        boxShadow: flicker
          ? `0 0 ${glowIntensity * 8}px rgba(239, 68, 68, ${glowIntensity * 0.6})`
          : `0 0 ${glowIntensity * 6}px ${cellColor}`,
        border: `1px solid ${flicker ? 'rgba(239, 68, 68, 0.5)' : 'rgba(6, 182, 212, 0.3)'}`,
      }}
    />
  );
}
