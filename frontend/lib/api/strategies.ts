import { api } from '../api-client';

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

export const strategies = {
  list: () => api.get<Strategy[]>('/api/strategies/list'),
  toggle: (payload: { id: string; enabled: boolean }) =>
    api.post<{ success: boolean }>('/api/strategies/toggle', {
      body: payload
    })
};
