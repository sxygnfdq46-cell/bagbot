/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 13.1 — DIMENSIONAL MEMORY ENGINE (DME)
 * LEVEL 15 — ROLLING MEMORY INTELLIGENCE LAYER
 * ═══════════════════════════════════════════════════════════════════
 * Central export hub for all memory components
 * ═══════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// LEVEL 13.1 EXPORTS (Dimensional Memory Engine)
// ─────────────────────────────────────────────────────────────────

export { ImmediateContextLayer } from './ImmediateContextLayer';
export { SessionIntentLayer } from './SessionIntentLayer';
export { LongArcPatternLayer } from './LongArcPatternLayer';
export { MemoryVectorEngine } from './MemoryVectorEngine';
export { MultiLayerContextGrid } from './MultiLayerContextGrid';
export { MemorySafetyBoundary } from './MemorySafetyBoundary';

// ─────────────────────────────────────────────────────────────────
// LEVEL 15 EXPORTS (Rolling Memory Intelligence)
// ─────────────────────────────────────────────────────────────────

export { RollingMemoryCore } from './RollingMemoryCore';
export type {
  MemoryEntry,
  MemoryType,
  MemoryPriority,
  DecayConfig,
  RetentionPolicy,
  QueryOptions,
  MemoryExport
} from './RollingMemoryCore';

export { TechnicalContextWeaver } from './TechnicalContextWeaver';
export type {
  ContextThread,
  ThreadStatus,
  ContextMilestone,
  ContextConnection,
  ContextWeave,
  ContextGap,
  ContinuityReport,
  ContinuityStatus
} from './TechnicalContextWeaver';

export { IntentThreadTracker } from './IntentThreadTracker';
export type {
  TechnicalIntent,
  IntentStatus,
  IntentType,
  IntentMilestone,
  IntentBlocker,
  IntentChain,
  IntentDrift,
  IntentAlignment,
  IntentSummary
} from './IntentThreadTracker';

export { MemoryReliabilityMatrix } from './MemoryReliabilityMatrix';
export type {
  ReliabilityScore,
  ReliabilityStatus,
  CorruptionReport,
  CorruptionType,
  ConsistencyCheck,
  ConsistencyFailure,
  StaleEntry,
  IntegrityAudit,
  DeterminismReport
} from './MemoryReliabilityMatrix';

export { ContinuitySyncLayer } from './ContinuitySyncLayer';
export type {
  SyncState,
  SyncStatus,
  SyncMessage,
  SyncConflict,
  StorageAdapter,
  StorageType,
  SyncConfig,
  TabInfo,
  ConflictResolution
} from './ContinuitySyncLayer';

export { MemoryAuditGate } from './MemoryAuditGate';
export type {
  AuditEntry,
  OperationType,
  ApprovalRequest,
  ApprovalResponse,
  ApprovalStatus,
  AuditLog,
  ExpirationPolicy,
  MemoryStats
} from './MemoryAuditGate';

export { RollingMemoryUI } from './RollingMemoryUI';

// ─────────────────────────────────────────────────────────────────
// LEVEL 15 SAFETY CONSTANTS
// ─────────────────────────────────────────────────────────────────

export const LEVEL_15_SAFETY = {
  MAX_ENTRIES: 10000,
  MAX_MEMORY_AGE_MS: 72 * 3600 * 1000,
  PURGE_THRESHOLD: 8000,
  NO_PERSONAL_DATA: true,
  TECHNICAL_ONLY: true,
  REQUIRE_WRITE_APPROVAL: true,
  REQUIRE_DELETE_APPROVAL: true,
  AUTO_EXPIRE: true,
  DEFAULT_TTL_MS: 72 * 3600 * 1000
} as const;

export const LEVEL_15_VERSION = {
  level: 15,
  name: 'Rolling Memory Intelligence Layer',
  mode: 'C — 72h Rolling Technical Memory',
  component_count: 8,
  features: [
    '72-hour technical memory with time-decay',
    'Multi-day context threading',
    'Technical intent tracking',
    'Cryptographic integrity validation',
    'Cross-tab synchronization',
    'Mandatory approval gates',
    'Auto-expiration enforcement',
    'Visual memory dashboard'
  ]
} as const;
