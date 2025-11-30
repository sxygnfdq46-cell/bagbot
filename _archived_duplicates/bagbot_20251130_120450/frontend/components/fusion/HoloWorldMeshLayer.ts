/**
 * 🌐 HOLO WORLD MESH LAYER
 * 
 * 3D holographic mesh that visualizes parallel intelligence streams as an
 * interconnected web of light. Each node represents a data point, decision path,
 * or intelligence stream. Connections show relationships and information flow.
 * 
 * VISUALIZATION FEATURES:
 * • Intelligence Nodes: Visual representations of parallel processing streams
 * • Energy Flows: Animated paths showing information transfer
 * • Mesh Pulses: Rhythmic waves showing system heartbeat
 * • Node Connections: Dynamic links between related intelligence
 * • Holographic Grid: 3D grid structure that morphs with market conditions
 * • Particle Streams: Flowing particles representing active computations
 * • Resonance Fields: Areas of high intelligence density
 * 
 * The mesh is a living, breathing visualization of the AI's thought process,
 * making the invisible computational work visible and beautiful.
 */

import type { ParallelIntelligenceState } from './ParallelIntelligenceCore';
import type { TriPhaseState } from './EnvTriPhaseAwareness';
import type { ReflexEngineState } from './ReflexEngineV2';

// ============================================
// TYPES
// ============================================

/**
 * 3D Vector
 */
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Node types in the mesh
 */
export type NodeType = 
  | 'intelligence'      // Parallel intelligence data point
  | 'temporal'          // Tri-phase temporal awareness
  | 'reflex'            // Reflex engine decision
  | 'scenario'          // Future scenario
  | 'pattern'           // Pattern recognition
  | 'signal'            // Trading signal
  | 'opportunity'       // Identified opportunity
  | 'warning'           // Early warning
  | 'hub';              // Central aggregation point

/**
 * Node state
 */
export type NodeState = 'active' | 'dormant' | 'pulsing' | 'critical' | 'fading';

/**
 * Individual node in the mesh
 */
export interface MeshNode {
  id: string;
  type: NodeType;
  state: NodeState;
  
  // Position
  position: Vector3D;
  targetPosition: Vector3D;    // For smooth animation
  
  // Visual properties
  size: number;                // 0-1 relative size
  brightness: number;          // 0-1 luminosity
  color: string;               // Hex color
  pulseRate: number;           // Hz
  glowIntensity: number;       // 0-1
  
  // Data
  data: any;                   // Associated data payload
  label: string;               // Human-readable label
  confidence: number;          // 0-1
  importance: number;          // 0-1
  
  // Connections
  connectedTo: string[];       // IDs of connected nodes
  connectionStrength: Map<string, number>; // 0-1 strength per connection
  
  // Lifecycle
  energy: number;              // 0-1 vitality
  age: number;                 // milliseconds since creation
  lifetime: number;            // Maximum lifetime
  createdAt: number;
}

/**
 * Connection between nodes
 */
export interface MeshConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  
  // Visual
  strength: number;            // 0-1 visual thickness
  flowDirection: 'forward' | 'backward' | 'bidirectional';
  flowSpeed: number;           // 0-1 animation speed
  color: string;
  particleCount: number;       // Number of particles flowing
  
  // State
  active: boolean;
  pulsing: boolean;
  transferring: boolean;       // Currently transferring data
  
  createdAt: number;
}

/**
 * Energy flow particle
 */
export interface FlowParticle {
  id: string;
  connectionId: string;
  
  // Position along connection (0-1)
  progress: number;
  speed: number;
  
  // Visual
  size: number;
  color: string;
  trail: boolean;              // Leave trail behind
  
  // Data
  payload?: any;               // What this particle carries
  
  createdAt: number;
}

/**
 * Grid layer configuration
 */
export interface GridLayer {
  name: string;
  depth: number;               // Z-depth in 3D space
  density: number;             // Grid line density
  opacity: number;             // 0-1
  color: string;
  morphAmount: number;         // 0-1 how much it morphs
  rotation: Vector3D;          // Rotation angles
}

/**
 * Complete mesh state
 */
export interface HoloMeshState {
  // Nodes
  nodes: MeshNode[];
  activeNodes: number;
  totalEnergy: number;         // Sum of all node energy
  
  // Connections
  connections: MeshConnection[];
  activeConnections: number;
  totalFlow: number;           // Total information flow
  
  // Particles
  particles: FlowParticle[];
  particleCount: number;
  
  // Grid
  gridLayers: GridLayer[];
  gridMorphFactor: number;     // 0-1 overall grid distortion
  
  // Resonance
  resonanceFields: ResonanceField[];
  fieldCount: number;
  
  // Performance
  renderComplexity: number;    // 0-1 how complex the mesh is
  updateFrequency: number;     // Hz
  
  // Animation
  globalPulse: number;         // 0-1 sine wave for global sync
  breathingRate: number;       // Hz
  
  timestamp: number;
}

/**
 * Resonance field - area of high intelligence density
 */
export interface ResonanceField {
  id: string;
  center: Vector3D;
  radius: number;
  intensity: number;           // 0-1
  color: string;
  pulseRate: number;
  affectedNodes: string[];     // Node IDs within this field
  createdAt: number;
}

// ============================================
// HOLO WORLD MESH ENGINE
// ============================================

export class HoloWorldMeshLayer {
  private currentState: HoloMeshState | null = null;
  private nodeRegistry: Map<string, MeshNode> = new Map();
  private connectionRegistry: Map<string, MeshConnection> = new Map();
  private particleRegistry: Map<string, FlowParticle> = new Map();
  
  // Configuration
  private maxNodes = 100;
  private maxConnections = 200;
  private maxParticles = 500;
  private baseUpdateFrequency = 30; // Hz
  
  // Animation
  private animationTime = 0;
  private lastUpdate = Date.now();
  
  /**
   * Main processing function
   */
  public process(
    intelligence: ParallelIntelligenceState | null,
    triPhase: TriPhaseState | null,
    reflexEngine: ReflexEngineState | null
  ): HoloMeshState {
    const now = Date.now();
    const deltaTime = now - this.lastUpdate;
    this.lastUpdate = now;
    this.animationTime += deltaTime;
    
    // Generate/update nodes
    this.updateNodes(intelligence, triPhase, reflexEngine);
    
    // Generate/update connections
    this.updateConnections();
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // Update grid
    const gridLayers = this.generateGridLayers(intelligence);
    const gridMorphFactor = this.calculateGridMorphFactor(intelligence);
    
    // Generate resonance fields
    const resonanceFields = this.generateResonanceFields();
    
    // Calculate metrics
    const nodes = Array.from(this.nodeRegistry.values());
    const connections = Array.from(this.connectionRegistry.values());
    const particles = Array.from(this.particleRegistry.values());
    
    const activeNodes = nodes.filter(n => n.state === 'active' || n.state === 'pulsing').length;
    const totalEnergy = nodes.reduce((sum, n) => sum + n.energy, 0);
    const activeConnections = connections.filter(c => c.active).length;
    const totalFlow = connections.reduce((sum, c) => sum + (c.active ? c.strength * c.flowSpeed : 0), 0);
    
    const renderComplexity = this.calculateRenderComplexity(nodes.length, connections.length, particles.length);
    const updateFrequency = this.calculateUpdateFrequency(renderComplexity);
    
    const globalPulse = Math.sin(this.animationTime / 1000 * Math.PI * 2 * 0.5); // 0.5 Hz
    const breathingRate = 0.3; // Hz
    
    const state: HoloMeshState = {
      nodes,
      activeNodes,
      totalEnergy,
      connections,
      activeConnections,
      totalFlow,
      particles,
      particleCount: particles.length,
      gridLayers,
      gridMorphFactor,
      resonanceFields,
      fieldCount: resonanceFields.length,
      renderComplexity,
      updateFrequency,
      globalPulse,
      breathingRate,
      timestamp: now
    };
    
    this.currentState = state;
    
    return state;
  }
  
  // ============================================
  // NODE MANAGEMENT
  // ============================================
  
  private updateNodes(
    intelligence: ParallelIntelligenceState | null,
    triPhase: TriPhaseState | null,
    reflexEngine: ReflexEngineState | null
  ): void {
    const now = Date.now();
    
    // Age and fade existing nodes
    for (const [id, node] of Array.from(this.nodeRegistry.entries())) {
      node.age = now - node.createdAt;
      
      // Decay energy over time
      node.energy = Math.max(0, node.energy - 0.001);
      
      // Update state based on energy
      if (node.energy < 0.2) {
        node.state = 'fading';
      } else if (node.energy > 0.8) {
        node.state = 'critical';
      } else if (node.energy > 0.6) {
        node.state = 'pulsing';
      } else if (node.energy > 0.3) {
        node.state = 'active';
      } else {
        node.state = 'dormant';
      }
      
      // Remove if dead
      if (node.energy <= 0 || node.age > node.lifetime) {
        this.nodeRegistry.delete(id);
      }
      
      // Smooth position transitions
      node.position.x += (node.targetPosition.x - node.position.x) * 0.1;
      node.position.y += (node.targetPosition.y - node.position.y) * 0.1;
      node.position.z += (node.targetPosition.z - node.position.z) * 0.1;
    }
    
    // Generate new nodes from intelligence data
    if (intelligence) {
      this.generateIntelligenceNodes(intelligence);
    }
    
    if (triPhase) {
      this.generateTemporalNodes(triPhase);
    }
    
    if (reflexEngine) {
      this.generateReflexNodes(reflexEngine);
    }
    
    // Limit total nodes
    if (this.nodeRegistry.size > this.maxNodes) {
      this.pruneWeakestNodes(this.nodeRegistry.size - this.maxNodes);
    }
  }
  
  private generateIntelligenceNodes(intel: ParallelIntelligenceState): void {
    const now = Date.now();
    
    // Create hub node for overall intelligence
    const hubId = 'intel_hub';
    if (!this.nodeRegistry.has(hubId)) {
      this.createNode({
        id: hubId,
        type: 'hub',
        position: { x: 0, y: 0, z: 0 },
        size: 0.8,
        color: '#00ffff',
        label: 'Intelligence Core',
        confidence: intel.certaintyIndex,
        importance: 1.0,
        data: intel,
        lifetime: 60000
      });
    } else {
      this.energizeNode(hubId, 0.1);
    }
    
    // Create nodes for each scenario
    for (const scenario of intel.scenarios) {
      const nodeId = `scenario_${scenario.scenario}`;
      if (!this.nodeRegistry.has(nodeId)) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 3;
        this.createNode({
          id: nodeId,
          type: 'scenario',
          position: {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: Math.random() * 2 - 1
          },
          size: scenario.probability * 0.6,
          color: this.getScenarioColor(scenario.scenario),
          label: scenario.scenario,
          confidence: scenario.conviction,
          importance: scenario.probability,
          data: scenario,
          lifetime: 30000
        });
        
        this.connectNodes(hubId, nodeId, scenario.probability);
      }
    }
    
    // Create nodes for timeframes
    for (const tf of intel.timeframes) {
      const nodeId = `timeframe_${tf.timeframe}`;
      if (!this.nodeRegistry.has(nodeId)) {
        const positions: Record<string, Vector3D> = {
          micro: { x: -4, y: 2, z: 1 },
          short: { x: -2, y: 2, z: 0 },
          medium: { x: 0, y: 3, z: 0 },
          long: { x: 2, y: 2, z: 0 },
          macro: { x: 4, y: 2, z: 1 }
        };
        
        this.createNode({
          id: nodeId,
          type: 'intelligence',
          position: positions[tf.timeframe],
          size: tf.confidence * 0.5,
          color: '#ff00ff',
          label: tf.timeframe,
          confidence: tf.confidence,
          importance: tf.strength,
          data: tf,
          lifetime: 45000
        });
        
        this.connectNodes(hubId, nodeId, tf.confidence);
      }
    }
  }
  
  private generateTemporalNodes(triPhase: TriPhaseState): void {
    const now = Date.now();
    
    // Past node
    const pastId = 'temporal_past';
    if (!this.nodeRegistry.has(pastId)) {
      this.createNode({
        id: pastId,
        type: 'temporal',
        position: { x: -5, y: -2, z: 0 },
        size: 0.6,
        color: '#0088ff',
        label: 'Past Memory',
        confidence: triPhase.past.memoryClarity,
        importance: 0.8,
        data: triPhase.past,
        lifetime: 60000
      });
    }
    
    // Present node
    const presentId = 'temporal_present';
    if (!this.nodeRegistry.has(presentId)) {
      this.createNode({
        id: presentId,
        type: 'temporal',
        position: { x: 0, y: -2, z: 0 },
        size: 0.7,
        color: '#00ff88',
        label: 'Present State',
        confidence: triPhase.present.clarityIndex,
        importance: 1.0,
        data: triPhase.present,
        lifetime: 60000
      });
    }
    
    // Future node
    const futureId = 'temporal_future';
    if (!this.nodeRegistry.has(futureId)) {
      this.createNode({
        id: futureId,
        type: 'temporal',
        position: { x: 5, y: -2, z: 0 },
        size: 0.6,
        color: '#ff8800',
        label: 'Future Prediction',
        confidence: triPhase.future.forecastReliability,
        importance: 0.8,
        data: triPhase.future,
        lifetime: 60000
      });
    }
    
    // Connect temporal nodes
    this.connectNodes(pastId, presentId, triPhase.temporalAlignment);
    this.connectNodes(presentId, futureId, triPhase.temporalAlignment);
    
    // Create nodes for opportunities
    for (const opp of triPhase.future.opportunities) {
      const oppId = `opportunity_${opp.type}_${now}`;
      this.createNode({
        id: oppId,
        type: 'opportunity',
        position: {
          x: 5 + Math.random() * 2 - 1,
          y: -1,
          z: Math.random() * 2 - 1
        },
        size: opp.quality * 0.5,
        color: '#00ff00',
        label: opp.type,
        confidence: opp.probability,
        importance: opp.quality,
        data: opp,
        lifetime: opp.timeWindow
      });
      
      this.connectNodes(futureId, oppId, opp.probability);
    }
    
    // Create nodes for warnings
    for (const warning of triPhase.future.earlyWarnings) {
      const warningId = `warning_${warning.type}_${now}`;
      this.createNode({
        id: warningId,
        type: 'warning',
        position: {
          x: 5 + Math.random() * 2 - 1,
          y: -3,
          z: Math.random() * 2 - 1
        },
        size: warning.severity * 0.6,
        color: '#ff0000',
        label: warning.type,
        confidence: warning.probability,
        importance: warning.severity,
        data: warning,
        lifetime: warning.timeToImpact
      });
      
      this.connectNodes(futureId, warningId, warning.probability);
    }
  }
  
  private generateReflexNodes(reflexEngine: ReflexEngineState): void {
    // Create nodes for active reflexes
    for (const reflex of reflexEngine.primedReflexes.slice(0, 5)) {
      const nodeId = `reflex_${reflex.id}`;
      if (!this.nodeRegistry.has(nodeId)) {
        this.createNode({
          id: nodeId,
          type: 'reflex',
          position: {
            x: Math.random() * 6 - 3,
            y: -4 - Math.random() * 2,
            z: Math.random() * 2 - 1
          },
          size: reflex.confidence * 0.5,
          color: this.getReflexColor(reflex.type),
          label: reflex.type,
          confidence: reflex.confidence,
          importance: reflex.priority === 'critical' ? 1.0 : 0.6,
          data: reflex,
          lifetime: reflex.expiresAt - reflex.createdAt
        });
      }
    }
    
    // Create node for optimal decision path
    if (reflexEngine.optimalPath) {
      const pathId = 'optimal_path';
      if (!this.nodeRegistry.has(pathId)) {
        this.createNode({
          id: pathId,
          type: 'hub',
          position: { x: 0, y: -5, z: 0 },
          size: 0.7,
          color: '#ffff00',
          label: 'Optimal Path',
          confidence: reflexEngine.optimalPath.successProbability,
          importance: reflexEngine.optimalPath.score,
          data: reflexEngine.optimalPath,
          lifetime: 30000
        });
      }
    }
  }
  
  private createNode(config: {
    id: string;
    type: NodeType;
    position: Vector3D;
    size: number;
    color: string;
    label: string;
    confidence: number;
    importance: number;
    data: any;
    lifetime: number;
  }): void {
    const now = Date.now();
    
    const node: MeshNode = {
      id: config.id,
      type: config.type,
      state: 'active',
      position: config.position,
      targetPosition: config.position,
      size: config.size,
      brightness: config.importance,
      color: config.color,
      pulseRate: 0.5 + config.importance * 0.5,
      glowIntensity: config.confidence,
      data: config.data,
      label: config.label,
      confidence: config.confidence,
      importance: config.importance,
      connectedTo: [],
      connectionStrength: new Map(),
      energy: 1.0,
      age: 0,
      lifetime: config.lifetime,
      createdAt: now
    };
    
    this.nodeRegistry.set(config.id, node);
  }
  
  private energizeNode(nodeId: string, amount: number): void {
    const node = this.nodeRegistry.get(nodeId);
    if (node) {
      node.energy = Math.min(1.0, node.energy + amount);
    }
  }
  
  private pruneWeakestNodes(count: number): void {
    const nodes = Array.from(this.nodeRegistry.values())
      .sort((a, b) => (a.energy * a.importance) - (b.energy * b.importance));
    
    for (let i = 0; i < Math.min(count, nodes.length); i++) {
      this.nodeRegistry.delete(nodes[i].id);
    }
  }
  
  private getScenarioColor(scenario: string): string {
    const colors: Record<string, string> = {
      bullish: '#00ff00',
      bearish: '#ff0000',
      neutral: '#888888',
      volatile: '#ff00ff',
      reversal: '#ff8800'
    };
    return colors[scenario] || '#ffffff';
  }
  
  private getReflexColor(type: string): string {
    const colors: Record<string, string> = {
      protective: '#ff0000',
      opportunistic: '#00ff00',
      adaptive: '#0088ff',
      anticipatory: '#ff00ff'
    };
    return colors[type] || '#ffffff';
  }
  
  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================
  
  private updateConnections(): void {
    const now = Date.now();
    
    // Remove stale connections
    for (const [id, conn] of Array.from(this.connectionRegistry.entries())) {
      const fromNode = this.nodeRegistry.get(conn.fromNodeId);
      const toNode = this.nodeRegistry.get(conn.toNodeId);
      
      if (!fromNode || !toNode) {
        this.connectionRegistry.delete(id);
      }
    }
  }
  
  private connectNodes(fromId: string, toId: string, strength: number): void {
    const fromNode = this.nodeRegistry.get(fromId);
    const toNode = this.nodeRegistry.get(toId);
    
    if (!fromNode || !toNode) return;
    
    const connId = `conn_${fromId}_${toId}`;
    
    if (!this.connectionRegistry.has(connId)) {
      const connection: MeshConnection = {
        id: connId,
        fromNodeId: fromId,
        toNodeId: toId,
        strength,
        flowDirection: 'forward',
        flowSpeed: strength * 0.8,
        color: this.blendColors(fromNode.color, toNode.color),
        particleCount: Math.floor(strength * 5),
        active: true,
        pulsing: strength > 0.7,
        transferring: true,
        createdAt: Date.now()
      };
      
      this.connectionRegistry.set(connId, connection);
      
      // Update node connections
      fromNode.connectedTo.push(toId);
      fromNode.connectionStrength.set(toId, strength);
      
      // Create particles
      this.createParticles(connection);
    }
  }
  
  private blendColors(color1: string, color2: string): string {
    // Simplified color blending
    return color1; // In production, would do proper color mixing
  }
  
  // ============================================
  // PARTICLE MANAGEMENT
  // ============================================
  
  private updateParticles(deltaTime: number): void {
    for (const [id, particle] of Array.from(this.particleRegistry.entries())) {
      // Move particle along connection
      particle.progress += particle.speed * (deltaTime / 1000);
      
      // Remove if reached end
      if (particle.progress >= 1.0) {
        this.particleRegistry.delete(id);
      }
    }
  }
  
  private createParticles(connection: MeshConnection): void {
    for (let i = 0; i < connection.particleCount; i++) {
      const particleId = `particle_${connection.id}_${i}_${Date.now()}`;
      
      const particle: FlowParticle = {
        id: particleId,
        connectionId: connection.id,
        progress: i / connection.particleCount,
        speed: connection.flowSpeed,
        size: 0.1,
        color: connection.color,
        trail: true,
        createdAt: Date.now()
      };
      
      this.particleRegistry.set(particleId, particle);
      
      // Limit particles
      if (this.particleRegistry.size > this.maxParticles) {
        const oldest = Array.from(this.particleRegistry.entries())
          .sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
        this.particleRegistry.delete(oldest[0]);
      }
    }
  }
  
  // ============================================
  // GRID AND RESONANCE
  // ============================================
  
  private generateGridLayers(intelligence: ParallelIntelligenceState | null): GridLayer[] {
    return [
      {
        name: 'Base Grid',
        depth: -5,
        density: 0.5,
        opacity: 0.2,
        color: '#004488',
        morphAmount: intelligence ? intelligence.certaintyIndex * 0.3 : 0.1,
        rotation: { x: 0, y: 0, z: 0 }
      },
      {
        name: 'Mid Grid',
        depth: 0,
        density: 0.7,
        opacity: 0.4,
        color: '#0088ff',
        morphAmount: intelligence ? (1 - intelligence.certaintyIndex) * 0.5 : 0.2,
        rotation: { x: 0, y: 0, z: Math.sin(this.animationTime / 5000) * 0.1 }
      },
      {
        name: 'Front Grid',
        depth: 3,
        density: 0.3,
        opacity: 0.1,
        color: '#00ffff',
        morphAmount: 0.1,
        rotation: { x: 0, y: 0, z: Math.cos(this.animationTime / 3000) * 0.15 }
      }
    ];
  }
  
  private calculateGridMorphFactor(intelligence: ParallelIntelligenceState | null): number {
    if (!intelligence) return 0.1;
    
    return (1 - intelligence.certaintyIndex) * intelligence.riskLevel;
  }
  
  private generateResonanceFields(): ResonanceField[] {
    const fields: ResonanceField[] = [];
    
    // Find clusters of high-importance nodes
    const nodes = Array.from(this.nodeRegistry.values());
    const importantNodes = nodes.filter(n => n.importance > 0.7 && n.energy > 0.5);
    
    if (importantNodes.length > 0) {
      // Create field around average position
      const avgPos = {
        x: importantNodes.reduce((sum, n) => sum + n.position.x, 0) / importantNodes.length,
        y: importantNodes.reduce((sum, n) => sum + n.position.y, 0) / importantNodes.length,
        z: importantNodes.reduce((sum, n) => sum + n.position.z, 0) / importantNodes.length
      };
      
      fields.push({
        id: `field_${Date.now()}`,
        center: avgPos,
        radius: 2,
        intensity: importantNodes.reduce((sum, n) => sum + n.importance, 0) / importantNodes.length,
        color: '#00ffff',
        pulseRate: 0.5,
        affectedNodes: importantNodes.map(n => n.id),
        createdAt: Date.now()
      });
    }
    
    return fields;
  }
  
  // ============================================
  // PERFORMANCE
  // ============================================
  
  private calculateRenderComplexity(nodeCount: number, connCount: number, particleCount: number): number {
    const nodeComplexity = nodeCount / this.maxNodes;
    const connComplexity = connCount / this.maxConnections;
    const particleComplexity = particleCount / this.maxParticles;
    
    return (nodeComplexity + connComplexity + particleComplexity) / 3;
  }
  
  private calculateUpdateFrequency(complexity: number): number {
    // Reduce update frequency as complexity increases
    return this.baseUpdateFrequency * (1 - complexity * 0.5);
  }
  
  /**
   * Public accessors
   */
  public getCurrentState(): HoloMeshState | null {
    return this.currentState;
  }
  
  public getNodes(): MeshNode[] {
    return Array.from(this.nodeRegistry.values());
  }
  
  public getConnections(): MeshConnection[] {
    return Array.from(this.connectionRegistry.values());
  }
  
  public getParticles(): FlowParticle[] {
    return Array.from(this.particleRegistry.values());
  }
  
  public getNode(id: string): MeshNode | undefined {
    return this.nodeRegistry.get(id);
  }
}
