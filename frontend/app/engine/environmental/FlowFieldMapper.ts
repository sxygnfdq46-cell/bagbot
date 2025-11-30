/**
 * 🌊 FLOWFIELD MAPPER (FFM)
 * 
 * Turns orderflow into directional streams.
 * Creates vector field that guides UI motion.
 */

export interface FlowFieldState {
  // Vector grid
  grid: FlowVector[][];
  gridSize: { rows: number; cols: number };
  cellSize: number;
  
  // Flow characteristics
  dominantFlow: {
    direction: number;      // 0-360 degrees
    strength: number;       // 0-100
    consistency: number;    // 0-100 (how uniform)
  };
  
  // Flow streams
  streams: FlowStream[];
  vortices: Vortex[];
  
  // Pressure zones
  sources: PressureZone[];  // Where flow originates (buying)
  sinks: PressureZone[];    // Where flow drains (selling)
  
  // Flow metrics
  totalFlow: number;        // Combined magnitude
  turbulence: number;       // 0-100 (chaos level)
  coherence: number;        // 0-100 (organization level)
}

export interface FlowVector {
  x: number;                // Grid x position
  y: number;                // Grid y position
  direction: number;        // 0-360 degrees
  magnitude: number;        // 0-1 strength
  source: 'buy' | 'sell' | 'neutral';
}

export interface FlowStream {
  id: string;
  points: { x: number; y: number }[];
  strength: number;
  color: string;
  lifetime: number;
  age: number;
}

export interface Vortex {
  center: { x: number; y: number };
  radius: number;
  rotation: 'cw' | 'ccw';
  strength: number;
  type: 'accumulation' | 'distribution';
}

export interface PressureZone {
  center: { x: number; y: number };
  radius: number;
  strength: number;        // Positive for source, negative for sink
  influence: number;       // How far effect reaches
}

export interface OrderFlowData {
  buyVolume: number;
  sellVolume: number;
  buyOrders: number;
  sellOrders: number;
  priceDirection: number;  // -1 to 1
  aggression: number;      // 0-1 (market orders vs limits)
  imbalance: number;       // -1 to 1 (sell to buy imbalance)
}

export class FlowFieldMapper {
  private state: FlowFieldState;
  private flowHistory: OrderFlowData[];
  private readonly HISTORY_SIZE = 50;
  private readonly DEFAULT_GRID_SIZE = { rows: 15, cols: 20 };

  constructor() {
    this.state = this.initializeState();
    this.flowHistory = [];
  }

  private initializeState(): FlowFieldState {
    const grid: FlowVector[][] = [];
    for (let y = 0; y < this.DEFAULT_GRID_SIZE.rows; y++) {
      const row: FlowVector[] = [];
      for (let x = 0; x < this.DEFAULT_GRID_SIZE.cols; x++) {
        row.push({
          x,
          y,
          direction: 0,
          magnitude: 0,
          source: 'neutral'
        });
      }
      grid.push(row);
    }

    return {
      grid,
      gridSize: this.DEFAULT_GRID_SIZE,
      cellSize: 100 / this.DEFAULT_GRID_SIZE.cols,
      dominantFlow: {
        direction: 0,
        strength: 0,
        consistency: 50
      },
      streams: [],
      vortices: [],
      sources: [],
      sinks: [],
      totalFlow: 0,
      turbulence: 0,
      coherence: 50
    };
  }

  // ============================================
  // UPDATE
  // ============================================

  public update(orderFlow: OrderFlowData): FlowFieldState {
    // Add to history
    this.flowHistory.push(orderFlow);
    if (this.flowHistory.length > this.HISTORY_SIZE) {
      this.flowHistory.shift();
    }

    // Update vector field
    this.updateVectorField(orderFlow);

    // Calculate dominant flow
    this.calculateDominantFlow();

    // Generate flow streams
    this.updateFlowStreams();

    // Detect vortices
    this.detectVortices();

    // Identify pressure zones
    this.identifyPressureZones(orderFlow);

    // Calculate flow metrics
    this.calculateFlowMetrics();

    return this.state;
  }

  // ============================================
  // VECTOR FIELD
  // ============================================

  private updateVectorField(flow: OrderFlowData): void {
    const { rows, cols } = this.state.gridSize;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const vector = this.state.grid[y][x];

        // Calculate base direction from price and flow
        let direction = 0;
        let magnitude = 0;
        let source: 'buy' | 'sell' | 'neutral' = 'neutral';

        // Price direction influences vertical component
        const verticalBias = flow.priceDirection * 90; // -90 to +90 degrees

        // Imbalance influences horizontal component
        const horizontalBias = flow.imbalance * 45; // -45 to +45 degrees

        // Combine for base direction
        direction = 90 + verticalBias + horizontalBias; // Center around 90° (up)

        // Magnitude from total volume
        const volumeRatio = flow.buyVolume + flow.sellVolume;
        magnitude = Math.min(1, volumeRatio * 0.5);

        // Add spatial variation (creates more interesting flow)
        const xRatio = x / cols;
        const yRatio = y / rows;
        const spatialNoise = (Math.sin(xRatio * Math.PI * 2) + Math.cos(yRatio * Math.PI * 2)) * 15;
        direction += spatialNoise;

        // Determine source
        if (flow.buyVolume > flow.sellVolume * 1.2) {
          source = 'buy';
        } else if (flow.sellVolume > flow.buyVolume * 1.2) {
          source = 'sell';
        }

        // Apply aggression to magnitude
        magnitude *= (0.5 + flow.aggression * 0.5);

        // Update vector
        vector.direction = (direction + 360) % 360;
        vector.magnitude = magnitude;
        vector.source = source;
      }
    }
  }

  // ============================================
  // DOMINANT FLOW
  // ============================================

  private calculateDominantFlow(): void {
    let totalX = 0;
    let totalY = 0;
    let totalMagnitude = 0;
    let count = 0;

    // Average all vectors
    for (const row of this.state.grid) {
      for (const vector of row) {
        if (vector.magnitude > 0.1) {
          const rad = (vector.direction * Math.PI) / 180;
          const vx = Math.cos(rad) * vector.magnitude;
          const vy = Math.sin(rad) * vector.magnitude;
          
          totalX += vx;
          totalY += vy;
          totalMagnitude += vector.magnitude;
          count++;
        }
      }
    }

    if (count > 0) {
      const avgX = totalX / count;
      const avgY = totalY / count;
      
      // Calculate dominant direction
      const direction = (Math.atan2(avgY, avgX) * 180 / Math.PI + 360) % 360;
      
      // Calculate strength
      const strength = Math.min(100, (totalMagnitude / count) * 100);
      
      // Calculate consistency (how aligned vectors are)
      const consistency = this.calculateVectorConsistency();

      this.state.dominantFlow = {
        direction,
        strength,
        consistency
      };
    }
  }

  private calculateVectorConsistency(): number {
    const dominant = this.state.dominantFlow.direction;
    let alignmentSum = 0;
    let count = 0;

    for (const row of this.state.grid) {
      for (const vector of row) {
        if (vector.magnitude > 0.1) {
          // Calculate angle difference
          let diff = Math.abs(vector.direction - dominant);
          if (diff > 180) diff = 360 - diff;
          
          // Alignment score (0 at 180°, 1 at 0°)
          const alignment = 1 - (diff / 180);
          alignmentSum += alignment * vector.magnitude;
          count++;
        }
      }
    }

    return count > 0 ? (alignmentSum / count) * 100 : 50;
  }

  // ============================================
  // FLOW STREAMS
  // ============================================

  private updateFlowStreams(): void {
    // Age existing streams
    this.state.streams = this.state.streams.filter(stream => {
      stream.age++;
      return stream.age < stream.lifetime;
    });

    // Spawn new streams periodically
    if (this.state.streams.length < 8 && this.state.totalFlow > 20) {
      const newStream = this.createFlowStream();
      if (newStream) {
        this.state.streams.push(newStream);
      }
    }

    // Update stream positions
    for (const stream of this.state.streams) {
      this.advanceStream(stream);
    }
  }

  private createFlowStream(): FlowStream | null {
    // Start from edge based on dominant flow
    const { direction, strength } = this.state.dominantFlow;
    
    if (strength < 20) return null;

    // Determine start position
    let startX: number, startY: number;
    const angle = (direction - 90 + 360) % 360; // Convert to standard angle

    if (angle < 45 || angle > 315) {
      // Coming from right
      startX = 100;
      startY = Math.random() * 100;
    } else if (angle < 135) {
      // Coming from bottom
      startX = Math.random() * 100;
      startY = 100;
    } else if (angle < 225) {
      // Coming from left
      startX = 0;
      startY = Math.random() * 100;
    } else {
      // Coming from top
      startX = Math.random() * 100;
      startY = 0;
    }

    return {
      id: `stream_${Date.now()}_${Math.random()}`,
      points: [{ x: startX, y: startY }],
      strength: strength / 100,
      color: this.getFlowColor(direction),
      lifetime: 100 + Math.floor(Math.random() * 100),
      age: 0
    };
  }

  private advanceStream(stream: FlowStream): void {
    const lastPoint = stream.points[stream.points.length - 1];
    
    // Get flow vector at this position
    const vector = this.getVectorAt(lastPoint.x, lastPoint.y);
    
    if (vector) {
      // Move along flow direction
      const rad = (vector.direction * Math.PI) / 180;
      const speed = 2 + vector.magnitude * 3;
      
      const newX = lastPoint.x + Math.cos(rad) * speed;
      const newY = lastPoint.y + Math.sin(rad) * speed;
      
      // Keep in bounds
      if (newX >= 0 && newX <= 100 && newY >= 0 && newY <= 100) {
        stream.points.push({ x: newX, y: newY });
        
        // Limit point count
        if (stream.points.length > 30) {
          stream.points.shift();
        }
      } else {
        // Out of bounds, end stream
        stream.age = stream.lifetime;
      }
    }
  }

  // ============================================
  // VORTICES
  // ============================================

  private detectVortices(): void {
    this.state.vortices = [];

    // Look for circular flow patterns
    const checkRadius = 3; // Grid cells to check
    
    for (let y = checkRadius; y < this.state.gridSize.rows - checkRadius; y++) {
      for (let x = checkRadius; x < this.state.gridSize.cols - checkRadius; x++) {
        const vortex = this.checkVortexAt(x, y, checkRadius);
        if (vortex) {
          this.state.vortices.push(vortex);
        }
      }
    }

    // Limit vortex count
    if (this.state.vortices.length > 3) {
      this.state.vortices.sort((a, b) => b.strength - a.strength);
      this.state.vortices = this.state.vortices.slice(0, 3);
    }
  }

  private checkVortexAt(centerX: number, centerY: number, radius: number): Vortex | null {
    // Check if vectors around this point show circular pattern
    let cwScore = 0;
    let ccwScore = 0;
    let totalMagnitude = 0;

    const points = [
      { x: centerX + radius, y: centerY, expected: 270 },
      { x: centerX, y: centerY + radius, expected: 0 },
      { x: centerX - radius, y: centerY, expected: 90 },
      { x: centerX, y: centerY - radius, expected: 180 }
    ];

    for (const point of points) {
      if (point.y >= 0 && point.y < this.state.gridSize.rows &&
          point.x >= 0 && point.x < this.state.gridSize.cols) {
        const vector = this.state.grid[point.y][point.x];
        
        // Check alignment with circular flow
        const diff = Math.abs(vector.direction - point.expected);
        const alignmentCW = 1 - Math.min(diff, 360 - diff) / 180;
        const alignmentCCW = 1 - Math.min(Math.abs(vector.direction - (point.expected + 180) % 360), 360 - Math.abs(vector.direction - (point.expected + 180) % 360)) / 180;
        
        cwScore += alignmentCW * vector.magnitude;
        ccwScore += alignmentCCW * vector.magnitude;
        totalMagnitude += vector.magnitude;
      }
    }

    const avgMagnitude = totalMagnitude / points.length;
    const strength = Math.max(cwScore, ccwScore) / points.length * 100;

    // Need strong circular pattern
    if (strength > 40 && avgMagnitude > 0.3) {
      const centerPx = {
        x: (centerX / this.state.gridSize.cols) * 100,
        y: (centerY / this.state.gridSize.rows) * 100
      };

      return {
        center: centerPx,
        radius: (radius / this.state.gridSize.cols) * 100,
        rotation: cwScore > ccwScore ? 'cw' : 'ccw',
        strength,
        type: cwScore > ccwScore ? 'accumulation' : 'distribution'
      };
    }

    return null;
  }

  // ============================================
  // PRESSURE ZONES
  // ============================================

  private identifyPressureZones(flow: OrderFlowData): void {
    this.state.sources = [];
    this.state.sinks = [];

    // Create source for strong buying
    if (flow.buyVolume > flow.sellVolume * 1.5) {
      this.state.sources.push({
        center: { x: 50 + Math.random() * 20 - 10, y: 70 + Math.random() * 10 },
        radius: 15 + flow.buyVolume * 10,
        strength: flow.buyVolume * 100,
        influence: 30
      });
    }

    // Create sink for strong selling
    if (flow.sellVolume > flow.buyVolume * 1.5) {
      this.state.sinks.push({
        center: { x: 50 + Math.random() * 20 - 10, y: 30 + Math.random() * 10 },
        radius: 15 + flow.sellVolume * 10,
        strength: -flow.sellVolume * 100,
        influence: 30
      });
    }
  }

  // ============================================
  // METRICS
  // ============================================

  private calculateFlowMetrics(): void {
    // Total flow = sum of all vector magnitudes
    let totalMag = 0;
    let count = 0;

    for (const row of this.state.grid) {
      for (const vector of row) {
        totalMag += vector.magnitude;
        count++;
      }
    }

    this.state.totalFlow = (totalMag / count) * 100;

    // Turbulence = variation in directions
    this.state.turbulence = 100 - this.state.dominantFlow.consistency;

    // Coherence = how organized the flow is
    this.state.coherence = this.state.dominantFlow.consistency;
  }

  // ============================================
  // HELPERS
  // ============================================

  private getFlowColor(direction: number): string {
    // Color based on direction
    const hue = direction; // 0-360 maps directly to hue
    return `hsl(${hue}, 70%, 60%)`;
  }

  // ============================================
  // GETTERS
  // ============================================

  public getState(): FlowFieldState {
    return { ...this.state };
  }

  public getVectorAt(x: number, y: number): FlowVector | null {
    const col = Math.floor((x / 100) * this.state.gridSize.cols);
    const row = Math.floor((y / 100) * this.state.gridSize.rows);
    
    if (row >= 0 && row < this.state.gridSize.rows && 
        col >= 0 && col < this.state.gridSize.cols) {
      return this.state.grid[row][col];
    }
    
    return null;
  }

  public getDominantFlow() {
    return { ...this.state.dominantFlow };
  }

  public reset(): void {
    this.state = this.initializeState();
    this.flowHistory = [];
  }
}
