/**
 * LEVEL 6.1 — BEHAVIOR MAPPING LAYER
 * Maps data changes → UI reactions
 * 
 * This is where BagBot starts behaving like a living system.
 */

import { BehaviorOutput } from './BehaviorCore';

export type UIReaction = {
  type: 'pulse' | 'neon' | 'aura' | 'halo' | 'ripple' | 'drift' | 'distortion';
  intensity: number;
  duration: number;
  color?: string;
};

export class BehaviorMap {
  /**
   * PRICE ACCELERATION → PULSE ACCELERATION
   */
  static priceAccelerationToPulse(
    currentPrice: number,
    previousPrice: number,
    timeWindowMs: number
  ): UIReaction {
    const priceChange = Math.abs(currentPrice - previousPrice);
    const changePercent = (priceChange / previousPrice) * 100;
    const acceleration = (changePercent / timeWindowMs) * 1000; // Per second
    
    return {
      type: 'pulse',
      intensity: Math.min(100, acceleration * 50),
      duration: 800,
      color: currentPrice > previousPrice ? '#00ff00' : '#ff0000',
    };
  }
  
  /**
   * VOLATILITY INCREASE → NEON DISTORTION
   */
  static volatilityToNeonDistortion(
    currentVol: number,
    avgVol: number
  ): UIReaction {
    const volRatio = currentVol / avgVol;
    
    if (volRatio > 2) {
      return {
        type: 'distortion',
        intensity: Math.min(100, (volRatio - 1) * 30),
        duration: 2000,
      };
    }
    
    return {
      type: 'distortion',
      intensity: 0,
      duration: 0,
    };
  }
  
  /**
   * STRATEGY GAIN → GREEN AI AURA
   */
  static strategyGainToAura(pnl: number, previousPnl: number): UIReaction {
    const gain = pnl - previousPnl;
    
    if (gain > 100) {
      return {
        type: 'aura',
        intensity: Math.min(100, gain / 50),
        duration: 3000,
        color: '#00ff7f', // Spring green
      };
    }
    
    return {
      type: 'aura',
      intensity: 20,
      duration: 0,
      color: '#00ffff', // Cyan default
    };
  }
  
  /**
   * STRATEGY DRAWDOWN → MAGENTA WARNING HALO
   */
  static strategyDrawdownToHalo(pnl: number, previousPnl: number): UIReaction {
    const loss = previousPnl - pnl;
    
    if (loss > 100) {
      return {
        type: 'halo',
        intensity: Math.min(100, loss / 50),
        duration: 5000,
        color: '#ff00ff', // Magenta warning
      };
    }
    
    return {
      type: 'halo',
      intensity: 30,
      duration: 0,
    };
  }
  
  /**
   * CPU/WORKER PRESSURE → DIM HOLOGRAMS
   */
  static systemPressureToDimming(
    cpuPercent: number,
    workerLoad: number
  ): UIReaction {
    const pressureScore = (cpuPercent + workerLoad) / 2;
    
    if (pressureScore > 75) {
      return {
        type: 'aura',
        intensity: Math.max(20, 100 - pressureScore),
        duration: 1000,
      };
    }
    
    return {
      type: 'aura',
      intensity: 80,
      duration: 0,
    };
  }
  
  /**
   * CALM MARKETS → SLOW DRIFTING PARTICLES
   */
  static calmMarketToParticles(volatility: number): UIReaction {
    if (volatility < 5) {
      return {
        type: 'drift',
        intensity: 15, // Slow, gentle drift
        duration: 10000,
      };
    }
    
    return {
      type: 'drift',
      intensity: 50, // Normal speed
      duration: 5000,
    };
  }
  
  /**
   * MAP BEHAVIOR OUTPUT TO SPECIFIC UI REACTIONS
   */
  static mapBehaviorToReactions(behavior: BehaviorOutput): UIReaction[] {
    const reactions: UIReaction[] = [];
    
    // Map emotional state to base reactions
    switch (behavior.emotionalState) {
      case 'overclocked':
        reactions.push({
          type: 'pulse',
          intensity: 100,
          duration: 500,
          color: '#ff0000',
        });
        reactions.push({
          type: 'distortion',
          intensity: 80,
          duration: 2000,
        });
        break;
        
      case 'stressed':
        reactions.push({
          type: 'halo',
          intensity: 70,
          duration: 3000,
          color: '#ff00ff',
        });
        reactions.push({
          type: 'ripple',
          intensity: 60,
          duration: 1000,
        });
        break;
        
      case 'alert':
        reactions.push({
          type: 'aura',
          intensity: 60,
          duration: 2000,
          color: '#ffff00',
        });
        break;
        
      case 'focused':
        reactions.push({
          type: 'pulse',
          intensity: 40,
          duration: 1500,
          color: '#00ffff',
        });
        break;
        
      case 'calm':
        reactions.push({
          type: 'drift',
          intensity: 20,
          duration: 5000,
        });
        break;
    }
    
    // Add intensity-based ripples
    if (behavior.dataRippleFrequency > 50) {
      reactions.push({
        type: 'ripple',
        intensity: behavior.dataRippleFrequency,
        duration: 800,
      });
    }
    
    return reactions;
  }
}
