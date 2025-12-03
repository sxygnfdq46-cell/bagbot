import { mockResponse, nowIso } from '@/lib/api/mock-service';

export type MarketPrice = {
  symbol: string;
  price: number;
  change: number;
};

export type Position = {
  id: string;
  symbol: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  status?: string;
};

export type Trade = {
  id: string;
  symbol: string;
  size: number;
  pnl: number;
  timestamp: string;
};

export type SystemStatus = {
  uptime?: string;
  latencyMs?: number;
  mode?: string;
};

export type DashboardSnapshot = {
  prices: MarketPrice[];
  positions: Position[];
  trades: Trade[];
  status: SystemStatus;
};

let marketSnapshot: MarketPrice[] = [
  { symbol: 'BTC-USD', price: 47250.45, change: 1.2 },
  { symbol: 'ETH-USD', price: 3050.11, change: -0.4 },
  { symbol: 'SOL-USD', price: 144.08, change: 2.1 },
  { symbol: 'DOGE-USD', price: 0.21, change: 4.5 }
];

let positionsSnapshot: Position[] = [
  { id: 'btc-alpha', symbol: 'BTC-USD', size: 0.65, entryPrice: 45100, currentPrice: 47250, pnl: 13975 },
  { id: 'eth-scout', symbol: 'ETH-USD', size: 12, entryPrice: 2905, currentPrice: 3050, pnl: 1740 },
  { id: 'sol-drift', symbol: 'SOL-USD', size: 180, entryPrice: 136, currentPrice: 144, pnl: 1440 }
];

let tradesSnapshot: Trade[] = [
  { id: 'trade-1', symbol: 'BTC-USD', size: 0.25, pnl: 2100, timestamp: nowIso(12) },
  { id: 'trade-2', symbol: 'ETH-USD', size: 4, pnl: -320, timestamp: nowIso(55) },
  { id: 'trade-3', symbol: 'SOL-USD', size: 120, pnl: 980, timestamp: nowIso(90) }
];

let statusSnapshot: SystemStatus = {
  uptime: '62h 14m',
  latencyMs: 42,
  mode: 'Autonomy'
};

let uptimeMinutes = 62 * 60 + 14;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const driftValue = (value: number, delta: number, min: number, max: number) =>
  clamp(value + (Math.random() - 0.5) * delta, min, max);

const mutatePrices = () => {
  marketSnapshot = marketSnapshot.map((asset) => {
    const previous = asset.price;
    const nextPrice = clamp(previous + (Math.random() - 0.5) * previous * 0.004, previous * 0.96, previous * 1.04);
    return {
      ...asset,
      price: Number(nextPrice.toFixed(2)),
      change: Number((((nextPrice - previous) / previous) * 100).toFixed(2))
    };
  });
};

const mutatePositions = () => {
  positionsSnapshot = positionsSnapshot.map((position) => {
    const relatedPrice = marketSnapshot.find((asset) => asset.symbol === position.symbol)?.price ?? position.currentPrice;
    const drifted = driftValue(relatedPrice, relatedPrice * 0.002, relatedPrice * 0.95, relatedPrice * 1.05);
    const pnl = (drifted - position.entryPrice) * position.size;
    return {
      ...position,
      currentPrice: Number(drifted.toFixed(2)),
      pnl: Number(pnl.toFixed(2)),
      status: pnl >= 0 ? 'Gain' : 'Drawdown'
    };
  });
};

const mutateTrades = () => {
  if (Math.random() > 0.65) {
    const symbol = marketSnapshot[Math.floor(Math.random() * marketSnapshot.length)];
    const pnl = Number(((Math.random() - 0.4) * 2500).toFixed(2));
    tradesSnapshot = [
      {
        id: `trade-${Date.now()}`,
        symbol: symbol.symbol,
        size: Number((Math.random() * 3 + 0.1).toFixed(2)),
        pnl,
        timestamp: nowIso(Math.floor(Math.random() * 15))
      },
      ...tradesSnapshot
    ].slice(0, 8);
  }
};

const mutateStatus = () => {
  uptimeMinutes += Math.max(1, Math.floor(Math.random() * 3));
  const hours = Math.floor(uptimeMinutes / 60);
  const minutes = uptimeMinutes % 60;
  statusSnapshot = {
    uptime: `${hours}h ${minutes}m`,
    latencyMs: Math.round(driftValue(statusSnapshot.latencyMs ?? 40, 6, 22, 90)),
    mode: Math.random() > 0.9 ? 'Review' : 'Autonomy'
  };
};

const mutateSnapshot = () => {
  mutatePrices();
  mutatePositions();
  mutateTrades();
  mutateStatus();
};

const buildSnapshot = (): DashboardSnapshot => ({
  prices: marketSnapshot,
  positions: positionsSnapshot,
  trades: tradesSnapshot,
  status: statusSnapshot
});

export const dashboardApi = {
  getSnapshot: async (): Promise<DashboardSnapshot> => {
    mutateSnapshot();
    return mockResponse(buildSnapshot());
  },
  getLivePrices: async (): Promise<MarketPrice[]> => mockResponse(marketSnapshot),
  getPositions: async (): Promise<Position[]> => mockResponse(positionsSnapshot),
  getRecentTrades: async (): Promise<Trade[]> => mockResponse(tradesSnapshot),
  getSystemStatus: async (): Promise<SystemStatus> => mockResponse(statusSnapshot)
};
