import { api } from '../api-client';

export type Preferences = {
  notifications: boolean;
  dailySummary: boolean;
  riskLevel: 'low' | 'medium' | 'high';
};

export type ApiKeysPayload = {
  apiKey: string;
  apiSecret: string;
};

export const settings = {
  getPreferences: () => api.get<Preferences & { apiKey?: string }>('/api/settings/preferences'),
  savePreferences: (payload: Preferences) =>
    api.post('/api/settings/preferences', {
      body: payload
    }),
  saveApiKeys: (payload: ApiKeysPayload) =>
    api.post('/api/settings/api-keys', {
      body: payload
    })
};
