import { mockResponse } from '@/lib/api/mock-service';

export type Preferences = {
  notifications: boolean;
  dailySummary: boolean;
  riskLevel: 'low' | 'medium' | 'high';
};

export type ApiKeysPayload = {
  apiKey: string;
  apiSecret: string;
};

let preferencesSnapshot: Preferences & { apiKey?: string } = {
  notifications: true,
  dailySummary: true,
  riskLevel: 'medium',
  apiKey: '••••-PREVIEW-KEY'
};

export const settings = {
  getPreferences: async () => mockResponse(preferencesSnapshot),
  savePreferences: async (payload: Preferences) => {
    preferencesSnapshot = { ...preferencesSnapshot, ...payload };
    return mockResponse({ success: true });
  },
  saveApiKeys: async (payload: ApiKeysPayload) => {
    preferencesSnapshot = { ...preferencesSnapshot, apiKey: payload.apiKey };
    return mockResponse({ success: true });
  }
};
