/**
 * Market Service - Price Feeds & Market Data
 * SAFE: Read-only market data, no trading execution
 */

import { api } from '@/lib/api';

export interface Ticker {
  symbol: string;
  price: number;
  change_24h: number;
  change_percent_24h: number;
  volume_24h: number;
  high_24h: number;
  low_24h: number;
  timestamp: number;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderbookLevel {
  price: number;
  quantity: number;
  total: number;
}

export interface Orderbook {
  symbol: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  timestamp: number;
}

export interface MarketDepth {
  symbol: string;
  bid_depth: number;
  ask_depth: number;
  spread: number;
  mid_price: number;
}

/**
 * Get live ticker for all symbols
 */
export async function getTickers(): Promise<Ticker[]> {
  return api.get('/api/market/tickers');
}

/**
 * Get ticker for specific symbol
 */
export async function getTicker(symbol: string): Promise<Ticker> {
  return api.get(`/api/market/ticker/${symbol}`);
}

/**
 * Get candle data for charting
 */
export async function getCandles(
  symbol: string,
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h',
  limit: number = 100
): Promise<Candle[]> {
  return api.get(`/api/market/candles/${symbol}?interval=${interval}&limit=${limit}`);
}

/**
 * Get orderbook snapshot
 */
export async function getOrderbook(
  symbol: string,
  depth: number = 20
): Promise<Orderbook> {
  return api.get(`/api/market/orderbook/${symbol}?depth=${depth}`);
}

/**
 * Get market depth analysis
 */
export async function getMarketDepth(symbol: string): Promise<MarketDepth> {
  return api.get(`/api/market/depth/${symbol}`);
}

/**
 * Get available trading symbols
 */
export async function getSymbols(): Promise<string[]> {
  return api.get('/api/market/symbols');
}

export const marketService = {
  getTickers,
  getTicker,
  getCandles,
  getOrderbook,
  getMarketDepth,
  getSymbols,
};

export default marketService;
