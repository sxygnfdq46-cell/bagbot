/**
 * 🌡️ LIQUIDITY THERMOSTAT (LT)
 * 
 * Heat-level regulator reflecting liquidity health.
 * Controls UI temperature based on market liquidity.
 */

export interface LiquidityThermostatState {
  // Temperature readings
  currentTemp: number;        // 0-100 (cold=illiquid, hot=liquid)
  targetTemp: number;         // Optimal liquidity level
  heatIndex: number;          // Feels-like temperature
  
  // Liquidity metrics
  spreadHeat: number;         // Heat from bid-ask spread
  depthHeat: number;          // Heat from order book depth
  volumeHeat: number;         // Heat from trading volume
  velocityHeat: number;       // Heat from liquidity velocity
  
  // Thermal zones
  hotZones: ThermalZone[];    // High liquidity areas
  coldZones: ThermalZone[];   // Low liquidity areas
  thermalGradient: number;    // 0-100 (temperature variation)
  
  // Regulation
  regulationMode: 'heating' | 'cooling' | 'maintaining';
  regulationStrength: number; // 0-100 (how hard regulating)
  
  // Health indicators
  liquidityHealth: number;    // 0-100 (overall health score)
  stressLevel: number;        // 0-100 (liquidity stress)
  fragmentation: number;      // 0-100 (how scattered liquidity is)
}

export interface ThermalZone {
  center: { x: number; y: number };
  radius: number;
  temperature: number;        // 0-100
  type: 'depth_pool' | 'spread_desert' | 'volume_geyser' | 'stagnant';
  intensity: number;          // 0-100
}

export interface LiquidityData {
  timestamp: number;
  bidAskSpread: number;       // Percentage
  bidDepth: number;           // Total bid volume
  askDepth: number;           // Total ask volume
  totalDepth: number;         // Combined depth
  volume: number;             // Recent trading volume
  trades: number;             // Number of trades
  avgTradeSize: number;       // Average trade size
  slippage: number;           // Estimated slippage %
  imbalance: number;          // Bid vs ask imbalance (-1 to 1)
}

export class LiquidityThermostat {
  private state: LiquidityThermostatState;
  private liquidityHistory: LiquidityData[];
  private tempHistory: number[];
  private readonly HISTORY_SIZE = 100;
  private readonly OPTIMAL_TEMP = 70; // Target temperature

  constructor() {
    this.state = this.getDefaultState();
    this.liquidityHistory = [];
    this.tempHistory = [];
  }

  private getDefaultState(): LiquidityThermostatState {
    return {
      currentTemp: 50,
      targetTemp: this.OPTIMAL_TEMP,
      heatIndex: 50,
      spreadHeat: 50,
      depthHeat: 50,
      volumeHeat: 50,
      velocityHeat: 50,
      hotZones: [],
      coldZones: [],
      thermalGradient: 0,
      regulationMode: 'maintaining',
      regulationStrength: 0,
      liquidityHealth: 50,
      stressLevel: 0,
      fragmentation: 0
    };
  }

  // ============================================
  // UPDATE
  // ============================================

  public update(data: LiquidityData): LiquidityThermostatState {
    // Add to history
    this.liquidityHistory.push(data);
    if (this.liquidityHistory.length > this.HISTORY_SIZE) {
      this.liquidityHistory.shift();
    }

    // Calculate heat sources
    this.calculateSpreadHeat(data);
    this.calculateDepthHeat(data);
    this.calculateVolumeHeat(data);
    this.calculateVelocityHeat();

    // Update current temperature
    this.updateCurrentTemp();

    // Calculate heat index
    this.calculateHeatIndex(data);

    // Identify thermal zones
    this.identifyThermalZones(data);

    // Determine regulation mode
    this.updateRegulation();

    // Calculate health metrics
    this.calculateHealthMetrics(data);

    // Add to temp history
    this.tempHistory.push(this.state.currentTemp);
    if (this.tempHistory.length > this.HISTORY_SIZE) {
      this.tempHistory.shift();
    }

    return this.state;
  }

  // ============================================
  // HEAT SOURCES
  // ============================================

  private calculateSpreadHeat(data: LiquidityData): void {
    // Tight spread = hot (liquid)
    // Wide spread = cold (illiquid)
    
    // Convert spread % to temperature (inverse relationship)
    // 0.01% spread = 100°, 0.5% spread = 0°
    const spreadScore = Math.max(0, 100 - (data.bidAskSpread * 200));
    
    this.state.spreadHeat = spreadScore;
  }

  private calculateDepthHeat(data: LiquidityData): void {
    // Deep order book = hot (liquid)
    // Shallow book = cold (illiquid)
    
    // Normalize depth (assuming 1.0 = baseline)
    const depthScore = Math.min(100, data.totalDepth * 50);
    
    // Balance matters too
    const imbalancePenalty = Math.abs(data.imbalance) * 30;
    
    this.state.depthHeat = Math.max(0, depthScore - imbalancePenalty);
  }

  private calculateVolumeHeat(data: LiquidityData): void {
    // High volume = hot (liquid)
    // Low volume = cold (illiquid)
    
    // Normalize volume
    const volumeScore = Math.min(100, data.volume * 50);
    
    // Trade frequency adds heat
    const tradeFrequency = data.trades;
    const frequencyBoost = Math.min(30, tradeFrequency * 3);
    
    this.state.volumeHeat = Math.min(100, volumeScore + frequencyBoost);
  }

  private calculateVelocityHeat(): void {
    // How fast liquidity is moving (rate of change in depth/volume)
    
    if (this.liquidityHistory.length < 5) {
      this.state.velocityHeat = 50;
      return;
    }

    const recent = this.liquidityHistory.slice(-5);
    const older = this.liquidityHistory.slice(-10, -5);

    if (older.length === 0) {
      this.state.velocityHeat = 50;
      return;
    }

    // Calculate average changes
    const recentVolume = recent.reduce((sum, d) => sum + d.volume, 0) / recent.length;
    const olderVolume = older.reduce((sum, d) => sum + d.volume, 0) / older.length;
    
    const volumeVelocity = ((recentVolume - olderVolume) / olderVolume) * 100;
    
    // Positive velocity = heating, negative = cooling
    this.state.velocityHeat = 50 + Math.max(-50, Math.min(50, volumeVelocity));
  }

  // ============================================
  // TEMPERATURE
  // ============================================

  private updateCurrentTemp(): void {
    // Weighted average of heat sources
    const weightedTemp = 
      this.state.spreadHeat * 0.3 +
      this.state.depthHeat * 0.3 +
      this.state.volumeHeat * 0.25 +
      this.state.velocityHeat * 0.15;

    // Smooth temperature changes
    this.state.currentTemp += (weightedTemp - this.state.currentTemp) * 0.2;
  }

  private calculateHeatIndex(data: LiquidityData): void {
    // Heat index = feels-like temperature (adjusted for slippage)
    
    // High slippage makes it feel colder (harder to trade)
    const slippagePenalty = data.slippage * 50;
    
    // Low avg trade size = feels hotter (easier for small trades)
    const tradeSizeBonus = data.avgTradeSize < 0.5 ? 10 : 0;
    
    this.state.heatIndex = Math.max(0, this.state.currentTemp - slippagePenalty + tradeSizeBonus);
  }

  // ============================================
  // THERMAL ZONES
  // ============================================

  private identifyThermalZones(data: LiquidityData): void {
    this.state.hotZones = [];
    this.state.coldZones = [];

    // Hot zone: Deep liquidity pool
    if (data.totalDepth > 1.5 && data.bidAskSpread < 0.02) {
      this.state.hotZones.push({
        center: { x: 50, y: 50 },
        radius: 30,
        temperature: 90,
        type: 'depth_pool',
        intensity: Math.min(100, data.totalDepth * 40)
      });
    }

    // Hot zone: Volume geyser
    if (data.volume > 2.0 && data.trades > 50) {
      this.state.hotZones.push({
        center: { x: 40 + Math.random() * 20, y: 40 + Math.random() * 20 },
        radius: 25,
        temperature: 85,
        type: 'volume_geyser',
        intensity: Math.min(100, data.volume * 35)
      });
    }

    // Cold zone: Wide spread desert
    if (data.bidAskSpread > 0.1) {
      this.state.coldZones.push({
        center: { x: 30, y: 70 },
        radius: 35,
        temperature: 15,
        type: 'spread_desert',
        intensity: Math.min(100, data.bidAskSpread * 200)
      });
    }

    // Cold zone: Stagnant area
    if (data.volume < 0.3 && data.trades < 10) {
      this.state.coldZones.push({
        center: { x: 70, y: 30 },
        radius: 30,
        temperature: 20,
        type: 'stagnant',
        intensity: Math.max(0, 100 - data.volume * 100)
      });
    }

    // Calculate thermal gradient
    if (this.state.hotZones.length > 0 && this.state.coldZones.length > 0) {
      const maxHot = Math.max(...this.state.hotZones.map(z => z.temperature));
      const minCold = Math.min(...this.state.coldZones.map(z => z.temperature));
      this.state.thermalGradient = maxHot - minCold;
    } else {
      this.state.thermalGradient = 0;
    }
  }

  // ============================================
  // REGULATION
  // ============================================

  private updateRegulation(): void {
    const tempDiff = this.state.currentTemp - this.state.targetTemp;

    if (Math.abs(tempDiff) < 5) {
      this.state.regulationMode = 'maintaining';
      this.state.regulationStrength = 0;
    } else if (tempDiff > 0) {
      // Too hot - cooling
      this.state.regulationMode = 'cooling';
      this.state.regulationStrength = Math.min(100, Math.abs(tempDiff) * 2);
    } else {
      // Too cold - heating
      this.state.regulationMode = 'heating';
      this.state.regulationStrength = Math.min(100, Math.abs(tempDiff) * 2);
    }
  }

  // ============================================
  // HEALTH METRICS
  // ============================================

  private calculateHealthMetrics(data: LiquidityData): void {
    // Liquidity health = overall score
    const spreadHealth = Math.max(0, 100 - data.bidAskSpread * 500);
    const depthHealth = Math.min(100, data.totalDepth * 50);
    const volumeHealth = Math.min(100, data.volume * 40);
    const slippageHealth = Math.max(0, 100 - data.slippage * 200);

    this.state.liquidityHealth = (
      spreadHealth * 0.3 +
      depthHealth * 0.3 +
      volumeHealth * 0.2 +
      slippageHealth * 0.2
    );

    // Stress level = how far from optimal
    const tempStress = Math.abs(this.state.currentTemp - this.OPTIMAL_TEMP);
    const imbalanceStress = Math.abs(data.imbalance) * 50;
    const slippageStress = data.slippage * 100;

    this.state.stressLevel = Math.min(100,
      tempStress * 0.5 + imbalanceStress * 0.3 + slippageStress * 0.2
    );

    // Fragmentation = how scattered liquidity is
    const zoneCount = this.state.hotZones.length + this.state.coldZones.length;
    const gradientFrag = this.state.thermalGradient * 0.5;

    this.state.fragmentation = Math.min(100, zoneCount * 15 + gradientFrag);
  }

  // ============================================
  // GETTERS
  // ============================================

  public getState(): LiquidityThermostatState {
    return { ...this.state };
  }

  public getTemperature(): number {
    return this.state.currentTemp;
  }

  public getHeatIndex(): number {
    return this.state.heatIndex;
  }

  public isHealthy(): boolean {
    return this.state.liquidityHealth > 60 && this.state.stressLevel < 40;
  }

  public getTempAt(x: number, y: number): number {
    let temp = this.state.currentTemp;

    // Adjust for hot zones
    for (const zone of this.state.hotZones) {
      const dx = x - zone.center.x;
      const dy = y - zone.center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < zone.radius) {
        const influence = 1 - (dist / zone.radius);
        temp += (zone.temperature - this.state.currentTemp) * influence * 0.5;
      }
    }

    // Adjust for cold zones
    for (const zone of this.state.coldZones) {
      const dx = x - zone.center.x;
      const dy = y - zone.center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < zone.radius) {
        const influence = 1 - (dist / zone.radius);
        temp += (zone.temperature - this.state.currentTemp) * influence * 0.5;
      }
    }

    return Math.max(0, Math.min(100, temp));
  }

  public reset(): void {
    this.state = this.getDefaultState();
    this.liquidityHistory = [];
    this.tempHistory = [];
  }
}
