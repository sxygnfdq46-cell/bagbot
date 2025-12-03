import { mockResponse } from '@/lib/api/mock-service';

export type PricePoint = { timestamp: number; value: number };
export type MiniChart = { symbol: string; change: number; points: number[]; volume: string };
export type LiveFeedEvent = { id: string; channel: string; latency: number; payload: string };
export type ChartOverviewStat = { label: string; value: string; accent: string };

export type Candle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type ChartSnapshot = {
  asset: string;
  timeframe: string;
  series: PricePoint[];
  candles: Candle[];
  overview: ChartOverviewStat[];
  miniCharts: MiniChart[];
  pulse: number[];
  feed: LiveFeedEvent[];
};

const ASSETS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD'];
const TIMEFRAMES = ['1H', '4H', '1D', '1W'];

const basePrice = (asset: string) => {
  if (asset.startsWith('ETH')) return 3050;
  if (asset.startsWith('SOL')) return 145;
  if (asset.startsWith('DOGE')) return 0.21;
  return 47250;
};

const noisePoint = (anchor: number) => {
  const variance = Math.random() * 10;
  const direction = Math.random() > 0.5 ? 1 : -1;
  return Math.max(10, anchor + variance * direction);
};

const sparkline = (anchor: number, length = 32) => Array.from({ length }, () => noisePoint(anchor));

const timeframeToMinutes: Record<string, number> = {
  '1H': 60,
  '4H': 240,
  '1D': 1440,
  '1W': 10080
};

const buildSeries = (asset: string): PricePoint[] => {
  const base = basePrice(asset);
  const length = 140;
  const series: PricePoint[] = [];
  let current = base;
  for (let i = 0; i < length; i += 1) {
    current += (Math.random() - 0.5) * (base * 0.0015);
    series.push({ timestamp: Date.now() - (length - i) * 60_000, value: Math.max(current, 1) });
  }
  return series;
};

const buildCandles = (asset: string, timeframe: string): Candle[] => {
  const base = basePrice(asset);
  const length = 120;
  const candles: Candle[] = [];
  let cursor = base;
  const minutes = timeframeToMinutes[timeframe] ?? 60;
  const stepMs = minutes * 60_000;

  for (let i = 0; i < length; i += 1) {
    const open = cursor;
    const drift = (Math.random() - 0.5) * (base * 0.0025);
    const close = Math.max(1, open + drift);
    const high = Math.max(open, close) + Math.random() * (base * 0.0015);
    const low = Math.min(open, close) - Math.random() * (base * 0.0015);
    const volume = Math.max(10, Math.random() * base * 1200);
    candles.push({
      timestamp: Date.now() - (length - i) * stepMs,
      open,
      high,
      low,
      close,
      volume
    });
    cursor = close;
  }

  return candles;
};

const buildMiniCharts = (): MiniChart[] =>
  ASSETS.map((symbol) => ({
    symbol,
    change: Number(((Math.random() - 0.5) * 4).toFixed(2)),
    points: sparkline(50),
    volume: `${(Math.random() * 120 + 40).toFixed(0)}M`
  }));

const buildOverview = (): ChartOverviewStat[] => [
  { label: 'Heat score', value: `${(Math.random() * 100).toFixed(1)}%`, accent: 'var(--accent-gold)' },
  { label: 'Liquidity', value: `${(Math.random() * 500).toFixed(0)}M`, accent: 'var(--accent-cyan)' },
  { label: 'Spread', value: `${(Math.random() * 12).toFixed(2)} bps`, accent: 'var(--accent-violet)' },
  { label: 'Volatility', value: `${(Math.random() * 4 + 1).toFixed(2)}σ`, accent: 'var(--accent-green)' }
];

const seedPulse = () => Array.from({ length: 30 }, () => noisePoint(50));

const newFeedEvent = (asset: string): LiveFeedEvent => ({
  id: `${asset}-${Date.now()}`,
  channel: asset,
  latency: Math.round(Math.random() * 10) + 5,
  payload: `${asset.split('-')[0]} ${Math.random() > 0.5 ? 'bid' : 'ask'} ping`
});

let chartSnapshot: ChartSnapshot = {
  asset: ASSETS[0],
  timeframe: TIMEFRAMES[0],
  series: buildSeries(ASSETS[0]),
  candles: buildCandles(ASSETS[0], TIMEFRAMES[0]),
  overview: buildOverview(),
  miniCharts: buildMiniCharts(),
  pulse: seedPulse(),
  feed: Array.from({ length: 4 }, (_, index) => newFeedEvent(ASSETS[index % ASSETS.length]))
};

const mutatePulse = (asset: string) => {
  chartSnapshot = {
    ...chartSnapshot,
    pulse: [...chartSnapshot.pulse.slice(-24), noisePoint(chartSnapshot.pulse.at(-1) ?? 50)],
    feed: [newFeedEvent(asset), ...chartSnapshot.feed].slice(0, 6)
  };
};

export const chartsApi = {
  listAssets: () => ASSETS,
  listTimeframes: () => TIMEFRAMES,
  getSnapshot: async (asset: string, timeframe: string): Promise<ChartSnapshot> => {
    chartSnapshot = {
      asset,
      timeframe,
      series: buildSeries(asset),
      candles: buildCandles(asset, timeframe),
      overview: buildOverview(),
      miniCharts: buildMiniCharts(),
      pulse: chartSnapshot.pulse,
      feed: chartSnapshot.feed
    };
    return mockResponse(chartSnapshot);
  },
  streamPulse: async (asset: string): Promise<Pick<ChartSnapshot, 'pulse' | 'feed'>> => {
    mutatePulse(asset);
    return mockResponse({ pulse: chartSnapshot.pulse, feed: chartSnapshot.feed });
  }
};
