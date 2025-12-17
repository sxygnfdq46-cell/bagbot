import type { SystemStatus } from '@/lib/api/dashboard';
import type { BotStatus, HealthStats } from '@/lib/api/bot';
import type { BrainActivityResponse, BrainDecision } from '@/lib/api/brain';
import type { SystemHealth } from '@/lib/api/admin';
import type { Strategy } from '@/lib/api/strategies';

export type RuntimeSnapshot = {
  system: {
    status?: SystemStatus | null;
    health?: Pick<SystemHealth, 'backendStatus' | 'brainStatus' | 'cpuLoad' | 'ramUsage' | 'uptime'> | null;
    safeMode?: boolean | null;
  };
  bot: {
    status?: BotStatus | null;
    lastAction?: string | null;
    health?: HealthStats | null;
    state?: 'RUNNING' | 'STOPPED' | null;
    lastUpdateTs?: number | null;
  };
  brain: {
    status?: BrainActivityResponse['status'] | null;
    lastDecision?: BrainDecision | null;
  };
  strategies: Array<Pick<Strategy, 'id'> & { enabled: boolean }>;
};

type IntentSource = 'admin' | 'bot-page' | 'strategies-page' | 'unknown';

export type RuntimeIntent =
  | {
      type: 'SET_BOT_STATE';
      state: 'RUNNING' | 'STOPPED';
      source?: IntentSource;
    }
  | {
      type: 'SET_SAFE_MODE';
      enabled: boolean;
      source?: IntentSource;
    }
  | {
      type: 'SET_STRATEGY_STATE';
      id: string;
      enabled: boolean;
      source?: IntentSource;
    };
