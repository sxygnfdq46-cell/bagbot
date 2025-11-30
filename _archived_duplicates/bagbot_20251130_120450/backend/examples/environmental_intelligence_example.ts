// ═══════════════════════════════════════════════════════════════════
// ENVIRONMENTAL INTELLIGENCE USAGE EXAMPLE
// ═══════════════════════════════════════════════════════════════════
// Demonstrates how to use the new Level 22 analytics integration
// Location: /bagbot/backend/core/TradingPipelineCore.ts
//          /bagbot/backend/core/DecisionEngine.ts
//          /bagbot/backend/analytics/

/**
 * EXAMPLE 1: USING TRADING PIPELINE WITH ANALYTICS
 * 
 * The TradingPipelineCore now automatically enriches all signals with
 * environmental intelligence before processing.
 */

// Get singleton instance
const pipeline = TradingPipelineCore.getInstance();

// Update analytics with current price (call this on every tick)
pipeline.updateAnalytics(50250);

// Check current environmental state
const environment = pipeline.getEnvironment();
console.log('Volatility:', environment.volatility?.level); // LOW/MEDIUM/HIGH/EXTREME
console.log('Regime:', environment.regime?.regime); // RANGING/TRENDING/BREAKOUT/COMPRESSION
console.log('Heat:', environment.heat?.heat); // 0-100
console.log('Noise:', environment.noise?.noise); // 0-100

// Create and process a signal
const signal: TradingSignal = {
  id: 'SIG-001',
  type: 'BUY',
  symbol: 'BTC/USD',
  confidence: 75,
  fusionScore: 82,
  riskLevel: 'MEDIUM',
  source: 'fusion',
  timestamp: Date.now(),
};

// Process signal (automatically enriched with environment)
const result = await pipeline.processSignal(signal);

// The signal now has environmental context in signal.environment
// Risk filters use this to adjust position sizing and block risky signals

/**
 * EXAMPLE 2: USING DECISION ENGINE WITH ENVIRONMENTAL CONTEXT
 * 
 * The DecisionEngine now accepts environmental context in DecisionInputs
 * and adapts decisions based on volatility/regime/heat/noise.
 */

const decisionEngine = DecisionEngine.getInstance();

// Create decision inputs with environmental context
const inputs: DecisionInputs = {
  rawFusion: { /* ... */ },
  stabilizedFusion: { /* ... */ },
  shieldState: 'Green',
  emotionalDegradation: 0.05,
  executionWarning: false,
  memoryUnstable: false,
  volatilityIndex: 0.35,
  trendStrength: 'UP',
  driftRate: 0.02,
  
  // NEW: Environmental intelligence
  environment: pipeline.getEnvironment(),
};

// Make decision (automatically applies environmental adaptations)
const decision = decisionEngine.decide(inputs);

/**
 * ENVIRONMENTAL ADAPTATIONS APPLIED:
 * 
 * 1. VOLATILITY MULTIPLIER:
 *    - LOW: 1.0x confidence (full)
 *    - MEDIUM: 0.9x confidence
 *    - HIGH: 0.7x confidence
 *    - EXTREME: 0.5x confidence
 * 
 * 2. REGIME BOOST:
 *    - COMPRESSION regime: +10% confidence (pre-breakout setup)
 * 
 * 3. HEAT PENALTY:
 *    - OVERHEATED (>80): -15% confidence (exhaustion risk)
 * 
 * 4. NOISE BLOCKING:
 *    - NOISY (>70): Force WAIT (high whipsaw risk)
 */

/**
 * EXAMPLE 3: RISK FILTER INTEGRATION
 * 
 * TradingPipelineCore risk filters now check environmental conditions:
 */

// BLOCKED CONDITIONS:
// - EXTREME volatility: "EXTREME volatility - market too unstable"
// - OVERHEATED: "Market OVERHEATED - exhaustion risk"
// - NOISY: "Market NOISY - high whipsaw risk"

// POSITION SIZE ADJUSTMENTS:
// Base adjustment * volatilityMultiplier
// Example: 50% base * 0.7 (HIGH vol) = 35% position size

/**
 * EXAMPLE 4: SCENARIO TESTING
 */

// Scenario 1: Clean trending market
const trendingPrices = [50000, 50050, 50100, 50150, 50200];
trendingPrices.forEach(p => pipeline.updateAnalytics(p));
// Expected: LOW volatility, TRENDING regime, full confidence

// Scenario 2: High volatility
const volatilePrices = [50000, 51000, 49500, 52000, 48000];
volatilePrices.forEach(p => pipeline.updateAnalytics(p));
// Expected: HIGH/EXTREME volatility, 0.5-0.7x risk multiplier

// Scenario 3: Choppy/ranging
const choppyPrices = [50000, 50100, 49900, 50050, 49950];
choppyPrices.forEach(p => pipeline.updateAnalytics(p));
// Expected: RANGING regime, HIGH noise, signals may be blocked

// Scenario 4: Compression (pre-breakout)
const compressionPrices = Array.from({ length: 30 }, () => 50000 + Math.random() * 50);
compressionPrices.forEach(p => pipeline.updateAnalytics(p));
// Expected: COMPRESSION regime, +10% confidence boost on breakout signals

/**
 * KEY METHODS:
 * 
 * TradingPipelineCore:
 *   - updateAnalytics(price: number): void
 *   - getEnvironment(): { volatility, regime, heat, noise }
 *   - processSignal(signal): Promise<ExecutionStub | null>
 * 
 * Analytics Engines (accessed via getEnvironment()):
 *   - VolatilityEngine: getRiskMultiplier(), getReading()
 *   - RegimeScanner: isTrending(), isCompression(), isBreakout()
 *   - HeatIndex: isOverheated(), isCold(), getConfidenceMultiplier()
 *   - NoiseFilter: isNoisy(), shouldBlockSignals(), getConfidenceMultiplier()
 */

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 1: USING TRADING PIPELINE WITH ANALYTICS
// ═══════════════════════════════════════════════════════════════════

async function tradingPipelineExample() {
  console.log('🌊 Example 1: Trading Pipeline with Environmental Intelligence\n');

  // Get singleton instance
  const pipeline = TradingPipelineCore.getInstance();

  // Simulate price updates (normally from live market feed)
  const prices = [
    50000, 50100, 50050, 50150, 50120, 50180, 50220, 50190, 50250, 50280,
    50320, 50350, 50380, 50420, 50450, 50480, 50510, 50540, 50570, 50600,
  ];

  // Feed prices to analytics engines
  console.log('📊 Updating analytics with price data...');
  for (const price of prices) {
    pipeline.updateAnalytics(price);
  }

  // Check current environmental state
  const environment = pipeline.getEnvironment();
  console.log('\n🌍 Current Environmental State:');
  console.log('  Volatility:', environment.volatility?.level, `(score: ${environment.volatility?.score.toFixed(1)})`);
  console.log('  Regime:', environment.regime?.regime, `(confidence: ${environment.regime?.confidence.toFixed(1)}%)`);
  console.log('  Heat:', environment.heat?.heat.toFixed(1), `(zone: ${getHeatZone(environment.heat?.heat || 0)})`);
  console.log('  Noise:', environment.noise?.noise.toFixed(1), `(zone: ${getNoiseZone(environment.noise?.noise || 0)})`);

  // Create a trading signal
  const signal: TradingSignal = {
    id: 'SIG-TEST-001',
    type: 'BUY',
    symbol: 'BTC/USD',
    confidence: 75,
    fusionScore: 82,
    riskLevel: 'MEDIUM',
    source: 'fusion',
    timestamp: Date.now(),
  };

  console.log('\n📈 Processing signal:', signal.type, signal.symbol);
  console.log('  Initial Confidence:', signal.confidence);
  console.log('  Fusion Score:', signal.fusionScore);

  // Process signal (automatically enriched with environment)
  const result = await pipeline.processSignal(signal);

  if (result) {
    console.log('\n✅ Signal PASSED risk filters');
    console.log('  Order ID:', result.orderId);
    console.log('  Status:', result.status);
    console.log('  Adjustments:');
    console.log('    - Position Size:', result.signal.riskLevel);
  } else {
    console.log('\n❌ Signal BLOCKED by risk filters');
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 2: USING DECISION ENGINE WITH ENVIRONMENTAL CONTEXT
// ═══════════════════════════════════════════════════════════════════

function decisionEngineExample() {
  console.log('\n🧠 Example 2: Decision Engine with Environmental Intelligence\n');

  const decisionEngine = DecisionEngine.getInstance();
  const pipeline = TradingPipelineCore.getInstance();

  // Get current environment
  const environment = pipeline.getEnvironment();

  // Create decision inputs
  const inputs: DecisionInputs = {
    // Fusion data (mock for example)
    rawFusion: {
      fusionScore: 78.5,
      confidence: 82,
      signal: 'BULLISH_CONFIRMATION',
      timestamp: Date.now(),
      components: {
        technical: 75,
        sentiment: 80,
        volume: 82,
      },
    },
    stabilizedFusion: {
      score: 76.2,
      confidence: 80,
      signal: 'BUY_STRONG',
      stability: 0.95,
      timestamp: Date.now(),
    },

    // Shield intelligence
    shieldState: 'Green',
    emotionalDegradation: 0.05,
    executionWarning: false,
    memoryUnstable: false,

    // Market data
    volatilityIndex: 0.35,
    trendStrength: 'UP',
    driftRate: 0.02,

    // NEW: Environmental intelligence
    environment,
  };

  console.log('📊 Decision Inputs:');
  console.log('  Fusion Score:', inputs.stabilizedFusion.score);
  console.log('  Shield State:', inputs.shieldState);
  console.log('  Trend:', inputs.trendStrength);
  console.log('  Volatility Index:', inputs.volatilityIndex);

  if (environment.volatility) {
    console.log('\n🌊 Environmental Context:');
    console.log('  Volatility Level:', environment.volatility.level);
    console.log('  Market Regime:', environment.regime?.regime);
    console.log('  Heat Level:', environment.heat?.heat.toFixed(1));
    console.log('  Noise Level:', environment.noise?.noise.toFixed(1));
  }

  // Make decision
  const decision = decisionEngine.decide(inputs);

  console.log('\n🎯 DECISION OUTPUT:');
  console.log('  Action:', decision.action);
  console.log('  Confidence:', decision.confidence.toFixed(1) + '%');
  console.log('  Risk Level:', decision.risk);
  console.log('  Reasons:');
  decision.reason.forEach((r, i) => console.log(`    ${i + 1}. ${r}`));
}

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE 3: SCENARIO TESTING
// ═══════════════════════════════════════════════════════════════════

async function scenarioTesting() {
  console.log('\n🧪 Example 3: Scenario Testing\n');

  const pipeline = TradingPipelineCore.getInstance();

  // Scenario 1: Stable trending market
  console.log('📈 Scenario 1: STABLE TRENDING MARKET');
  const trendingPrices = Array.from({ length: 50 }, (_, i) => 50000 + i * 50);
  trendingPrices.forEach(p => pipeline.updateAnalytics(p));
  
  let env = pipeline.getEnvironment();
  console.log('  Volatility:', env.volatility?.level);
  console.log('  Regime:', env.regime?.regime);
  console.log('  Expected: LOW volatility, TRENDING regime');

  // Scenario 2: High volatility
  console.log('\n⚡ Scenario 2: HIGH VOLATILITY MARKET');
  const volatilePrices = [50000, 51000, 49500, 52000, 48000, 53000, 47000];
  volatilePrices.forEach(p => pipeline.updateAnalytics(p));
  
  env = pipeline.getEnvironment();
  console.log('  Volatility:', env.volatility?.level);
  console.log('  Risk Multiplier:', env.volatility ? getRiskMultiplier(env.volatility.level) : 1.0);
  console.log('  Expected: HIGH or EXTREME volatility');

  // Scenario 3: Choppy/ranging market
  console.log('\n🌀 Scenario 3: CHOPPY RANGING MARKET');
  const choppyPrices = [50000, 50100, 49900, 50050, 49950, 50080, 49920, 50060];
  choppyPrices.forEach(p => pipeline.updateAnalytics(p));
  
  env = pipeline.getEnvironment();
  console.log('  Regime:', env.regime?.regime);
  console.log('  Noise Level:', env.noise?.noise.toFixed(1));
  console.log('  Expected: RANGING regime, HIGH noise');

  // Scenario 4: Compression (tight range before breakout)
  console.log('\n🔒 Scenario 4: COMPRESSION (Pre-Breakout)');
  const compressionPrices = Array.from({ length: 30 }, () => 50000 + Math.random() * 50);
  compressionPrices.forEach(p => pipeline.updateAnalytics(p));
  
  env = pipeline.getEnvironment();
  console.log('  Regime:', env.regime?.regime);
  console.log('  Range Width:', env.regime?.rangeWidth.toFixed(4));
  console.log('  Expected: COMPRESSION regime (breakout setup)');
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function getHeatZone(heat: number): string {
  if (heat < 20) return 'COLD';
  if (heat < 40) return 'COOL';
  if (heat < 60) return 'MODERATE';
  if (heat < 80) return 'WARM';
  return 'OVERHEATED';
}

function getNoiseZone(noise: number): string {
  if (noise < 30) return 'CLEAN';
  if (noise < 50) return 'MODERATE';
  if (noise < 70) return 'CHOPPY';
  return 'NOISY';
}

function getRiskMultiplier(level: string): number {
  switch (level) {
    case 'LOW': return 1.0;
    case 'MEDIUM': return 0.8;
    case 'HIGH': return 0.5;
    case 'EXTREME': return 0.25;
    default: return 1.0;
  }
}

// ═══════════════════════════════════════════════════════════════════
// RUN EXAMPLES
// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🌊 BAGBOT ENVIRONMENTAL INTELLIGENCE — USAGE EXAMPLES');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    await tradingPipelineExample();
    console.log('\n' + '─'.repeat(60) + '\n');
    
    decisionEngineExample();
    console.log('\n' + '─'.repeat(60) + '\n');
    
    await scenarioTesting();
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ ALL EXAMPLES COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { tradingPipelineExample, decisionEngineExample, scenarioTesting };
