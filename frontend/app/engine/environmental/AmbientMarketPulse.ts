/**
 * 💓 AMBIENT MARKET PULSE (AMP)
 * 
 * Global 1Hz "heartbeat" matching live market vitality.
 * Synchronizes entire UI to market rhythm.
 */

export interface AmbientMarketPulseState {
  // Heartbeat
  bpm: number;                  // Beats per minute (30-180)
  rhythm: PulseRhythm;
  regularity: number;           // 0-100 (how regular beats are)
  
  // Pulse wave
  currentPhase: number;         // 0-360 degrees (current beat position)
  amplitude: number;            // 0-100 (beat strength)
  waveform: 'sine' | 'square' | 'triangle' | 'saw' | 'erratic';
  
  // Vitality
  marketVitality: number;       // 0-100 (how alive market is)
  energyLevel: number;          // 0-100 (market energy)
  fatigue: number;              // 0-100 (market tiredness)
  arousal: number;              // 0-100 (excitement level)
  
  // Cardiac metrics
  hrvScore: number;             // 0-100 (heart rate variability - health indicator)
  stressIndex: number;          // 0-100 (market stress)
  coherence: number;            // 0-100 (systemic alignment)
  
  // Circulation
  flowRate: number;             // 0-100 (how well market is flowing)
  pressure: number;             // 0-100 (market pressure)
  oxygenation: number;          // 0-100 (liquidity saturation)
  
  // Historical
  beatHistory: Beat[];
  avgBPM: number;               // Rolling average
  peakBPM: number;              // Highest in session
  restingBPM: number;           // Baseline
}

export interface Beat {
  timestamp: number;
  bpm: number;
  amplitude: number;
  phase: number;
  duration: number;             // milliseconds
}

export type PulseRhythm = 
  | 'regular'                   // Steady, predictable
  | 'irregular'                 // Varying intervals
  | 'rapid'                     // Fast, excited
  | 'slow'                      // Calm, subdued
  | 'skipped'                   // Missing beats
  | 'racing'                    // Extremely fast
  | 'arrhythmic';               // Chaotic

export interface MarketVitalSigns {
  timestamp: number;
  volume: number;               // Current volume
  trades: number;               // Trade count
  volatility: number;           // Price volatility
  momentum: number;             // Directional momentum
  liquidity: number;            // Available liquidity
  participation: number;        // Market participants activity
}

export class AmbientMarketPulse {
  private state: AmbientMarketPulseState;
  private vitalsHistory: MarketVitalSigns[];
  private intervalId: NodeJS.Timeout | null = null;
  private lastBeatTime: number = 0;
  private readonly HISTORY_SIZE = 300; // 5 minutes at 1Hz
  private readonly MIN_BPM = 30;
  private readonly MAX_BPM = 180;
  private readonly RESTING_BPM = 60;

  constructor() {
    this.state = this.getDefaultState();
    this.vitalsHistory = [];
  }

  private getDefaultState(): AmbientMarketPulseState {
    return {
      bpm: this.RESTING_BPM,
      rhythm: 'regular',
      regularity: 80,
      currentPhase: 0,
      amplitude: 50,
      waveform: 'sine',
      marketVitality: 50,
      energyLevel: 50,
      fatigue: 0,
      arousal: 50,
      hrvScore: 70,
      stressIndex: 0,
      coherence: 70,
      flowRate: 50,
      pressure: 50,
      oxygenation: 70,
      beatHistory: [],
      avgBPM: this.RESTING_BPM,
      peakBPM: this.RESTING_BPM,
      restingBPM: this.RESTING_BPM
    };
  }

  // ============================================
  // START/STOP
  // ============================================

  public start(): void {
    if (this.intervalId) return;

    // Update pulse at 60Hz for smooth animation
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000 / 60);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // ============================================
  // UPDATE
  // ============================================

  public update(vitals: MarketVitalSigns): AmbientMarketPulseState {
    // Add to history
    this.vitalsHistory.push(vitals);
    if (this.vitalsHistory.length > this.HISTORY_SIZE) {
      this.vitalsHistory.shift();
    }

    // Calculate BPM from market vitality
    this.calculateBPM(vitals);

    // Determine rhythm
    this.determineRhythm();

    // Calculate vitality metrics
    this.calculateVitality(vitals);

    // Calculate cardiac metrics
    this.calculateCardiacMetrics();

    // Calculate circulation
    this.calculateCirculation(vitals);

    // Update waveform
    this.updateWaveform();

    return this.state;
  }

  private tick(): void {
    const now = Date.now();

    // Calculate phase progression based on BPM
    const beatDuration = (60 / this.state.bpm) * 1000; // milliseconds per beat
    const dt = now - this.lastBeatTime;

    if (dt >= beatDuration) {
      // New beat
      this.triggerBeat(now);
      this.lastBeatTime = now;
      this.state.currentPhase = 0;
    } else {
      // Progress through beat
      this.state.currentPhase = (dt / beatDuration) * 360;
    }
  }

  private triggerBeat(timestamp: number): void {
    const beat: Beat = {
      timestamp,
      bpm: this.state.bpm,
      amplitude: this.state.amplitude,
      phase: 0,
      duration: (60 / this.state.bpm) * 1000
    };

    this.state.beatHistory.push(beat);

    // Keep last 100 beats
    if (this.state.beatHistory.length > 100) {
      this.state.beatHistory.shift();
    }

    // Update peak BPM
    if (this.state.bpm > this.state.peakBPM) {
      this.state.peakBPM = this.state.bpm;
    }
  }

  // ============================================
  // BPM CALCULATION
  // ============================================

  private calculateBPM(vitals: MarketVitalSigns): void {
    if (this.vitalsHistory.length < 2) {
      this.state.bpm = this.RESTING_BPM;
      return;
    }

    // Calculate BPM based on multiple factors
    const volumeFactor = Math.min(1, vitals.volume * 0.8);
    const tradesFactor = Math.min(1, vitals.trades / 100);
    const volatilityFactor = vitals.volatility;
    const momentumFactor = Math.abs(vitals.momentum);
    const participationFactor = vitals.participation;

    // Combine factors (weighted)
    const activityScore = (
      volumeFactor * 0.25 +
      tradesFactor * 0.2 +
      volatilityFactor * 0.25 +
      momentumFactor * 0.15 +
      participationFactor * 0.15
    );

    // Map to BPM range
    const targetBPM = this.RESTING_BPM + (activityScore * (this.MAX_BPM - this.RESTING_BPM));

    // Smooth BPM changes
    this.state.bpm += (targetBPM - this.state.bpm) * 0.1;
    this.state.bpm = Math.max(this.MIN_BPM, Math.min(this.MAX_BPM, this.state.bpm));

    // Update average
    if (this.state.beatHistory.length > 0) {
      const recent = this.state.beatHistory.slice(-20);
      this.state.avgBPM = recent.reduce((sum, b) => sum + b.bpm, 0) / recent.length;
    }
  }

  // ============================================
  // RHYTHM DETERMINATION
  // ============================================

  private determineRhythm(): void {
    if (this.state.beatHistory.length < 5) {
      this.state.rhythm = 'regular';
      this.state.regularity = 80;
      return;
    }

    const recent = this.state.beatHistory.slice(-10);
    
    // Calculate interval variability
    const intervals = [];
    for (let i = 1; i < recent.length; i++) {
      intervals.push(recent[i].timestamp - recent[i - 1].timestamp);
    }

    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgInterval; // Coefficient of variation

    // Classify rhythm
    this.state.regularity = Math.max(0, 100 - cv * 100);

    if (this.state.bpm > 140) {
      this.state.rhythm = 'racing';
    } else if (this.state.bpm > 100 && cv < 0.1) {
      this.state.rhythm = 'rapid';
    } else if (this.state.bpm < 45) {
      this.state.rhythm = 'slow';
    } else if (cv > 0.3) {
      this.state.rhythm = 'arrhythmic';
    } else if (cv > 0.2) {
      this.state.rhythm = 'irregular';
    } else if (cv > 0.15) {
      this.state.rhythm = 'skipped';
    } else {
      this.state.rhythm = 'regular';
    }
  }

  // ============================================
  // VITALITY METRICS
  // ============================================

  private calculateVitality(vitals: MarketVitalSigns): void {
    // Market vitality = overall "aliveness"
    const volumeVitality = Math.min(100, vitals.volume * 80);
    const tradeVitality = Math.min(100, vitals.trades / 100 * 100);
    const momentumVitality = Math.abs(vitals.momentum) * 100;
    const participationVitality = vitals.participation * 100;

    this.state.marketVitality = (
      volumeVitality * 0.3 +
      tradeVitality * 0.2 +
      momentumVitality * 0.25 +
      participationVitality * 0.25
    );

    // Energy level = capacity to do work
    this.state.energyLevel = (this.state.bpm - this.MIN_BPM) / (this.MAX_BPM - this.MIN_BPM) * 100;

    // Fatigue = accumulated stress without recovery
    if (this.state.bpm > 120) {
      this.state.fatigue += 0.5; // Accumulate fatigue at high BPM
    } else if (this.state.bpm < 70) {
      this.state.fatigue = Math.max(0, this.state.fatigue - 1); // Recover at low BPM
    }
    this.state.fatigue = Math.min(100, this.state.fatigue);

    // Arousal = excitement level
    this.state.arousal = Math.min(100,
      (vitals.volatility * 50) +
      (this.state.bpm > 100 ? 30 : 0) +
      (vitals.momentum * 20)
    );
  }

  // ============================================
  // CARDIAC METRICS
  // ============================================

  private calculateCardiacMetrics(): void {
    if (this.state.beatHistory.length < 10) return;

    const recent = this.state.beatHistory.slice(-20);

    // HRV Score (Heart Rate Variability) - marker of health/adaptability
    const intervals: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      intervals.push(recent[i].timestamp - recent[i - 1].timestamp);
    }

    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const rmssd = Math.sqrt(
      intervals.slice(1).reduce((sum, interval, i) => {
        return sum + Math.pow(interval - intervals[i], 2);
      }, 0) / (intervals.length - 1)
    );

    // Higher RMSSD = better HRV = healthier
    this.state.hrvScore = Math.min(100, (rmssd / avgInterval) * 100);

    // Stress index (inverse of HRV)
    this.state.stressIndex = Math.max(0, 100 - this.state.hrvScore);

    // Coherence = alignment between different rhythms
    const bpmVariance = recent.reduce((sum, b) => sum + Math.pow(b.bpm - this.state.avgBPM, 2), 0) / recent.length;
    const bpmStdDev = Math.sqrt(bpmVariance);
    this.state.coherence = Math.max(0, 100 - bpmStdDev);
  }

  // ============================================
  // CIRCULATION
  // ============================================

  private calculateCirculation(vitals: MarketVitalSigns): void {
    // Flow rate = how smoothly market is operating
    this.state.flowRate = Math.min(100,
      vitals.volume * 40 +
      this.state.regularity * 0.3 +
      (100 - this.state.fatigue) * 0.3
    );

    // Pressure = directional force
    this.state.pressure = Math.min(100,
      Math.abs(vitals.momentum) * 60 +
      vitals.participation * 40
    );

    // Oxygenation = liquidity saturation
    this.state.oxygenation = Math.min(100, vitals.liquidity * 100);
  }

  // ============================================
  // WAVEFORM
  // ============================================

  private updateWaveform(): void {
    // Choose waveform based on market conditions
    if (this.state.rhythm === 'arrhythmic' || this.state.rhythm === 'skipped') {
      this.state.waveform = 'erratic';
    } else if (this.state.bpm > 140) {
      this.state.waveform = 'square'; // Sharp, aggressive
    } else if (this.state.arousal > 70) {
      this.state.waveform = 'saw'; // Rising excitement
    } else if (this.state.regularity < 50) {
      this.state.waveform = 'triangle'; // Uneven
    } else {
      this.state.waveform = 'sine'; // Smooth, normal
    }

    // Amplitude based on energy
    this.state.amplitude = this.state.energyLevel * 0.8 + 20;
  }

  // ============================================
  // GETTERS
  // ============================================

  public getState(): AmbientMarketPulseState {
    return { ...this.state };
  }

  public getBPM(): number {
    return this.state.bpm;
  }

  public getCurrentPhase(): number {
    return this.state.currentPhase;
  }

  public getPulseValue(): number {
    // Get current pulse value based on waveform and phase
    const phase = this.state.currentPhase;
    const amplitude = this.state.amplitude / 100;

    switch (this.state.waveform) {
      case 'sine':
        return Math.sin((phase * Math.PI) / 180) * amplitude;
      
      case 'square':
        return (phase < 180 ? 1 : -1) * amplitude;
      
      case 'triangle':
        if (phase < 90) return (phase / 90) * amplitude;
        if (phase < 270) return ((180 - phase) / 90) * amplitude;
        return ((phase - 360) / 90) * amplitude;
      
      case 'saw':
        return ((phase / 360) * 2 - 1) * amplitude;
      
      case 'erratic':
        return (Math.random() * 2 - 1) * amplitude;
      
      default:
        return 0;
    }
  }

  public isHealthy(): boolean {
    return this.state.hrvScore > 50 && 
           this.state.stressIndex < 70 && 
           this.state.fatigue < 60;
  }

  public reset(): void {
    this.state = this.getDefaultState();
    this.vitalsHistory = [];
    this.lastBeatTime = 0;
  }
}
