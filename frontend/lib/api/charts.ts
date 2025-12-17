import { mockResponse } from '@/lib/api/mock-service';

export type PricePoint = { timestamp: number; value: number };
export type MiniChart = { symbol: string; change: number; points: number[]; volume: string };
export type LiveFeedEvent = { id: string; channel: string; latency: number; payload: string };
export type ChartOverviewStat = { label: string; value: string; accent: string };

export type MarketDataSource = 'MOCK' | 'HISTORICAL';

export type Candle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source: MarketDataSource;
  validForLearning: boolean;
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
  marketDataSource: MarketDataSource;
};

const ASSETS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD'];
const TIMEFRAMES = ['1H', '4H', '1D', '1W', '1M'];
const DEFAULT_CANDLE_COUNT = 120;
const TICKS_PER_CANDLE = 12;
const ENV_SOURCE = (process.env.NEXT_PUBLIC_MARKET_DATA_SOURCE || 'MOCK').toString().toUpperCase();
const MARKET_DATA_SOURCE: MarketDataSource = ENV_SOURCE === 'HISTORICAL' ? 'HISTORICAL' : 'MOCK';
const HISTORICAL_REPLAY_SPEED = Number(process.env.NEXT_PUBLIC_HISTORICAL_REPLAY_SPEED ?? '1') || 1;

const basePrice = (asset: string) => {
  if (asset.startsWith('ETH')) return 3050;
  if (asset.startsWith('SOL')) return 145;
  if (asset.startsWith('DOGE')) return 0.21;
  return 47250;
};

const sparkline = (anchor: number, length = 32) => Array.from({ length }, (_, index) => anchor + Math.sin(index * 0.3) * 6);
const noisePoint = (anchor: number, index: number) => anchor + Math.sin(index * 0.35) * 6;
// Pulse is a visual-only heartbeat and explicitly not part of OHLC truth for tests.

const timeframeToMinutes: Record<string, number> = {
  '1H': 60,
  '4H': 240,
  '1D': 1440,
  '1W': 10080,
  '1M': 43200
};

type Tick = { timestamp: number; price: number; asset: string; source: MarketDataSource };

const HISTORICAL_TICKS: Tick[] = (() => {
  const base = Date.parse('2024-04-12T13:00:00Z');
  const prices = [
    68120.4, 68105.8, 68142.1, 68188.6, 68210.3, 68172.9, 68140.7, 68092.4, 68018.6, 67945.2,
    67990.5, 68060.9, 68112.2, 68178.3, 68240.8, 68295.1, 68345.6, 68410.2, 68458.9, 68405.3,
    68322.4, 68244.8, 68170.6, 68105.1, 68062.9, 68010.8, 67965.4, 67910.2, 67842.6, 67890.4,
    67960.5, 68025.7, 68092.3, 68144.8, 68195.4, 68232.6, 68288.1, 68320.3, 68378.6, 68440.9,
    68495.2, 68532.8, 68578.6, 68510.4, 68432.5, 68355.3, 68292.4, 68220.8, 68170.2, 68112.5,
    68062.4, 68005.9, 67944.2, 67890.8, 67822.1, 67760.5, 67710.6, 67655.2, 67602.4, 67544.8,
    67592.5, 67650.1, 67705.6, 67752.4, 67810.8, 67862.9, 67905.5, 67962.3, 68008.6, 68055.2,
    68112.4, 68170.5, 68218.6, 68270.4, 68305.2, 68362.8, 68412.6, 68458.2, 68512.4, 68560.8,
    68605.3, 68642.8, 68692.4, 68740.6, 68790.2, 68832.9, 68880.4, 68822.5, 68750.2, 68682.6,
    68610.4, 68555.2, 68492.6, 68435.2, 68378.6, 68320.2, 68262.8, 68210.4, 68152.9, 68098.4,
    68040.5, 67992.1, 67935.4, 67882.3, 67828.6, 67775.2, 67720.8, 67662.4, 67618.6, 67570.2,
    67522.8, 67470.4, 67415.8, 67362.4, 67308.2, 67262.9, 67210.6, 67162.4, 67118.2, 67072.6,
    67020.4, 66972.5, 66925.2, 66872.6, 66822.4, 66770.8, 66718.6, 66670.4, 66618.2, 66572.6,
    66522.5, 66475.2, 66422.8, 66378.6, 66325.2, 66270.8, 66222.6, 66170.4, 66122.8, 66072.4,
    66025.2, 65978.6, 65922.4, 65870.2, 65825.8, 65772.4, 65720.6, 65670.2, 65618.4, 65572.8
  ];
  return prices.map((price, index) => ({
    timestamp: base + index * 30_000,
    price,
    asset: 'BTC-USD',
    source: 'HISTORICAL'
  }));
})();

const historicalReplay = {
  speed: HISTORICAL_REPLAY_SPEED,
  active: MARKET_DATA_SOURCE === 'HISTORICAL',
  startedAt: Date.now(),
  cursor: 0,
  start() {
    this.startedAt = Date.now();
    this.cursor = 0;
    this.active = true;
  },
  stop() {
    this.active = false;
  },
  prime(timeframe: string) {
    if (!HISTORICAL_TICKS.length) return;
    const baseTs = HISTORICAL_TICKS[0].timestamp;
    const lastTs = HISTORICAL_TICKS[HISTORICAL_TICKS.length - 1].timestamp;
    const minutes = timeframeToMinutes[timeframe] ?? 60;
    const stepMs = minutes * 60_000;
    const desiredWindowMs = DEFAULT_CANDLE_COUNT * stepMs;
    const availableRangeMs = Math.max(0, lastTs - baseTs);
    const offsetMs = Math.min(desiredWindowMs, availableRangeMs);

    // Position the replay clock in the past so ticks() immediately surfaces a full window.
    const speed = Math.max(0.1, this.speed);
    this.startedAt = Date.now() - offsetMs / speed;
    this.cursor = 0;
    this.active = true;
  },
  ticks(): Tick[] {
    if (!this.active) return HISTORICAL_TICKS.slice(0, this.cursor);
    if (!HISTORICAL_TICKS.length) return [];

    const baseTs = HISTORICAL_TICKS[0].timestamp;
    const cutoff = baseTs + (Date.now() - this.startedAt) * Math.max(0.1, this.speed);
    while (this.cursor < HISTORICAL_TICKS.length && HISTORICAL_TICKS[this.cursor].timestamp <= cutoff) {
      this.cursor += 1;
    }
    if (this.cursor >= HISTORICAL_TICKS.length) {
      this.active = false;
    }
    return HISTORICAL_TICKS.slice(0, this.cursor);
  }
};

if (MARKET_DATA_SOURCE === 'HISTORICAL') {
  historicalReplay.start();
}

const deterministicPrice = (asset: string, index: number, timestamp: number) => {
  const base = basePrice(asset);
  const waveA = Math.sin(index * 0.7) * base * 0.0022;
  const waveB = Math.cos(index * 0.18 + timestamp * 0.000001) * base * 0.0011;
  return Math.max(0.0001, base + waveA + waveB);
};

const generateTicks = (asset: string, timeframe: string, count: number, anchor: number, source: MarketDataSource) => {
  const minutes = timeframeToMinutes[timeframe] ?? 60;
  const stepMs = minutes * 60_000;
  const tickStep = Math.max(1, Math.floor(stepMs / TICKS_PER_CANDLE));
  const ticks: Tick[] = [];

  for (let candleIndex = 0; candleIndex < count; candleIndex += 1) {
    const candleEnd = anchor - (count - candleIndex) * stepMs;
    const candleStart = candleEnd - stepMs;
    for (let j = 0; j < TICKS_PER_CANDLE; j += 1) {
      const ts = candleStart + j * tickStep;
      ticks.push({
        timestamp: ts,
        price: deterministicPrice(asset, candleIndex * TICKS_PER_CANDLE + j, ts),
        asset,
        source
      });
    }
    ticks.push({
      timestamp: candleEnd,
      price: deterministicPrice(asset, candleIndex * TICKS_PER_CANDLE + TICKS_PER_CANDLE, candleEnd),
      asset,
      source
    });
  }

  return ticks;
};

const sliceTicksForWindow = (ticks: Tick[], start: number, end: number) =>
  ticks.filter((tick) => tick.timestamp >= start && tick.timestamp <= end);

const buildCandlesFromTicks = (ticks: Tick[], timeframe: string): Candle[] => {
  if (!ticks.length) return [];
  const source = ticks[0].source;
  const assetSymbol = ticks[0].asset;
  const minutes = timeframeToMinutes[timeframe] ?? 60;
  const stepMs = minutes * 60_000;
  const baseTs = ticks[0].timestamp - (ticks[0].timestamp % stepMs);
  const lastTs = ticks[ticks.length - 1].timestamp;
  const candleCount = Math.min(DEFAULT_CANDLE_COUNT, Math.ceil((lastTs - baseTs) / stepMs) + 1);

  const candles: Candle[] = [];
  for (let i = 0; i < candleCount; i += 1) {
    const candleStart = baseTs + i * stepMs;
    const candleEnd = candleStart + stepMs;
    const windowTicks = sliceTicksForWindow(ticks, candleStart, candleEnd);

    if (windowTicks.length === 0) {
      const flatPrice = basePrice(assetSymbol);
      candles.push({
        timestamp: candleEnd,
        open: flatPrice,
        high: flatPrice,
        low: flatPrice,
        close: flatPrice,
        volume: 0,
        source,
        validForLearning: source !== 'MOCK' && source !== 'HISTORICAL'
      });
      continue;
    }

    const open = windowTicks[0].price;
    const close = windowTicks[windowTicks.length - 1].price;
    const prices = windowTicks.map((tick) => tick.price);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const volume = prices.reduce((acc, price) => acc + price * 0.01, 0);

    candles.push({
      timestamp: candleEnd,
      open,
      high,
      low,
      close,
      volume: Number(volume.toFixed(4)),
      source,
      validForLearning: source !== 'MOCK' && source !== 'HISTORICAL'
    });
  }

  return candles;
};

const buildCandles = (asset: string, timeframe: string, source: MarketDataSource): Candle[] => {
  if (source === 'HISTORICAL') {
    const ticks = historicalReplay.ticks();
    return buildCandlesFromTicks(ticks, timeframe);
  }

  const count = DEFAULT_CANDLE_COUNT;
  const minutes = timeframeToMinutes[timeframe] ?? 60;
  const stepMs = minutes * 60_000;
  const anchor = Date.now();
  const ticks = generateTicks(asset, timeframe, count, anchor, source);

  const candles: Candle[] = [];
  for (let i = 0; i < count; i += 1) {
    const candleEnd = anchor - (count - i) * stepMs;
    const candleStart = candleEnd - stepMs;
    const windowTicks = sliceTicksForWindow(ticks, candleStart, candleEnd);

    if (windowTicks.length === 0) {
      const flatPrice = basePrice(asset);
      candles.push({
        timestamp: candleEnd,
        open: flatPrice,
        high: flatPrice,
        low: flatPrice,
        close: flatPrice,
        volume: 0,
        source,
        validForLearning: source !== 'MOCK'
      });
      continue;
    }

    const open = windowTicks[0].price;
    const close = windowTicks[windowTicks.length - 1].price;
    const prices = windowTicks.map((tick) => tick.price);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const volume = prices.reduce((acc, price) => acc + price * 0.01, 0);

    candles.push({
      timestamp: candleEnd,
      open,
      high,
      low,
      close,
      volume: Number(volume.toFixed(4)),
      source,
      validForLearning: source !== 'MOCK'
    });
  }

  return candles;
};

const buildSeries = (asset: string, timeframe: string, candles?: Candle[]): PricePoint[] => {
  const sourceCandles = candles ?? buildCandles(asset, timeframe, MARKET_DATA_SOURCE);
  return sourceCandles.map((candle) => ({ timestamp: candle.timestamp, value: candle.close }));
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

const seedPulse = () => Array.from({ length: 30 }, (_, index) => noisePoint(50, index));

const newFeedEvent = (asset: string): LiveFeedEvent => ({
  id: `${asset}-${Date.now()}`,
  channel: asset,
  latency: Math.round(Math.random() * 10) + 5,
  payload: `${asset.split('-')[0]} ${Math.random() > 0.5 ? 'bid' : 'ask'} ping`
});

const initialCandles = buildCandles(ASSETS[0], TIMEFRAMES[0], MARKET_DATA_SOURCE);
let chartSnapshot: ChartSnapshot = {
  asset: ASSETS[0],
  timeframe: TIMEFRAMES[0],
  series: buildSeries(ASSETS[0], TIMEFRAMES[0], initialCandles),
  candles: initialCandles,
  overview: buildOverview(),
  miniCharts: buildMiniCharts(),
  pulse: seedPulse(),
  feed: Array.from({ length: 4 }, (_, index) => newFeedEvent(ASSETS[index % ASSETS.length])),
  marketDataSource: MARKET_DATA_SOURCE
};

const mutatePulse = (asset: string) => {
  const nextIndex = chartSnapshot.pulse.length;
  chartSnapshot = {
    ...chartSnapshot,
    pulse: [...chartSnapshot.pulse.slice(-24), noisePoint(chartSnapshot.pulse.at(-1) ?? 50, nextIndex)],
    feed: [newFeedEvent(asset), ...chartSnapshot.feed].slice(0, 6)
  };
};

type SnapshotOptions = {
  cache?: RequestCache;
};

export const chartsApi = {
  listAssets: () => ASSETS,
  listTimeframes: () => TIMEFRAMES,
  startHistoricalReplay: (speed?: number) => {
    if (MARKET_DATA_SOURCE !== 'HISTORICAL') return;
    if (speed && Number.isFinite(speed) && speed > 0) {
      historicalReplay.speed = speed;
    }
    historicalReplay.start();
  },
  stopHistoricalReplay: () => {
    if (MARKET_DATA_SOURCE !== 'HISTORICAL') return;
    historicalReplay.stop();
  },
  getSnapshot: async (asset: string, timeframe: string, _options?: SnapshotOptions): Promise<ChartSnapshot> => {
    if (MARKET_DATA_SOURCE === 'HISTORICAL') {
      historicalReplay.prime(timeframe);
    }
    const candles = buildCandles(asset, timeframe, MARKET_DATA_SOURCE);
    chartSnapshot = {
      asset,
      timeframe,
      series: buildSeries(asset, timeframe, candles),
      candles,
      overview: buildOverview(),
      miniCharts: buildMiniCharts(),
      pulse: chartSnapshot.pulse,
      feed: chartSnapshot.feed,
      marketDataSource: MARKET_DATA_SOURCE
    };
    return mockResponse(chartSnapshot);
  },
  streamPulse: async (asset: string): Promise<Pick<ChartSnapshot, 'pulse' | 'feed'>> => {
    if (MARKET_DATA_SOURCE === 'HISTORICAL') {
      const candles = buildCandles(asset, chartSnapshot.timeframe, MARKET_DATA_SOURCE);
      chartSnapshot = {
        ...chartSnapshot,
        candles,
        series: buildSeries(asset, chartSnapshot.timeframe, candles)
      };
    }
    mutatePulse(asset);
    const payload: any = { pulse: chartSnapshot.pulse, feed: chartSnapshot.feed };
    if (MARKET_DATA_SOURCE === 'HISTORICAL') {
      payload.candles = chartSnapshot.candles;
      payload.series = chartSnapshot.series;
    }
    return mockResponse(payload);
  }
};
