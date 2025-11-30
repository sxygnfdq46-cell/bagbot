/**
 * Settings Service - User Preferences & Configuration
 * SAFE: Read/write user settings (no system config changes)
 */

import { api } from '@/lib/api';

export interface UserSettings {
  user_id: string;
  display: {
    theme: 'dark' | 'light' | 'auto';
    animations_enabled: boolean;
    sound_enabled: boolean;
    compact_view: boolean;
  };
  notifications: {
    enabled: boolean;
    email_enabled: boolean;
    push_enabled: boolean;
    trade_alerts: boolean;
    signal_alerts: boolean;
    error_alerts: boolean;
    daily_summary: boolean;
  };
  trading: {
    default_symbol: string;
    default_timeframe: string;
    confirm_trades: boolean;
    auto_refresh_interval: number;
  };
  api_keys: {
    exchange: string;
    api_key_masked: string;
    api_secret_masked: string;
    testnet_mode: boolean;
    last_updated: string;
  };
  preferences: {
    language: string;
    timezone: string;
    currency: string;
    date_format: string;
    number_format: string;
  };
}

export interface NotificationPreferences {
  enabled: boolean;
  channels: {
    email: boolean;
    push: boolean;
    browser: boolean;
  };
  events: {
    trades: boolean;
    signals: boolean;
    errors: boolean;
    system: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
  };
}

export interface APIKeyInfo {
  exchange: string;
  api_key_masked: string;
  permissions: string[];
  testnet_mode: boolean;
  status: 'active' | 'invalid' | 'expired';
  last_verified: string;
}

/**
 * Get user settings
 */
export async function getUserSettings(): Promise<UserSettings> {
  return api.get('/api/settings');
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  settings: Partial<UserSettings>
): Promise<UserSettings> {
  return api.patch('/api/settings', settings);
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return api.get('/api/settings/notifications');
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  return api.patch('/api/settings/notifications', preferences);
}

/**
 * Get API key information (masked)
 */
export async function getAPIKeyInfo(): Promise<APIKeyInfo> {
  return api.get('/api/settings/api-keys');
}

/**
 * Update API keys (SAFE: validation only, no direct trading)
 */
export async function updateAPIKeys(data: {
  exchange: string;
  api_key: string;
  api_secret: string;
  testnet_mode: boolean;
}): Promise<APIKeyInfo> {
  return api.post('/api/settings/api-keys', data);
}

/**
 * Verify API keys
 */
export async function verifyAPIKeys(): Promise<{
  valid: boolean;
  permissions: string[];
  message: string;
}> {
  return api.post('/api/settings/api-keys/verify');
}

/**
 * Delete API keys
 */
export async function deleteAPIKeys(): Promise<{ success: boolean }> {
  return api.delete('/api/settings/api-keys');
}

/**
 * Get display preferences
 */
export async function getDisplayPreferences(): Promise<UserSettings['display']> {
  return api.get('/api/settings/display');
}

/**
 * Update display preferences
 */
export async function updateDisplayPreferences(
  preferences: Partial<UserSettings['display']>
): Promise<UserSettings['display']> {
  return api.patch('/api/settings/display', preferences);
}

/**
 * Get trading preferences
 */
export async function getTradingPreferences(): Promise<UserSettings['trading']> {
  return api.get('/api/settings/trading');
}

/**
 * Update trading preferences
 */
export async function updateTradingPreferences(
  preferences: Partial<UserSettings['trading']>
): Promise<UserSettings['trading']> {
  return api.patch('/api/settings/trading', preferences);
}

/**
 * Reset settings to default
 */
export async function resetSettings(category?: string): Promise<UserSettings> {
  const params = category ? `?category=${category}` : '';
  return api.post(`/api/settings/reset${params}`);
}

/**
 * Export settings
 */
export async function exportSettings(): Promise<Blob> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/settings/export`
  );
  return response.blob();
}

/**
 * Import settings
 */
export async function importSettings(file: File): Promise<UserSettings> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/settings/import`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Import failed');
  }

  return response.json();
}

export const settingsService = {
  getSettings: getUserSettings,
  updateSettings: updateUserSettings,
  getNotifications: getNotificationPreferences,
  updateNotifications: updateNotificationPreferences,
  getAPIKeys: getAPIKeyInfo,
  updateAPIKeys,
  verifyAPIKeys,
  deleteAPIKeys,
  getDisplay: getDisplayPreferences,
  updateDisplay: updateDisplayPreferences,
  getTrading: getTradingPreferences,
  updateTrading: updateTradingPreferences,
  reset: resetSettings,
  export: exportSettings,
  import: importSettings,
};

export default settingsService;
