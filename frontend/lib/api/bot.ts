import { mockResponse } from '@/lib/api/mock-service';

export type BotStatus = 'running' | 'stopped' | 'error';

export type LogEntry = { id: string; level: BotStatus; message: string; timestamp: string };

export type BotMetrics = {
  decisionsPerMinute: number;
  latencyMs: number;
  uptimeHours: number;
  confidence: number;
};

export type HealthStats = {
  cpu: number;
  ram: number;
  load: number;
};

export type BotSnapshot = {
  status: BotStatus;
  lastAction: string;
  metrics: BotMetrics;
  health: HealthStats;
  outputSeries: number[];
  triggerSeries: number[];
  eventLog: LogEntry[];
};

const fluctuate = (value: number, variance: number, min: number, max: number) => {
  const next = value + (Math.random() - 0.5) * variance;
  return Math.min(max, Math.max(min, next));
};

const sparkPoint = (anchor: number) => {
  const variance = Math.random() * 12;
  const direction = Math.random() > 0.5 ? 1 : -1;
  return Math.max(5, anchor + variance * direction);
};

const seedSeries = () => Array.from({ length: 36 }, () => sparkPoint(50));

const seedLog = (): LogEntry[] => [
  { id: '1', level: 'running', message: 'Bot session resumed from warm standby.', timestamp: '09:21:04' },
  { id: '2', level: 'running', message: 'Execution core synced to exchange heartbeat.', timestamp: '09:18:55' },
  { id: '3', level: 'running', message: 'Diagnostics: zero anomalies in last sweep.', timestamp: '09:12:12' }
];

let botSnapshot: BotSnapshot = {
  status: 'running',
  lastAction: 'Boot sequence validated 2m ago',
  metrics: { decisionsPerMinute: 126, latencyMs: 8, uptimeHours: 42, confidence: 0.87 },
  health: { cpu: 62, ram: 54, load: 1.12 },
  outputSeries: seedSeries(),
  triggerSeries: seedSeries(),
  eventLog: seedLog()
};

const appendLog = (level: BotStatus, message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  const entry: LogEntry = { id: `${Date.now()}`, level, message, timestamp };
  botSnapshot = { ...botSnapshot, eventLog: [entry, ...botSnapshot.eventLog].slice(0, 8) };
};

const mutateTelemetry = () => {
  const { metrics, health, outputSeries, triggerSeries } = botSnapshot;
  const nextMetrics: BotMetrics = {
    decisionsPerMinute: fluctuate(metrics.decisionsPerMinute, 4, 80, 180),
    latencyMs: fluctuate(metrics.latencyMs, 1.2, 4, 22),
    uptimeHours: metrics.uptimeHours + 1,
    confidence: fluctuate(metrics.confidence, 0.02, 0.55, 0.99)
  };
  const nextHealth: HealthStats = {
    cpu: fluctuate(health.cpu, 2.5, 30, 95),
    ram: fluctuate(health.ram, 1.8, 25, 90),
    load: fluctuate(health.load, 0.12, 0.35, 1.9)
  };

  botSnapshot = {
    ...botSnapshot,
    metrics: nextMetrics,
    health: nextHealth,
    outputSeries: [...outputSeries.slice(-30), sparkPoint(outputSeries.at(-1) ?? 50)],
    triggerSeries: [...triggerSeries.slice(-30), sparkPoint(triggerSeries.at(-1) ?? 45)]
  };

  if (Math.random() > 0.7) {
    appendLog(botSnapshot.status, botSnapshot.status === 'running' ? 'Strategy meta-controller recalibrated weights.' : 'Awaiting operator input.');
  }
};

const describeCommand = (command: BotStatus | 'restart') => {
  if (command === 'restart') return 'Bot kernel restarted gracefully.';
  if (command === 'running') return 'Bot resumed execution lane.';
  if (command === 'stopped') return 'Bot halted via operator command.';
  return 'Error captured, safe mode engaged.';
};

export const botApi = {
  getSnapshot: async (): Promise<BotSnapshot> => {
    mutateTelemetry();
    return mockResponse(botSnapshot);
  },
  issueCommand: async (command: BotStatus | 'restart'): Promise<BotSnapshot> => {
    if (command === 'restart') {
      botSnapshot = { ...botSnapshot, status: 'running', lastAction: `Restarted • ${new Date().toLocaleTimeString()}` };
    } else {
      botSnapshot = { ...botSnapshot, status: command, lastAction: `${command.toUpperCase()} • ${new Date().toLocaleTimeString()}` };
    }
    appendLog(command === 'restart' ? 'running' : command, describeCommand(command));
    mutateTelemetry();
    return mockResponse(botSnapshot);
  }
};
