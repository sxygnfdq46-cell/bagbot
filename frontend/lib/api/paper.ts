import { api, ApiError } from '@/lib/api-client';
import { mockResponse, nowIso } from '@/lib/api/mock-service';

export type PaperPosition = {
  id: string;
  symbol: string;
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  status?: string;
};

export type PaperRejection = {
  id: string;
  reason: string;
  timestamp: string;
};

export type PaperTrade = {
  id: string;
  symbol: string;
  side: string;
  size: number;
  price: number;
  pnl?: number;
  timestamp: string;
};

export type PaperSummary = {
  equity: number;
  cash: number;
  realizedPnl: number;
  unrealizedPnl: number;
  positions: PaperPosition[];
  rejections: PaperRejection[];
  trades: PaperTrade[];
  source: 'backend' | 'mock';
  notice?: string;
};

const mockPositions: PaperPosition[] = [
  { id: 'btc-alpha', symbol: 'BTC-USD', size: 0.4, entryPrice: 45200, markPrice: 47100, pnl: 760, status: 'open' },
  { id: 'eth-scout', symbol: 'ETH-USD', size: 8, entryPrice: 2910, markPrice: 3040, pnl: 1040, status: 'open' }
];

const mockRejections: PaperRejection[] = [
  { id: 'rej-1', reason: 'Insufficient inventory for sell', timestamp: nowIso(5) },
  { id: 'rej-2', reason: 'Order type not supported in paper mode', timestamp: nowIso(18) }
];

const mockTrades: PaperTrade[] = [
  { id: 'trade-1', symbol: 'BTC-USD', side: 'buy', size: 0.2, price: 45000, pnl: 420, timestamp: nowIso(45) },
  { id: 'trade-2', symbol: 'ETH-USD', side: 'sell', size: 3, price: 3030, pnl: 210, timestamp: nowIso(120) }
];

const buildMockSummary = async (): Promise<PaperSummary> =>
  mockResponse({
    equity: 125000,
    cash: 42000,
    realizedPnl: 1840,
    unrealizedPnl: mockPositions.reduce((acc, pos) => acc + pos.pnl, 0),
    positions: mockPositions,
    rejections: mockRejections,
    trades: mockTrades,
    source: 'mock'
  });

export const paperApi = {
  getSummary: async (): Promise<PaperSummary> => {
    try {
      const backend = await api.get<Partial<PaperSummary>>('/api/paper/summary');
      return {
        equity: backend.equity ?? 0,
        cash: backend.cash ?? 0,
        realizedPnl: backend.realizedPnl ?? 0,
        unrealizedPnl: backend.unrealizedPnl ?? 0,
        positions: backend.positions ?? [],
        rejections: backend.rejections ?? [],
        trades: backend.trades ?? [],
        source: 'backend'
      };
    } catch (error) {
      const detail = error instanceof ApiError ? error.message : 'Paper summary unavailable';
      const fallback = await buildMockSummary();
      return { ...fallback, notice: detail };
    }
  }
};
