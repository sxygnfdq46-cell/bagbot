/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 16: NEXT-GEN UI SYSTEM - INTEGRATION HUB
 * ═══════════════════════════════════════════════════════════════════
 * Central export hub for all Level 16 components.
 * Provides unified access to the reactive UI system.
 * 
 * COMPONENTS:
 * - ReactiveUIKernel: Global UI state machine (885 lines)
 * - ViewportStreamEngine: GPU streaming engine (808 lines)
 * - SystemDashboardGrid: Dockable admin grid (1,123 lines)
 * - DataPulseFeed: Real-time metrics (706 lines)
 * - MultiLayerVisualComposer: Layered UI builder (1,003 lines)
 * - UIIntentRouter: Context-aware routing (662 lines)
 * - nextui.css: GPU animations (1,416 lines)
 * 
 * TOTAL: 6,603 lines (97% of 6,000-7,500 target)
 * ═══════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// REACTIVE UI KERNEL
// ─────────────────────────────────────────────────────────────────

export {
  ReactiveUIKernel,
  UIKernelProvider,
  useUIKernel,
  useUIState,
  useUISelector,
  useUIPerformance,
  useViewport,
  useTheme,
  useUIMode
} from './ReactiveUIKernel';

export type {
  UITheme,
  ViewportSize,
  UIMode,
  RenderPriority,
  ViewportState,
  UIState,
  UIPerformance,
  UIEvent,
  UISubscription,
  ReactiveUIConfig
} from './ReactiveUIKernel';

// ─────────────────────────────────────────────────────────────────
// VIEWPORT STREAM ENGINE
// ─────────────────────────────────────────────────────────────────

export {
  ViewportStreamEngine,
  getStreamEngine,
  destroyStreamEngine
} from './ViewportStreamEngine';

export type {
  StreamType,
  AnimationEasing,
  StreamConfig,
  AnimationFrame,
  StreamMetrics,
  StreamItem,
  AnimationConfig
} from './ViewportStreamEngine';

// ─────────────────────────────────────────────────────────────────
// SYSTEM DASHBOARD GRID
// ─────────────────────────────────────────────────────────────────

export {
  SystemDashboardGrid,
  createDefaultLayout
} from './SystemDashboardGrid';

export type {
  PanelSize,
  PanelPosition,
  GridPanel,
  GridLayout,
  DragState,
  ResizeState
} from './SystemDashboardGrid';

// ─────────────────────────────────────────────────────────────────
// DATA PULSE FEED
// ─────────────────────────────────────────────────────────────────

export {
  DataPulseFeed,
  getPulseFeed,
  destroyPulseFeed
} from './DataPulseFeed';

export type {
  MetricType,
  AggregationMethod,
  MetricData,
  MetricSnapshot,
  MemoryMetrics,
  RiskMetrics,
  StateMetrics,
  LoadMetrics,
  PerformanceMetrics,
  PulseFeedConfig,
  MetricSubscription
} from './DataPulseFeed';

// ─────────────────────────────────────────────────────────────────
// MULTI-LAYER VISUAL COMPOSER
// ─────────────────────────────────────────────────────────────────

export {
  MultiLayerVisualComposer,
  createChartLayer,
  createPulseRingLayer,
  createTimelineLayer
} from './MultiLayerVisualComposer';

export type {
  LayerType,
  ChartType,
  VisualLayer,
  LayerConfig,
  ChartConfig,
  PulseRingConfig,
  TimelineConfig,
  TimelineEvent,
  ComposerConfig
} from './MultiLayerVisualComposer';

// ─────────────────────────────────────────────────────────────────
// UI INTENT ROUTER
// ─────────────────────────────────────────────────────────────────

export {
  UIIntentRouter,
  getIntentRouter,
  destroyIntentRouter,
  useIntentRouter
} from './UIIntentRouter';

export type {
  IntentType,
  InteractionType,
  UIContext,
  UserInteraction,
  ClassifiedIntent,
  IntentHandler,
  RouterConfig
} from './UIIntentRouter';

// ─────────────────────────────────────────────────────────────────
// CONSTANTS & METADATA
// ─────────────────────────────────────────────────────────────────

export const LEVEL_16_VERSION = '1.0.0';

export const LEVEL_16_METADATA = {
  name: 'Next-Gen UI System',
  version: LEVEL_16_VERSION,
  level: 16,
  components: [
    'ReactiveUIKernel',
    'ViewportStreamEngine',
    'SystemDashboardGrid',
    'DataPulseFeed',
    'MultiLayerVisualComposer',
    'UIIntentRouter',
    'nextui.css'
  ],
  totalLines: 6603,
  targetRange: [6000, 7500],
  completion: '97%',
  features: [
    '20ms render cycles with 60fps target',
    'GPU-accelerated animations',
    'Real-time metrics at 50ms intervals',
    'Dockable dashboard panels',
    'Context-aware intent routing',
    'Cross-page state sync',
    'Layered visualization system',
    'Performance monitoring'
  ],
  purpose: 'Foundation for Level 17 Admin Page',
  safety: [
    'Read-only UI state',
    'No autonomous execution',
    'Pure rendering logic',
    'No data mutations',
    'Intent classification only'
  ]
};

// ─────────────────────────────────────────────────────────────────
// SAFETY CONSTANTS
// ─────────────────────────────────────────────────────────────────

export const LEVEL_16_SAFETY = {
  MAX_PANEL_COUNT: 20,
  MAX_LAYER_COUNT: 50,
  MAX_EVENT_QUEUE: 1000,
  MAX_HISTORY_SIZE: 1200,
  TARGET_FPS: 60,
  MIN_RENDER_INTERVAL: 16.67, // ms
  MAX_RENDER_INTERVAL: 50, // ms
  DEBOUNCE_DEFAULT: 100, // ms
  IDLE_TIMEOUT: 300000, // 5 minutes
  PERFORMANCE_WARNING_FPS: 30,
  PERFORMANCE_CRITICAL_FPS: 20
};

// ─────────────────────────────────────────────────────────────────
// USAGE EXAMPLE
// ─────────────────────────────────────────────────────────────────

export const LEVEL_16_USAGE_EXAMPLE = `
import {
  UIKernelProvider,
  useUIState,
  useUIPerformance,
  SystemDashboardGrid,
  getPulseFeed,
  MultiLayerVisualComposer,
  getIntentRouter
} from '@/components/ui';

// 1. Wrap app with UIKernelProvider
<UIKernelProvider config={{ targetFPS: 60 }}>
  <App />
</UIKernelProvider>

// 2. Use UI state hooks
function Component() {
  const state = useUIState();
  const performance = useUIPerformance();
  
  return (
    <div>
      <p>FPS: {performance.fps}</p>
      <p>Theme: {state.theme}</p>
    </div>
  );
}

// 3. Create dashboard with panels
<SystemDashboardGrid
  gridSize={20}
  snapToGrid={true}
  onLayoutChange={(layout) => console.log(layout)}
/>

// 4. Subscribe to real-time metrics
const feed = getPulseFeed();
feed.subscribe(['memory', 'risk'], (snapshot) => {
  console.log('Memory:', snapshot.memory);
  console.log('Risk:', snapshot.risk);
});

// 5. Create layered visualizations
<MultiLayerVisualComposer
  config={{ width: 1920, height: 1080 }}
  layers={[
    createChartLayer('chart-1', 'line', [1, 2, 3, 4, 5]),
    createPulseRingLayer('pulse-1', 960, 540)
  ]}
/>

// 6. Route user interactions
const router = getIntentRouter();
router.processInteraction({
  type: 'click',
  timestamp: Date.now(),
  target: 'nav-settings',
  targetType: 'button'
});
`;
