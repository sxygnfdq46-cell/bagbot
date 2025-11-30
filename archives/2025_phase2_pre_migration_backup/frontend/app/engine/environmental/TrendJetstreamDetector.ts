/**
 * 🌬️ TRENDJETSTREAM DETECTOR (TJD)
 * 
 * Measures long-term directional wind.
 * Detects when market is flowing in strong directional current.
 */

export interface TrendJetstreamState {
  // Jetstream detection
  jetstream: Jetstream | null;
  crossCurrents: CrossCurrent[];
  
  // Wind layers
  tradewinds: WindLayer;      // Short-term (1-15min)
  westerlies: WindLayer;      // Medium-term (15min-4hr)
  jetlayer: WindLayer;        // Long-term (4hr-24hr)
  
  // Trend metrics
  trendStrength: number;      // 0-100 (how strong is trend)
  trendDuration: number;      // milliseconds
  trendStability: number;     // 0-100 (how stable)
  directionConfidence: number; // 0-100 (how certain)
  
  // Shear zones
  shearZones: ShearZone[];    // Where trends conflict
  turbulence: number;         // 0-100 (trend instability)
}

export interface Jetstream {
  direction: number;          // 0-360 degrees (0=up, 180=down)
  velocity: number;           // 0-100 (trend speed)
  width: number;              // 0-100 (how wide the trend corridor is)
  altitude: number;           // 0-100 (timeframe strength)
  core: {                     // Strongest part of jetstream
    position: { x: number; y: number };
    velocity: number;
  };
  waviness: number;           // 0-100 (how much jetstream meanders)
}

export interface WindLayer {
  direction: number;          // 0-360 degrees
  speed: number;              // 0-100
  consistency: number;        // 0-100 (how steady)
  coverage: number;           // 0-100 (what % of market affected)
  pressure: number;           // 0-100 (directional pressure)
}

export interface CrossCurrent {
  position: { x: number; y: number };
  direction: number;          // Different from main trend
  strength: number;           // 0-100
  type: 'counter_trend' | 'pullback' | 'rotation';
}

export interface ShearZone {
  position: { x: number; y: number };
  radius: number;
  shearStrength: number;      // 0-100 (how different winds are)
  turbulence: number;         // 0-100
  type: 'directional' | 'speed';
}

export interface TrendData {
  timestamp: number;
  price: number;
  sma20: number;             // 20-period MA
  sma50: number;             // 50-period MA
  sma200: number;            // 200-period MA
  adx: number;               // ADX trend strength
  plusDI: number;            // +DI
  minusDI: number;           // -DI
  momentum: number;          // Rate of change
  volume: number;
}

export class TrendJetstreamDetector {
  private state: TrendJetstreamState;
  private trendHistory: TrendData[];
  private jetstreamHistory: Jetstream[];
  private readonly HISTORY_SIZE = 500;

  constructor() {
    this.state = this.getDefaultState();
    this.trendHistory = [];
    this.jetstreamHistory = [];
  }

  private getDefaultState(): TrendJetstreamState {
    return {
      jetstream: null,
      crossCurrents: [],
      tradewinds: this.getDefaultWindLayer(),
      westerlies: this.getDefaultWindLayer(),
      jetlayer: this.getDefaultWindLayer(),
      trendStrength: 0,
      trendDuration: 0,
      trendStability: 50,
      directionConfidence: 50,
      shearZones: [],
      turbulence: 0
    };
  }

  private getDefaultWindLayer(): WindLayer {
    return {
      direction: 90,
      speed: 0,
      consistency: 50,
      coverage: 0,
      pressure: 50
    };
  }

  // ============================================
  // UPDATE
  // ============================================

  public update(data: TrendData): TrendJetstreamState {
    // Add to history
    this.trendHistory.push(data);
    if (this.trendHistory.length > this.HISTORY_SIZE) {
      this.trendHistory.shift();
    }

    // Analyze wind layers
    this.analyzeTradewinds();
    this.analyzeWesterlies();
    this.analyzeJetlayer();

    // Detect jetstream
    this.detectJetstream(data);

    // Find cross currents
    this.detectCrossCurrent();

    // Identify shear zones
    this.identifyShearZones();

    // Calculate trend metrics
    this.calculateTrendMetrics(data);

    return this.state;
  }

  // ============================================
  // WIND LAYER ANALYSIS
  // ============================================

  private analyzeTradewinds(): void {
    // Short-term (last 15 data points ~ 15 minutes if 1min bars)
    const recent = this.trendHistory.slice(-15);
    if (recent.length < 5) return;

    this.state.tradewinds = this.analyzeWindLayer(recent);
  }

  private analyzeWesterlies(): void {
    // Medium-term (last 60 points ~ 1 hour)
    const recent = this.trendHistory.slice(-60);
    if (recent.length < 10) return;

    this.state.westerlies = this.analyzeWindLayer(recent);
  }

  private analyzeJetlayer(): void {
    // Long-term (last 240 points ~ 4 hours)
    const recent = this.trendHistory.slice(-240);
    if (recent.length < 20) return;

    this.state.jetlayer = this.analyzeWindLayer(recent);
  }

  private analyzeWindLayer(data: TrendData[]): WindLayer {
    if (data.length < 2) return this.getDefaultWindLayer();

    const first = data[0];
    const last = data[data.length - 1];

    // Direction based on price movement and MAs
    const priceChange = last.price - first.price;
    const ma20Slope = last.sma20 - first.sma20;
    const ma50Slope = last.sma50 - first.sma50;

    // Combine signals
    const avgSlope = (priceChange + ma20Slope + ma50Slope) / 3;
    const direction = avgSlope > 0 ? 45 : 225; // 45° = uptrend, 225° = downtrend

    // Speed from ADX (average)
    const avgADX = data.reduce((sum, d) => sum + d.adx, 0) / data.length;
    const speed = Math.min(100, avgADX);

    // Consistency from direction stability
    const directionChanges = data.slice(1).reduce((count, d, i) => {
      const prev = data[i];
      return count + ((d.price - prev.price) * (last.price - first.price) < 0 ? 1 : 0);
    }, 0);
    const consistency = Math.max(0, 100 - (directionChanges / data.length * 100));

    // Coverage from volume
    const avgVolume = data.reduce((sum, d) => sum + d.volume, 0) / data.length;
    const coverage = Math.min(100, avgVolume * 50);

    // Pressure from +DI vs -DI
    const avgPlusDI = data.reduce((sum, d) => sum + d.plusDI, 0) / data.length;
    const avgMinusDI = data.reduce((sum, d) => sum + d.minusDI, 0) / data.length;
    const pressure = ((avgPlusDI / (avgPlusDI + avgMinusDI)) * 100) || 50;

    return {
      direction,
      speed,
      consistency,
      coverage,
      pressure
    };
  }

  // ============================================
  // JETSTREAM DETECTION
  // ============================================

  private detectJetstream(data: TrendData): void {
    // Jetstream exists when:
    // 1. All three layers aligned (similar direction)
    // 2. Strong ADX (>25)
    // 3. Price above/below key MAs

    const layersAligned = this.checkLayerAlignment();
    const strongADX = data.adx > 25;
    const maTrend = this.checkMATrend(data);

    if (layersAligned && strongADX && maTrend !== 'neutral') {
      // Calculate jetstream properties
      const direction = this.state.jetlayer.direction;
      const velocity = Math.min(100, 
        (this.state.tradewinds.speed * 0.2 + 
         this.state.westerlies.speed * 0.3 + 
         this.state.jetlayer.speed * 0.5)
      );

      // Width from consistency across layers
      const avgConsistency = (
        this.state.tradewinds.consistency +
        this.state.westerlies.consistency +
        this.state.jetlayer.consistency
      ) / 3;
      const width = avgConsistency;

      // Altitude from trend strength at different timeframes
      const altitude = this.state.jetlayer.speed;

      // Core = strongest wind in jetstream
      const coreVelocity = Math.max(
        this.state.tradewinds.speed,
        this.state.westerlies.speed,
        this.state.jetlayer.speed
      );

      // Position based on price relative to MAs
      const pricePosition = this.getPricePosition(data);

      // Waviness from path stability
      const waviness = 100 - this.state.jetlayer.consistency;

      this.state.jetstream = {
        direction,
        velocity,
        width,
        altitude,
        core: {
          position: pricePosition,
          velocity: coreVelocity
        },
        waviness
      };

      // Add to history
      this.jetstreamHistory.push({ ...this.state.jetstream });
      if (this.jetstreamHistory.length > 100) {
        this.jetstreamHistory.shift();
      }
    } else {
      this.state.jetstream = null;
    }
  }

  private checkLayerAlignment(): boolean {
    // Check if all layers pointing similar direction
    const directions = [
      this.state.tradewinds.direction,
      this.state.westerlies.direction,
      this.state.jetlayer.direction
    ];

    // All should be within 90 degrees of each other
    const maxDiff = Math.max(...directions) - Math.min(...directions);
    return maxDiff < 90;
  }

  private checkMATrend(data: TrendData): 'bullish' | 'bearish' | 'neutral' {
    const { price, sma20, sma50, sma200 } = data;

    // Bullish: price > sma20 > sma50 > sma200
    if (price > sma20 && sma20 > sma50 && sma50 > sma200) {
      return 'bullish';
    }

    // Bearish: price < sma20 < sma50 < sma200
    if (price < sma20 && sma20 < sma50 && sma50 < sma200) {
      return 'bearish';
    }

    return 'neutral';
  }

  private getPricePosition(data: TrendData): { x: number; y: number } {
    // X = horizontal position (could be based on time or price action)
    const x = 50; // Center

    // Y = vertical position based on price relative to MAs
    const ma200Dist = ((data.price - data.sma200) / data.sma200) * 100;
    const y = 50 + Math.max(-40, Math.min(40, ma200Dist)); // 10-90 range

    return { x, y };
  }

  // ============================================
  // CROSS CURRENTS
  // ============================================

  private detectCrossCurrent(): void {
    this.state.crossCurrents = [];

    if (!this.state.jetstream) return;

    const mainDirection = this.state.jetstream.direction;

    // Check if any layer going different direction
    const layers = [
      { name: 'trade', layer: this.state.tradewinds },
      { name: 'west', layer: this.state.westerlies }
    ];

    for (const { layer, name } of layers) {
      const directionDiff = Math.abs(layer.direction - mainDirection);
      
      // Significant difference (>45°)
      if (directionDiff > 45 && directionDiff < 315) {
        const type = this.classifyCrossCurrent(directionDiff, layer.speed);
        
        this.state.crossCurrents.push({
          position: { 
            x: name === 'trade' ? 30 : 70, 
            y: 50 
          },
          direction: layer.direction,
          strength: layer.speed,
          type
        });
      }
    }

    // Check for pullbacks (short-term counter-trend)
    if (this.trendHistory.length > 10) {
      const recent = this.trendHistory.slice(-10);
      const recentTrend = recent[recent.length - 1].price - recent[0].price;
      const overallTrend = this.state.jetstream.direction < 180 ? 1 : -1;

      if ((recentTrend > 0 && overallTrend < 0) || (recentTrend < 0 && overallTrend > 0)) {
        this.state.crossCurrents.push({
          position: { x: 50, y: 40 },
          direction: recentTrend > 0 ? 45 : 225,
          strength: Math.abs(recentTrend) * 100,
          type: 'pullback'
        });
      }
    }
  }

  private classifyCrossCurrent(angleDiff: number, strength: number): 'counter_trend' | 'pullback' | 'rotation' {
    if (angleDiff > 135 && angleDiff < 225) {
      return 'counter_trend'; // Opposite direction
    } else if (strength < 30) {
      return 'pullback'; // Weak counter-movement
    } else {
      return 'rotation'; // Sideways movement
    }
  }

  // ============================================
  // SHEAR ZONES
  // ============================================

  private identifyShearZones(): void {
    this.state.shearZones = [];

    // Shear zones occur where wind layers have different directions or speeds

    // Check direction shear
    const layers = [
      this.state.tradewinds,
      this.state.westerlies,
      this.state.jetlayer
    ];

    for (let i = 0; i < layers.length - 1; i++) {
      const layer1 = layers[i];
      const layer2 = layers[i + 1];

      // Direction difference
      let dirDiff = Math.abs(layer1.direction - layer2.direction);
      if (dirDiff > 180) dirDiff = 360 - dirDiff;

      if (dirDiff > 45) {
        this.state.shearZones.push({
          position: { x: 50, y: 30 + i * 20 },
          radius: 25,
          shearStrength: Math.min(100, dirDiff / 1.8),
          turbulence: dirDiff * 0.5,
          type: 'directional'
        });
      }

      // Speed difference
      const speedDiff = Math.abs(layer1.speed - layer2.speed);
      if (speedDiff > 30) {
        this.state.shearZones.push({
          position: { x: 50, y: 40 + i * 20 },
          radius: 20,
          shearStrength: Math.min(100, speedDiff),
          turbulence: speedDiff * 0.7,
          type: 'speed'
        });
      }
    }

    // Limit shear zones
    if (this.state.shearZones.length > 3) {
      this.state.shearZones.sort((a, b) => b.shearStrength - a.shearStrength);
      this.state.shearZones = this.state.shearZones.slice(0, 3);
    }
  }

  // ============================================
  // TREND METRICS
  // ============================================

  private calculateTrendMetrics(data: TrendData): void {
    // Trend strength from ADX
    this.state.trendStrength = Math.min(100, data.adx * 1.5);

    // Trend duration
    if (this.jetstreamHistory.length > 0) {
      const firstJetstream = this.jetstreamHistory[0];
      const sameDirection = Math.abs(firstJetstream.direction - (this.state.jetstream?.direction || 0)) < 45;
      
      if (sameDirection) {
        this.state.trendDuration = Date.now() - (this.trendHistory[0]?.timestamp || Date.now());
      } else {
        this.state.trendDuration = 0;
      }
    }

    // Trend stability
    this.state.trendStability = this.state.jetlayer.consistency;

    // Direction confidence
    const layerAgreement = this.checkLayerAlignment() ? 50 : 0;
    const adxConfidence = Math.min(50, data.adx);
    this.state.directionConfidence = layerAgreement + adxConfidence;

    // Turbulence from shear zones
    this.state.turbulence = this.state.shearZones.length > 0
      ? Math.max(...this.state.shearZones.map(z => z.turbulence))
      : 0;
  }

  // ============================================
  // GETTERS
  // ============================================

  public getState(): TrendJetstreamState {
    return { ...this.state };
  }

  public getJetstream(): Jetstream | null {
    return this.state.jetstream ? { ...this.state.jetstream } : null;
  }

  public isInJetstream(): boolean {
    return this.state.jetstream !== null && this.state.jetstream.velocity > 40;
  }

  public getWindAt(altitude: 'low' | 'mid' | 'high'): WindLayer {
    switch (altitude) {
      case 'low': return { ...this.state.tradewinds };
      case 'mid': return { ...this.state.westerlies };
      case 'high': return { ...this.state.jetlayer };
    }
  }

  public reset(): void {
    this.state = this.getDefaultState();
    this.trendHistory = [];
    this.jetstreamHistory = [];
  }
}
