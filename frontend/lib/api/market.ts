import { dashboardApi, type MarketPrice } from '@/lib/api/dashboard';

export { MarketPrice };

export const market = {
  getLivePrices: () => dashboardApi.getLivePrices()
};
