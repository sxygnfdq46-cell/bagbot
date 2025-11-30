/**
 * Service Index - Unified Export
 * Central access point for all backend services
 */

export { default as systemService } from './system';
export { default as marketService } from './market';
export { default as dashboardService } from './dashboard';
export { default as strategiesService } from './strategies';
export { default as signalsService } from './signals';
export { default as logsService } from './logs';
export { default as terminalService } from './terminal';
export { default as backtestService } from './backtest';
export { default as aiService } from './ai';
export { default as settingsService } from './settings';

// Re-export types for convenience
export type {
  SystemHealth,
  SystemSummary,
  WorkerHealth,
} from './system';

export type {
  Ticker,
  Candle,
  Orderbook,
  OrderbookLevel,
  MarketDepth,
} from './market';

export type {
  RecentTrade,
  StrategyStatus,
  DashboardMetrics,
  PositionSummary,
} from './dashboard';

export type {
  Strategy,
  StrategyConfig,
  StrategyPerformance,
  StrategyTrade,
} from './strategies';

export type {
  Signal,
  SignalHistory,
  SignalStats,
  SignalFilter,
} from './signals';

export type {
  LogEntry,
  LogFilter,
  LogStats,
} from './logs';

export type {
  Command,
  CommandHistory,
  CommandOutput,
  SafeCommand,
} from './terminal';

export type {
  BacktestConfig,
  BacktestResult,
  BacktestMetrics,
  BacktestTrade,
} from './backtest';

export type {
  ChatMessage,
  ChatSession,
  AIQuery,
  AIResponse,
  AICapabilities,
} from './ai';

export type {
  UserSettings,
  NotificationPreferences,
  APIKeyInfo,
} from './settings';
