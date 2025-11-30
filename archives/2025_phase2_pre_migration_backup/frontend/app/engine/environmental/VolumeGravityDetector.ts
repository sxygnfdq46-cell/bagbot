/**
 * ⚖️ VOLUME GRAVITY DETECTOR (VGD)
 * 
 * Detects pull-zones & market centers of mass.
 * Creates gravitational fields that attract or repel UI elements.
 */

export interface VolumeGravityState {
  // Centers of mass
  massPoints: MassPoint[];
  
  // Gravitational field
  primaryCenter: MassPoint | null;
  secondaryCenter: MassPoint | null;
  
  // Pull zones
  attractionZones: GravityZone[];
  repulsionZones: GravityZone[];
  
  // Gravity metrics
  totalMass: number;          // 0-100 (total volume concentration)
  centerStrength: number;     // 0-100 (how strong primary center is)
  balance: number;            // 0-100 (how evenly distributed mass is)
  stability: number;          // 0-100 (how stable center position is)
  
  // Field effects
  fieldStrength: number;      // 0-100 (overall gravitational pull)
  tideStrength: number;       // 0-100 (oscillation intensity)
  distortion: number;         // 0-100 (field warping)
}

export interface MassPoint {
  position: { x: number; y: number }; // Percentage coordinates
  mass: number;                       // 0-100 (volume concentration)
  type: 'buy' | 'sell' | 'neutral';
  radius: number;                     // Influence radius
  velocity: { x: number; y: number }; // Movement vector
  age: number;                        // How long it's existed
}

export interface GravityZone {
  center: { x: number; y: number };
  radius: number;
  strength: number;           // Positive = attraction, negative = repulsion
  type: 'volume_cluster' | 'support' | 'resistance' | 'void';
  influence: number;          // How far effect reaches (0-100)
}

export interface VolumeData {
  totalVolume: number;
  buyVolume: number;
  sellVolume: number;
  priceLevel: number;         // Current price as percentage of range
  volumeProfile: { price: number; volume: number }[]; // Volume at price levels
  largeOrders: { price: number; size: number; side: 'buy' | 'sell' }[];
}

export class VolumeGravityDetector {
  private state: VolumeGravityState;
  private massHistory: MassPoint[];
  private volumeHistory: VolumeData[];
  private readonly HISTORY_SIZE = 100;

  constructor() {
    this.state = this.getDefaultState();
    this.massHistory = [];
    this.volumeHistory = [];
  }

  private getDefaultState(): VolumeGravityState {
    return {
      massPoints: [],
      primaryCenter: null,
      secondaryCenter: null,
      attractionZones: [],
      repulsionZones: [],
      totalMass: 0,
      centerStrength: 0,
      balance: 50,
      stability: 50,
      fieldStrength: 0,
      tideStrength: 0,
      distortion: 0
    };
  }

  // ============================================
  // UPDATE
  // ============================================

  public update(volumeData: VolumeData): VolumeGravityState {
    // Add to history
    this.volumeHistory.push(volumeData);
    if (this.volumeHistory.length > this.HISTORY_SIZE) {
      this.volumeHistory.shift();
    }

    // Detect mass points from volume concentrations
    this.detectMassPoints(volumeData);

    // Age and update existing mass points
    this.updateMassPoints();

    // Identify primary and secondary centers
    this.identifyCenters();

    // Generate gravity zones
    this.generateGravityZones(volumeData);

    // Calculate gravity metrics
    this.calculateMetrics();

    return this.state;
  }

  // ============================================
  // MASS POINT DETECTION
  // ============================================

  private detectMassPoints(data: VolumeData): void {
    // Detect volume clusters from volume profile
    const clusters = this.findVolumeClusters(data.volumeProfile);

    for (const cluster of clusters) {
      // Check if we already have a mass point near this location
      const existing = this.findNearbyMassPoint(cluster.position);

      if (existing) {
        // Update existing mass point
        existing.mass = cluster.mass;
        existing.age = 0; // Reset age
      } else {
        // Create new mass point
        this.state.massPoints.push({
          position: cluster.position,
          mass: cluster.mass,
          type: cluster.type,
          radius: 10 + cluster.mass * 0.3,
          velocity: { x: 0, y: 0 },
          age: 0
        });
      }
    }

    // Detect mass from large orders
    for (const order of data.largeOrders) {
      if (order.size > data.totalVolume * 0.1) { // Significant order
        const position = {
          x: 50 + (Math.random() * 40 - 20), // Spread around center
          y: (order.price - 0.5) * 100 + 50   // Y = price level
        };

        const mass = (order.size / data.totalVolume) * 100;

        this.state.massPoints.push({
          position,
          mass,
          type: order.side,
          radius: 15 + mass * 0.2,
          velocity: { x: 0, y: 0 },
          age: 0
        });
      }
    }

    // Limit mass point count
    if (this.state.massPoints.length > 10) {
      this.state.massPoints.sort((a, b) => b.mass - a.mass);
      this.state.massPoints = this.state.massPoints.slice(0, 10);
    }
  }

  private findVolumeClusters(profile: { price: number; volume: number }[]): {
    position: { x: number; y: number };
    mass: number;
    type: 'buy' | 'sell' | 'neutral';
  }[] {
    if (profile.length === 0) return [];

    const clusters: { position: { x: number; y: number }; mass: number; type: 'buy' | 'sell' | 'neutral' }[] = [];
    const totalVolume = profile.reduce((sum, p) => sum + p.volume, 0);

    // Find local maxima in volume profile
    for (let i = 1; i < profile.length - 1; i++) {
      const prev = profile[i - 1].volume;
      const curr = profile[i].volume;
      const next = profile[i + 1].volume;

      // Local maximum
      if (curr > prev && curr > next && curr > totalVolume * 0.05) {
        const mass = (curr / totalVolume) * 100;
        
        clusters.push({
          position: {
            x: 50, // Center horizontally
            y: (profile[i].price - 0.5) * 100 + 50 // Price level
          },
          mass,
          type: 'neutral' // Would need order flow to determine buy/sell
        });
      }
    }

    return clusters;
  }

  private findNearbyMassPoint(position: { x: number; y: number }): MassPoint | null {
    const threshold = 15; // Distance threshold

    for (const point of this.state.massPoints) {
      const dx = point.position.x - position.x;
      const dy = point.position.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < threshold) {
        return point;
      }
    }

    return null;
  }

  // ============================================
  // MASS POINT UPDATES
  // ============================================

  private updateMassPoints(): void {
    // Age points and calculate movement
    for (let i = this.state.massPoints.length - 1; i >= 0; i--) {
      const point = this.state.massPoints[i];
      point.age++;

      // Remove old points
      if (point.age > 50) {
        this.state.massPoints.splice(i, 1);
        continue;
      }

      // Calculate gravitational interactions (mass points attract/repel each other)
      let forceX = 0;
      let forceY = 0;

      for (const other of this.state.massPoints) {
        if (other === point) continue;

        const dx = other.position.x - point.position.x;
        const dy = other.position.y - point.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0.1) {
          // Gravity force proportional to mass, inverse square of distance
          const force = (point.mass * other.mass) / (distance * distance);
          const forceDir = Math.atan2(dy, dx);

          // Same type attracts, opposite repels
          const attractRepel = (point.type === other.type) ? 1 : -0.5;

          forceX += Math.cos(forceDir) * force * attractRepel * 0.01;
          forceY += Math.sin(forceDir) * force * attractRepel * 0.01;
        }
      }

      // Update velocity
      point.velocity.x += forceX;
      point.velocity.y += forceY;

      // Apply friction
      point.velocity.x *= 0.95;
      point.velocity.y *= 0.95;

      // Update position
      point.position.x += point.velocity.x;
      point.position.y += point.velocity.y;

      // Keep in bounds
      point.position.x = Math.max(5, Math.min(95, point.position.x));
      point.position.y = Math.max(5, Math.min(95, point.position.y));

      // Decay mass over time
      point.mass *= 0.99;
    }

    // Add to history
    this.massHistory.push(...this.state.massPoints.map(p => ({ ...p })));
    if (this.massHistory.length > this.HISTORY_SIZE) {
      this.massHistory = this.massHistory.slice(-this.HISTORY_SIZE);
    }
  }

  // ============================================
  // CENTER IDENTIFICATION
  // ============================================

  private identifyCenters(): void {
    if (this.state.massPoints.length === 0) {
      this.state.primaryCenter = null;
      this.state.secondaryCenter = null;
      return;
    }

    // Calculate center of mass
    let totalMass = 0;
    let centerX = 0;
    let centerY = 0;

    for (const point of this.state.massPoints) {
      totalMass += point.mass;
      centerX += point.position.x * point.mass;
      centerY += point.position.y * point.mass;
    }

    if (totalMass > 0) {
      centerX /= totalMass;
      centerY /= totalMass;

      // Primary center is the calculated center of mass
      this.state.primaryCenter = {
        position: { x: centerX, y: centerY },
        mass: totalMass,
        type: 'neutral',
        radius: 20 + totalMass * 0.1,
        velocity: { x: 0, y: 0 },
        age: 0
      };
    }

    // Secondary center is the largest mass point farthest from primary
    if (this.state.primaryCenter && this.state.massPoints.length > 1) {
      let maxDist = 0;
      let secondaryPoint: MassPoint | null = null;

      for (const point of this.state.massPoints) {
        if (point.mass < totalMass * 0.2) continue; // Must be significant

        const dx = point.position.x - centerX;
        const dy = point.position.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist) {
          maxDist = dist;
          secondaryPoint = point;
        }
      }

      this.state.secondaryCenter = secondaryPoint;
    }
  }

  // ============================================
  // GRAVITY ZONES
  // ============================================

  private generateGravityZones(data: VolumeData): void {
    this.state.attractionZones = [];
    this.state.repulsionZones = [];

    // Create attraction zones around mass points
    for (const point of this.state.massPoints) {
      if (point.mass > 20) {
        this.state.attractionZones.push({
          center: { ...point.position },
          radius: point.radius,
          strength: point.mass,
          type: 'volume_cluster',
          influence: point.mass * 0.8
        });
      }
    }

    // Create support/resistance zones from volume profile peaks
    const profile = data.volumeProfile;
    const avgVolume = profile.reduce((sum, p) => sum + p.volume, 0) / profile.length;

    for (const level of profile) {
      if (level.volume > avgVolume * 2) {
        const yPos = (level.price - 0.5) * 100 + 50;

        this.state.attractionZones.push({
          center: { x: 50, y: yPos },
          radius: 15,
          strength: (level.volume / avgVolume) * 30,
          type: yPos > 50 ? 'resistance' : 'support',
          influence: 40
        });
      }
    }

    // Create repulsion zones in low-volume areas (voids)
    for (let i = 0; i < profile.length - 1; i++) {
      const curr = profile[i];
      const next = profile[i + 1];

      if (curr.volume < avgVolume * 0.3 && next.volume < avgVolume * 0.3) {
        const yPos = ((curr.price + next.price) / 2 - 0.5) * 100 + 50;

        this.state.repulsionZones.push({
          center: { x: 50, y: yPos },
          radius: 20,
          strength: -30,
          type: 'void',
          influence: 35
        });
      }
    }

    // Limit zone count
    if (this.state.attractionZones.length > 5) {
      this.state.attractionZones.sort((a, b) => b.strength - a.strength);
      this.state.attractionZones = this.state.attractionZones.slice(0, 5);
    }

    if (this.state.repulsionZones.length > 3) {
      this.state.repulsionZones = this.state.repulsionZones.slice(0, 3);
    }
  }

  // ============================================
  // METRICS
  // ============================================

  private calculateMetrics(): void {
    // Total mass
    this.state.totalMass = this.state.massPoints.reduce((sum, p) => sum + p.mass, 0);

    // Center strength
    this.state.centerStrength = this.state.primaryCenter?.mass || 0;

    // Balance (how evenly distributed mass is)
    if (this.state.massPoints.length > 0) {
      const avgMass = this.state.totalMass / this.state.massPoints.length;
      let variance = 0;

      for (const point of this.state.massPoints) {
        variance += Math.pow(point.mass - avgMass, 2);
      }

      variance /= this.state.massPoints.length;
      this.state.balance = Math.max(0, 100 - variance);
    }

    // Stability (how much center is moving)
    if (this.massHistory.length > 10) {
      const recent = this.massHistory.slice(-10);
      const centerMovement = this.calculateCenterMovement(recent);
      this.state.stability = Math.max(0, 100 - centerMovement * 10);
    }

    // Field strength
    this.state.fieldStrength = Math.min(100, this.state.totalMass * 0.8);

    // Tide strength (oscillation based on buy/sell imbalance)
    const buyMass = this.state.massPoints.filter(p => p.type === 'buy').reduce((sum, p) => sum + p.mass, 0);
    const sellMass = this.state.massPoints.filter(p => p.type === 'sell').reduce((sum, p) => sum + p.mass, 0);
    this.state.tideStrength = Math.abs(buyMass - sellMass);

    // Distortion (how warped the field is)
    this.state.distortion = Math.min(100, 
      this.state.attractionZones.length * 10 + 
      this.state.repulsionZones.length * 15
    );
  }

  private calculateCenterMovement(points: MassPoint[]): number {
    if (points.length < 2) return 0;

    let totalMovement = 0;
    let count = 0;

    for (let i = 1; i < points.length; i++) {
      const dx = points[i].position.x - points[i - 1].position.x;
      const dy = points[i].position.y - points[i - 1].position.y;
      totalMovement += Math.sqrt(dx * dx + dy * dy);
      count++;
    }

    return count > 0 ? totalMovement / count : 0;
  }

  // ============================================
  // GETTERS
  // ============================================

  public getState(): VolumeGravityState {
    return { ...this.state };
  }

  public getGravityAt(x: number, y: number): { x: number; y: number; strength: number } {
    let forceX = 0;
    let forceY = 0;
    let totalStrength = 0;

    // Calculate forces from all mass points
    for (const point of this.state.massPoints) {
      const dx = point.position.x - x;
      const dy = point.position.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0.1) {
        const force = point.mass / (distance * distance) * 0.1;
        forceX += (dx / distance) * force;
        forceY += (dy / distance) * force;
        totalStrength += force;
      }
    }

    // Add forces from zones
    for (const zone of this.state.attractionZones) {
      const dx = zone.center.x - x;
      const dy = zone.center.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < zone.radius) {
        const force = (zone.strength / 100) * (1 - distance / zone.radius);
        forceX += (dx / distance) * force * 0.1;
        forceY += (dy / distance) * force * 0.1;
        totalStrength += force * 0.1;
      }
    }

    return {
      x: forceX,
      y: forceY,
      strength: Math.min(100, totalStrength * 10)
    };
  }

  public reset(): void {
    this.state = this.getDefaultState();
    this.massHistory = [];
    this.volumeHistory = [];
  }
}
