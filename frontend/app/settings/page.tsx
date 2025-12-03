'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import Tag from '@/components/ui/tag';
import { settings as settingsApi, type Preferences } from '@/lib/api/settings';
import { useToast } from '@/components/ui/toast-provider';
import GlobalHeroBadge from '@/components/ui/global-hero-badge';
import MetricLabel from '@/components/ui/metric-label';
import TerminalShell from '@/components/ui/terminal-shell';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [preferences, setPreferences] = useState<Preferences>({ notifications: true, dailySummary: true, riskLevel: 'medium' });
  const { notify } = useToast();

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const data = await settingsApi.getPreferences();
        setPreferences({
          notifications: data.notifications,
          dailySummary: data.dailySummary,
          riskLevel: data.riskLevel
        });
        if (data.apiKey) {
          setApiKey(data.apiKey);
        }
      } catch (error) {
        console.warn('Using default preferences', error);
        notify({ title: 'Preferences unavailable', description: 'Using safe defaults', variant: 'error' });
      } finally {
        setLoadingPrefs(false);
      }
    };

    fetchPreferences();
  }, [notify]);

  const handleSaveKeys = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingKeys(true);
    try {
      await settingsApi.saveApiKeys({ apiKey, apiSecret });
      notify({ title: 'Credentials stored', description: 'Keys vaulted successfully', variant: 'success' });
    } catch (error) {
      notify({ title: 'Key storage failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
    } finally {
      setSavingKeys(false);
    }
  };

  const handleSavePreferences = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPrefs(true);
    try {
      await settingsApi.savePreferences(preferences);
      notify({ title: 'Preferences saved', description: 'Signal routing updated', variant: 'success' });
    } catch (error) {
      notify({ title: 'Preferences failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
    } finally {
      setSavingPrefs(false);
    }
  };

  const credentialStatus = savingKeys ? 'warning' : apiKey ? 'success' : 'default';
  const preferencesStatus = savingPrefs ? 'warning' : loadingPrefs ? 'default' : 'success';

  return (
    <TerminalShell className="stack-gap-lg w-full">
      <GlobalHeroBadge
        badge="SETTINGS"
        metaText="PREMIUM VAULT"
        title="BagBot Preferences"
        description="Align vault credentials, ambience, and notifications from one premium surface."
        statusLabel="Vault"
        statusValue={apiKey ? 'Key stored' : 'Pending'}
      />
      <section className="stack-gap-sm w-full">
        <header className="stack-gap-xxs w-full">
          <MetricLabel className="text-[color:var(--accent-gold)]">System Settings</MetricLabel>
          <h2 className="text-3xl font-semibold leading-tight">Command the vault and signal posture</h2>
          <p className="muted-premium">
            Align security credentials, ambience, and signal routing in one premium surface to keep BagBot tuned to your desk.
          </p>
        </header>
      </section>

      <Card title="API Keys" subtitle="Securely stored within BagBot Vault">
        <div className="flex flex-wrap items-center gap-3 pb-4">
            <Tag variant={credentialStatus}>
              {savingKeys ? 'Encrypting credentials' : apiKey ? 'Vaulted' : 'Pending input'}
            </Tag>
            <MetricLabel className="text-xs uppercase tracking-[0.4em] text-[color:var(--accent-green)]">
              Zero knowledge storage
            </MetricLabel>
          </div>
        <form className="grid-premium sm:grid-cols-2" onSubmit={handleSaveKeys}>
            <label className="stack-gap-xxs text-sm">
              <MetricLabel as="span">API Key</MetricLabel>
              <input
                value={apiKey}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setApiKey(event.target.value)}
                placeholder="Primary exchange key"
                className="field-premium"
              />
            </label>
            <label className="stack-gap-xxs text-sm">
              <MetricLabel as="span">API Secret</MetricLabel>
              <input
                type="password"
                value={apiSecret}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setApiSecret(event.target.value)}
                placeholder="Never shared"
                className="field-premium"
              />
            </label>
            <div className="sm:col-span-2">
              <p className="muted-premium text-sm">Keys remain client-side until encrypted and transmitted to the vault.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="submit" isLoading={savingKeys} loadingText="Securing…" className="w-full sm:w-auto">
                  Store Credentials
                </Button>
              </div>
            </div>
        </form>
      </Card>

      <Card title="Theme" subtitle="Instant ambiance switch">
        <p className="muted-premium">
          Use the global toggle anchored to the sidebar footer to choose between Light Luxe and Noir mode.
        </p>
      </Card>

      <Card title="Preferences" subtitle="Tailor system signals to you">
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <Tag variant={preferencesStatus}>
            {savingPrefs ? 'Saving route' : loadingPrefs ? 'Loading prefs' : 'Live preferences'}
          </Tag>
          <MetricLabel className="text-xs uppercase tracking-[0.4em] text-[color:var(--accent-violet)]">
            Signal governance
          </MetricLabel>
        </div>
        <form className="stack-gap-md" onSubmit={handleSavePreferences}>
          <div className="grid-premium">
            <PreferenceRow
              label="Instant notifications"
              loading={loadingPrefs}
              checked={preferences.notifications}
              onChange={(checked) => setPreferences((prev) => ({ ...prev, notifications: checked }))}
            />
            <PreferenceRow
              label="Daily alpha digest"
              loading={loadingPrefs}
              checked={preferences.dailySummary}
              onChange={(checked) => setPreferences((prev) => ({ ...prev, dailySummary: checked }))}
            />
          </div>
          <label className="stack-gap-xxs text-sm">
            <MetricLabel as="span">Risk Appetite</MetricLabel>
            {loadingPrefs ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <select
                value={preferences.riskLevel}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  setPreferences((prev) => ({ ...prev, riskLevel: event.target.value as Preferences['riskLevel'] }))
                }
                className="field-premium field-premium--select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            )}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="submit" variant="secondary" isLoading={savingPrefs} loadingText="Saving…" className="w-full sm:w-auto">
              Save Preferences
            </Button>
          </div>
        </form>
      </Card>
    </TerminalShell>
  );
}

function PreferenceRow({
  label,
  loading,
  checked,
  onChange
}: {
  label: string;
  loading: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex flex-wrap items-center justify-between gap-4 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-base/70 px-4 py-3 text-sm">
      <MetricLabel as="span" className="text-base text-[color:var(--text-main)]">{label}</MetricLabel>
      {loading ? (
        <Skeleton className="h-6 w-12" />
      ) : (
        <input
          type="checkbox"
          checked={checked}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked)}
          className="checkbox-premium"
        />
      )}
    </label>
  );
}
