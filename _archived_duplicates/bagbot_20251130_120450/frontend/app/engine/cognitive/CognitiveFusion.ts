/**
 * LEVEL 6.2 — COGNITIVE FUSION LAYER
 * Neural anticipation engine that predicts UI reactions 0.5s before data arrives
 * 
 * Makes the UI feel aware and responsive by analyzing:
 * - Volatility trends
 * - API cadence patterns
 * - BIC emotional state trajectories
 * 
 * 100% CLIENT-ONLY | Zero backend calls | Fully SAFE MODE compliant
 */

import { BehaviorOutput, EmotionalState } from '../bic/BehaviorCore';

export interface PredictiveSignal {
  confidence: number;        // 0-100
  anticipatedLoad: number;   // 0-100 (expected system load)
  prewarmIntensity: number;  // 0-100 (UI prewarm strength)
  expectedState: EmotionalState;
  timeToImpact: number;      // milliseconds until predicted event
}

export interface CognitiveOutput {
  // Predictive flags
  volatilitySpike: boolean;
  dataFlood: boolean;
  signalBurst: boolean;
  systemStrain: boolean;
  
  // UI anticipation multipliers
  glowMultiplier: number;      // 0.5-2.0 (prewarm factor)
  pulseMultiplier: number;     // 0.5-2.0 (anticipation pulse)
  intensityMultiplier: number; // 0.5-2.0 (master intensity)
  
  // Micro-prediction window (300-500ms ahead)
  predictiveSignal: PredictiveSignal;
  
  // Emotional-visual binding state
  visualBinding: {
    particleDensity: number;   // 0-100
    quantumFieldWarp: number;  // 0-100
    holoFluxTension: number;   // 0-100
    hyperspaceThreads: number; // 0-100
    cameraDrift: number;       // 0-100
    neonPulse: number;         // 0-100
  };
}

interface CognitiveHistory {
  timestamps: number[];
  emotionalStates: EmotionalState[];
  intensities: number[];
  volatilityRatios: number[];
}

export class CognitiveFusion {
  private history: CognitiveHistory = {
    timestamps: [],
    emotionalStates: [],
    intensities: [],
    volatilityRatios: [],
  };
  
  private maxHistoryLength = 20; // Last 20 observations
  private predictionWindow = 400; // 400ms ahead (middle of 300-500ms range)
  
  /**
   * STAGE 1: PRE-SIGNAL HEAT
   * Estimate future load based on historical patterns
   */
  private calculatePreSignalHeat(): number {
    if (this.history.intensities.length < 3) return 0;
    
    // Calculate velocity (rate of change)
    const recent = this.history.intensities.slice(-3);
    const velocity = recent[2] - recent[0];
    
    // Calculate acceleration (rate of velocity change)
    const velocities: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      velocities.push(recent[i] - recent[i - 1]);
    }
    const acceleration = velocities[1] - velocities[0];
    
    // Heat increases with positive velocity and acceleration
    const heat = Math.max(0, velocity * 2 + acceleration * 3);
    return Math.min(100, heat);
  }
  
  /**
   * STAGE 2: MICRO-PREDICTION WINDOW (300-500ms)
   * Predict next emotional state transition
   */
  private buildPredictiveSignal(currentBehavior: BehaviorOutput): PredictiveSignal {
    const heat = this.calculatePreSignalHeat();
    
    // Analyze volatility trajectory
    const volTrend = this.analyzeVolatilityTrend();
    
    // Predict next state
    const expectedState = this.predictNextState(currentBehavior.emotionalState, volTrend);
    
    // Calculate confidence based on pattern stability
    const confidence = this.calculatePredictionConfidence();
    
    // Estimate load from state
    const anticipatedLoad = this.estimateLoadForState(expectedState);
    
    // Prewarm intensity scales with confidence and heat
    const prewarmIntensity = Math.min(100, (confidence * 0.6 + heat * 0.4));
    
    return {
      confidence,
      anticipatedLoad,
      prewarmIntensity,
      expectedState,
      timeToImpact: this.predictionWindow,
    };
  }
  
  /**
   * STAGE 3: UI ANTICIPATION
   * Adjust visuals ahead of backend updates
   */
  private calculateUIAnticipation(signal: PredictiveSignal): {
    glowMultiplier: number;
    pulseMultiplier: number;
    intensityMultiplier: number;
  } {
    const { prewarmIntensity, confidence } = signal;
    
    // Only anticipate if confidence > 40%
    if (confidence < 40) {
      return {
        glowMultiplier: 1.0,
        pulseMultiplier: 1.0,
        intensityMultiplier: 1.0,
      };
    }
    
    // Scale multipliers with prewarm intensity
    const factor = prewarmIntensity / 100;
    
    return {
      glowMultiplier: 1.0 + (factor * 0.5),      // 1.0-1.5x
      pulseMultiplier: 1.0 + (factor * 0.6),     // 1.0-1.6x
      intensityMultiplier: 1.0 + (factor * 0.4), // 1.0-1.4x
    };
  }
  
  /**
   * UNIFIED EMOTIONAL-VISUAL BINDING
   * Maps emotional states to specific visual system parameters
   */
  private bindEmotionToVisuals(
    emotionalState: EmotionalState,
    intensity: number
  ): CognitiveOutput['visualBinding'] {
    const base = intensity / 100;
    
    switch (emotionalState) {
      case 'calm':
        return {
          particleDensity: 20 + base * 10,     // Sparse, slow drift
          quantumFieldWarp: 15 + base * 10,    // Soft, gentle warp
          holoFluxTension: 10 + base * 5,      // Minimal tension
          hyperspaceThreads: 5,                // Almost none
          cameraDrift: 10 + base * 10,         // Slow drift
          neonPulse: 15 + base * 10,           // Gentle pulse
        };
      
      case 'focused':
        return {
          particleDensity: 40 + base * 20,     // Moderate, sharper
          quantumFieldWarp: 30 + base * 15,    // Clear warp
          holoFluxTension: 30 + base * 15,     // Moderate tension
          hyperspaceThreads: 20 + base * 15,   // Some threads
          cameraDrift: 25 + base * 15,         // Steady movement
          neonPulse: 35 + base * 20,           // Clear pulse
        };
      
      case 'alert':
        return {
          particleDensity: 60 + base * 20,     // Dense
          quantumFieldWarp: 50 + base * 20,    // Strong warp
          holoFluxTension: 60 + base * 20,     // Strong tension
          hyperspaceThreads: 45 + base * 25,   // Many threads
          cameraDrift: 45 + base * 20,         // Active drift
          neonPulse: 60 + base * 25,           // Strong pulse
        };
      
      case 'stressed':
        return {
          particleDensity: 75 + base * 15,     // Very dense
          quantumFieldWarp: 70 + base * 20,    // Heavy warp
          holoFluxTension: 80 + base * 15,     // High tension
          hyperspaceThreads: 75 + base * 20,   // Hyperspace threading increases
          cameraDrift: 60 + base * 20,         // Fast drift
          neonPulse: 75 + base * 20,           // Rapid pulse
        };
      
      case 'overclocked':
        return {
          particleDensity: 90 + base * 10,     // Maximum density
          quantumFieldWarp: 85 + base * 15,    // Extreme warp
          holoFluxTension: 95 + base * 5,      // Maximum tension
          hyperspaceThreads: 95 + base * 5,    // Full threading
          cameraDrift: 85 + base * 15,         // Camera drift maxed
          neonPulse: 95 + base * 5,            // Neon pulse spikes
        };
      
      default:
        return {
          particleDensity: 50,
          quantumFieldWarp: 50,
          holoFluxTension: 50,
          hyperspaceThreads: 50,
          cameraDrift: 50,
          neonPulse: 50,
        };
    }
  }
  
  /**
   * Main fusion method - called by CognitiveFusionProvider at 60fps
   */
  public fuse(currentBehavior: BehaviorOutput): CognitiveOutput {
    // Update history
    this.updateHistory(currentBehavior);
    
    // Build predictive signal
    const predictiveSignal = this.buildPredictiveSignal(currentBehavior);
    
    // Calculate UI anticipation multipliers
    const anticipation = this.calculateUIAnticipation(predictiveSignal);
    
    // Bind emotion to visual systems
    const visualBinding = this.bindEmotionToVisuals(
      currentBehavior.emotionalState,
      currentBehavior.intensity
    );
    
    // Detect predictive flags
    const volatilitySpike = this.detectVolatilitySpike();
    const dataFlood = this.detectDataFlood();
    const signalBurst = predictiveSignal.confidence > 70 && predictiveSignal.anticipatedLoad > 60;
    const systemStrain = currentBehavior.emotionalState === 'stressed' || 
                         currentBehavior.emotionalState === 'overclocked';
    
    return {
      volatilitySpike,
      dataFlood,
      signalBurst,
      systemStrain,
      glowMultiplier: anticipation.glowMultiplier,
      pulseMultiplier: anticipation.pulseMultiplier,
      intensityMultiplier: anticipation.intensityMultiplier,
      predictiveSignal,
      visualBinding,
    };
  }
  
  // ===== HELPER METHODS =====
  
  private updateHistory(behavior: BehaviorOutput): void {
    const now = Date.now();
    this.history.timestamps.push(now);
    this.history.emotionalStates.push(behavior.emotionalState);
    this.history.intensities.push(behavior.intensity);
    
    // Extract volatility ratio from behavior (estimated from intensity)
    const volRatio = behavior.intensity / 50; // Normalized estimate
    this.history.volatilityRatios.push(volRatio);
    
    // Trim to max length
    if (this.history.timestamps.length > this.maxHistoryLength) {
      this.history.timestamps.shift();
      this.history.emotionalStates.shift();
      this.history.intensities.shift();
      this.history.volatilityRatios.shift();
    }
  }
  
  private analyzeVolatilityTrend(): 'rising' | 'falling' | 'stable' {
    if (this.history.volatilityRatios.length < 3) return 'stable';
    
    const recent = this.history.volatilityRatios.slice(-3);
    const trend = recent[2] - recent[0];
    
    if (trend > 0.2) return 'rising';
    if (trend < -0.2) return 'falling';
    return 'stable';
  }
  
  private predictNextState(
    current: EmotionalState,
    volTrend: 'rising' | 'falling' | 'stable'
  ): EmotionalState {
    const states: EmotionalState[] = ['calm', 'focused', 'alert', 'stressed', 'overclocked'];
    const currentIndex = states.indexOf(current);
    
    if (volTrend === 'rising') {
      // Predict escalation
      return states[Math.min(currentIndex + 1, states.length - 1)];
    } else if (volTrend === 'falling') {
      // Predict de-escalation
      return states[Math.max(currentIndex - 1, 0)];
    }
    
    // Stable - no change
    return current;
  }
  
  private calculatePredictionConfidence(): number {
    if (this.history.emotionalStates.length < 5) return 30; // Low confidence with little data
    
    // Calculate stability (less variance = higher confidence)
    const recent = this.history.intensities.slice(-5);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / recent.length;
    const stability = Math.max(0, 100 - variance);
    
    // Higher stability = higher confidence
    return Math.min(100, stability * 0.8 + 20); // 20-100 range
  }
  
  private estimateLoadForState(state: EmotionalState): number {
    const loadMap: Record<EmotionalState, number> = {
      calm: 20,
      focused: 40,
      alert: 60,
      stressed: 80,
      overclocked: 100,
    };
    return loadMap[state];
  }
  
  private detectVolatilitySpike(): boolean {
    if (this.history.volatilityRatios.length < 3) return false;
    
    const recent = this.history.volatilityRatios.slice(-3);
    const acceleration = recent[2] - recent[0];
    
    return acceleration > 0.5; // Spike if ratio increases by > 0.5
  }
  
  private detectDataFlood(): boolean {
    if (this.history.timestamps.length < 5) return false;
    
    // Check if last 5 updates happened within 2 seconds (rapid updates)
    const recentTimestamps = this.history.timestamps.slice(-5);
    const timeSpan = recentTimestamps[4] - recentTimestamps[0];
    
    return timeSpan < 2000; // Flood if < 2s between 5 updates
  }
  
  /**
   * Public method to reset history (useful for testing)
   */
  public reset(): void {
    this.history = {
      timestamps: [],
      emotionalStates: [],
      intensities: [],
      volatilityRatios: [],
    };
  }
}
