import { dashboardApi, type Position, type SystemStatus, type Trade } from '@/lib/api/dashboard';

export { Position, Trade, SystemStatus };

export const trading = {
  getPositions: () => dashboardApi.getPositions(),
  getRecentTrades: () => dashboardApi.getRecentTrades(),
  getSystemStatus: () => dashboardApi.getSystemStatus()
};
