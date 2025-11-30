/**
 * 🌤️ MARKET WEATHER ENGINE (MWE)
 * 
 * Converts volatility & liquidity into "environmental climate."
 * Creates atmospheric conditions that the UI responds to.
 */

export interface MarketWeatherState {
  // Current conditions
  temperature: number;        // 0-100 (cold=calm, hot=volatile)
  pressure: number;           // 0-100 (low=bearish, high=bullish)
  humidity: number;           // 0-100 (liquidity saturation)
  visibility: number;         // 0-100 (market clarity)
  windSpeed: number;          // 0-100 (momentum strength)
  
  // Weather classification
  condition: WeatherCondition;
  severity: number;           // 0-100 (how extreme current weather is)
  
  // Atmospheric layers
  atmosphere: {
    lower: AtmosphericLayer;  // Fast market reactions (5min)
    middle: AtmosphericLayer; // Medium trends (1hr)
    upper: AtmosphericLayer;  // Long-term climate (4hr+)
  };
  
  // Weather patterns
  patterns: WeatherPattern[];
  forecast: WeatherForecast[];
  
  // Visual effects
  effects: {
    fogDensity: number;       // 0-1 (uncertainty)
    cloudCover: number;       // 0-1 (resistance/support)
    precipitation: number;    // 0-1 (sell pressure)
    lightning: number;        // 0-1 (sudden moves)
  };
}

export type WeatherCondition = 
  | 'clear'           // Low volatility, high liquidity
  | 'partly_cloudy'   // Moderate conditions
  | 'overcast'        // Building pressure
  | 'light_rain'      // Mild selling
  | 'heavy_rain'      // Strong selling
  | 'thunderstorm'    // High volatility + volume
  | 'fog'             // Low liquidity
  | 'heatwave'        // Extreme bullish
  | 'blizzard';       // Extreme bearish

export interface AtmosphericLayer {
  temperature: number;
  pressure: number;
  turbulence: number;
  stability: number;
}

export interface WeatherPattern {
  type: 'front' | 'cell' | 'system';
  strength: number;
  direction: number; // 0-360 degrees
  speed: number;
  position: { x: number; y: number };
  radius: number;
  timestamp: number;
}

export interface WeatherForecast {
  timestamp: number;
  condition: WeatherCondition;
  confidence: number;
}

export interface MarketData {
  price: number;
  volume: number;
  volatility: number;     // ATR-based
  liquidity: number;      // Bid-ask spread + depth
  momentum: number;       // Rate of change
  trend: number;          // -1 to 1 (bearish to bullish)
}

export class MarketWeatherEngine {
  private state: MarketWeatherState;
  private history: MarketData[];
  private readonly HISTORY_SIZE = 100;

  constructor() {
    this.state = this.getDefaultState();
    this.history = [];
  }

  private getDefaultState(): MarketWeatherState {
    return {
      temperature: 50,
      pressure: 50,
      humidity: 50,
      visibility: 80,
      windSpeed: 20,
      condition: 'clear',
      severity: 0,
      atmosphere: {
        lower: { temperature: 50, pressure: 50, turbulence: 10, stability: 80 },
        middle: { temperature: 50, pressure: 50, turbulence: 5, stability: 90 },
        upper: { temperature: 50, pressure: 50, turbulence: 2, stability: 95 }
      },
      patterns: [],
      forecast: [],
      effects: {
        fogDensity: 0,
        cloudCover: 0.2,
        precipitation: 0,
        lightning: 0
      }
    };
  }

  // ============================================
  // UPDATE
  // ============================================

  public update(marketData: MarketData): MarketWeatherState {
    // Add to history
    this.history.push(marketData);
    if (this.history.length > this.HISTORY_SIZE) {
      this.history.shift();
    }

    // Calculate core metrics
    this.updateTemperature(marketData);
    this.updatePressure(marketData);
    this.updateHumidity(marketData);
    this.updateVisibility(marketData);
    this.updateWindSpeed(marketData);

    // Update atmospheric layers
    this.updateAtmosphere();

    // Classify weather condition
    this.classifyCondition();

    // Generate weather patterns
    this.generatePatterns(marketData);

    // Create forecast
    this.generateForecast();

    // Update visual effects
    this.updateEffects();

    return this.state;
  }

  // ============================================
  // CORE METRICS
  // ============================================

  private updateTemperature(data: MarketData): void {
    // Temperature = volatility intensity
    // 0 = dead calm, 100 = extreme volatility
    
    const volatilityScore = Math.min(100, data.volatility * 100);
    const volumeBoost = data.volume > 1.5 ? 20 : 0; // High volume heats up market
    
    const target = Math.min(100, volatilityScore + volumeBoost);
    
    // Smooth transition
    this.state.temperature += (target - this.state.temperature) * 0.15;
  }

  private updatePressure(data: MarketData): void {
    // Pressure = directional bias
    // 0 = extreme bearish, 50 = neutral, 100 = extreme bullish
    
    const trendScore = ((data.trend + 1) / 2) * 100; // -1..1 → 0..100
    const momentumBoost = data.momentum * 10; // Add momentum influence
    
    const target = Math.min(100, Math.max(0, trendScore + momentumBoost));
    
    // Pressure changes slower than temperature
    this.state.pressure += (target - this.state.pressure) * 0.08;
  }

  private updateHumidity(data: MarketData): void {
    // Humidity = liquidity saturation
    // 0 = dry/illiquid, 100 = saturated/high liquidity
    
    const liquidityScore = Math.min(100, data.liquidity * 100);
    
    // Recent volume increases humidity
    const recentVolume = this.getRecentAverage('volume', 10);
    const volumeBoost = recentVolume > 1.2 ? 15 : 0;
    
    const target = Math.min(100, liquidityScore + volumeBoost);
    
    this.state.humidity += (target - this.state.humidity) * 0.12;
  }

  private updateVisibility(data: MarketData): void {
    // Visibility = market clarity (inverse of uncertainty)
    // 0 = foggy/uncertain, 100 = clear/predictable
    
    const volatilityPenalty = data.volatility * 50; // High vol reduces visibility
    const liquidityBonus = data.liquidity * 30;     // High liquidity improves it
    
    const target = Math.min(100, Math.max(0, 80 - volatilityPenalty + liquidityBonus));
    
    this.state.visibility += (target - this.state.visibility) * 0.1;
  }

  private updateWindSpeed(data: MarketData): void {
    // Wind speed = momentum strength
    // 0 = calm, 100 = gale force
    
    const momentumScore = Math.abs(data.momentum) * 100;
    const trendBoost = Math.abs(data.trend) * 20; // Strong trends add wind
    
    const target = Math.min(100, momentumScore + trendBoost);
    
    this.state.windSpeed += (target - this.state.windSpeed) * 0.2;
  }

  // ============================================
  // ATMOSPHERIC LAYERS
  // ============================================

  private updateAtmosphere(): void {
    // Lower atmosphere (5min) - most reactive
    this.state.atmosphere.lower = {
      temperature: this.state.temperature,
      pressure: this.state.pressure,
      turbulence: Math.min(100, this.state.windSpeed * 0.8),
      stability: Math.max(0, 100 - this.state.temperature * 0.5)
    };

    // Middle atmosphere (1hr) - smoothed
    const recentTemp = this.getRecentAverage('temperature', 12);
    const recentPressure = this.getRecentAverage('pressure', 12);
    
    this.state.atmosphere.middle = {
      temperature: recentTemp,
      pressure: recentPressure,
      turbulence: Math.min(100, this.state.windSpeed * 0.5),
      stability: Math.max(0, 100 - recentTemp * 0.3)
    };

    // Upper atmosphere (4hr+) - long-term climate
    const longTemp = this.getRecentAverage('temperature', 48);
    const longPressure = this.getRecentAverage('pressure', 48);
    
    this.state.atmosphere.upper = {
      temperature: longTemp,
      pressure: longPressure,
      turbulence: Math.min(100, this.state.windSpeed * 0.2),
      stability: Math.max(0, 100 - longTemp * 0.1)
    };
  }

  // ============================================
  // CONDITION CLASSIFICATION
  // ============================================

  private classifyCondition(): void {
    const { temperature, pressure, humidity, windSpeed } = this.state;

    // Calculate severity (0-100)
    const extremeTemp = Math.abs(temperature - 50);
    const extremePressure = Math.abs(pressure - 50);
    const extremeWind = windSpeed;
    
    this.state.severity = Math.min(100, 
      (extremeTemp * 0.4) + (extremePressure * 0.3) + (extremeWind * 0.3)
    );

    // Classify condition based on metrics
    if (temperature < 20 && humidity > 70 && windSpeed < 30) {
      this.state.condition = 'clear';
    } else if (temperature < 40 && pressure > 60 && humidity > 50) {
      this.state.condition = 'partly_cloudy';
    } else if (pressure < 40 && humidity < 40) {
      this.state.condition = 'fog';
    } else if (temperature > 80 && pressure > 70) {
      this.state.condition = 'heatwave';
    } else if (temperature > 80 && pressure < 30) {
      this.state.condition = 'blizzard';
    } else if (temperature > 60 && windSpeed > 70) {
      this.state.condition = 'thunderstorm';
    } else if (pressure < 40 && temperature > 40) {
      this.state.condition = 'heavy_rain';
    } else if (pressure < 50) {
      this.state.condition = 'light_rain';
    } else {
      this.state.condition = 'overcast';
    }
  }

  // ============================================
  // WEATHER PATTERNS
  // ============================================

  private generatePatterns(data: MarketData): void {
    // Clean up old patterns
    const now = Date.now();
    this.state.patterns = this.state.patterns.filter(
      p => now - p.timestamp < 300000 // Keep for 5 minutes
    );

    // Generate new patterns based on market movements
    if (Math.abs(data.momentum) > 0.5 && data.volume > 1.5) {
      // Strong momentum creates a weather cell
      this.state.patterns.push({
        type: 'cell',
        strength: Math.min(100, Math.abs(data.momentum) * 100),
        direction: data.trend > 0 ? 90 : 270, // Up or down
        speed: this.state.windSpeed,
        position: { x: 50, y: 50 },
        radius: 30 + (data.volume * 20),
        timestamp: now
      });
    }

    if (this.state.severity > 60) {
      // High severity creates a storm system
      this.state.patterns.push({
        type: 'system',
        strength: this.state.severity,
        direction: this.state.pressure > 50 ? 45 : 225,
        speed: this.state.windSpeed * 0.7,
        position: { x: 50 + (Math.random() * 20 - 10), y: 50 + (Math.random() * 20 - 10) },
        radius: 50,
        timestamp: now
      });
    }

    // Limit pattern count
    if (this.state.patterns.length > 5) {
      this.state.patterns = this.state.patterns.slice(-5);
    }
  }

  // ============================================
  // FORECAST
  // ============================================

  private generateForecast(): void {
    // Simple forecast based on trends
    const forecasts: WeatherForecast[] = [];
    const now = Date.now();
    
    // 5min forecast
    forecasts.push({
      timestamp: now + 300000,
      condition: this.predictCondition(5),
      confidence: 75
    });

    // 15min forecast
    forecasts.push({
      timestamp: now + 900000,
      condition: this.predictCondition(15),
      confidence: 60
    });

    // 1hr forecast
    forecasts.push({
      timestamp: now + 3600000,
      condition: this.predictCondition(60),
      confidence: 40
    });

    this.state.forecast = forecasts;
  }

  private predictCondition(minutesAhead: number): WeatherCondition {
    // Simple trend-based prediction
    const tempTrend = this.getTrend('temperature');
    const pressureTrend = this.getTrend('pressure');
    
    const futureTemp = this.state.temperature + (tempTrend * minutesAhead * 0.1);
    const futurePressure = this.state.pressure + (pressureTrend * minutesAhead * 0.05);

    // Use similar logic to current classification
    if (futureTemp > 80 && futurePressure > 70) return 'heatwave';
    if (futureTemp > 70 && this.state.windSpeed > 60) return 'thunderstorm';
    if (futurePressure < 35) return 'heavy_rain';
    if (futureTemp < 30) return 'clear';
    
    return this.state.condition; // Default to current
  }

  // ============================================
  // VISUAL EFFECTS
  // ============================================

  private updateEffects(): void {
    // Fog density from low visibility
    this.state.effects.fogDensity = Math.max(0, 1 - (this.state.visibility / 100));

    // Cloud cover from pressure
    this.state.effects.cloudCover = 0.2 + (Math.abs(50 - this.state.pressure) / 100);

    // Precipitation from bearish pressure
    this.state.effects.precipitation = this.state.pressure < 50 
      ? (50 - this.state.pressure) / 50 
      : 0;

    // Lightning from high temperature + wind
    this.state.effects.lightning = 
      (this.state.temperature > 70 && this.state.windSpeed > 60) 
        ? ((this.state.temperature - 70) / 30) * ((this.state.windSpeed - 60) / 40)
        : 0;
  }

  // ============================================
  // HELPERS
  // ============================================

  private getRecentAverage(metric: 'temperature' | 'pressure' | 'volume', count: number): number {
    if (metric === 'volume') {
      const recent = this.history.slice(-count);
      if (recent.length === 0) return 0.5;
      const sum = recent.reduce((acc, d) => acc + d.volume, 0);
      return sum / recent.length;
    }
    
    // For state metrics, return current value since we don't store state history
    if (metric === 'temperature') return this.state.temperature;
    if (metric === 'pressure') return this.state.pressure;
    return 50;
  }

  private getTrend(metric: 'temperature' | 'pressure'): number {
    if (this.history.length < 2) return 0;
    
    const recent = this.history.slice(-10);
    const first = recent[0][metric === 'temperature' ? 'volatility' : 'trend'] as number;
    const last = recent[recent.length - 1][metric === 'temperature' ? 'volatility' : 'trend'] as number;
    
    return last - first;
  }

  // ============================================
  // GETTERS
  // ============================================

  public getState(): MarketWeatherState {
    return { ...this.state };
  }

  public getCondition(): WeatherCondition {
    return this.state.condition;
  }

  public getSeverity(): number {
    return this.state.severity;
  }

  public getEffects() {
    return { ...this.state.effects };
  }

  public reset(): void {
    this.state = this.getDefaultState();
    this.history = [];
  }
}
