# Backend Wiring Phase 3: Live Integration Progress

## Status: IN PROGRESS

### Completed Pages

#### 1. **Home Page** (`/app/page.tsx`) ✅
**Services Integrated:**
- `/api/system/summary` - Real-time system metrics (via useAPI)
- `/api/market/tickers` - Live ticker data (via useAPIPoll, 5s refresh)

**Features Wired:**
- **Stats Grid (4 HUDWidgets):**
  - System Status: Live status with ONLINE/OFFLINE detection
  - Active Strategies: Real strategy count from backend
  - 24H Profit: Real daily PnL with trend indicators
  - Win Rate: Calculated from system data with color coding

**UI Enhancements:**
- Loading states for all widgets ("LOADING...", "..." placeholders)
- Error notification panel when backend unavailable
- Dynamic color coding (green for profit, red for loss, cyan for neutral)
- Trend indicators based on real data
- Currency and percentage formatting helpers

**Safe Mode Compliance:** ✅ Read-only endpoints only

---

#### 2. **Dashboard Page** (`/app/dashboard/page.tsx`) ✅
**Services Integrated:**
- `/api/dashboard/metrics` - Full dashboard metrics (via useAPI)
- `/api/trading/recent?limit=10` - Recent trades (via useAPIPoll, 3s refresh)
- `/api/strategies/status` - Strategy statuses (via useAPI)
- `/api/trading/positions` - Open positions (via useAPI)
- WebSocket `prices` channel - Real-time BTC price feed

**Features Wired:**
- **Stats Grid (4 HUDWidgets):**
  - Portfolio Value: Total equity with trend
  - 24H P&L: Daily profit/loss with percentage change
  - Active Positions: Live position count
  - Win Rate: Strategy win rate with color coding

- **Recent Trades Table:**
  - Real-time trade history (last 10)
  - Dynamically colored BUY/SELL indicators
  - Formatted timestamps and prices
  - Loading and empty states

- **System Health Panel:**
  - Strategy status bars (running/paused/stopped)
  - Performance percentage indicators
  - Animated progress bars with glow effects
  - Fallback to generic health when no strategies

**UI Enhancements:**
- Loading states for all sections
- Error notification panel for backend failures
- WebSocket connection monitoring
- Auto-refresh for trades (3s) and positions
- Currency, percentage, and time formatting

**Safe Mode Compliance:** ✅ Read-only endpoints + safe WebSocket subscriptions

---

### Next Steps

#### 2. **Dashboard Page** (`/app/dashboard/page.tsx`)
**Services to Integrate:**
- `dashboardService.getDashboardMetrics()` - Full metrics overview
- `dashboardService.getRecentTrades()` - Recent trade history
- `dashboardService.getStrategyStatuses()` - Strategy performance grid
- `dashboardService.getOpenPositions()` - Current positions table
- `dashboardService.getPnLHistory()` - PnL chart data
- `marketService.getTickers()` - Live price feeds via WebSocket

**Components to Wire:**
- Performance metrics cards (volume, trades, PnL, win rate)
- Recent trades table with real data
- Strategy status cards with start/stop buttons
- Open positions table with current P&L
- PnL history chart with real data points

#### 3. **Systems Page** (`/app/systems/page.tsx`)
**Services to Integrate:**
- `systemService.getSystemHealth()` - Health checks
- `systemService.getWorkerHealth()` - Worker status
- `systemService.getMetrics()` - System metrics
- `systemService.getServiceUptime()` - Uptime tracking

#### 4. **Strategies Page** (`/app/strategies/page.tsx`)
**Services to Integrate:**
- `strategiesService.getStrategies()` - Strategy list
- `strategiesService.getStrategyPerformance()` - Performance metrics
- `strategiesService.getTrades()` - Trade history per strategy
- `strategiesService.startStrategy()` - Safe start action
- `strategiesService.stopStrategy()` - Safe stop action
- `strategiesService.pauseStrategy()` - Safe pause action

#### 5. **Signals Page** (`/app/signals/page.tsx`)
**Services to Integrate:**
- `signalsService.getRecentSignals()` - Latest signals
- `signalsService.getSignalHistory()` - Historical signals with filters
- `signalsService.getSignalStats()` - Signal performance stats
- WebSocket subscription for real-time signal stream

#### 6. **Charts Page** (`/app/charts/page.tsx`)
**Services to Integrate:**
- `marketService.getCandles()` - OHLCV data for candlestick charts
- `marketService.getOrderbook()` - Order book depth
- `marketService.getMarketDepth()` - Market depth visualization
- WebSocket for real-time price updates

#### 7. **AI Chat Page** (`/app/ai/page.tsx`)
**Services to Integrate:**
- `aiService.queryAI()` - Send queries
- `aiService.getChatHistory()` - Load history
- `aiService.createSession()` - Session management
- `aiService.streamAIResponse()` - Streaming responses
- `aiService.uploadFile()` - File uploads for analysis

#### 8. **Logs Page** (`/app/logs/page.tsx`)
**Services to Integrate:**
- `logsService.getRecentLogs()` - Latest log entries
- `logsService.getLogs()` - Paginated logs with filters
- `logsService.getErrorLogs()` - Error-only view
- `logsService.tailLogs()` - Real-time log streaming via generator
- WebSocket for live log tail

#### 9. **Settings Page** (`/app/settings/page.tsx`)
**Services to Integrate:**
- `settingsService.getUserSettings()` - All preferences
- `settingsService.updateSettings()` - Save changes
- `settingsService.getAPIKeyInfo()` - Masked API keys
- `settingsService.updateAPIKeys()` - Update API keys
- `settingsService.verifyAPIKeys()` - Validate keys
- `settingsService.exportSettings()` - Export config
- `settingsService.importSettings()` - Import config

#### 10. **Backtest Page** (`/app/backtest/page.tsx`)
**Services to Integrate:**
- `backtestService.getBacktestConfigs()` - Available configs
- `backtestService.createConfig()` - New backtest config
- `backtestService.runBacktest()` - Execute backtest
- `backtestService.getResults()` - View results
- `backtestService.compareBacktests()` - Compare multiple runs
- `backtestService.exportBacktest()` - Export results

#### 11. **Terminal Page** (`/app/terminal/page.tsx`)
**Services to Integrate:**
- `terminalService.getSafeCommands()` - List safe commands
- `terminalService.executeCommand()` - Run command
- `terminalService.getCommandStatus()` - Check status
- `terminalService.streamCommandOutput()` - Live output stream
- `terminalService.validateCommand()` - Pre-execution validation
- WebSocket for real-time output streaming

---

## Integration Checklist

### For Each Page:
- [ ] Import `useAPI` hook from `@/lib/hooks/useAPI`
- [ ] Import relevant service from `@/services`
- [ ] Add data fetching with `useAPI()` calls
- [ ] Extract data with fallback values
- [ ] Replace static content with real data
- [ ] Add loading states (skeletons, spinners, placeholders)
- [ ] Add error handling (error banners, fallback UI)
- [ ] Add WebSocket connections where applicable
- [ ] Format data for display (currency, dates, percentages)
- [ ] Test compilation (no TypeScript errors)

### Safe Mode Requirements:
- ✅ Only use read-only endpoints
- ✅ Only use approved safe endpoints (start/stop/pause strategies, safe terminal commands)
- ✅ No direct trading execution
- ✅ No worker queue modifications
- ✅ No optimizer changes
- ✅ No AI model modifications

---

## Progress Metrics

**Completed:** 6/11 pages (55%)
- ✅ Home (system summary + tickers)
- ✅ Dashboard (full metrics + trades + strategies + positions + WebSocket)
- ✅ Systems (health + workers + metrics)
- ✅ Strategies (list + start/stop/pause actions)
- ✅ Signals (recent + history + WebSocket stream)
- ✅ Settings (user settings + save functionality)

**Remaining:** 5 pages
- Charts (candles + orderbook + WebSocket prices)
- Chat (AI queries + streaming)
- Logs (recent + tail stream + WebSocket)
- Backtest (configs + run + results)
- Terminal (commands + execution + WebSocket output)

**Total Estimated:** ~45 min remaining for full integration

---

## Integration Summary

### API Endpoints Used:
- `/api/system/summary` - System overview
- `/api/system/health` - Health checks
- `/api/system/workers` - Worker status
- `/api/system/metrics` - Performance metrics
- `/api/dashboard/metrics` - Dashboard overview
- `/api/trading/recent` - Recent trades
- `/api/strategies/status` - Strategy statuses
- `/api/trading/positions` - Open positions
- `/api/strategies` - Strategy list
- `/api/strategies/start` - Start strategy (POST)
- `/api/strategies/stop` - Stop strategy (POST)
- `/api/strategies/pause` - Pause strategy (POST)
- `/api/signals/recent` - Recent signals
- `/api/settings/user` - User settings (GET/PATCH)
- `/api/market/tickers` - Live ticker data

### WebSocket Channels Used:
- `prices` - Real-time price updates (BTCUSDT)
- `signals` - Real-time signal stream

### Features Implemented:
- ✅ Loading states for all data fetches
- ✅ Error handling with fallback UI
- ✅ Auto-refresh/polling for time-sensitive data
- ✅ WebSocket connections for real-time streams
- ✅ Currency, percentage, and time formatting
- ✅ Safe strategy actions (start/stop/pause)
- ✅ Dynamic color coding based on data
- ✅ Trend indicators and progress bars
- ✅ Type-safe API calls throughout

---

## Next Action
**COPILOT DO:** Wire remaining 5 pages (Charts, Chat, Logs, Backtest, Terminal)
