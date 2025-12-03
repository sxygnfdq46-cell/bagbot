import { mockResponse, nowIso } from '@/lib/api/mock-service';

export type SystemHealth = {
  uptime: string;
  cpuLoad: number;
  ramUsage: number;
  backendStatus: 'online' | 'offline' | 'degraded' | 'safe-mode' | string;
  brainStatus: 'online' | 'offline' | 'degraded' | 'safe-mode' | string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'suspended' | string;
  lastActive?: string;
  role?: string;
};

export type AdminStrategy = {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
};

export type AdminLogEntry = {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
};

export type AdminConfigPayload = {
  config: Record<string, unknown>;
};

type AdminConfigState = Record<string, unknown>;

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const drift = (value: number, delta: number, min = 0, max = 100) => clamp(value + (Math.random() - 0.5) * delta, min, max);

const formatUptime = () => {
  const hours = Math.floor(uptimeMinutes / 60);
  const minutes = uptimeMinutes % 60;
  return `${hours}h ${minutes}m`;
};

let uptimeMinutes = 42 * 60 + 18;

let systemHealthSnapshot: SystemHealth = {
  uptime: '42h 18m',
  cpuLoad: 57.2,
  ramUsage: 63.4,
  backendStatus: 'online',
  brainStatus: 'online'
};

let adminUsersSnapshot: AdminUser[] = [
  { id: 'ops-1', name: 'Aria Navarro', email: 'aria@bagbot.ai', status: 'active', lastActive: nowIso(3), role: 'operator' },
  { id: 'ops-2', name: 'Malik Rhodes', email: 'malik@bagbot.ai', status: 'active', lastActive: nowIso(9), role: 'admin' },
  { id: 'ops-3', name: 'Sera Quinn', email: 'sera@bagbot.ai', status: 'suspended', lastActive: nowIso(720), role: 'observer' }
];

let adminStrategiesSnapshot: AdminStrategy[] = [
  { id: 'guardian', name: 'Guardian Envelope', enabled: true },
  { id: 'nebula', name: 'Nebula Drift', enabled: false },
  { id: 'aegis', name: 'Aegis Breaker', enabled: true }
];

let adminLogsSnapshot: AdminLogEntry[] = Array.from({ length: 6 }).map((_, index) => ({
  id: `log-${index}`,
  type: index % 3 === 0 ? 'warning' : 'info',
  message: index % 3 === 0 ? 'Throttle window adjusted' : 'Operator heartbeat received',
  timestamp: nowIso(index)
}));

let configSnapshot: AdminConfigState = {
  risk: 'balanced',
  throttle: 'medium',
  observers: ['ops-3']
};

let safeModeActive = false;

const refreshSystemHealth = (overrides?: Partial<SystemHealth>) => {
  uptimeMinutes += safeModeActive ? 0 : Math.max(1, Math.floor(Math.random() * 4));
  systemHealthSnapshot = {
    ...systemHealthSnapshot,
    cpuLoad: drift(systemHealthSnapshot.cpuLoad, 6),
    ramUsage: drift(systemHealthSnapshot.ramUsage, 4),
    uptime: formatUptime()
  };

  if (overrides) {
    systemHealthSnapshot = { ...systemHealthSnapshot, ...overrides };
  }

  return systemHealthSnapshot;
};

const updateUserStatus = (id: string, status: AdminUser['status']) => {
  adminUsersSnapshot = adminUsersSnapshot.map((user) => {
    if (user.id !== id) return user;
    return {
      ...user,
      status,
      lastActive: status === 'active' ? nowIso(0) : user.lastActive ?? nowIso(0)
    };
  });
};

const toggleStrategyState = (id: string, enabled?: boolean) => {
  adminStrategiesSnapshot = adminStrategiesSnapshot.map((strategy) =>
    strategy.id === id ? { ...strategy, enabled: typeof enabled === 'boolean' ? enabled : !strategy.enabled } : strategy
  );
};

const driftLogs = () => {
  if (Math.random() > 0.5) {
    const nextLog: AdminLogEntry = {
      id: `log-${Date.now()}`,
      type: Math.random() > 0.8 ? 'error' : Math.random() > 0.5 ? 'warning' : 'info',
      message: pickLogMessage(),
      timestamp: nowIso(0)
    };
    adminLogsSnapshot = [nextLog, ...adminLogsSnapshot].slice(0, 30);
  }
  return adminLogsSnapshot;
};

const pickLogMessage = () => {
  const catalog = [
    'Operator authenticated via control room',
    'Global kill switch armed but idle',
    'Strategy alignment drifted 0.3%',
    'Safe mode request queued',
    'Audit channel ping acknowledged'
  ];
  return catalog[Math.floor(Math.random() * catalog.length)];
};

export const adminApi = {
  getSystemHealth: async () => mockResponse(refreshSystemHealth()),
  getUsers: async () => mockResponse(adminUsersSnapshot),
  suspendUser: async (id: string) => {
    updateUserStatus(id, 'suspended');
    return mockResponse({ success: true });
  },
  activateUser: async (id: string) => {
    updateUserStatus(id, 'active');
    return mockResponse({ success: true });
  },
  getStrategies: async () => mockResponse(adminStrategiesSnapshot),
  toggleStrategy: async (id: string) => {
    toggleStrategyState(id);
    return mockResponse({ success: true });
  },
  killAllStrategies: async () => {
    adminStrategiesSnapshot = adminStrategiesSnapshot.map((strategy) => ({ ...strategy, enabled: false }));
    return mockResponse({ success: true });
  },
  activateSafeMode: async () => {
    safeModeActive = true;
    refreshSystemHealth({ backendStatus: 'safe-mode', brainStatus: 'safe-mode' });
    return mockResponse({ success: true, mode: 'safe' });
  },
  deactivateSafeMode: async () => {
    safeModeActive = false;
    refreshSystemHealth({ backendStatus: 'online', brainStatus: 'online' });
    return mockResponse({ success: true, mode: 'live' });
  },
  updateConfig: async ({ config }: AdminConfigPayload) => {
    configSnapshot = { ...configSnapshot, ...config };
    return mockResponse({ success: true, config: configSnapshot });
  },
  getConfig: async () => mockResponse(configSnapshot),
  getLogs: async () => {
    return mockResponse(driftLogs());
  }
};
