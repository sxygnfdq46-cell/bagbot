/**
 * Pattern Service - React Integration for Pattern Sync Engine
 * 
 * Provides React-friendly interface to Pattern Sync Engine.
 * Manages pattern synchronization, heatmap updates, and zone computation.
 */

import { PatternSyncEngine, MasterPattern, HeatmapData, RiskZone, OpportunityZone } from '@/app/lib/patterns/PatternSyncEngine';
import { PatternType } from '@/app/lib/patterns/patternRules';
import { addPatternAnalysis, updateHeatmapData, updateRiskZones, updateOpportunityZones } from '@/app/state/patternState';

/**
 * Signal source for pattern analysis
 */
interface SignalSource {
  engine: string;
  confidence: number;
  weight: number;
  data: any;
}

/**
 * Pattern analysis result
 */
interface PatternAnalysis {
  pattern: MasterPattern;
  action: 'ENTER' | 'EXIT' | 'HOLD' | 'AVOID';
  confidence: number;
  reasoning: string[];
  warnings: string[];
  opportunities: string[];
}

// Event listeners
type PatternListener = (pattern: MasterPattern) => void;
type AnalysisListener = (analysis: PatternAnalysis) => void;
type HeatmapListener = (data: HeatmapData[]) => void;
type ZoneListener = (zones: RiskZone[] | OpportunityZone[]) => void;
type SyncListener = () => void;

const patternDetectedListeners: PatternListener[] = [];
const analysisCompleteListeners: AnalysisListener[] = [];
const heatmapUpdatedListeners: HeatmapListener[] = [];
const riskZonesUpdatedListeners: ZoneListener[] = [];
const opportunityZonesUpdatedListeners: ZoneListener[] = [];
const syncCompleteListeners: SyncListener[] = [];
const criticalPatternListeners: PatternListener[] = [];

// ============================================================================
// Core Pattern Operations
// ============================================================================

/**
 * Sync patterns from multiple engine signals
 */
export function syncPatterns(
  symbol: string,
  timeframe: string,
  price: number,
  signals: SignalSource[]
): PatternAnalysis | null {
  try {
    const analysis = PatternSyncEngine.analyzePattern(symbol, timeframe, price, signals);
    
    if (analysis) {
      // Store in state
      addPatternAnalysis(analysis);
      
      // Trigger listeners
      patternDetectedListeners.forEach(listener => {
        try {
          listener(analysis.pattern);
        } catch (error) {
          console.error('[Pattern Service] Listener error:', error);
        }
      });
      
      analysisCompleteListeners.forEach(listener => {
        try {
          listener(analysis);
        } catch (error) {
          console.error('[Pattern Service] Listener error:', error);
        }
      });
      
      // Check for critical patterns
      if (analysis.pattern.significance === 'CRITICAL') {
        criticalPatternListeners.forEach(listener => {
          try {
            listener(analysis.pattern);
          } catch (error) {
            console.error('[Pattern Service] Listener error:', error);
          }
        });
      }
      
      console.log('[Pattern Service] Pattern synced:', {
        type: analysis.pattern.type,
        action: analysis.action,
        confidence: analysis.confidence.toFixed(1),
      });
    }
    
    return analysis;
  } catch (error) {
    console.error('[Pattern Service] Sync error:', error);
    return null;
  }
}

/**
 * Sync multiple patterns in batch
 */
export function syncPatternBatch(
  symbol: string,
  timeframe: string,
  pricePoints: number[],
  signalsBatch: SignalSource[][]
): PatternAnalysis[] {
  const analyses: PatternAnalysis[] = [];
  
  for (let i = 0; i < pricePoints.length && i < signalsBatch.length; i++) {
    const analysis = syncPatterns(symbol, timeframe, pricePoints[i], signalsBatch[i]);
    if (analysis) {
      analyses.push(analysis);
    }
  }
  
  console.log('[Pattern Service] Batch synced:', analyses.length, 'patterns');
  return analyses;
}

/**
 * Update master pattern map
 */
export function updateMasterPatternMap(patterns: MasterPattern[]): void {
  try {
    PatternSyncEngine.updateMasterPatternMap(patterns);
    console.log('[Pattern Service] Master pattern map updated:', patterns.length, 'patterns');
  } catch (error) {
    console.error('[Pattern Service] Update error:', error);
  }
}

/**
 * Get pattern by ID
 */
export function getPattern(id: string): MasterPattern | undefined {
  return PatternSyncEngine.getPattern(id);
}

/**
 * Get patterns by symbol
 */
export function getPatternsBySymbol(symbol: string): MasterPattern[] {
  return PatternSyncEngine.getPatternsBySymbol(symbol);
}

/**
 * Get active patterns
 */
export function getActivePatterns(): MasterPattern[] {
  return PatternSyncEngine.getActivePatterns();
}

// ============================================================================
// Heatmap Management
// ============================================================================

/**
 * Update heatmap for symbol/timeframe
 */
export function updateHeatmap(
  symbol: string,
  timeframe: string,
  priceRange: number[]
): HeatmapData[] {
  try {
    const heatmap = PatternSyncEngine.updateHeatmap(symbol, timeframe, priceRange);
    
    // Store in state
    updateHeatmapData(symbol, timeframe, heatmap);
    
    // Trigger listeners
    heatmapUpdatedListeners.forEach(listener => {
      try {
        listener(heatmap);
      } catch (error) {
        console.error('[Pattern Service] Listener error:', error);
      }
    });
    
    console.log('[Pattern Service] Heatmap updated:', heatmap.length, 'data points');
    return heatmap;
  } catch (error) {
    console.error('[Pattern Service] Heatmap update error:', error);
    return [];
  }
}

/**
 * Get cached heatmap
 */
export function getHeatmap(symbol: string, timeframe: string): HeatmapData[] | undefined {
  return PatternSyncEngine.getHeatmap(symbol, timeframe);
}

/**
 * Generate heatmap for current market conditions
 */
export function generateMarketHeatmap(
  symbol: string,
  timeframes: string[],
  currentPrice: number,
  range: number = 0.05 // 5% range
): Map<string, HeatmapData[]> {
  const heatmaps = new Map<string, HeatmapData[]>();
  
  const minPrice = currentPrice * (1 - range);
  const maxPrice = currentPrice * (1 + range);
  const priceRange = Array.from({ length: 20 }, (_, i) => 
    minPrice + (i / 19) * (maxPrice - minPrice)
  );
  
  timeframes.forEach(timeframe => {
    const heatmap = updateHeatmap(symbol, timeframe, priceRange);
    heatmaps.set(timeframe, heatmap);
  });
  
  return heatmaps;
}

// ============================================================================
// Risk & Opportunity Zones
// ============================================================================

/**
 * Compute risk zones for symbol
 */
export function computeRiskZones(symbol: string): RiskZone[] {
  try {
    const zones = PatternSyncEngine.computeRiskZones(symbol);
    
    // Store in state
    updateRiskZones(zones);
    
    // Trigger listeners
    riskZonesUpdatedListeners.forEach(listener => {
      try {
        listener(zones);
      } catch (error) {
        console.error('[Pattern Service] Listener error:', error);
      }
    });
    
    console.log('[Pattern Service] Risk zones computed:', zones.length, 'zones');
    return zones;
  } catch (error) {
    console.error('[Pattern Service] Risk zones error:', error);
    return [];
  }
}

/**
 * Compute opportunity zones for symbol
 */
export function computeOpportunityZones(symbol: string): OpportunityZone[] {
  try {
    const zones = PatternSyncEngine.computeOpportunityZones(symbol);
    
    // Store in state
    updateOpportunityZones(zones);
    
    // Trigger listeners
    opportunityZonesUpdatedListeners.forEach(listener => {
      try {
        listener(zones);
      } catch (error) {
        console.error('[Pattern Service] Listener error:', error);
      }
    });
    
    console.log('[Pattern Service] Opportunity zones computed:', zones.length, 'zones');
    return zones;
  } catch (error) {
    console.error('[Pattern Service] Opportunity zones error:', error);
    return [];
  }
}

/**
 * Get current risk zones
 */
export function getRiskZones(): RiskZone[] {
  return PatternSyncEngine.getRiskZones();
}

/**
 * Get current opportunity zones
 */
export function getOpportunityZones(): OpportunityZone[] {
  return PatternSyncEngine.getOpportunityZones();
}

/**
 * Compute all zones for symbol
 */
export function computeAllZones(symbol: string): {
  riskZones: RiskZone[];
  opportunityZones: OpportunityZone[];
} {
  const riskZones = computeRiskZones(symbol);
  const opportunityZones = computeOpportunityZones(symbol);
  
  return { riskZones, opportunityZones };
}

// ============================================================================
// Engine State Updates
// ============================================================================

/**
 * Update engine states (Shield, Threat, Regime, Volatility)
 */
export function updateEngineStates(states: {
  shieldActive?: boolean;
  threatLevel?: number;
  regime?: string;
  volatilityLevel?: number;
}): void {
  try {
    if (states.shieldActive !== undefined) {
      PatternSyncEngine.updateShieldStatus(states.shieldActive);
    }
    
    if (states.threatLevel !== undefined) {
      PatternSyncEngine.updateThreatLevel(states.threatLevel);
    }
    
    if (states.regime !== undefined) {
      PatternSyncEngine.updateRegime(states.regime);
    }
    
    if (states.volatilityLevel !== undefined) {
      PatternSyncEngine.updateVolatilityLevel(states.volatilityLevel);
    }
    
    console.log('[Pattern Service] Engine states updated:', states);
  } catch (error) {
    console.error('[Pattern Service] State update error:', error);
  }
}

/**
 * Update shield status
 */
export function updateShieldStatus(active: boolean): void {
  PatternSyncEngine.updateShieldStatus(active);
}

/**
 * Update threat level
 */
export function updateThreatLevel(level: number): void {
  PatternSyncEngine.updateThreatLevel(level);
}

/**
 * Update regime
 */
export function updateRegime(regime: string): void {
  PatternSyncEngine.updateRegime(regime);
}

/**
 * Update volatility level
 */
export function updateVolatilityLevel(level: number): void {
  PatternSyncEngine.updateVolatilityLevel(level);
}

// ============================================================================
// Integration with Other Engines
// ============================================================================

/**
 * Integrate Shield engine signal
 */
export function integrateShieldSignal(
  symbol: string,
  confidence: number,
  data: any
): SignalSource {
  return {
    engine: 'SHIELD',
    confidence,
    weight: 1.5, // High weight for shield
    data,
  };
}

/**
 * Integrate Threat engine signal
 */
export function integrateThreatSignal(
  symbol: string,
  confidence: number,
  data: any
): SignalSource {
  return {
    engine: 'THREAT',
    confidence,
    weight: 1.3, // High weight for threat
    data,
  };
}

/**
 * Integrate RL Core signal
 */
export function integrateRLSignal(
  symbol: string,
  confidence: number,
  data: any
): SignalSource {
  return {
    engine: 'RL_CORE',
    confidence,
    weight: 1.2, // Moderate-high weight for learning
    data,
  };
}

/**
 * Integrate Fusion signal
 */
export function integrateFusionSignal(
  symbol: string,
  confidence: number,
  data: any
): SignalSource {
  return {
    engine: 'FUSION',
    confidence,
    weight: 1.4, // High weight for fusion
    data,
  };
}

/**
 * Integrate Strategy Selector signal
 */
export function integrateStrategySignal(
  symbol: string,
  confidence: number,
  data: any
): SignalSource {
  return {
    engine: 'STRATEGY',
    confidence,
    weight: 1.0, // Standard weight
    data,
  };
}

/**
 * Integrate DVBE signal
 */
export function integrateDVBESignal(
  symbol: string,
  confidence: number,
  data: any
): SignalSource {
  return {
    engine: 'DVBE',
    confidence,
    weight: 1.1, // Moderate-high weight
    data,
  };
}

/**
 * Integrate MFAE signal
 */
export function integrateMFAESignal(
  symbol: string,
  confidence: number,
  data: any
): SignalSource {
  return {
    engine: 'MFAE',
    confidence,
    weight: 1.1, // Moderate-high weight
    data,
  };
}

// ============================================================================
// Event Listeners
// ============================================================================

/**
 * Listen for pattern detections
 */
export function onPatternDetected(listener: PatternListener): () => void {
  patternDetectedListeners.push(listener);
  return () => {
    const index = patternDetectedListeners.indexOf(listener);
    if (index > -1) patternDetectedListeners.splice(index, 1);
  };
}

/**
 * Listen for analysis completions
 */
export function onAnalysisComplete(listener: AnalysisListener): () => void {
  analysisCompleteListeners.push(listener);
  return () => {
    const index = analysisCompleteListeners.indexOf(listener);
    if (index > -1) analysisCompleteListeners.splice(index, 1);
  };
}

/**
 * Listen for heatmap updates
 */
export function onHeatmapUpdated(listener: HeatmapListener): () => void {
  heatmapUpdatedListeners.push(listener);
  return () => {
    const index = heatmapUpdatedListeners.indexOf(listener);
    if (index > -1) heatmapUpdatedListeners.splice(index, 1);
  };
}

/**
 * Listen for risk zone updates
 */
export function onRiskZonesUpdated(listener: ZoneListener): () => void {
  riskZonesUpdatedListeners.push(listener);
  return () => {
    const index = riskZonesUpdatedListeners.indexOf(listener);
    if (index > -1) riskZonesUpdatedListeners.splice(index, 1);
  };
}

/**
 * Listen for opportunity zone updates
 */
export function onOpportunityZonesUpdated(listener: ZoneListener): () => void {
  opportunityZonesUpdatedListeners.push(listener);
  return () => {
    const index = opportunityZonesUpdatedListeners.indexOf(listener);
    if (index > -1) opportunityZonesUpdatedListeners.splice(index, 1);
  };
}

/**
 * Listen for sync completions
 */
export function onSyncComplete(listener: SyncListener): () => void {
  syncCompleteListeners.push(listener);
  return () => {
    const index = syncCompleteListeners.indexOf(listener);
    if (index > -1) syncCompleteListeners.splice(index, 1);
  };
}

/**
 * Listen for critical patterns
 */
export function onCriticalPattern(listener: PatternListener): () => void {
  criticalPatternListeners.push(listener);
  return () => {
    const index = criticalPatternListeners.indexOf(listener);
    if (index > -1) criticalPatternListeners.splice(index, 1);
  };
}

// ============================================================================
// Statistics & Summary
// ============================================================================

/**
 * Get pattern summary
 */
export function getPatternSummary() {
  return PatternSyncEngine.getPatternSummary();
}

/**
 * Get comprehensive market analysis
 */
export function getMarketAnalysis(symbol: string): {
  patterns: MasterPattern[];
  activePatterns: MasterPattern[];
  riskZones: RiskZone[];
  opportunityZones: OpportunityZone[];
  summary: any;
} {
  const patterns = getPatternsBySymbol(symbol);
  const activePatterns = getActivePatterns();
  const riskZones = getRiskZones();
  const opportunityZones = getOpportunityZones();
  const summary = getPatternSummary();
  
  return {
    patterns,
    activePatterns,
    riskZones,
    opportunityZones,
    summary,
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if pattern should trigger action
 */
export function shouldActOnPattern(analysis: PatternAnalysis): boolean {
  return (
    analysis.action === 'ENTER' &&
    analysis.confidence > 60 &&
    analysis.warnings.length < 3
  );
}

/**
 * Check if pattern should be avoided
 */
export function shouldAvoidPattern(analysis: PatternAnalysis): boolean {
  return (
    analysis.action === 'AVOID' ||
    analysis.confidence < 40 ||
    analysis.warnings.length >= 3
  );
}

/**
 * Get pattern risk level
 */
export function getPatternRiskLevel(pattern: MasterPattern): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (pattern.riskScore > 80) return 'CRITICAL';
  if (pattern.riskScore > 60) return 'HIGH';
  if (pattern.riskScore > 40) return 'MEDIUM';
  return 'LOW';
}

/**
 * Get pattern opportunity level
 */
export function getPatternOpportunityLevel(pattern: MasterPattern): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCELLENT' {
  if (pattern.opportunityScore > 80) return 'EXCELLENT';
  if (pattern.opportunityScore > 60) return 'HIGH';
  if (pattern.opportunityScore > 40) return 'MEDIUM';
  return 'LOW';
}

// ============================================================================
// Mock Data Helpers (for testing)
// ============================================================================

/**
 * Create mock signal source
 */
export function createMockSignal(
  engine: string,
  confidence: number,
  patternType: PatternType
): SignalSource {
  return {
    engine,
    confidence,
    weight: 1.0,
    data: { patternType },
  };
}

/**
 * Test pattern sync with mock data
 */
export function testPatternSync(): void {
  const mockSignals: SignalSource[] = [
    createMockSignal('SHIELD', 75, PatternType.DOUBLE_BOTTOM),
    createMockSignal('FUSION', 80, PatternType.DOUBLE_BOTTOM),
    createMockSignal('RL_CORE', 70, PatternType.DOUBLE_BOTTOM),
  ];
  
  const analysis = syncPatterns('BTC/USD', '1h', 50000, mockSignals);
  
  if (analysis) {
    console.log('[Pattern Service] Test sync successful:', {
      pattern: analysis.pattern.type,
      action: analysis.action,
      confidence: analysis.confidence,
    });
  } else {
    console.log('[Pattern Service] Test sync failed');
  }
}

// Export service
export const PatternService = {
  // Core operations
  syncPatterns,
  syncPatternBatch,
  updateMasterPatternMap,
  getPattern,
  getPatternsBySymbol,
  getActivePatterns,
  
  // Heatmap
  updateHeatmap,
  getHeatmap,
  generateMarketHeatmap,
  
  // Zones
  computeRiskZones,
  computeOpportunityZones,
  getRiskZones,
  getOpportunityZones,
  computeAllZones,
  
  // Engine states
  updateEngineStates,
  updateShieldStatus,
  updateThreatLevel,
  updateRegime,
  updateVolatilityLevel,
  
  // Integration
  integrateShieldSignal,
  integrateThreatSignal,
  integrateRLSignal,
  integrateFusionSignal,
  integrateStrategySignal,
  integrateDVBESignal,
  integrateMFAESignal,
  
  // Event listeners
  onPatternDetected,
  onAnalysisComplete,
  onHeatmapUpdated,
  onRiskZonesUpdated,
  onOpportunityZonesUpdated,
  onSyncComplete,
  onCriticalPattern,
  
  // Statistics
  getPatternSummary,
  getMarketAnalysis,
  
  // Utilities
  shouldActOnPattern,
  shouldAvoidPattern,
  getPatternRiskLevel,
  getPatternOpportunityLevel,
  
  // Testing
  createMockSignal,
  testPatternSync,
};

export default PatternService;
