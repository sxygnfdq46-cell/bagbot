/**
 * 🎯 EXECUTION PRECISION CORE (EPC)
 * 
 * STEP 24.27 — Where BagBot's trades become laser-precise
 * 
 * This is one of the most important intelligence modules in the entire BagBot ecosystem.
 * This is where BagBot becomes surgical with its entries and exits.
 * 
 * The Execution Precision Core is responsible for:
 * - Turning refined decisions into exact execution coordinates
 * - Micro-timing entries
 * - Adjusting order type dynamically (market, limit, adaptive)
 * - Avoiding slippage spikes
 * - Ensuring trades fire ONLY when the micro-conditions are perfect
 * - Increasing daily accuracy and consistency
 * 
 * This is how we make BagBot "trade every day AND trade smart."
 * 
 * Requirements:
 * - TypeScript module only (frontend-safe)
 * - Create class ExecutionPrecisionCore
 * - Method execute(refinedDecision)
 * - Responsibilities:
 *   - Derive orderType via confidence thresholds
 *   - Calculate entryPriceTarget based on timing and refinement confidence
 *   - Add fallbackPrice (safety re-entry)
 *   - Apply slippageGuard using volatility inputs
 *   - Generate microTiming: Date.now() + timing offset
 *   - Include MicroMarketChecks() = spreadCheck() micro scanners (mocked)
 *     - spreadCheck() - ensures spread is acceptable
 *     - liquidityPulse() - checks order book depth
 *     - volatilityTicks() - monitors recent price changes
 *   - trustScore = combined confidence + stability + safety
 *   - Output final object:
 *     {
 *       orderType,
 *       entryPriceTarget,
 *       fallbackPrice,
 *       size,
 *       slippageGuard,
 *       microTiming,
 *       trustScore,
 *       executionNotes
 *     }
 * - No external backend integration.
 * - No API calls.
 * - Modular, extendable, and aligned with Level 21–24 architecture.
 */

import type { RefinedDecision } from '../refinement/StrategicRefinementLattice';
import { getMarketSimulationEngine } from '../simulation/MarketSimulationEngine';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Final executable trade structure
 */
export interface ExecutableTradeOrder {
  orderType: 'MARKET' | 'LIMIT' | 'ADAPTIVE';
  entryPriceTarget: number;      // Target entry price
  fallbackPrice: number;         // Fallback price if target not hit
  size: number;                  // Position size (0-1)
  slippageGuard: SlippageGuard;
  microTiming: MicroTiming;
  trustScore: number;            // 0-100, combined confidence metric
  executionNotes: string[];
  metadata: ExecutionMetadata;
}

/**
 * Slippage protection configuration
 */
export interface SlippageGuard {
  maxSlippageBps: number;        // Max slippage in basis points (1 bps = 0.01%)
  priceRange: {
    min: number;                 // Minimum acceptable price
    max: number;                 // Maximum acceptable price
  };
  adaptiveThreshold: number;     // When to switch from LIMIT to MARKET
  enabled: boolean;
}

/**
 * Micro-timing configuration
 */
export interface MicroTiming {
  targetTimestamp: number;       // Exact timestamp to execute (milliseconds)
  windowMs: number;              // Execution window (milliseconds)
  urgency: 'IMMEDIATE' | 'PATIENT' | 'DELAYED';
  delayReason?: string;
}

/**
 * Execution metadata for logging and analysis
 */
export interface ExecutionMetadata {
  executionTime: number;         // Milliseconds taken to generate execution plan
  marketChecks: MarketCheckResults;
  confidenceBreakdown: ConfidenceBreakdown;
  timestamp: number;
  warnings: string[];
}

/**
 * Market check results from micro-scanners
 */
export interface MarketCheckResults {
  spreadCheck: {
    spread: number;              // Current spread in basis points
    acceptable: boolean;
    threshold: number;
  };
  liquidityPulse: {
    depth: number;               // Order book depth (0-100)
    sufficient: boolean;
    minRequired: number;
  };
  volatilityTicks: {
    recentVolatility: number;    // 0-100
    stable: boolean;
    threshold: number;
  };
  allPassed: boolean;
}

/**
 * Confidence breakdown for transparency
 */
export interface ConfidenceBreakdown {
  refinementConfidence: number;  // From refined decision
  stabilityScore: number;        // From safety checks
  marketConditions: number;      // From micro-checks
  finalTrustScore: number;       // Combined score
}

/**
 * Market data input for micro-checks
 */
export interface MarketDataInput {
  currentPrice: number;
  bidPrice: number;
  askPrice: number;
  orderBookDepth: number;        // 0-100
  recentVolatility: number;      // 0-100
}

// ============================================================================
// EXECUTION PRECISION CORE CLASS
// ============================================================================

export class ExecutionPrecisionCore {
  // Configuration thresholds
  private readonly CONFIDENCE_THRESHOLDS = {
    market: 80,                  // Use MARKET order if confidence >= 80
    limit: 50,                   // Use LIMIT order if confidence >= 50
    adaptive: 60,                // Use ADAPTIVE if between 60-80
  };

  private readonly SLIPPAGE_LIMITS = {
    high: 10,                    // Max 10 bps for high confidence
    medium: 25,                  // Max 25 bps for medium confidence
    low: 50,                     // Max 50 bps for low confidence
  };

  private readonly MARKET_CHECK_THRESHOLDS = {
    maxSpreadBps: 30,            // Max acceptable spread
    minLiquidity: 40,            // Min order book depth
    maxVolatility: 75,           // Max recent volatility
  };

  private readonly VERSION = '24.27.0';

  /**
   * Main execution method
   * Converts refined decision into precise execution parameters
   */
  public execute(
    refinedDecision: RefinedDecision,
    marketData?: MarketDataInput
  ): ExecutableTradeOrder {
    // Use simulated market data if not provided
    if (!marketData && typeof window !== 'undefined') {
      try {
        const engine = getMarketSimulationEngine();
        const state = engine.getMarketState();
        const candles = engine.getCandles('1m', 10);
        
        if (candles.length > 0) {
          const lastCandle = candles[candles.length - 1];
          marketData = {
            currentPrice: state.currentPrice,
            bidPrice: lastCandle.low,
            askPrice: lastCandle.high,
            orderBookDepth: 50 + Math.random() * 30,
            recentVolatility: state.volatility * 100,
          };
        }
      } catch (e) {
        // Fallback if engine not initialized
      }
    }
    
    const startTime = Date.now();
    const executionNotes: string[] = [];
    const warnings: string[] = [];

    // Step 1: Respect Safe Mode - no execution if critical
    if (
      refinedDecision.safety.finalRiskLevel === 'CRITICAL' ||
      !refinedDecision.safety.safeModeRespected
    ) {
      return this.buildSafeModeExecution(refinedDecision, startTime, executionNotes);
    }

    // Step 2: Run micro-market checks (if market data provided)
    const marketChecks = marketData
      ? this.runMicroMarketChecks(marketData, warnings)
      : this.getMockedMarketChecks();

    if (!marketChecks.allPassed) {
      executionNotes.push('⚠️ Market checks failed - adjusting execution strategy');
    }

    // Step 3: Derive order type based on confidence
    const orderType = this.deriveOrderType(
      refinedDecision.confidence,
      marketChecks,
      executionNotes
    );

    // Step 4: Calculate entry price target
    const priceTarget = this.calculateEntryPriceTarget(
      refinedDecision,
      orderType,
      marketData
    );

    // Step 5: Calculate fallback price (safety re-entry)
    const fallbackPrice = this.calculateFallbackPrice(
      priceTarget.entryPriceTarget,
      refinedDecision,
      orderType
    );

    // Step 6: Apply slippage guard
    const slippageGuard = this.applySlippageGuard(
      priceTarget.entryPriceTarget,
      refinedDecision.confidence,
      marketChecks.volatilityTicks.recentVolatility,
      orderType
    );

    // Step 7: Generate micro-timing
    const microTiming = this.generateMicroTiming(
      refinedDecision.timing,
      marketChecks,
      executionNotes
    );

    // Step 8: Calculate trust score
    const confidenceBreakdown = this.calculateTrustScore(
      refinedDecision,
      marketChecks
    );

    // Step 9: Final validation
    if (confidenceBreakdown.finalTrustScore < 30) {
      warnings.push('Low trust score - consider delaying execution');
      executionNotes.push(`Trust score ${confidenceBreakdown.finalTrustScore.toFixed(1)} below threshold`);
    }

    // Step 10: Build executable trade order
    const executable: ExecutableTradeOrder = {
      orderType,
      entryPriceTarget: priceTarget.entryPriceTarget,
      fallbackPrice,
      size: refinedDecision.size,
      slippageGuard,
      microTiming,
      trustScore: confidenceBreakdown.finalTrustScore,
      executionNotes,
      metadata: {
        executionTime: Date.now() - startTime,
        marketChecks,
        confidenceBreakdown,
        timestamp: Date.now(),
        warnings,
      },
    };

    return executable;
  }

  // =========================================================================
  // PRIVATE HELPER METHODS
  // =========================================================================

  /**
   * Build a safe mode execution (no trading)
   */
  private buildSafeModeExecution(
    decision: RefinedDecision,
    startTime: number,
    notes: string[]
  ): ExecutableTradeOrder {
    notes.push('🛡️ SAFE MODE: Execution blocked due to critical risk level');

    return {
      orderType: 'LIMIT',
      entryPriceTarget: 0,
      fallbackPrice: 0,
      size: 0,
      slippageGuard: {
        maxSlippageBps: 0,
        priceRange: { min: 0, max: 0 },
        adaptiveThreshold: 0,
        enabled: false,
      },
      microTiming: {
        targetTimestamp: Date.now() + 60000, // Delay 1 minute
        windowMs: 0,
        urgency: 'DELAYED',
        delayReason: 'Safe mode active - critical risk detected',
      },
      trustScore: 0,
      executionNotes: notes,
      metadata: {
        executionTime: Date.now() - startTime,
        marketChecks: this.getMockedMarketChecks(),
        confidenceBreakdown: {
          refinementConfidence: decision.confidence,
          stabilityScore: 0,
          marketConditions: 0,
          finalTrustScore: 0,
        },
        timestamp: Date.now(),
        warnings: ['Safe mode enforcement - no execution permitted'],
      },
    };
  }

  /**
   * Run micro-market checks (spread, liquidity, volatility)
   */
  private runMicroMarketChecks(
    marketData: MarketDataInput,
    warnings: string[]
  ): MarketCheckResults {
    // Check 1: Spread check
    const spread = ((marketData.askPrice - marketData.bidPrice) / marketData.currentPrice) * 10000; // basis points
    const spreadAcceptable = spread <= this.MARKET_CHECK_THRESHOLDS.maxSpreadBps;
    if (!spreadAcceptable) {
      warnings.push(`Spread too wide: ${spread.toFixed(1)} bps`);
    }

    // Check 2: Liquidity pulse
    const liquiditySufficient = marketData.orderBookDepth >= this.MARKET_CHECK_THRESHOLDS.minLiquidity;
    if (!liquiditySufficient) {
      warnings.push(`Low liquidity: ${marketData.orderBookDepth.toFixed(1)}`);
    }

    // Check 3: Volatility ticks
    const volatilityStable = marketData.recentVolatility <= this.MARKET_CHECK_THRESHOLDS.maxVolatility;
    if (!volatilityStable) {
      warnings.push(`High volatility: ${marketData.recentVolatility.toFixed(1)}`);
    }

    const allPassed = spreadAcceptable && liquiditySufficient && volatilityStable;

    return {
      spreadCheck: {
        spread,
        acceptable: spreadAcceptable,
        threshold: this.MARKET_CHECK_THRESHOLDS.maxSpreadBps,
      },
      liquidityPulse: {
        depth: marketData.orderBookDepth,
        sufficient: liquiditySufficient,
        minRequired: this.MARKET_CHECK_THRESHOLDS.minLiquidity,
      },
      volatilityTicks: {
        recentVolatility: marketData.recentVolatility,
        stable: volatilityStable,
        threshold: this.MARKET_CHECK_THRESHOLDS.maxVolatility,
      },
      allPassed,
    };
  }

  /**
   * Get mocked market checks (when real data not available)
   */
  private getMockedMarketChecks(): MarketCheckResults {
    return {
      spreadCheck: {
        spread: 15,
        acceptable: true,
        threshold: this.MARKET_CHECK_THRESHOLDS.maxSpreadBps,
      },
      liquidityPulse: {
        depth: 65,
        sufficient: true,
        minRequired: this.MARKET_CHECK_THRESHOLDS.minLiquidity,
      },
      volatilityTicks: {
        recentVolatility: 45,
        stable: true,
        threshold: this.MARKET_CHECK_THRESHOLDS.maxVolatility,
      },
      allPassed: true,
    };
  }

  /**
   * Derive order type based on confidence and market conditions
   */
  private deriveOrderType(
    confidence: number,
    marketChecks: MarketCheckResults,
    notes: string[]
  ): 'MARKET' | 'LIMIT' | 'ADAPTIVE' {
    // Rule 1: High confidence + all checks passed = MARKET
    if (confidence >= this.CONFIDENCE_THRESHOLDS.market && marketChecks.allPassed) {
      notes.push(`MARKET order: High confidence (${confidence.toFixed(1)}) + good market conditions`);
      return 'MARKET';
    }

    // Rule 2: Medium-high confidence = ADAPTIVE
    if (
      confidence >= this.CONFIDENCE_THRESHOLDS.adaptive &&
      confidence < this.CONFIDENCE_THRESHOLDS.market
    ) {
      notes.push(`ADAPTIVE order: Moderate confidence (${confidence.toFixed(1)})`);
      return 'ADAPTIVE';
    }

    // Rule 3: Low-medium confidence or failed checks = LIMIT
    if (confidence >= this.CONFIDENCE_THRESHOLDS.limit || !marketChecks.allPassed) {
      notes.push(
        `LIMIT order: ${
          !marketChecks.allPassed ? 'Market conditions suboptimal' : `Lower confidence (${confidence.toFixed(1)})`
        }`
      );
      return 'LIMIT';
    }

    // Default: LIMIT (safest)
    notes.push('LIMIT order: Default safe execution');
    return 'LIMIT';
  }

  /**
   * Calculate entry price target based on timing and market data
   */
  private calculateEntryPriceTarget(
    refinedDecision: RefinedDecision,
    orderType: 'MARKET' | 'LIMIT' | 'ADAPTIVE',
    marketData?: MarketDataInput
  ): { entryPriceTarget: number } {
    // If market data available, use current price
    if (marketData) {
      const basePrice = marketData.currentPrice;

      // For BUY: aim slightly below current (better entry)
      // For SELL: aim slightly above current (better exit)
      const adjustment = refinedDecision.action === 'BUY' ? -0.001 : 0.001; // 0.1%
      
      let targetPrice = basePrice * (1 + adjustment);

      // MARKET orders use current price
      if (orderType === 'MARKET') {
        targetPrice = basePrice;
      }

      return { entryPriceTarget: targetPrice };
    }

    // Mocked price target (when no real data)
    return { entryPriceTarget: 50000 }; // Example: $50,000 for BTC
  }

  /**
   * Calculate fallback price for safety re-entry
   */
  private calculateFallbackPrice(
    entryTarget: number,
    refinedDecision: RefinedDecision,
    orderType: 'MARKET' | 'LIMIT' | 'ADAPTIVE'
  ): number {
    // Fallback is typically 0.5% away from target
    const fallbackOffset = refinedDecision.action === 'BUY' ? 0.005 : -0.005;
    
    // MARKET orders don't need fallback
    if (orderType === 'MARKET') {
      return entryTarget;
    }

    return entryTarget * (1 + fallbackOffset);
  }

  /**
   * Apply slippage guard based on confidence and volatility
   */
  private applySlippageGuard(
    entryPrice: number,
    confidence: number,
    volatility: number,
    orderType: 'MARKET' | 'LIMIT' | 'ADAPTIVE'
  ): SlippageGuard {
    // Determine max slippage based on confidence
    let maxSlippageBps: number;
    if (confidence >= 80) {
      maxSlippageBps = this.SLIPPAGE_LIMITS.high;
    } else if (confidence >= 50) {
      maxSlippageBps = this.SLIPPAGE_LIMITS.medium;
    } else {
      maxSlippageBps = this.SLIPPAGE_LIMITS.low;
    }

    // Adjust for high volatility
    if (volatility > 70) {
      maxSlippageBps *= 1.5; // Allow more slippage in volatile conditions
    }

    // Calculate price range
    const slippageMultiplier = maxSlippageBps / 10000; // Convert bps to decimal
    const priceMin = entryPrice * (1 - slippageMultiplier);
    const priceMax = entryPrice * (1 + slippageMultiplier);

    // Adaptive threshold (when to switch from LIMIT to MARKET)
    const adaptiveThreshold = maxSlippageBps * 0.7; // 70% of max slippage

    return {
      maxSlippageBps,
      priceRange: {
        min: priceMin,
        max: priceMax,
      },
      adaptiveThreshold,
      enabled: orderType !== 'MARKET', // Slippage guard not needed for MARKET orders
    };
  }

  /**
   * Generate micro-timing for execution
   */
  private generateMicroTiming(
    timing: any,
    marketChecks: MarketCheckResults,
    notes: string[]
  ): MicroTiming {
    const now = Date.now();
    let targetTimestamp = now + timing.entryOffset;
    let windowMs = 5000; // Default 5 second window
    let delayReason: string | undefined;

    // Adjust timing based on market conditions
    if (!marketChecks.allPassed) {
      // Delay if market conditions not ideal
      targetTimestamp += 3000; // Add 3 second delay
      windowMs = 10000; // Wider window
      delayReason = 'Market conditions suboptimal - delaying execution';
      notes.push(delayReason);
    }

    // Immediate execution for urgent timing
    if (timing.urgency === 'IMMEDIATE') {
      targetTimestamp = now;
      windowMs = 1000; // 1 second window
    }

    return {
      targetTimestamp,
      windowMs,
      urgency: timing.urgency,
      delayReason,
    };
  }

  /**
   * Calculate trust score (combined confidence metric)
   */
  private calculateTrustScore(
    refinedDecision: RefinedDecision,
    marketChecks: MarketCheckResults
  ): ConfidenceBreakdown {
    // Component 1: Refinement confidence (50% weight)
    const refinementConfidence = refinedDecision.confidence;

    // Component 2: Stability score (30% weight)
    const stabilityScore =
      refinedDecision.safety.finalRiskLevel === 'LOW'
        ? 90
        : refinedDecision.safety.finalRiskLevel === 'MODERATE'
        ? 65
        : refinedDecision.safety.finalRiskLevel === 'HIGH'
        ? 40
        : 10;

    // Component 3: Market conditions (20% weight)
    const marketConditions = marketChecks.allPassed
      ? 85
      : (marketChecks.spreadCheck.acceptable ? 30 : 0) +
        (marketChecks.liquidityPulse.sufficient ? 30 : 0) +
        (marketChecks.volatilityTicks.stable ? 25 : 0);

    // Calculate weighted final trust score
    const finalTrustScore =
      refinementConfidence * 0.5 +
      stabilityScore * 0.3 +
      marketConditions * 0.2;

    return {
      refinementConfidence,
      stabilityScore,
      marketConditions,
      finalTrustScore: Math.max(0, Math.min(100, finalTrustScore)),
    };
  }

  /**
   * Get version
   */
  public getVersion(): string {
    return this.VERSION;
  }

  /**
   * Get configuration thresholds
   */
  public getConfig() {
    return {
      confidenceThresholds: { ...this.CONFIDENCE_THRESHOLDS },
      slippageLimits: { ...this.SLIPPAGE_LIMITS },
      marketCheckThresholds: { ...this.MARKET_CHECK_THRESHOLDS },
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let instance: ExecutionPrecisionCore | null = null;

export function getExecutionPrecisionCore(): ExecutionPrecisionCore {
  if (!instance) {
    instance = new ExecutionPrecisionCore();
  }
  return instance;
}

// Default export
export default ExecutionPrecisionCore;
