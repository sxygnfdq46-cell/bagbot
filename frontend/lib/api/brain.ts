import { mockResponse, nowIso } from '@/lib/api/mock-service';

export type BrainLink = {
  id: string;
  strategyName: string;
  status: 'linked' | 'pending' | 'faulted' | string;
};

export type BrainDecision = {
  id: string;
  timestamp: string;
  outcome: string;
  confidence: number;
};

export type BrainLinkageResponse = {
  nodes: BrainLink[];
};

export type BrainDecisionsResponse = {
  decisions: BrainDecision[];
};

export type DiagnosticResponse = { success: boolean; message?: string };

export type BrainActivityEvent = {
  id: string;
  label: string;
  location: string;
  intensity: number;
  status: 'stable' | 'spike' | 'offline' | 'degraded';
  timestamp: string;
};

export type BrainActivityResponse = {
  status: 'live' | 'syncing' | 'offline';
  events: BrainActivityEvent[];
};

export type BrainLoadMetrics = {
  load: number;
  temperature: number;
  saturation: number;
};

export type BrainLoadResponse = {
  status: 'live' | 'syncing' | 'offline';
  metrics: BrainLoadMetrics;
};

let linkageSnapshot: BrainLink[] = [
  { id: 'fusion-core', strategyName: 'Fusion Core', status: 'linked' },
  { id: 'alpha', strategyName: 'Alpha Pulse', status: 'linked' },
  { id: 'arb', strategyName: 'Arb Monitor', status: 'pending' }
];

let decisionsSnapshot: BrainDecision[] = Array.from({ length: 5 }).map((_, index) => ({
  id: `decision-${index + 1}`,
  timestamp: nowIso(index * 7),
  outcome: index % 2 === 0 ? 'execute' : 'hold',
  confidence: 0.6 + index * 0.05
}));

let activityStatus: BrainActivityResponse['status'] = 'syncing';
let activityEventsSnapshot: BrainActivityEvent[] = Array.from({ length: 6 }).map((_, index) => ({
  id: `activity-${index}`,
  label: index % 2 === 0 ? 'Signal alignment' : 'Liquidity pulse',
  location: index % 2 === 0 ? 'Neuron L' : 'Neuron S',
  intensity: 0.35 + Math.random() * 0.4,
  status: 'stable',
  timestamp: nowIso(index)
}));

let loadStatus: BrainLoadResponse['status'] = 'live';
let loadMetricsSnapshot: BrainLoadMetrics = {
  load: 0.38,
  temperature: 46,
  saturation: 0.31
};

let diagnosticHealth: 'clean' | 'warning' = 'clean';
let decisionCounter = decisionsSnapshot.length;

const STATUS_WEIGHTS: BrainLink['status'][] = ['linked', 'linked', 'pending', 'linked', 'faulted'];
const OUTCOMES = ['execute', 'hold', 'scale-in', 'scale-out'];
const ACTIVITY_STATUSES: BrainActivityEvent['status'][] = ['stable', 'stable', 'spike', 'degraded'];

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const driftLinkage = () => {
  linkageSnapshot = linkageSnapshot.map((node) => {
    const nextStatus = Math.random() > 0.85 ? pick(STATUS_WEIGHTS) : node.status;
    return { ...node, status: nextStatus };
  });
};

const pushDecision = () => {
  decisionCounter += 1;
  const decision: BrainDecision = {
    id: `decision-${decisionCounter}`,
    timestamp: nowIso(Math.floor(Math.random() * 5)),
    outcome: pick(OUTCOMES),
    confidence: clamp(0.55 + Math.random() * 0.4)
  };
  decisionsSnapshot = [decision, ...decisionsSnapshot].slice(0, 6);
};

const driftActivity = () => {
  activityEventsSnapshot = activityEventsSnapshot.map((event) => {
    const intensity = clamp(event.intensity + (Math.random() - 0.5) * 0.2);
    const nextStatus = Math.random() > 0.85 ? pick(ACTIVITY_STATUSES) : event.status;
    return {
      ...event,
      intensity,
      status: nextStatus,
      timestamp: nowIso(Math.floor(Math.random() * 3))
    };
  });
  if (Math.random() > 0.6) {
    const newEvent: BrainActivityEvent = {
      id: `activity-${Date.now()}`,
      label: pick(['Signal alignment', 'Load rebalance', 'Cross exchange watch', 'Factor drift check']),
      location: pick(['Neuron L', 'Neuron S', 'Core North', 'Core West']),
      intensity: clamp(0.3 + Math.random() * 0.6),
      status: pick(ACTIVITY_STATUSES),
      timestamp: nowIso(0)
    };
    activityEventsSnapshot = [newEvent, ...activityEventsSnapshot].slice(0, 10);
  }
  if (activityStatus === 'syncing') {
    activityStatus = 'live';
  } else if (Math.random() > 0.97) {
    activityStatus = 'offline';
  } else if (activityStatus === 'offline' && Math.random() > 0.5) {
    activityStatus = 'live';
  }
};

const driftLoad = () => {
  const nudge = () => (Math.random() - 0.5) * 0.08;
  loadMetricsSnapshot = {
    load: clamp(loadMetricsSnapshot.load + nudge()),
    temperature: Math.max(20, Math.min(80, loadMetricsSnapshot.temperature + (Math.random() - 0.5) * 4)),
    saturation: clamp(loadMetricsSnapshot.saturation + nudge())
  };
  if (loadStatus === 'syncing') {
    loadStatus = 'live';
  } else if (Math.random() > 0.98) {
    loadStatus = 'offline';
  } else if (loadStatus === 'offline' && Math.random() > 0.4) {
    loadStatus = 'live';
  }
};

export const brainApi = {
  getLinkage: async (): Promise<BrainLinkageResponse> => {
    driftLinkage();
    return mockResponse({ nodes: linkageSnapshot });
  },
  getRecentDecisions: async (): Promise<BrainDecisionsResponse> => {
    if (Math.random() > 0.6) {
      pushDecision();
    }
    return mockResponse({ decisions: decisionsSnapshot });
  },
  getActivityMap: async (): Promise<BrainActivityResponse> => {
    driftActivity();
    return mockResponse({ status: activityStatus, events: activityEventsSnapshot });
  },
  getLoadMetrics: async (): Promise<BrainLoadResponse> => {
    driftLoad();
    return mockResponse({ status: loadStatus, metrics: loadMetricsSnapshot });
  },
  runDiagnostic: async (): Promise<DiagnosticResponse> => {
    diagnosticHealth = Math.random() > 0.2 ? 'clean' : 'warning';
    if (diagnosticHealth === 'warning') {
      linkageSnapshot = linkageSnapshot.map((node) =>
        node.status === 'linked' && Math.random() > 0.8 ? { ...node, status: 'pending' } : node
      );
    }
    return mockResponse({ success: true, message: diagnosticHealth === 'clean' ? 'Diagnostics clean' : 'Minor drift detected' });
  },
  resetEngine: async (): Promise<DiagnosticResponse> => {
    diagnosticHealth = 'clean';
    linkageSnapshot = linkageSnapshot.map((node) => ({ ...node, status: 'linked' }));
    pushDecision();
    return mockResponse({ success: true, message: 'Brain reset issued' });
  }
};
