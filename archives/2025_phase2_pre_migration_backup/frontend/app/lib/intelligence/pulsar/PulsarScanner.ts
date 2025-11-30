export class PulsarScanner {
  private frequency: number;
  private thresholds: any;
  private listeners: Array<(signal: any) => void> = [];

  constructor() {
    this.frequency = 60; // scans per minute
    this.thresholds = {
      volatility: 0.65,
      liquidityShock: 0.55,
      anomaly: 0.70,
      trendBreak: 0.60
    };
  }

  onDetect(callback: (signal: any) => void) {
    this.listeners.push(callback);
  }

  private emit(signal: any) {
    for (const cb of this.listeners) cb(signal);
  }

  public scan(marketData: any) {
    const pulse = {
      volatility: this.analyzeVolatility(marketData),
      anomaly: this.detectAnomalies(marketData),
      liquidityShock: this.checkLiquidity(marketData),
      trendBreak: this.detectTrendBreak(marketData),
      timestamp: Date.now()
    };

    // Merge into one unified "threat pulse"
    const intensity =
      (pulse.volatility +
        pulse.anomaly +
        pulse.liquidityShock +
        pulse.trendBreak) / 4;

    if (intensity > this.thresholds.volatility) {
      this.emit({
        type: "PULSAR_THREAT",
        intensity,
        pulse
      });
    }

    return pulse;
  }

  private analyzeVolatility(data: any) {
    return Math.min(1, data.volatility || 0);
  }

  private detectAnomalies(data: any) {
    return Math.min(1, data.anomalyIndex || 0);
  }

  private checkLiquidity(data: any) {
    return Math.min(1, data.liquidityShock || 0);
  }

  private detectTrendBreak(data: any) {
    return Math.min(1, data.trendBreak || 0);
  }
}
