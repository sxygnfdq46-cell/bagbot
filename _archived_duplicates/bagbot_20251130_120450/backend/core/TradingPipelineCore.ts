// ═══════════════════════════════════════════════════════════════════
// TRADING PIPELINE CORE — Level 20.3
// ═══════════════════════════════════════════════════════════════════
// Signal → Validation → Risk Filters → Execution Stub → Telemetry → Rollback Safety
//
// STRICT RULES:
// • No actual broker execution (stub only)
// • No external calls
// • No side effects
// • TypeScript only
// • Stable, modular, fully typed
// • Designed to plug in future components:
//   - FusionEngine
//   - ShieldIntelligenceAPI
//   - RiskLayer
//   - StrategyLayer
//   - ExecutionEngine
// ═══════════════════════════════════════════════════════════════════

import { 
  VolatilityEngine, 
  RegimeScanner, 
  HeatIndex, 
  NoiseFilter,
  type VolatilityReading,
  type RegimeReading,
  type HeatReading,
  type NoiseReading
} from '../analytics';

type EventCallback = (event: TelemetryEvent) => void;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPE DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface TradingSignal {
  id: string;
  type: 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
  symbol: string;
  confidence: number; // 0-100
  fusionScore?: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: 'fusion' | 'technical' | 'intelligence' | 'manual';
  metadata?: Record<string, any>;
  timestamp: number;
  // Environmental context
  environment?: {
    volatility: VolatilityReading | null;
    regime: RegimeReading | null;
    heat: HeatReading | null;
    noise: NoiseReading | null;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalized: TradingSignal | null;
}

export interface RiskFilterResult {
  passed: boolean;
  riskScore: number; // 0-100
  blockers: string[];
  adjustments: {
    positionSize?: number;
    stopLoss?: number;
    takeProfit?: number;
  };
}

export interface ExecutionStub {
  orderId: string;
  signal: TradingSignal;
  status: 'STUB_CREATED' | 'STUB_VALIDATED' | 'STUB_LOGGED';
  message: string;
  timestamp: number;
}

export interface TelemetryEvent {
  type: 'SIGNAL_RECEIVED' | 'VALIDATION_PASSED' | 'VALIDATION_FAILED' | 
        'RISK_PASSED' | 'RISK_BLOCKED' | 'EXECUTION_STUB' | 'ROLLBACK';
  data: any;
  timestamp: number;
}

export interface PipelineConfig {
  maxSignalsPerMinute: number;
  minConfidence: number;
  maxRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  enableRollback: boolean;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRADING PIPELINE CORE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class TradingPipelineCore {
  private static instance: TradingPipelineCore;
  
  private config: PipelineConfig = {
    maxSignalsPerMinute: 10,
    minConfidence: 60,
    maxRiskLevel: 'MEDIUM',
    enableRollback: true,
    logLevel: 'INFO',
  };

  private signalHistory: TradingSignal[] = [];
  private telemetryLog: TelemetryEvent[] = [];
  private lastMinuteSignals: number[] = [];
  private eventListeners: Map<TelemetryEvent['type'], EventCallback[]> = new Map();

  // Analytics engines
  private volatilityEngine: VolatilityEngine;
  private regimeScanner: RegimeScanner;
  private heatIndex: HeatIndex;
  private noiseFilter: NoiseFilter;

  private constructor() {
    // Initialize analytics modules
    this.volatilityEngine = new VolatilityEngine();
    this.regimeScanner = new RegimeScanner();
    this.heatIndex = new HeatIndex();
    this.noiseFilter = new NoiseFilter();
  }

  static getInstance(): TradingPipelineCore {
    if (!TradingPipelineCore.instance) {
      TradingPipelineCore.instance = new TradingPipelineCore();
    }
    return TradingPipelineCore.instance;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. PROCESS SIGNAL (MAIN ENTRY POINT)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async processSignal(signal: TradingSignal): Promise<ExecutionStub | null> {
    this.emitEvent('SIGNAL_RECEIVED', signal);

    // Step 1: Normalize signal
    const normalized = this.normalizeSignal(signal);

    // Step 2: Inject environmental context (NEW - LEVEL 22)
    this.enrichWithEnvironment(normalized);

    // Step 3: Validate signal
    const validation = this.validateSignal(normalized);
    if (!validation.valid) {
      this.emitEvent('VALIDATION_FAILED', { signal: normalized, errors: validation.errors });
      return null;
    }
    this.emitEvent('VALIDATION_PASSED', validation.normalized);

    // Step 4: Run risk filters
    const riskResult = await this.runRiskFilters(validation.normalized!);
    if (!riskResult.passed) {
      this.emitEvent('RISK_BLOCKED', { signal: validation.normalized, blockers: riskResult.blockers });
      return null;
    }
    this.emitEvent('RISK_PASSED', riskResult);

    // Step 5: Route to execution stub (placeholder)
    const executionStub = this.routeExecution(validation.normalized!);
    this.emitEvent('EXECUTION_STUB', executionStub);

    // Step 6: Log telemetry
    this.signalHistory.push(validation.normalized!);
    if (this.signalHistory.length > 100) {
      this.signalHistory.shift();
    }

    return executionStub;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. VALIDATE SIGNAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  validateSignal(signal: TradingSignal): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!signal.id) errors.push('Missing signal ID');
    if (!signal.type) errors.push('Missing signal type');
    if (!signal.symbol) errors.push('Missing symbol');
    if (signal.confidence === undefined) errors.push('Missing confidence');

    // Validate type
    if (!['BUY', 'SELL', 'HOLD', 'WAIT'].includes(signal.type)) {
      errors.push(`Invalid signal type: ${signal.type}`);
    }

    // Validate confidence
    if (signal.confidence < 0 || signal.confidence > 100) {
      errors.push('Confidence must be 0-100');
    }

    // Check minimum confidence
    if (signal.confidence < this.config.minConfidence) {
      warnings.push(`Confidence ${signal.confidence} below minimum ${this.config.minConfidence}`);
    }

    // Check risk level
    const riskLevels = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    const maxRisk = riskLevels[this.config.maxRiskLevel];
    const signalRisk = riskLevels[signal.riskLevel];
    
    if (signalRisk > maxRisk) {
      errors.push(`Risk level ${signal.riskLevel} exceeds max ${this.config.maxRiskLevel}`);
    }

    // Check rate limiting
    const now = Date.now();
    this.lastMinuteSignals = this.lastMinuteSignals.filter(t => t > now - 60000);
    if (this.lastMinuteSignals.length >= this.config.maxSignalsPerMinute) {
      errors.push('Rate limit exceeded');
    }
    this.lastMinuteSignals.push(now);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      normalized: errors.length === 0 ? signal : null,
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. RUN RISK FILTERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async runRiskFilters(signal: TradingSignal): Promise<RiskFilterResult> {
    const blockers: string[] = [];
    let riskScore = 0;

    // Risk Filter 1: Confidence check
    if (signal.confidence < 70) {
      riskScore += 30;
    }

    // Risk Filter 2: Risk level check
    const riskMap = { LOW: 10, MEDIUM: 30, HIGH: 60, CRITICAL: 90 };
    riskScore += riskMap[signal.riskLevel];

    // Risk Filter 3: Fusion score check (if available)
    if (signal.fusionScore !== undefined && signal.fusionScore < 50) {
      riskScore += 20;
      blockers.push('Fusion score below threshold');
    }

    // Risk Filter 4: Type check
    if (signal.type === 'WAIT') {
      blockers.push('WAIT signal - no execution');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // NEW: ENVIRONMENTAL RISK FILTERS (LEVEL 22)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let volatilityMultiplier = 1.0;
    let heatMultiplier = 1.0;
    let noiseMultiplier = 1.0;

    if (signal.environment) {
      const { volatility, heat, noise } = signal.environment;

      // VOLATILITY: Increase risk score in high volatility
      if (volatility) {
        volatilityMultiplier = this.volatilityEngine.getRiskMultiplier();
        
        if (volatility.level === 'EXTREME') {
          riskScore += 30;
          blockers.push('EXTREME volatility - market too unstable');
        } else if (volatility.level === 'HIGH') {
          riskScore += 15;
        }
      }

      // HEAT: Increase risk if market overheated (exhaustion)
      if (heat && heat.overheated) {
        riskScore += 20;
        heatMultiplier = this.heatIndex.getConfidenceMultiplier();
        blockers.push('Market OVERHEATED - exhaustion risk');
      }

      // NOISE: Block signals in very noisy markets
      if (noise && noise.noisy) {
        riskScore += 25;
        noiseMultiplier = this.noiseFilter.getConfidenceMultiplier();
        blockers.push('Market NOISY - high whipsaw risk');
      }
    }

    // Overall risk assessment
    if (riskScore > 75) {
      blockers.push(`Overall risk score too high: ${riskScore}`);
    }

    return {
      passed: blockers.length === 0,
      riskScore,
      blockers,
      adjustments: {
        positionSize: (riskScore > 50 ? 0.5 : 1.0) * volatilityMultiplier,
        stopLoss: riskScore > 60 ? 0.02 : 0.05,
        takeProfit: riskScore > 60 ? 0.04 : 0.10,
      },
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. ROUTE EXECUTION (STUB ONLY)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  routeExecution(signal: TradingSignal): ExecutionStub {
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      orderId,
      signal,
      status: 'STUB_LOGGED',
      message: `[STUB] Signal ${signal.type} for ${signal.symbol} logged. No actual execution.`,
      timestamp: Date.now(),
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. ROLLBACK (FAIL-SAFE)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  rollback(orderId: string, reason: string): boolean {
    if (!this.config.enableRollback) {
      return false;
    }

    this.emitEvent('ROLLBACK', { orderId, reason, timestamp: Date.now() });
    
    // In production, this would cancel pending orders, close positions, etc.
    // For now, it's just logged
    return true;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HELPER METHODS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private normalizeSignal(signal: TradingSignal): TradingSignal {
    return {
      ...signal,
      id: signal.id || `SIG-${Date.now()}`,
      timestamp: signal.timestamp || Date.now(),
      confidence: Math.max(0, Math.min(100, signal.confidence)),
    };
  }

  /**
   * Update analytics engines with current market price
   * Call this periodically (e.g., on each tick) to keep analytics fresh
   * @param price - Current market price
   */
  updateAnalytics(price: number): void {
    this.volatilityEngine.update(price);
    this.regimeScanner.update(price);
    this.heatIndex.update(price);
    this.noiseFilter.update(price);
  }

  /**
   * Enrich signal with environmental context from analytics
   * Injects volatility, regime, heat, and noise readings into signal
   */
  private enrichWithEnvironment(signal: TradingSignal): void {
    signal.environment = {
      volatility: this.volatilityEngine.getReading(),
      regime: this.regimeScanner.getReading(),
      heat: this.heatIndex.getReading(),
      noise: this.noiseFilter.getReading(),
    };
  }

  /**
   * Get current environmental snapshot
   */
  getEnvironment() {
    return {
      volatility: this.volatilityEngine.getReading(),
      regime: this.regimeScanner.getReading(),
      heat: this.heatIndex.getReading(),
      noise: this.noiseFilter.getReading(),
    };
  }

  private emitEvent(type: TelemetryEvent['type'], data: any): void {
    const event: TelemetryEvent = {
      type,
      data,
      timestamp: Date.now(),
    };

    this.telemetryLog.push(event);
    if (this.telemetryLog.length > 1000) {
      this.telemetryLog.shift();
    }

    // Call registered listeners
    const listeners = this.eventListeners.get(type) || [];
    listeners.forEach(callback => callback(event));
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EVENT MANAGEMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  on(type: TelemetryEvent['type'], callback: EventCallback): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(type) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PUBLIC API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  getSignalHistory(): TradingSignal[] {
    return [...this.signalHistory];
  }

  getTelemetryLog(): TelemetryEvent[] {
    return [...this.telemetryLog];
  }

  updateConfig(config: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): PipelineConfig {
    return { ...this.config };
  }

  clearHistory(): void {
    this.signalHistory = [];
    this.telemetryLog = [];
    this.lastMinuteSignals = [];
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getTradingPipeline = () => TradingPipelineCore.getInstance();

export default TradingPipelineCore;
