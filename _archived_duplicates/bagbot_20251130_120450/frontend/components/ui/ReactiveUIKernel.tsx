/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 16.1: REACTIVE UI KERNEL
 * ═══════════════════════════════════════════════════════════════════
 * Global UI state machine with cross-page sync and 20ms render cycles.
 * Manages all real-time UI updates, viewport state, and component sync.
 * 
 * SAFETY: Read-only UI state, no execution logic
 * PURPOSE: Foundation for Level 17 Admin Page + real-time dashboards
 * ═══════════════════════════════════════════════════════════════════
 */

'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type UITheme = 'dark' | 'light' | 'auto';
export type ViewportSize = 'mobile' | 'tablet' | 'desktop' | 'ultrawide';
export type UIMode = 'admin' | 'viewer' | 'compact' | 'fullscreen';
export type RenderPriority = 'critical' | 'high' | 'normal' | 'low' | 'idle';

export interface ViewportState {
  width: number;
  height: number;
  size: ViewportSize;
  devicePixelRatio: number;
  isPortrait: boolean;
  aspectRatio: number;
}

export interface UIState {
  theme: UITheme;
  mode: UIMode;
  viewport: ViewportState;
  isActive: boolean;
  focusedComponent: string | null;
  modalStack: string[];
  sidebarOpen: boolean;
  fullscreenComponent: string | null;
  lastInteraction: number;
  idleTime: number;
}

export interface UIPerformance {
  fps: number;
  frameTimes: number[];
  avgFrameTime: number;
  renderCount: number;
  lastRender: number;
  droppedFrames: number;
  gpuUtilization: number;
}

export interface UIEvent {
  type: string;
  timestamp: number;
  component: string;
  data?: any;
  priority: RenderPriority;
}

export interface UISubscription {
  id: string;
  component: string;
  selector: (state: UIState) => any;
  callback: (value: any) => void;
  priority: RenderPriority;
}

export interface ReactiveUIConfig {
  targetFPS: number;
  renderInterval: number;
  idleTimeout: number;
  enablePerformanceMonitoring: boolean;
  enableCrossSiteSync: boolean;
  maxEventQueueSize: number;
}

// ─────────────────────────────────────────────────────────────────
// REACTIVE UI KERNEL CLASS
// ─────────────────────────────────────────────────────────────────

export class ReactiveUIKernel {
  private state: UIState;
  private performance: UIPerformance;
  private config: ReactiveUIConfig;
  private subscriptions: Map<string, UISubscription>;
  private eventQueue: UIEvent[];
  private renderLoop?: number;
  private performanceLoop?: number;
  private broadcastChannel?: BroadcastChannel;
  private listeners: Map<string, Set<(state: UIState) => void>>;

  constructor(config?: Partial<ReactiveUIConfig>) {
    this.config = {
      targetFPS: 60,
      renderInterval: 16.67, // ~60fps
      idleTimeout: 300000, // 5 minutes
      enablePerformanceMonitoring: true,
      enableCrossSiteSync: false,
      maxEventQueueSize: 1000,
      ...config
    };

    this.state = this.initializeState();
    this.performance = this.initializePerformance();
    this.subscriptions = new Map();
    this.eventQueue = [];
    this.listeners = new Map();

    this.startRenderLoop();
    this.startPerformanceMonitoring();
    this.setupViewportTracking();
    
    if (this.config.enableCrossSiteSync) {
      this.setupCrossSiteSync();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────

  private initializeState(): UIState {
    const viewport = this.getViewportState();
    
    return {
      theme: this.detectTheme(),
      mode: 'viewer',
      viewport,
      isActive: true,
      focusedComponent: null,
      modalStack: [],
      sidebarOpen: true,
      fullscreenComponent: null,
      lastInteraction: Date.now(),
      idleTime: 0
    };
  }

  private initializePerformance(): UIPerformance {
    return {
      fps: 60,
      frameTimes: [],
      avgFrameTime: 16.67,
      renderCount: 0,
      lastRender: Date.now(),
      droppedFrames: 0,
      gpuUtilization: 0
    };
  }

  private detectTheme(): UITheme {
    if (typeof window === 'undefined') return 'dark';
    
    const stored = localStorage.getItem('bagbot-ui-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  private getViewportState(): ViewportState {
    if (typeof window === 'undefined') {
      return {
        width: 1920,
        height: 1080,
        size: 'desktop',
        devicePixelRatio: 1,
        isPortrait: false,
        aspectRatio: 16 / 9
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const isPortrait = height > width;
    const aspectRatio = width / height;

    let size: ViewportSize;
    if (width < 768) size = 'mobile';
    else if (width < 1024) size = 'tablet';
    else if (width < 1920) size = 'desktop';
    else size = 'ultrawide';

    return {
      width,
      height,
      size,
      devicePixelRatio,
      isPortrait,
      aspectRatio
    };
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER LOOP (20ms cycle)
  // ─────────────────────────────────────────────────────────────

  private startRenderLoop(): void {
    const render = () => {
      const startTime = performance.now();

      // Process event queue
      this.processEventQueue();

      // Update idle time
      const now = Date.now();
      this.state.idleTime = now - this.state.lastInteraction;

      // Check if idle
      if (this.state.idleTime > this.config.idleTimeout) {
        this.state.isActive = false;
      }

      // Notify subscribers
      this.notifySubscribers();

      // Record frame time
      const frameTime = performance.now() - startTime;
      this.recordFrameTime(frameTime);

      // Schedule next frame
      this.renderLoop = requestAnimationFrame(render);
    };

    this.renderLoop = requestAnimationFrame(render);
  }

  private processEventQueue(): void {
    // Sort by priority
    const sorted = [...this.eventQueue].sort((a, b) => {
      const priorityMap = { critical: 0, high: 1, normal: 2, low: 3, idle: 4 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    });

    // Process up to 10 events per frame to avoid blocking
    const toProcess = sorted.slice(0, 10);
    this.eventQueue = this.eventQueue.filter(e => !toProcess.includes(e));

    toProcess.forEach(event => {
      this.handleUIEvent(event);
    });
  }

  private handleUIEvent(event: UIEvent): void {
    switch (event.type) {
      case 'interaction':
        this.state.lastInteraction = event.timestamp;
        this.state.isActive = true;
        this.state.idleTime = 0;
        break;
      
      case 'focus':
        this.state.focusedComponent = event.component;
        break;
      
      case 'blur':
        if (this.state.focusedComponent === event.component) {
          this.state.focusedComponent = null;
        }
        break;
      
      case 'modal_open':
        this.state.modalStack.push(event.component);
        break;
      
      case 'modal_close':
        this.state.modalStack = this.state.modalStack.filter(c => c !== event.component);
        break;
      
      case 'fullscreen_enter':
        this.state.fullscreenComponent = event.component;
        break;
      
      case 'fullscreen_exit':
        this.state.fullscreenComponent = null;
        break;
      
      case 'sidebar_toggle':
        this.state.sidebarOpen = !this.state.sidebarOpen;
        break;
    }
  }

  private notifySubscribers(): void {
    this.subscriptions.forEach(sub => {
      try {
        const value = sub.selector(this.state);
        sub.callback(value);
      } catch (error) {
        console.error(`[UI KERNEL] Subscription error for ${sub.component}:`, error);
      }
    });

    // Notify general listeners
    this.listeners.forEach((callbacks, key) => {
      callbacks.forEach(callback => {
        try {
          callback(this.state);
        } catch (error) {
          console.error(`[UI KERNEL] Listener error:`, error);
        }
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // PERFORMANCE MONITORING
  // ─────────────────────────────────────────────────────────────

  private startPerformanceMonitoring(): void {
    if (!this.config.enablePerformanceMonitoring) return;

    const monitor = () => {
      // Calculate FPS
      if (this.performance.frameTimes.length > 0) {
        const avgFrameTime = this.performance.frameTimes.reduce((a, b) => a + b, 0) / this.performance.frameTimes.length;
        this.performance.avgFrameTime = avgFrameTime;
        this.performance.fps = Math.round(1000 / avgFrameTime);
      }

      // Estimate GPU utilization (simplified)
      if (this.performance.droppedFrames > 0) {
        this.performance.gpuUtilization = Math.min(100, (this.performance.droppedFrames / this.performance.renderCount) * 100);
      }

      // Clear old frame times (keep last 60 frames)
      if (this.performance.frameTimes.length > 60) {
        this.performance.frameTimes = this.performance.frameTimes.slice(-60);
      }
    };

    this.performanceLoop = window.setInterval(monitor, 1000);
  }

  private recordFrameTime(frameTime: number): void {
    this.performance.frameTimes.push(frameTime);
    this.performance.renderCount++;
    this.performance.lastRender = Date.now();

    // Check for dropped frames (>33ms = <30fps)
    if (frameTime > 33) {
      this.performance.droppedFrames++;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // VIEWPORT TRACKING
  // ─────────────────────────────────────────────────────────────

  private setupViewportTracking(): void {
    if (typeof window === 'undefined') return;

    const updateViewport = () => {
      this.state.viewport = this.getViewportState();
      this.emitEvent({
        type: 'viewport_change',
        component: 'kernel',
        data: this.state.viewport,
        priority: 'high'
      });
    };

    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    // Track visibility
    document.addEventListener('visibilitychange', () => {
      this.state.isActive = !document.hidden;
    });
  }

  // ─────────────────────────────────────────────────────────────
  // CROSS-SITE SYNC
  // ─────────────────────────────────────────────────────────────

  private setupCrossSiteSync(): void {
    if (typeof BroadcastChannel === 'undefined') return;

    try {
      this.broadcastChannel = new BroadcastChannel('bagbot-ui-kernel');
      
      this.broadcastChannel.onmessage = (event) => {
        const { type, data } = event.data;
        
        if (type === 'state_update') {
          // Merge remote state (selective)
          this.state.theme = data.theme || this.state.theme;
          this.state.mode = data.mode || this.state.mode;
        } else if (type === 'event') {
          this.emitEvent(data);
        }
      };

      console.log('[UI KERNEL] Cross-site sync enabled');
    } catch (error) {
      console.error('[UI KERNEL] Failed to setup cross-site sync:', error);
    }
  }

  private broadcastState(): void {
    if (!this.broadcastChannel) return;

    this.broadcastChannel.postMessage({
      type: 'state_update',
      data: {
        theme: this.state.theme,
        mode: this.state.mode,
        viewport: this.state.viewport
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────

  getState(): UIState {
    return { ...this.state };
  }

  getPerformance(): UIPerformance {
    return { ...this.performance };
  }

  subscribe(
    component: string,
    selector: (state: UIState) => any,
    callback: (value: any) => void,
    priority: RenderPriority = 'normal'
  ): string {
    const id = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: UISubscription = {
      id,
      component,
      selector,
      callback,
      priority
    };

    this.subscriptions.set(id, subscription);
    
    // Immediately call with current value
    try {
      const value = selector(this.state);
      callback(value);
    } catch (error) {
      console.error(`[UI KERNEL] Initial subscription call failed:`, error);
    }

    return id;
  }

  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  emitEvent(event: Omit<UIEvent, 'timestamp'>): void {
    const fullEvent: UIEvent = {
      timestamp: Date.now(),
      ...event
    };

    // Check queue size
    if (this.eventQueue.length >= this.config.maxEventQueueSize) {
      // Remove oldest low-priority event
      const lowPriorityIndex = this.eventQueue.findIndex(e => e.priority === 'low' || e.priority === 'idle');
      if (lowPriorityIndex !== -1) {
        this.eventQueue.splice(lowPriorityIndex, 1);
      }
    }

    this.eventQueue.push(fullEvent);

    // Broadcast if enabled
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'event',
        data: fullEvent
      });
    }
  }

  setTheme(theme: UITheme): void {
    this.state.theme = theme;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('bagbot-ui-theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }

    this.broadcastState();
  }

  setMode(mode: UIMode): void {
    this.state.mode = mode;
    this.broadcastState();
  }

  toggleSidebar(): void {
    this.emitEvent({
      type: 'sidebar_toggle',
      component: 'kernel',
      priority: 'high'
    });
  }

  openModal(componentId: string): void {
    this.emitEvent({
      type: 'modal_open',
      component: componentId,
      priority: 'critical'
    });
  }

  closeModal(componentId: string): void {
    this.emitEvent({
      type: 'modal_close',
      component: componentId,
      priority: 'critical'
    });
  }

  enterFullscreen(componentId: string): void {
    this.emitEvent({
      type: 'fullscreen_enter',
      component: componentId,
      priority: 'critical'
    });
  }

  exitFullscreen(): void {
    this.emitEvent({
      type: 'fullscreen_exit',
      component: 'kernel',
      priority: 'critical'
    });
  }

  recordInteraction(component: string): void {
    this.emitEvent({
      type: 'interaction',
      component,
      priority: 'normal'
    });
  }

  // ─────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────

  destroy(): void {
    if (this.renderLoop) {
      cancelAnimationFrame(this.renderLoop);
    }

    if (this.performanceLoop) {
      clearInterval(this.performanceLoop);
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }

    this.subscriptions.clear();
    this.eventQueue = [];
    this.listeners.clear();

    console.log('[UI KERNEL] Destroyed');
  }
}

// ─────────────────────────────────────────────────────────────────
// REACT CONTEXT & HOOKS
// ─────────────────────────────────────────────────────────────────

const UIKernelContext = createContext<ReactiveUIKernel | null>(null);

export const UIKernelProvider: React.FC<{
  children: React.ReactNode;
  config?: Partial<ReactiveUIConfig>;
}> = ({ children, config }) => {
  const kernelRef = useRef<ReactiveUIKernel>();

  if (!kernelRef.current) {
    kernelRef.current = new ReactiveUIKernel(config);
  }

  useEffect(() => {
    return () => {
      kernelRef.current?.destroy();
    };
  }, []);

  return (
    <UIKernelContext.Provider value={kernelRef.current}>
      {children}
    </UIKernelContext.Provider>
  );
};

export function useUIKernel(): ReactiveUIKernel {
  const kernel = useContext(UIKernelContext);
  if (!kernel) {
    throw new Error('useUIKernel must be used within UIKernelProvider');
  }
  return kernel;
}

export function useUIState(): UIState {
  const kernel = useUIKernel();
  const [state, setState] = useState<UIState>(kernel.getState());

  useEffect(() => {
    const subscriptionId = kernel.subscribe(
      'useUIState',
      (s) => s,
      (newState) => setState(newState),
      'high'
    );

    return () => kernel.unsubscribe(subscriptionId);
  }, [kernel]);

  return state;
}

export function useUISelector<T>(selector: (state: UIState) => T): T {
  const kernel = useUIKernel();
  const [value, setValue] = useState<T>(selector(kernel.getState()));

  useEffect(() => {
    const subscriptionId = kernel.subscribe(
      'useUISelector',
      selector,
      (newValue) => setValue(newValue),
      'high'
    );

    return () => kernel.unsubscribe(subscriptionId);
  }, [kernel, selector]);

  return value;
}

export function useUIPerformance(): UIPerformance {
  const kernel = useUIKernel();
  const [performance, setPerformance] = useState<UIPerformance>(kernel.getPerformance());

  useEffect(() => {
    const interval = setInterval(() => {
      setPerformance(kernel.getPerformance());
    }, 1000);

    return () => clearInterval(interval);
  }, [kernel]);

  return performance;
}

export function useViewport(): ViewportState {
  return useUISelector(state => state.viewport);
}

export function useTheme(): [UITheme, (theme: UITheme) => void] {
  const kernel = useUIKernel();
  const theme = useUISelector(state => state.theme);
  
  const setTheme = useCallback((newTheme: UITheme) => {
    kernel.setTheme(newTheme);
  }, [kernel]);

  return [theme, setTheme];
}

export function useUIMode(): [UIMode, (mode: UIMode) => void] {
  const kernel = useUIKernel();
  const mode = useUISelector(state => state.mode);
  
  const setMode = useCallback((newMode: UIMode) => {
    kernel.setMode(newMode);
  }, [kernel]);

  return [mode, setMode];
}
