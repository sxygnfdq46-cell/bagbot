/**
 * 🌍 ENVIRONMENTAL CONSCIOUSNESS CORE (ECC)
 * 
 * Unified provider for all environmental subsystems.
 * Makes BagBot aware of the market world around it.
 */

'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { MarketWeatherEngine, type MarketWeatherState } from './MarketWeatherEngine';
import { FlowFieldMapper, type FlowFieldState } from './FlowFieldMapper';
import { VolumeGravityDetector, type VolumeGravityState } from './VolumeGravityDetector';
import { MomentumStormAnalyzer, type MomentumStormState } from './MomentumStormAnalyzer';
import { TrendJetstreamDetector, type TrendJetstreamState } from './TrendJetstreamDetector';
import { LiquidityThermostat, type LiquidityThermostatState } from './LiquidityThermostat';
import { MicroburstSensor, type MicroburstSensorState } from './MicroburstSensor';
import { AmbientMarketPulse, type AmbientMarketPulseState, type MarketVitalSigns } from './AmbientMarketPulse';

// ============================================
// UNIFIED STATE
// ============================================

export interface EnvironmentalState {
  weather: MarketWeatherState;
  flow: FlowFieldState;
  gravity: VolumeGravityState;
  storms: MomentumStormState;
  jetstream: TrendJetstreamState;
  temperature: LiquidityThermostatState;
  microbursts: MicroburstSensorState;
  pulse: AmbientMarketPulseState;
  
  // Global metrics
  environmentalHealth: number;  // 0-100 overall health
  awareness: number;            // 0-100 how aware BagBot is
  coherence: number;            // 0-100 how aligned subsystems are
  
  timestamp: number;
}

// ============================================
// CONTEXT
// ============================================

interface EnvironmentalContextValue {
  state: EnvironmentalState | null;
  
  // Subsystem getters
  getWeather: () => MarketWeatherState | null;
  getFlow: () => FlowFieldState | null;
  getGravity: () => VolumeGravityState | null;
  getStorms: () => MomentumStormState | null;
  getJetstream: () => TrendJetstreamState | null;
  getTemperature: () => LiquidityThermostatState | null;
  getMicrobursts: () => MicroburstSensorState | null;
  getPulse: () => AmbientMarketPulseState | null;
  
  // Query helpers
  isHealthy: () => boolean;
  getEnvironmentalScore: () => number;
  isAware: () => boolean;
  
  // Control
  reset: () => void;
}

const EnvironmentalContext = createContext<EnvironmentalContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface EnvironmentalConsciousnessCoreProps {
  children: React.ReactNode;
  updateInterval?: number;      // ms between updates (default: 1000)
  enabled?: boolean;             // enable/disable updates
}

export function EnvironmentalConsciousnessCore({
  children,
  updateInterval = 1000,
  enabled = true
}: EnvironmentalConsciousnessCoreProps) {
  // Subsystem instances
  const weatherEngine = useRef(new MarketWeatherEngine());
  const flowMapper = useRef(new FlowFieldMapper());
  const gravityDetector = useRef(new VolumeGravityDetector());
  const stormAnalyzer = useRef(new MomentumStormAnalyzer());
  const jetstreamDetector = useRef(new TrendJetstreamDetector());
  const liquidityThermostat = useRef(new LiquidityThermostat());
  const microburstSensor = useRef(new MicroburstSensor());
  const marketPulse = useRef(new AmbientMarketPulse());

  const [state, setState] = useState<EnvironmentalState | null>(null);
  const updateTimer = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    // Start pulse heartbeat
    marketPulse.current.start();

    // Start update loop
    if (enabled) {
      startUpdateLoop();
    }

    return () => {
      marketPulse.current.stop();
      stopUpdateLoop();
    };
  }, [enabled, updateInterval]);

  // ============================================
  // UPDATE LOOP
  // ============================================

  const startUpdateLoop = () => {
    if (updateTimer.current) return;

    updateTimer.current = setInterval(() => {
      updateEnvironment();
    }, updateInterval);
  };

  const stopUpdateLoop = () => {
    if (updateTimer.current) {
      clearInterval(updateTimer.current);
      updateTimer.current = null;
    }
  };

  const updateEnvironment = () => {
    // In real implementation, this would fetch live market data
    // For now, generate synthetic data
    const marketData = generateSyntheticMarketData();

    // Update all subsystems with properly formatted data
    const weather = weatherEngine.current.update(marketData.weather);
    const flow = flowMapper.current.update(marketData.orderFlow);
    const gravity = gravityDetector.current.update(marketData.volume);
    const storms = stormAnalyzer.current.update(marketData.momentum);
    const jetstream = jetstreamDetector.current.update(marketData.trend);
    const temperature = liquidityThermostat.current.update(marketData.liquidity);
    const microbursts = microburstSensor.current.update(marketData.tick);
    const pulse = marketPulse.current.update(marketData.vitals);

    // Calculate global metrics
    const environmentalHealth = calculateEnvironmentalHealth({
      weather, flow, gravity, storms, jetstream, temperature, microbursts, pulse
    });
    
    const awareness = calculateAwareness({
      weather, flow, gravity, storms, jetstream, temperature, microbursts, pulse
    });
    
    const coherence = calculateCoherence({
      weather, flow, gravity, storms, jetstream, temperature, microbursts, pulse
    });

    // Update unified state
    setState({
      weather,
      flow,
      gravity,
      storms,
      jetstream,
      temperature,
      microbursts,
      pulse,
      environmentalHealth,
      awareness,
      coherence,
      timestamp: Date.now()
    });
  };

  // ============================================
  // SYNTHETIC DATA (TEMPORARY)
  // ============================================

  const generateSyntheticMarketData = () => {
    const now = Date.now();
    const volatility = 0.3 + Math.random() * 0.4;
    const volume = 0.5 + Math.random() * 0.5;
    const momentum = (Math.random() - 0.5) * 2;
    const price = 100 + Math.sin(now / 10000) * 10 + Math.random() * 2;

    return {
      // For MarketWeatherEngine
      weather: {
        timestamp: now,
        price,
        volume,
        volatility,
        bidAskSpread: 0.01 + Math.random() * 0.05,
        orderFlow: {
          buyVolume: volume * (0.4 + Math.random() * 0.3),
          sellVolume: volume * (0.3 + Math.random() * 0.3),
          neutralVolume: volume * 0.2,
          netFlow: (Math.random() - 0.5) * volume,
          buyOrders: Math.floor(20 + Math.random() * 30),
          sellOrders: Math.floor(20 + Math.random() * 30),
          priceDirection: momentum,
          aggression: 0.3 + Math.random() * 0.5,
          imbalance: (Math.random() - 0.5) * 0.6
        },
        momentum,
        trend: momentum * 0.5,
        liquidity: 0.6 + Math.random() * 0.3,
        depth: {
          totalDepth: 5000 + Math.random() * 3000,
          bidDepth: 2500 + Math.random() * 1500,
          askDepth: 2500 + Math.random() * 1500,
          imbalance: (Math.random() - 0.5) * 0.4
        },
        indicators: {
          sma20: 100,
          sma50: 100,
          sma200: 100,
          ema: 100,
          rsi: 50 + Math.random() * 30,
          macd: momentum * 0.5,
          adx: 20 + Math.random() * 30,
          atr: volatility * 2,
          obv: 10000,
          vwap: 100
        },
        volumeProfile: {
          levels: Array(10).fill(0).map((_, i) => ({
            price: 95 + i,
            volume: 100 + Math.random() * 200,
            buyVolume: 50 + Math.random() * 100,
            sellVolume: 50 + Math.random() * 100
          })),
          pocPrice: 100,
          valueAreaHigh: 102,
          valueAreaLow: 98
        }
      },
      
      // For FlowFieldMapper
      orderFlow: {
        buyVolume: volume * (0.4 + Math.random() * 0.3),
        sellVolume: volume * (0.3 + Math.random() * 0.3),
        neutralVolume: volume * 0.2,
        netFlow: (Math.random() - 0.5) * volume,
        buyOrders: Math.floor(20 + Math.random() * 30),
        sellOrders: Math.floor(20 + Math.random() * 30),
        priceDirection: momentum,
        aggression: 0.3 + Math.random() * 0.5,
        imbalance: (Math.random() - 0.5) * 0.6
      },
      
      // For VolumeGravityDetector
      volume: {
        totalVolume: volume * 10000,
        buyVolume: volume * 5000 * (0.4 + Math.random() * 0.3),
        sellVolume: volume * 5000 * (0.3 + Math.random() * 0.3),
        priceLevel: price,
        volumeProfile: Array(10).fill(0).map((_, i) => ({
          price: 95 + i,
          volume: 100 + Math.random() * 200
        })),
        largeOrders: Array(3).fill(0).map(() => ({
          price: price + (Math.random() - 0.5) * 2,
          size: 100 + Math.random() * 500,
          side: Math.random() > 0.5 ? 'buy' as const : 'sell' as const
        }))
      },
      
      // For MomentumStormAnalyzer
      momentum: {
        timestamp: now,
        price,
        priceChange: momentum * 2,
        percentChange: momentum * 0.02,
        volume,
        deltaVolume: (Math.random() - 0.5) * volume,
        trades: Math.floor(30 + Math.random() * 50),
        aggressiveBuys: Math.floor(15 + Math.random() * 25),
        aggressiveSells: Math.floor(15 + Math.random() * 25),
        momentum,
        acceleration: (Math.random() - 0.5) * 0.5,
        velocity: momentum * 0.5,
        volatility
      },
      
      // For TrendJetstreamDetector
      trend: {
        timestamp: now,
        price,
        sma20: 100,
        sma50: 100,
        sma200: 100,
        adx: 20 + Math.random() * 30,
        plusDI: 20 + Math.random() * 20,
        minusDI: 20 + Math.random() * 20,
        momentum,
        volume
      },
      
      // For LiquidityThermostat
      liquidity: {
        timestamp: now,
        bidAskSpread: 0.01 + Math.random() * 0.05,
        bidDepth: 2500 + Math.random() * 1500,
        askDepth: 2500 + Math.random() * 1500,
        totalDepth: 5000 + Math.random() * 3000,
        volume,
        trades: Math.floor(30 + Math.random() * 50),
        avgTradeSize: volume / 30,
        slippage: 0.001 + Math.random() * 0.01,
        imbalance: (Math.random() - 0.5) * 0.4
      },
      
      // For MicroburstSensor
      tick: {
        timestamp: now,
        price,
        volume: volume * 100,
        side: Math.random() > 0.5 ? 'buy' as const : Math.random() > 0.5 ? 'sell' as const : 'unknown' as const,
        aggressiveness: 0.3 + Math.random() * 0.5,
        delta: (Math.random() - 0.5) * 0.2
      },
      
      // For AmbientMarketPulse
      vitals: {
        timestamp: now,
        volume,
        trades: Math.floor(30 + Math.random() * 50),
        volatility,
        momentum: Math.abs(momentum),
        liquidity: 0.6 + Math.random() * 0.3,
        participation: 0.5 + Math.random() * 0.4
      } as MarketVitalSigns
    };
  };

  // ============================================
  // GLOBAL METRICS
  // ============================================

  const calculateEnvironmentalHealth = (subsystems: {
    weather: MarketWeatherState;
    flow: FlowFieldState;
    gravity: VolumeGravityState;
    storms: MomentumStormState;
    jetstream: TrendJetstreamState;
    temperature: LiquidityThermostatState;
    microbursts: MicroburstSensorState;
    pulse: AmbientMarketPulseState;
  }): number => {
    // Health based on optimal conditions
    const weatherHealth = subsystems.weather.condition === 'clear' || subsystems.weather.condition === 'partly_cloudy' ? 80 : 50;
    const flowHealth = 100 - subsystems.flow.turbulence;
    const gravityHealth = subsystems.gravity.stability;
    const stormHealth = 100 - subsystems.storms.stormIntensity;
    const jetstreamHealth = subsystems.jetstream.trendStability;
    const temperatureHealth = subsystems.temperature.liquidityHealth;
    const microburstHealth = 100 - Math.min(100, subsystems.microbursts.burstFrequency * 2);
    const pulseHealth = subsystems.pulse.hrvScore;

    return (
      weatherHealth * 0.15 +
      flowHealth * 0.1 +
      gravityHealth * 0.1 +
      stormHealth * 0.15 +
      jetstreamHealth * 0.1 +
      temperatureHealth * 0.15 +
      microburstHealth * 0.1 +
      pulseHealth * 0.15
    );
  };

  const calculateAwareness = (subsystems: {
    weather: MarketWeatherState;
    flow: FlowFieldState;
    gravity: VolumeGravityState;
    storms: MomentumStormState;
    jetstream: TrendJetstreamState;
    temperature: LiquidityThermostatState;
    microbursts: MicroburstSensorState;
    pulse: AmbientMarketPulseState;
  }): number => {
    // Awareness = how much information we're gathering
    const weatherAwareness = subsystems.weather.visibility;
    const flowAwareness = subsystems.flow.coherence;
    const gravityAwareness = Math.min(100, subsystems.gravity.totalMass * 2);
    const stormAwareness = subsystems.storms.energyLevel;
    const jetstreamAwareness = subsystems.jetstream.directionConfidence;
    const temperatureAwareness = 100 - subsystems.temperature.fragmentation;
    const microburstAwareness = Math.min(100, subsystems.microbursts.burstDensity);
    const pulseAwareness = subsystems.pulse.coherence;

    return (
      weatherAwareness * 0.125 +
      flowAwareness * 0.125 +
      gravityAwareness * 0.125 +
      stormAwareness * 0.125 +
      jetstreamAwareness * 0.125 +
      temperatureAwareness * 0.125 +
      microburstAwareness * 0.125 +
      pulseAwareness * 0.125
    );
  };

  const calculateCoherence = (subsystems: {
    weather: MarketWeatherState;
    flow: FlowFieldState;
    gravity: VolumeGravityState;
    storms: MomentumStormState;
    jetstream: TrendJetstreamState;
    temperature: LiquidityThermostatState;
    microbursts: MicroburstSensorState;
    pulse: AmbientMarketPulseState;
  }): number => {
    // Coherence = how aligned all subsystems are
    // Check if all pointing in same direction
    
    const weatherDirection = subsystems.weather.pressure > 60 ? 1 : subsystems.weather.pressure < 40 ? -1 : 0;
    const flowDirection = subsystems.flow.dominantFlow.strength > 50 ? 
      (subsystems.flow.dominantFlow.direction < 90 || subsystems.flow.dominantFlow.direction > 270 ? 1 : -1) : 0;
    const stormDirection = subsystems.storms.stormIntensity > 50 ? 1 : 0;
    const jetstreamDirection = subsystems.jetstream.jetstream ? 
      (subsystems.jetstream.jetstream.direction < 90 || subsystems.jetstream.jetstream.direction > 270 ? 1 : -1) : 0;

    // Count agreements
    const directions = [weatherDirection, flowDirection, stormDirection, jetstreamDirection].filter(d => d !== 0);
    if (directions.length === 0) return 50;

    const agreements = directions.filter(d => d === directions[0]).length;
    const alignment = (agreements / directions.length) * 100;

    // Factor in pulse coherence
    return alignment * 0.7 + subsystems.pulse.coherence * 0.3;
  };

  // ============================================
  // GETTERS
  // ============================================

  const getWeather = () => state?.weather || null;
  const getFlow = () => state?.flow || null;
  const getGravity = () => state?.gravity || null;
  const getStorms = () => state?.storms || null;
  const getJetstream = () => state?.jetstream || null;
  const getTemperature = () => state?.temperature || null;
  const getMicrobursts = () => state?.microbursts || null;
  const getPulse = () => state?.pulse || null;

  const isHealthy = () => state ? state.environmentalHealth > 60 : false;
  const getEnvironmentalScore = () => state?.environmentalHealth || 0;
  const isAware = () => state ? state.awareness > 50 : false;

  // ============================================
  // RESET
  // ============================================

  const reset = () => {
    weatherEngine.current.reset();
    flowMapper.current.reset();
    gravityDetector.current.reset();
    stormAnalyzer.current.reset();
    jetstreamDetector.current.reset();
    liquidityThermostat.current.reset();
    microburstSensor.current.reset();
    marketPulse.current.reset();
    setState(null);
  };

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: EnvironmentalContextValue = {
    state,
    getWeather,
    getFlow,
    getGravity,
    getStorms,
    getJetstream,
    getTemperature,
    getMicrobursts,
    getPulse,
    isHealthy,
    getEnvironmentalScore,
    isAware,
    reset
  };

  return (
    <EnvironmentalContext.Provider value={value}>
      {children}
    </EnvironmentalContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useEnvironmentalConsciousness() {
  const context = useContext(EnvironmentalContext);
  if (!context) {
    throw new Error('useEnvironmentalConsciousness must be used within EnvironmentalConsciousnessCore');
  }
  return context;
}

// Convenience hooks for specific subsystems
export function useMarketWeather() {
  const { getWeather } = useEnvironmentalConsciousness();
  return getWeather();
}

export function useFlowField() {
  const { getFlow } = useEnvironmentalConsciousness();
  return getFlow();
}

export function useVolumeGravity() {
  const { getGravity } = useEnvironmentalConsciousness();
  return getGravity();
}

export function useMomentumStorms() {
  const { getStorms } = useEnvironmentalConsciousness();
  return getStorms();
}

export function useTrendJetstream() {
  const { getJetstream } = useEnvironmentalConsciousness();
  return getJetstream();
}

export function useLiquidityTemperature() {
  const { getTemperature } = useEnvironmentalConsciousness();
  return getTemperature();
}

export function useMicrobursts() {
  const { getMicrobursts } = useEnvironmentalConsciousness();
  return getMicrobursts();
}

export function useMarketPulse() {
  const { getPulse } = useEnvironmentalConsciousness();
  return getPulse();
}
