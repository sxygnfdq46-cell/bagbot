import { api } from '../api-client';

export type MarketPrice = {
  symbol: string;
  price: number;
  change?: number;
};

export const market = {
  getLivePrices: () => api.get<MarketPrice[]>('/api/market/prices')
};
