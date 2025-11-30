// types.ts
// Shared type definitions for Shield Intelligence System

export type ShieldType = 'stability' | 'emotional' | 'execution' | 'memory';

export interface ThreatRecord {
  id: string;
  severity: number; // 0-5
  shield: ShieldType;
  source: string;
  message: string;
  timestamp: number;
}

export interface CorrelationEvent {
  source: ShieldType;
  target: ShieldType;
  strength: number;
  timestamp: number;
}
