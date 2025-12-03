import { mockResponse, nowIso } from '@/lib/api/mock-service';

export type SignalAction = 'LONG' | 'SHORT' | 'FLAT' | string;

export type SignalRecord = {
  id: string;
  asset: string;
  action: SignalAction;
  confidence: number;
  timestamp: string;
  strength: string;
};

export type SignalStatus = 'connecting' | 'connected' | 'degraded';

export type SignalsSnapshot = {
  status: SignalStatus;
  signals: SignalRecord[];
};

const ASSETS = ['ETH', 'BTC', 'SOL', 'AVAX', 'MATIC', 'LINK'];
const STRENGTHS = ['High', 'Medium', 'Low'];
const ACTIONS: SignalAction[] = ['LONG', 'SHORT', 'FLAT'];

let signalStatus: SignalStatus = 'connecting';
let signalCounter = 0;

let signalsSnapshot: SignalRecord[] = Array.from({ length: 5 }).map(() => buildSignal());

function buildSignal(): SignalRecord {
  signalCounter += 1;
  const asset = ASSETS[Math.floor(Math.random() * ASSETS.length)];
  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  const confidence = 45 + Math.random() * 50;
  const strength = STRENGTHS[Math.floor(Math.random() * STRENGTHS.length)];
  return {
    id: `signal-${signalCounter}`,
    asset,
    action,
    confidence: Number(confidence.toFixed(1)),
    timestamp: nowIso(0),
    strength
  };
}

function driftSignals() {
  if (signalStatus === 'connecting') {
    signalStatus = 'connected';
  } else if (Math.random() > 0.96) {
    signalStatus = 'degraded';
  } else if (signalStatus === 'degraded' && Math.random() > 0.6) {
    signalStatus = 'connected';
  }

  if (Math.random() > 0.4) {
    const next = buildSignal();
    signalsSnapshot = [next, ...signalsSnapshot].slice(0, 15);
  } else {
    signalsSnapshot = signalsSnapshot.map((signal) => ({
      ...signal,
      confidence: Number(Math.max(30, Math.min(99, signal.confidence + (Math.random() - 0.5) * 4)).toFixed(1)),
      timestamp: nowIso(Math.floor(Math.random() * 3))
    }));
  }
}

export const signalsApi = {
  getSnapshot: async (): Promise<SignalsSnapshot> => {
    driftSignals();
    return mockResponse({ status: signalStatus, signals: signalsSnapshot });
  },
  pollFeed: async (): Promise<SignalsSnapshot> => {
    driftSignals();
    return mockResponse({ status: signalStatus, signals: signalsSnapshot });
  }
};
