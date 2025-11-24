# TASK 4.0 — FRONTEND RE-WIRING PLAN

**Project:** BAGBOT Trading Bot  
**Phase:** Phase 2 — Frontend Rewiring & UI Command Layer  
**Status:** PLANNING — AWAITING APPROVAL  
**Date:** 23 November 2025  
**Branch:** TBD (recommend: `feature/frontend-rewire`)

---

## 📋 EXECUTIVE SUMMARY

This document defines the complete architecture for rewiring the BAGBOT frontend to integrate with the newly completed Brain Core (Tasks 3.1–3.10). The brain backend is **100% stable and tested** with 119 passing tests. No backend modifications will be made unless explicitly required for API routing.

**Goal:** Create a clean, modular frontend command layer that routes all UI actions to the deterministic brain architecture while maintaining beautiful UX.

---

## 🎯 SCOPE & CONSTRAINTS

### ✅ What We Have (Stable — DO NOT MODIFY)
- ✅ `TradingBrain.process()` — central brain processor
- ✅ `ReplayEngine.run()` — historical replay system
- ✅ `BacktestExecutor` — backtest execution engine
- ✅ `GeneticOptimizer` — dual-objective optimizer
- ✅ Strategy registry (`ai_fusion`, `example`)
- ✅ Indicators engine (SMA, EMA, RSI, MACD, ATR, Bollinger)
- ✅ Structured logging with routing events
- ✅ Artifacts system (genomes + reports in timestamped folders)
- ✅ API contracts defined in `docs/api_contracts.json`
- ✅ 119 tests validating all brain functionality

### 🎨 What We're Building (Frontend Layer)
- 🔧 Button-to-brain routing table
- 🔧 Updated API endpoints for UI commands
- 🔧 Clean component-level command architecture
- 🔧 Real-time status monitoring
- 🔧 Logs viewer connected to structured logs
- 🔧 Genome/report artifact viewer
- 🔧 Strategy selection & configuration
- 🔧 Backtest runner with result display
- 🔧 Optimizer launcher with progress tracking

---

## 🏗️ FRONTEND ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js/React)                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │   Dashboard    │  │   Backtest     │  │   Optimizer    ││
│  │   - Status     │  │   - Runner     │  │   - Launcher   ││
│  │   - Controls   │  │   - Results    │  │   - Progress   ││
│  │   - Metrics    │  │   - Replay     │  │   - Artifacts  ││
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘│
│           │                   │                    │         │
│           └───────────────────┼────────────────────┘         │
│                               ▼                              │
│                   ┌─────────────────────┐                    │
│                   │   Command Router    │                    │
│                   │   (apiService.ts)   │                    │
│                   └──────────┬──────────┘                    │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │ HTTP/REST
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              API Routes (backend/main.py)              │ │
│  │  - /api/health                                        │ │
│  │  - /api/worker/start|stop|status                      │ │
│  │  - /jobs (POST) ← NEW ENDPOINT                        │ │
│  │  - /api/backtest/run ← NEW                            │ │
│  │  - /api/optimizer/run ← NEW                           │ │
│  │  - /api/artifacts/list ← NEW                          │ │
│  │  - /api/logs/stream ← NEW                             │ │
│  │  - /api/strategies/list ← NEW                         │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Job Queue Bridge (queue_bridge.py)          │ │
│  │           - submit_job(job_type, payload)             │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │ Queue
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  BRAIN CORE (Worker)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────┐            │
│  │     TradingBrain.process(job_type, payload)│            │
│  └─────────────────────┬───────────────────────┘            │
│                        │                                     │
│         ┌──────────────┼──────────────┐                     │
│         ▼              ▼              ▼                     │
│  ┌───────────┐  ┌────────────┐  ┌──────────────┐           │
│  │  Replay   │  │  Backtest  │  │  Optimizer   │           │
│  │  Engine   │  │  Executor  │  │  (Genetic)   │           │
│  └───────────┘  └────────────┘  └──────────────┘           │
│         │              │              │                     │
│         └──────────────┼──────────────┘                     │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────┐            │
│  │         Strategy Registry                   │            │
│  │         - ai_fusion                         │            │
│  │         - example                           │            │
│  └─────────────────────────────────────────────┘            │
│                        │                                     │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────┐            │
│  │         Artifacts System                    │            │
│  │         - artifacts/genomes/                │            │
│  │         - artifacts/reports/                │            │
│  └─────────────────────────────────────────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📍 BUTTON-TO-BRAIN ROUTING TABLE

### 1. Dashboard Controls

| UI Element | User Action | Frontend Handler | API Endpoint | Backend Job Type | Brain Method |
|------------|-------------|------------------|--------------|------------------|--------------|
| **Start Bot** button | Click | `handleBotToggle()` | `POST /api/worker/start` | N/A | Worker loop starts |
| **Stop Bot** button | Click | `handleBotToggle()` | `POST /api/worker/stop` | N/A | Worker loop stops |
| **Refresh Status** | Click | `handleManualRefresh()` | `GET /api/worker/status` | N/A | Status query |
| **View Logs** link | Click | Navigate to `/logs` | `GET /api/logs` | N/A | Read logs |

### 2. Backtest Runner

| UI Element | User Action | Frontend Handler | API Endpoint | Backend Job Type | Brain Method |
|------------|-------------|------------------|--------------|------------------|--------------|
| **Run Backtest** button | Click + params | `runBacktest()` | `POST /api/backtest/run` | `BACKTEST` | `brain.process("BACKTEST", {...})` |
| **Load Data** button | Click | `loadBacktestData()` | Internal | N/A | Load CSV via `backtest/loader.py` |
| **View Results** button | Click | `fetchBacktestResults()` | `GET /api/backtest/results/{id}` | N/A | Return stored results |
| **Download Report** | Click | `downloadReport()` | `GET /api/artifacts/reports/{file}` | N/A | Serve file |

### 3. Optimizer Control

| UI Element | User Action | Frontend Handler | API Endpoint | Backend Job Type | Brain Method |
|------------|-------------|------------------|--------------|------------------|--------------|
| **Start Optimization** | Click + params | `runOptimizer()` | `POST /api/optimizer/run` | `OPTIMIZE` | `genetic_optimizer.run_ga()` |
| **View Best Genome** | Click | `fetchBestGenome()` | `GET /api/artifacts/genomes/best` | N/A | Read best genome JSON |
| **Load Genome** | Select + click | `applyGenome()` | `POST /api/strategy/config` | N/A | Update strategy config |
| **View History** | Click | `fetchOptHistory()` | `GET /api/optimizer/history` | N/A | List artifact genomes |

### 4. Strategy Selection

| UI Element | User Action | Frontend Handler | API Endpoint | Backend Job Type | Brain Method |
|------------|-------------|------------------|--------------|------------------|--------------|
| **Strategy dropdown** | Select | `setSelectedStrategy()` | `GET /api/strategies/list` | N/A | Return `STRATEGY_REGISTRY` keys |
| **Apply Strategy** | Click | `applyStrategy()` | `POST /api/strategy/activate` | N/A | Update brain active strategy |
| **Configure Params** | Edit + save | `updateStrategyParams()` | `PUT /api/strategy/config` | N/A | Update strategy params |

### 5. Replay Control

| UI Element | User Action | Frontend Handler | API Endpoint | Backend Job Type | Brain Method |
|------------|-------------|------------------|--------------|------------------|--------------|
| **Load Replay** | Click + range | `startReplay()` | `POST /api/replay/start` | `REPLAY` | `ReplayEngine.run_from_to()` |
| **Pause/Resume** | Click | `toggleReplay()` | `POST /api/replay/pause` | N/A | Pause/resume logic |
| **Speed Control** | Slider | `setReplaySpeed()` | Internal | N/A | Frontend-only animation |

### 6. Logs Viewer

| UI Element | User Action | Frontend Handler | API Endpoint | Backend Job Type | Brain Method |
|------------|-------------|------------------|--------------|------------------|--------------|
| **Filter logs** | Type/select | `filterLogs()` | `GET /api/logs?level={level}` | N/A | Read filtered logs |
| **Live updates** | Auto-poll | `pollLogs()` | `GET /api/logs?since={timestamp}` | N/A | Stream recent logs |
| **Download logs** | Click | `downloadLogs()` | `GET /api/logs/download` | N/A | Serve log file |

---

## 🔌 NEW API ENDPOINTS REQUIRED

### Already Implemented ✅
- `GET /` — health check
- `GET /api/health` — API health
- `GET /api/worker/status` — worker status
- `POST /api/worker/start` — start worker
- `POST /api/worker/stop` — stop worker
- `POST /jobs` — generic job submission

### To Be Implemented 🔧

#### 1. Backtest API
```typescript
POST /api/backtest/run
Request Body:
{
  "data_file": "tests/data/BTCSTUSDT-1h-merged.csv",
  "genome_file": "artifacts/genomes/best_genome_dual.json", // optional
  "initial_balance": 10000.0,
  "fee_rate": 0.001
}
Response:
{
  "job_id": "backtest_abc123",
  "status": "queued"
}

GET /api/backtest/results/{job_id}
Response:
{
  "job_id": "backtest_abc123",
  "status": "completed",
  "results": {
    "final_balance": 12345.67,
    "total_return": 0.2345,
    "sharpe_ratio": 1.85,
    "max_drawdown": 0.12,
    "num_trades": 45,
    "win_rate": 0.68,
    "equity_curve": [...],
    "trades": [...]
  }
}
```

#### 2. Optimizer API
```typescript
POST /api/optimizer/run
Request Body:
{
  "data_file": "tests/data/BTCSTUSDT-1h-merged.csv",
  "objective": "sharpe",  // or "total_return" or "dual"
  "population": 24,
  "generations": 30,
  "seed": 42
}
Response:
{
  "job_id": "opt_xyz789",
  "status": "queued"
}

GET /api/optimizer/status/{job_id}
Response:
{
  "job_id": "opt_xyz789",
  "status": "running",
  "progress": {
    "current_generation": 15,
    "total_generations": 30,
    "best_fitness": 1.85
  }
}

GET /api/optimizer/results/{job_id}
Response:
{
  "job_id": "opt_xyz789",
  "status": "completed",
  "best_genome": {...},
  "best_fitness": 1.85,
  "artifact_path": "artifacts/genomes/best_genome_dual_20251123_172808.json"
}
```

#### 3. Artifacts API
```typescript
GET /api/artifacts/genomes
Response:
{
  "genomes": [
    {
      "filename": "best_genome_dual_20251123_172808.json",
      "timestamp": "2025-11-23T17:28:08Z",
      "fitness": 1.85,
      "objective": "dual"
    }
  ]
}

GET /api/artifacts/reports
Response:
{
  "reports": [
    {
      "filename": "backtest_report_dual_20251123_172808.txt",
      "timestamp": "2025-11-23T17:28:08Z",
      "metrics": {
        "sharpe": 1.85,
        "return": 0.23
      }
    }
  ]
}

GET /api/artifacts/genomes/{filename}
Response: JSON file content

GET /api/artifacts/reports/{filename}
Response: Text file content
```

#### 4. Strategy API
```typescript
GET /api/strategies/list
Response:
{
  "strategies": ["ai_fusion", "example"]
}

GET /api/strategy/config
Response:
{
  "active_strategy": "ai_fusion",
  "parameters": {
    "sma_short": 10,
    "sma_long": 30,
    "rsi_period": 14,
    ...
  }
}

PUT /api/strategy/config
Request Body:
{
  "strategy": "ai_fusion",
  "parameters": {
    "sma_short": 12,
    "sma_long": 26
  }
}
Response:
{
  "status": "updated",
  "message": "Strategy configuration updated"
}
```

#### 5. Logs API
```typescript
GET /api/logs?limit=100&level=INFO&since=2025-11-23T17:00:00Z
Response:
{
  "logs": [
    {
      "timestamp": "2025-11-23T17:28:08Z",
      "level": "INFO",
      "message": "Brain routing event: {'evt': 'ROUTE_SUCCESS'}",
      "source": "brain.py:95",
      "job_id": "abc123"
    }
  ],
  "total": 1543
}

GET /api/logs/download
Response: Log file download
```

#### 6. Replay API
```typescript
POST /api/replay/start
Request Body:
{
  "data_file": "tests/data/BTCSTUSDT-1h-merged.csv",
  "start_idx": 0,
  "end_idx": 100,
  "speed": 1.0  // playback speed multiplier
}
Response:
{
  "replay_id": "replay_123",
  "status": "running"
}

POST /api/replay/pause
Request Body:
{
  "replay_id": "replay_123"
}
Response:
{
  "status": "paused"
}

GET /api/replay/status/{replay_id}
Response:
{
  "replay_id": "replay_123",
  "status": "running",
  "current_idx": 45,
  "total_candles": 100
}
```

---

## 🧩 FRONTEND COMPONENT STRUCTURE

### Current Components (To Be Updated)
```
bagbot/frontend/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx              ✅ EXISTS - needs worker control rewire
│   │   └── components/
│   │       └── TradeControls.tsx ✅ EXISTS - needs strategy integration
│   ├── charts/
│   │   └── page.tsx              ✅ EXISTS - stable
│   ├── signals/
│   │   └── page.tsx              ✅ EXISTS - needs signal routing
│   ├── logs/
│   │   └── page.tsx              ✅ EXISTS - needs log API integration
│   └── settings/
│       └── page.tsx              ✅ EXISTS - needs strategy config
│
├── components/
│   ├── Dashboard/
│   │   ├── StatsCard.tsx         ✅ EXISTS - needs metrics API
│   │   ├── LiveTickerTape.tsx    ✅ EXISTS - stable
│   │   └── TickerTape.tsx        ✅ EXISTS - stable
│   ├── Layout/
│   │   ├── Sidebar.tsx           ✅ EXISTS - stable
│   │   └── PageContent.tsx       ✅ EXISTS - stable
│   └── UI/
│       ├── Card.tsx              ✅ EXISTS - stable
│       ├── PremiumButton.tsx     ✅ EXISTS - stable
│       └── ToastNotification.tsx ✅ EXISTS - stable
│
└── utils/
    ├── api.ts                    ✅ EXISTS - stable
    └── apiService.ts             ✅ EXISTS - needs new endpoints
```

### New Components Required 🔧
```
bagbot/frontend/
├── app/
│   ├── backtest/              🔧 NEW
│   │   └── page.tsx           - Backtest runner UI
│   ├── optimizer/             🔧 NEW
│   │   └── page.tsx           - Optimizer launcher UI
│   └── artifacts/             🔧 NEW
│       ├── page.tsx           - Artifact browser
│       └── components/
│           ├── GenomeViewer.tsx
│           └── ReportViewer.tsx
│
└── components/
    ├── Backtest/              🔧 NEW
    │   ├── BacktestRunner.tsx
    │   ├── BacktestResults.tsx
    │   └── EquityCurveChart.tsx
    ├── Optimizer/             🔧 NEW
    │   ├── OptimizerForm.tsx
    │   ├── ProgressTracker.tsx
    │   └── GenomeTable.tsx
    ├── Strategy/              🔧 NEW
    │   ├── StrategySelector.tsx
    │   ├── ParameterEditor.tsx
    │   └── StrategyCard.tsx
    └── Logs/                  🔧 NEW
        ├── LogViewer.tsx
        ├── LogFilter.tsx
        └── LiveLogStream.tsx
```

---

## 📝 IMPLEMENTATION PHASES

### Phase 4.1: Backend API Expansion ⚙️
**Objective:** Add missing API endpoints without modifying brain core

**Tasks:**
1. Create `api/backtest_routes.py`
   - `POST /api/backtest/run`
   - `GET /api/backtest/results/{id}`
2. Create `api/optimizer_routes.py`
   - `POST /api/optimizer/run`
   - `GET /api/optimizer/status/{id}`
   - `GET /api/optimizer/results/{id}`
3. Create `api/artifacts_routes.py`
   - `GET /api/artifacts/genomes`
   - `GET /api/artifacts/reports`
   - `GET /api/artifacts/{type}/{filename}`
4. Create `api/strategy_routes.py`
   - `GET /api/strategies/list`
   - `GET /api/strategy/config`
   - `PUT /api/strategy/config`
5. Create `api/logs_routes.py`
   - `GET /api/logs`
   - `GET /api/logs/download`
6. Mount all new routers in `backend/main.py`

**Deliverable:** Backend API complete, ready for frontend consumption

---

### Phase 4.2: Frontend Service Layer 🔌
**Objective:** Update `apiService.ts` with new endpoints

**Tasks:**
1. Add backtest service functions
   - `runBacktest(params): Promise<JobResponse>`
   - `getBacktestResults(jobId): Promise<BacktestResponse>`
2. Add optimizer service functions
   - `runOptimizer(params): Promise<JobResponse>`
   - `getOptimizerStatus(jobId): Promise<OptimizerStatus>`
   - `getOptimizerResults(jobId): Promise<OptimizerResponse>`
3. Add artifacts service functions
   - `listGenomes(): Promise<GenomesResponse>`
   - `listReports(): Promise<ReportsResponse>`
   - `downloadGenome(filename): Promise<Blob>`
4. Add strategy service functions
   - `listStrategies(): Promise<StrategiesResponse>`
   - `getStrategyConfig(): Promise<ConfigResponse>`
   - `updateStrategyConfig(config): Promise<Response>`
5. Add logs service functions
   - `getLogs(params): Promise<LogsResponse>`
   - `downloadLogs(): Promise<Blob>`

**Deliverable:** Frontend service layer complete with type-safe API calls

---

### Phase 4.3: Core Component Updates 🎨
**Objective:** Rewire existing components to new APIs

**Tasks:**
1. Update `app/dashboard/page.tsx`
   - Integrate new worker status API
   - Add real-time metrics display
   - Wire strategy selector
2. Update `app/logs/page.tsx`
   - Connect to new logs API
   - Add live log streaming
   - Implement log filtering
3. Update `app/settings/page.tsx`
   - Add strategy configuration panel
   - Connect to strategy API
   - Add parameter editor
4. Update `components/Dashboard/StatsCard.tsx`
   - Connect to metrics API
   - Display backtest metrics
   - Show optimizer progress

**Deliverable:** Existing UI components fully integrated with brain backend

---

### Phase 4.4: New Feature Components 🆕
**Objective:** Build new backtest, optimizer, and artifact viewers

**Tasks:**
1. Create backtest page (`app/backtest/page.tsx`)
   - Backtest parameter form
   - Run button with job tracking
   - Results display with equity curve
   - Trade history table
2. Create optimizer page (`app/optimizer/page.tsx`)
   - Optimizer parameter form
   - Progress tracking UI
   - Best genome display
   - Genome history table
3. Create artifacts page (`app/artifacts/page.tsx`)
   - Genome browser
   - Report viewer
   - Download buttons
   - Timestamp sorting
4. Create supporting components
   - `BacktestRunner.tsx`
   - `OptimizerForm.tsx`
   - `GenomeViewer.tsx`
   - `LogViewer.tsx`

**Deliverable:** Complete new feature set with beautiful UI

---

### Phase 4.5: Navigation & Integration 🔗
**Objective:** Update navigation and integrate all features

**Tasks:**
1. Update `components/Layout/Sidebar.tsx`
   - Add backtest link
   - Add optimizer link
   - Add artifacts link
2. Update `app/components/Navigation.tsx`
   - Add new routes
   - Update active states
3. Add breadcrumb navigation to new pages
4. Create unified job status tracker (for backtest/optimizer jobs)
5. Add toast notifications for job completion

**Deliverable:** Seamless navigation between all features

---

### Phase 4.6: Testing & Validation ✅
**Objective:** Validate all integrations work correctly

**Tasks:**
1. Manual UI testing
   - Test all buttons and forms
   - Verify API calls succeed
   - Check error handling
2. Integration testing
   - Test backtest → results flow
   - Test optimizer → genome flow
   - Test strategy config → brain update
3. Performance testing
   - Test log streaming performance
   - Test artifact loading speed
4. Browser compatibility testing
5. Mobile responsiveness testing

**Deliverable:** Fully tested, production-ready frontend

---

## 🔐 VALIDATION CRITERIA

Before marking this task complete, verify:

### Backend Validation ✅
- [ ] All new API endpoints return correct responses
- [ ] Job submission creates proper job types
- [ ] Brain routes jobs to correct handlers
- [ ] Artifacts are retrievable via API
- [ ] Logs are accessible and filterable
- [ ] No backend brain logic was modified

### Frontend Validation ✅
- [ ] All buttons trigger correct API calls
- [ ] API responses are properly typed
- [ ] Error states are handled gracefully
- [ ] Loading states are displayed
- [ ] Success notifications appear
- [ ] Navigation works seamlessly

### Integration Validation ✅
- [ ] Backtest runs and displays results
- [ ] Optimizer runs and saves genomes
- [ ] Strategy selection updates brain
- [ ] Logs stream in real-time
- [ ] Artifacts download correctly
- [ ] Worker start/stop works reliably

### UX Validation ✅
- [ ] UI is responsive on all screen sizes
- [ ] Buttons have clear labels
- [ ] Forms validate inputs
- [ ] Progress indicators show status
- [ ] Toast notifications are informative
- [ ] Dark theme looks beautiful

---

## 📦 DELIVERABLES

Upon completion of Task 4.0, the following will be delivered:

1. **Backend API Layer** (`bagbot/api/`)
   - `backtest_routes.py`
   - `optimizer_routes.py`
   - `artifacts_routes.py`
   - `strategy_routes.py`
   - `logs_routes.py`
   - Updated `backend/main.py` with router mounts

2. **Frontend Service Layer** (`bagbot/frontend/utils/`)
   - Updated `apiService.ts` with all new endpoints
   - Type definitions for all API responses

3. **Updated Components** (`bagbot/frontend/app/`)
   - Rewired dashboard
   - Rewired logs viewer
   - Rewired settings panel

4. **New Components** (`bagbot/frontend/app/`)
   - Backtest runner page
   - Optimizer launcher page
   - Artifacts browser page
   - All supporting sub-components

5. **Documentation**
   - Updated `ui_api_map.md` with new endpoints
   - Frontend component reference guide
   - User guide for new features

6. **Tests**
   - API endpoint tests
   - Component unit tests (Jest)
   - Integration tests

---

## 🚀 SUCCESS METRICS

**Definition of Done:**
- User can start/stop worker from dashboard ✅
- User can run backtest and see results ✅
- User can run optimizer and view best genome ✅
- User can select and configure strategies ✅
- User can view real-time logs ✅
- User can browse and download artifacts ✅
- All UI actions route to correct brain methods ✅
- No errors in console ✅
- Beautiful, responsive UI ✅

---

## ⚠️ RISKS & MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API response format mismatch | Medium | High | Define strict TypeScript types upfront |
| Job queue delays | Low | Medium | Add job status polling with timeout |
| Large log file performance | Medium | Medium | Implement pagination and streaming |
| Artifact file size | Low | Low | Add download progress indicators |
| Backend overload | Low | High | Add rate limiting and queue management |

---

## 📌 NOTES FOR IMPLEMENTATION

1. **DO NOT modify brain core logic** unless explicitly required for API routing
2. **Maintain determinism** — all backend calls must be deterministic
3. **Use existing tests** as contract — backend behavior must not change
4. **Follow existing patterns** — match code style of current brain modules
5. **Test incrementally** — validate each phase before moving to next
6. **Document as you go** — update `ui_api_map.md` with each new endpoint
7. **Ask before assuming** — if unclear, request clarification before proceeding

---

## ✋ AWAITING APPROVAL

**This is a PLANNING document.**  
**NO implementation will begin until this plan is reviewed and approved.**

**Please review and approve before proceeding to Phase 4.1.**

---

**End of Task 4.0 Planning Document**
