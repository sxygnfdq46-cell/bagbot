/**
 * 🌍 ENVIRONMENTAL CONSCIOUSNESS CORE
 * 
 * Level 9: Environmental Awareness
 * Makes BagBot aware of the market world around it.
 */

// Core provider
export {
  EnvironmentalConsciousnessCore,
  useEnvironmentalConsciousness,
  useMarketWeather,
  useFlowField,
  useVolumeGravity,
  useMomentumStorms,
  useTrendJetstream,
  useLiquidityTemperature,
  useMicrobursts,
  useMarketPulse,
  type EnvironmentalState
} from './EnvironmentalConsciousnessCore';

// Subsystem exports
export { MarketWeatherEngine, type MarketWeatherState, type WeatherCondition } from './MarketWeatherEngine';
export { FlowFieldMapper, type FlowFieldState, type FlowVector, type FlowStream, type Vortex } from './FlowFieldMapper';
export { VolumeGravityDetector, type VolumeGravityState, type MassPoint, type GravityZone } from './VolumeGravityDetector';
export { MomentumStormAnalyzer, type MomentumStormState, type Storm, type MomentumSurge } from './MomentumStormAnalyzer';
export { TrendJetstreamDetector, type TrendJetstreamState, type WindLayer, type Jetstream, type CrossCurrent } from './TrendJetstreamDetector';
export { LiquidityThermostat, type LiquidityThermostatState, type ThermalZone } from './LiquidityThermostat';
export { MicroburstSensor, type MicroburstSensorState, type Microburst, type PressureWave } from './MicroburstSensor';
export { AmbientMarketPulse, type AmbientMarketPulseState, type Beat, type PulseRhythm, type MarketVitalSigns } from './AmbientMarketPulse';
