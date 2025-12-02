import { api } from '@/lib/api-client';

export type SystemHealth = {
  uptime: string;
  cpuLoad: number;
  ramUsage: number;
  backendStatus: 'online' | 'offline' | 'degraded' | string;
  brainStatus: 'online' | 'offline' | 'degraded' | string;
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

export type AdminConfigPayload = {
  config: Record<string, unknown>;
};

export const adminApi = {
  getSystemHealth: () => api.get<SystemHealth>('/api/admin/system-health'),
  getUsers: () => api.get<AdminUser[]>('/api/admin/users'),
  suspendUser: (id: string) =>
    api.post<{ success: boolean }>(`/api/admin/users/${id}/suspend`, { body: null }),
  activateUser: (id: string) =>
    api.post<{ success: boolean }>(`/api/admin/users/${id}/activate`, { body: null }),
  getStrategies: () => api.get<AdminStrategy[]>('/api/admin/strategies'),
  toggleStrategy: (id: string) =>
    api.post<{ success: boolean }>(`/api/admin/strategies/${id}/toggle`, { body: null }),
  killAllStrategies: () =>
    api.post<{ success: boolean }>('/api/admin/strategies/kill-all', { body: null }),
  activateSafeMode: () => api.post<{ success: boolean }>('/api/admin/safe-mode/activate', { body: null }),
  deactivateSafeMode: () => api.post<{ success: boolean }>('/api/admin/safe-mode/deactivate', { body: null }),
  updateConfig: (payload: AdminConfigPayload) =>
    api.post<{ success: boolean }>('/api/admin/config/update', {
      body: payload
    })
};
