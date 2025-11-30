// /src/engine/fusion/filters.ts
// Signal smoothing and trend utilities

export function smooth(value: number, history: number[]): number {
  if (history.length < 3) return value;
  const last3 = history.slice(-3);
  const avg = last3.reduce((a, b) => a + b, 0) / last3.length;
  return value * 0.6 + avg * 0.4; // weighted average
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function trend(history: number[]): number {
  if (history.length < 5) return 0;
  const recent = history.slice(-5);
  const slope =
    (recent[4] - recent[0]) / 4; // simple linear slope
  return clamp(slope / 10, -1, 1); // normalize to [-1, 1]
}

export function ema(value: number, alpha: number, history: number[]): number {
  if (history.length === 0) return value;
  const lastEma = history[history.length - 1];
  return alpha * value + (1 - alpha) * lastEma;
}

export function zscore(value: number, history: number[]): number {
  if (history.length < 2) return 0;
  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  const variance = history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}
