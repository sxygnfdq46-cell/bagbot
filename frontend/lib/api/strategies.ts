import { mockResponse } from '@/lib/api/mock-service';

export type Strategy = {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  stats?: {
    winRate?: number;
    pnl?: number;
    sharpe?: number;
  };
};

const MOCK_STRATEGIES: Strategy[] = [
  {
    id: 'alpha-swing',
    name: 'Alpha Swing',
    description: 'Captures medium-term structural dislocations.',
    enabled: true,
    stats: { winRate: 64.2, pnl: 128000, sharpe: 1.42 }
  },
  {
    id: 'pulse-scout',
    name: 'Pulse Scout',
    description: 'High-frequency scout engine that softens entries.',
    enabled: false,
    stats: { winRate: 58.8, pnl: 82000, sharpe: 1.18 }
  },
  {
    id: 'dawn-breaker',
    name: 'Dawn Breaker',
    description: 'Overnight drift strategy tuned for Asia opens.',
    enabled: true,
    stats: { winRate: 71.1, pnl: 164500, sharpe: 1.67 }
  }
];

export const strategies = {
  list: async () => mockResponse(MOCK_STRATEGIES),
  toggle: async (_payload: { id: string; enabled: boolean }) => mockResponse({ success: true })
};
