'use client';

import { SciFiShell } from '../sci-fi-shell';
import { HoloCard } from '@/design-system/components/cards/HoloCard';
import { GlassInput } from '@/design-system/components/inputs/GlassInput';
import { NeonSwitch } from '@/design-system/components/inputs/NeonSwitch';
import { HoloButton } from '@/design-system/components/buttons/HoloButton';
import { NeonTabs } from '@/design-system/components/tabs/NeonTabs';
import { useTheme } from '../providers';
import { useState } from 'react';
import PageTransition from '@/components/PageTransition';
import AnimatedText from '@/components/AnimatedText';
import AnimatedCard from '@/components/AnimatedCard';
import { useAPI, useAPIMutation } from '@/lib/hooks/useAPI';
import { ParticleUniverse } from '@/components/quantum/QuantumEffects';
import { AuroraBackground } from '@/components/ascension/AscensionEffects';

export default function SettingsPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');

  // Fetch user settings
  const { data: settings, loading: settingsLoading, refetch } = useAPI<any>('/api/settings/user');

  // Save settings mutation
  const saveSettings = useAPIMutation('/api/settings/user', 'PATCH');

  // Handle save
  const handleSave = async () => {
    try {
      await saveSettings(settings);
      await refetch();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <SciFiShell>
      <AuroraBackground />
      <ParticleUniverse enabled={true} />
      
      <PageTransition direction="up">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <AnimatedText variant="breathe-cyan">
          <h1 
            className="text-4xl font-bold neon-text mb-2"
            style={{ color: theme.colors.neonCyan }}
          >
            System Configuration
          </h1>
          </AnimatedText>
          <p style={{ color: theme.text.tertiary }}>
            Customize your trading environment
          </p>
        </div>

        {/* Tabs */}
        <NeonTabs
          tabs={[
            { id: 'general', label: 'General', icon: '⚙️' },
            { id: 'trading', label: 'Trading', icon: '📊' },
            { id: 'risk', label: 'Risk Management', icon: '🛡️' },
            { id: 'api', label: 'API Keys', icon: '🔑' },
          ]}
          defaultTab={activeTab}
          onChange={setActiveTab}
        />

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <AnimatedCard variant="pulse-cyan" delay={100}>
            <HoloCard title="Appearance" subtitle="UI preferences" glowColor="cyan">
              <div className="space-y-4">
                <NeonSwitch label="Dark Mode" checked={true} size="md" />
                <NeonSwitch label="Animations" checked={true} size="md" />
                <NeonSwitch label="Sound Effects" checked={false} size="md" />
                <NeonSwitch label="Desktop Notifications" checked={true} size="md" />
              </div>
            </HoloCard>
            </AnimatedCard>

            <AnimatedCard variant="pulse-magenta" delay={200}>
            <HoloCard title="Language & Region" subtitle="Localization settings" glowColor="magenta">
              <div className="space-y-4">
                <GlassInput label="Language" value="English (US)" />
                <GlassInput label="Timezone" value="UTC-08:00 (Pacific)" />
                <GlassInput label="Date Format" value="MM/DD/YYYY" />
              </div>
            </HoloCard>
            </AnimatedCard>
          </div>
        )}

        {/* Trading Settings */}
        {activeTab === 'trading' && (
          <div className="space-y-6">
            <AnimatedCard variant="pulse-cyan" delay={100}>
            <HoloCard title="Order Execution" subtitle="Trading behavior" glowColor="cyan">
              <div className="space-y-4">
                <GlassInput label="Default Order Type" value="Market" />
                <GlassInput label="Max Slippage (%)" value="0.5" />
                <GlassInput label="Order Timeout (seconds)" value="30" />
                <NeonSwitch label="Auto-confirm orders" checked={false} size="md" />
                <NeonSwitch label="Enable stop-loss" checked={true} size="md" />
                <NeonSwitch label="Enable take-profit" checked={true} size="md" />
              </div>
            </HoloCard>
            </AnimatedCard>

            <AnimatedCard variant="pulse-magenta" delay={200}>
            <HoloCard title="Strategy Defaults" subtitle="New strategy configuration" glowColor="magenta">
              <div className="space-y-4">
                <GlassInput label="Default Position Size ($)" value="1000" />
                <GlassInput label="Max Concurrent Positions" value="10" />
                <GlassInput label="Signal Confidence Threshold (%)" value="75" />
              </div>
            </HoloCard>
            </AnimatedCard>
          </div>
        )}

        {/* Risk Management */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            <AnimatedCard variant="pulse-cyan" delay={100}>
            <HoloCard title="Portfolio Risk" subtitle="Global risk limits" glowColor="cyan">
              <div className="space-y-4">
                <GlassInput label="Max Portfolio Risk (%)" value="10" />
                <GlassInput label="Max Drawdown (%)" value="15" />
                <GlassInput label="Risk Per Trade (%)" value="2" />
                <GlassInput label="Max Position Size ($)" value="50000" />
              </div>
            </HoloCard>
            </AnimatedCard>

            <AnimatedCard variant="pulse-magenta" delay={200}>
            <HoloCard title="Emergency Controls" subtitle="Circuit breakers" glowColor="magenta">
              <div className="space-y-4">
                <NeonSwitch label="Enable daily loss limit" checked={true} size="md" />
                <GlassInput label="Daily Loss Limit ($)" value="5000" />
                <NeonSwitch label="Auto-pause on errors" checked={true} size="md" />
                <NeonSwitch label="Enable kill switch" checked={true} size="md" />
              </div>
            </HoloCard>
            </AnimatedCard>
          </div>
        )}

        {/* API Keys */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <AnimatedCard variant="pulse-cyan" delay={100}>
            <HoloCard title="Exchange Connections" subtitle="Manage API credentials" glowColor="cyan">
              <div className="space-y-6">
                {['Binance', 'Coinbase', 'Kraken', 'Bybit'].map((exchange) => (
                  <div key={exchange} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ 
                            background: theme.colors.success,
                            boxShadow: `0 0 10px ${theme.colors.success}`,
                          }}
                        />
                        <span className="font-bold text-lg" style={{ color: theme.text.primary }}>
                          {exchange}
                        </span>
                      </div>
                      <span 
                        className="px-3 py-1 rounded text-xs font-bold"
                        style={{ 
                          background: 'rgba(0, 255, 170, 0.2)',
                          color: theme.colors.success 
                        }}
                      >
                        CONNECTED
                      </span>
                    </div>
                    <GlassInput label="API Key" value="••••••••••••••••" type="password" />
                    <GlassInput label="Secret Key" value="••••••••••••••••" type="password" />
                  </div>
                ))}
              </div>
            </HoloCard>
            </AnimatedCard>

            <AnimatedCard variant="pulse-magenta" delay={200}>
            <HoloCard title="Permissions" subtitle="API access levels" glowColor="magenta">
              <div className="space-y-3">
                <NeonSwitch label="Enable trading" checked={true} size="md" />
                <NeonSwitch label="Enable withdrawals" checked={false} size="md" />
                <NeonSwitch label="Read-only mode" checked={false} size="md" />
              </div>
            </HoloCard>
            </AnimatedCard>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <HoloButton variant="ghost" size="lg" className="hover-lift transition-smooth">
            Reset to Defaults
          </HoloButton>
          <HoloButton variant="primary" size="lg" className="hover-lift hover-glow transition-smooth">
            Save Changes
          </HoloButton>
        </div>
      </div>
      </PageTransition>
    </SciFiShell>
  );
}
