'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dashboardApi, type MarketPrice, type Position, type SystemStatus, type Trade } from '@/lib/api/dashboard';
import { wsClient } from '@/lib/ws-client';

export type PricePoint = { timestamp: number; value: number };

export type DashboardState = {
  loading: boolean;
  error?: string;
  prices: MarketPrice[];
  positions: Position[];
  trades: Trade[];
  status: SystemStatus | null;
};

const INITIAL_STATE: DashboardState = {
  loading: true,
  prices: [],
  positions: [],
  trades: [],
  status: null
};

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);
  const [chartPoints, setChartPoints] = useState<PricePoint[]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: undefined }));
    try {
      const snapshot = await dashboardApi.getSnapshot();
      if (!mounted.current) return;
      setState({
        loading: false,
        prices: snapshot.prices,
        positions: snapshot.positions,
        trades: snapshot.trades,
        status: snapshot.status,
        error: undefined
      });
    } catch (error) {
      if (!mounted.current) return;
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const unsubPrices = wsClient.subscribe('prices', (data) => {
      if (!mounted.current || !Array.isArray(data)) return;
      setState((prev) => ({ ...prev, prices: data as MarketPrice[] }));
    });
    const unsubPositions = wsClient.subscribe('positions', (data) => {
      if (!mounted.current || !Array.isArray(data)) return;
      setState((prev) => ({ ...prev, positions: data as Position[] }));
    });
    const unsubTrades = wsClient.subscribe('trades', (data) => {
      if (!mounted.current || !Array.isArray(data)) return;
      setState((prev) => ({ ...prev, trades: data as Trade[] }));
    });
    const unsubStatus = wsClient.subscribe('status', (data) => {
      if (!mounted.current || !data || typeof data !== 'object') return;
      setState((prev) => ({ ...prev, status: data as SystemStatus }));
    });

    return () => {
      unsubPrices();
      unsubPositions();
      unsubTrades();
      unsubStatus();
    };
  }, []);

  const portfolioValue = useMemo(
    () => state.positions.reduce((acc, position) => acc + position.currentPrice * position.size, 0),
    [state.positions]
  );
  const totalPnl = useMemo(() => state.positions.reduce((acc, position) => acc + position.pnl, 0), [state.positions]);

  useEffect(() => {
    setChartPoints((prev) => {
      const latestValue = state.positions.length ? portfolioValue : state.prices[0]?.price;
      if (latestValue === undefined) return prev;
      const nextPoint: PricePoint = { timestamp: Date.now(), value: latestValue };
      const last = prev.at(-1);
      const tolerance = Math.max(latestValue * 0.001, 1);
      if (last && Math.abs(last.value - nextPoint.value) < tolerance) {
        return prev;
      }
      return [...prev, nextPoint].slice(-40);
    });
  }, [state.positions, state.prices, portfolioValue]);

  return {
    ...state,
    portfolioValue,
    totalPnl,
    chartPoints,
    reload: load
  };
}
