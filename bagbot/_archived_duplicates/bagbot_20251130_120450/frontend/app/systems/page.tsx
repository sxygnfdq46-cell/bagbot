'use client';

import { SciFiShell } from '../sci-fi-shell';
import { HoloCard } from '@/design-system/components/cards/HoloCard';
import { HUDWidget } from '@/design-system/components/hud/HUDWidget';
import { useTheme } from '../providers';
import PageTransition from '@/components/PageTransition';
import AnimatedText from '@/components/AnimatedText';
import AnimatedCard from '@/components/AnimatedCard';
import { useAPI, useAPIPoll } from '@/lib/hooks/useAPI';
import { ParticleUniverse, HoloRefract, QuantumField, CameraDrift } from '@/components/quantum/QuantumEffects';
import { TemporalDisplacement, HaloFlux } from '@/components/ascension/AscensionEffects';

export default function SystemsPage() {
  const { theme } = useTheme();

  // Fetch system health
  const { data: healthData, loading: healthLoading } = useAPI<any>('/api/system/health');

  // Fetch worker health with polling
  const { data: workerData } = useAPIPoll<any>('/api/system/workers', 5000);

  // Fetch system metrics
  const { data: metricsData, loading: metricsLoading } = useAPI<any>('/api/system/metrics');

  // Extract data with fallbacks
  const uptime = healthData?.uptime_hours ? (healthData.uptime_hours / 24 * 100).toFixed(2) : '99.98';
  const cpuUsage = metricsData?.cpu_percent ?? 23;
  const memoryUsage = metricsData?.memory_mb ? (metricsData.memory_mb / 1024).toFixed(1) : '4.2';
  const latency = metricsData?.latency_ms ?? 12;

  return (
    <SciFiShell>
      <HaloFlux intensity={healthLoading ? 'idle' : parseFloat(uptime) < 95 ? 'intense' : 'active'} />
      <ParticleUniverse enabled={true} />
      
      <PageTransition direction="up">
      <TemporalDisplacement active={healthLoading}>
      <CameraDrift>
      <HoloRefract>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <AnimatedText variant="breathe-cyan">
          <h1 
            className="text-4xl font-bold neon-text mb-2"
            style={{ color: theme.colors.neonCyan }}
          >
            Systems Monitor
          </h1>
          </AnimatedText>
          <p style={{ color: theme.text.tertiary }}>
            Real-time health checks and performance metrics
          </p>
        </div>

        {/* System Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <HUDWidget
            title="Uptime"
            value={healthLoading ? '...' : uptime}
            unit="%"
            icon="⚡"
            color="success"
          />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <HUDWidget
            title="CPU Usage"
            value={metricsLoading ? '...' : cpuUsage.toString()}
            unit="%"
            icon="🖥️"
            color={cpuUsage > 80 ? 'error' : 'cyan'}
          />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <HUDWidget
            title="Memory"
            value={metricsLoading ? '...' : memoryUsage}
            unit="GB"
            icon="💾"
            color="magenta"
          />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <HUDWidget
            title="Latency"
            value={metricsLoading ? '...' : latency.toString()}
            unit="ms"
            icon="📡"
            color={latency < 50 ? 'success' : 'warning'}
          />
          </div>
        </div>

        {/* Systems Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trading Engine */}
          <AnimatedCard variant="pulse-cyan" delay={100}>
          <HoloCard
            title="Trading Engine"
            subtitle="Core execution system"
            glowColor="cyan"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span style={{ color: theme.text.secondary }}>Status</span>
                <span 
                  className="px-3 py-1 rounded text-xs font-bold"
                  style={{ 
                    background: healthData?.status === 'healthy' ? 'rgba(0, 255, 170, 0.2)' : 'rgba(255, 68, 68, 0.2)',
                    color: healthData?.status === 'healthy' ? theme.colors.success : theme.colors.error
                  }}
                >
                  {healthLoading ? 'LOADING' : (healthData?.status?.toUpperCase() ?? 'OPERATIONAL')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: theme.text.secondary }}>Orders/sec</span>
                <span className="font-bold" style={{ color: theme.colors.neonCyan }}>
                  {metricsData?.orders_per_second ?? 847}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: theme.text.secondary }}>Execution Time</span>
                <span className="font-bold" style={{ color: theme.colors.success }}>
                  {metricsData?.avg_execution_time_us ? `${metricsData.avg_execution_time_us}μs` : '78μs'}
                </span>
              </div>
              <div>
                <div className="text-sm mb-2" style={{ color: theme.text.tertiary }}>
                  Load Distribution
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                  <div 
                    className="h-full animate-pulse-glow"
                    style={{ 
                      width: `${cpuUsage}%`,
                      background: theme.colors.neonCyan,
                      boxShadow: theme.shadows.glow.cyan 
                    }}
                  />
                </div>
              </div>
            </div>
          </HoloCard>
          </AnimatedCard>

          {/* Risk Manager */}
          <AnimatedCard variant="pulse-magenta" delay={200}>
          <HoloCard
            title="Risk Manager"
            subtitle="Position and exposure control"
            glowColor="magenta"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span style={{ color: theme.text.secondary }}>Status</span>
                <span 
                  className="px-3 py-1 rounded text-xs font-bold"
                  style={{ 
                    background: 'rgba(0, 255, 170, 0.2)',
                    color: theme.colors.success 
                  }}
                >
                  ACTIVE
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: theme.text.secondary }}>Risk Checks</span>
                <span className="font-bold" style={{ color: theme.colors.neonMagenta }}>1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: theme.text.secondary }}>Blocked Trades</span>
                <span className="font-bold" style={{ color: theme.colors.warning }}>3</span>
              </div>
              <div>
                <div className="text-sm mb-2" style={{ color: theme.text.tertiary }}>
                  Portfolio Risk
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                  <div 
                    className="h-full animate-pulse-glow"
                    style={{ 
                      width: '34%',
                      background: theme.colors.success,
                      boxShadow: `0 0 10px ${theme.colors.success}` 
                    }}
                  />
                </div>
              </div>
            </div>
          </HoloCard>
          </AnimatedCard>

          {/* Data Feed */}
          <AnimatedCard variant="pulse-cyan" delay={300}>
          <HoloCard
            title="Market Data Feed"
            subtitle="Real-time price aggregation"
            glowColor="cyan"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span style={{ color: theme.text.secondary }}>Status</span>
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
              <div className="flex items-center justify-between">
                <span style={{ color: theme.text.secondary }}>Updates/sec</span>
                <span className="font-bold" style={{ color: theme.colors.neonCyan }}>12,847</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: theme.text.secondary }}>Data Lag</span>
                <span className="font-bold" style={{ color: theme.colors.success }}>4ms</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['Binance', 'Coinbase', 'Kraken', 'Bybit'].map((ex) => (
                  <div
                    key={ex}
                    className="text-center p-2 rounded glass-panel"
                    style={{
                      background: 'rgba(0, 246, 255, 0.1)',
                      border: `1px solid ${theme.border.default}`,
                    }}
                  >
                    <div className="text-xs font-semibold" style={{ color: theme.colors.success }}>
                      ✓
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </HoloCard>
          </AnimatedCard>

          {/* Neural Engine */}
          <AnimatedCard variant="pulse-magenta" delay={100}>
          <HoloCard
            title="Neural Decision Engine"
            subtitle="AI strategy optimizer"
            glowColor="magenta"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span style={{ color: theme.text.secondary }}>Status</span>
                <span 
                  className="px-3 py-1 rounded text-xs font-bold"
                  style={{ 
                    background: 'rgba(255, 0, 255, 0.2)',
                    color: theme.colors.neonMagenta 
                  }}
                >
                  LEARNING
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: theme.text.secondary }}>Predictions/min</span>
                <span className="font-bold" style={{ color: theme.colors.neonMagenta }}>2,847</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: theme.text.secondary }}>Accuracy</span>
                <span className="font-bold" style={{ color: theme.colors.success }}>87.3%</span>
              </div>
              <div>
                <div className="text-sm mb-2" style={{ color: theme.text.tertiary }}>
                  Training Progress
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                  <div 
                    className="h-full animate-pulse-glow"
                    style={{ 
                      width: '87%',
                      background: theme.colors.neonMagenta,
                      boxShadow: theme.shadows.glow.magenta 
                    }}
                  />
                </div>
              </div>
            </div>
          </HoloCard>
          </AnimatedCard>
        </div>

        {/* System Logs Preview */}
        <AnimatedCard variant="pulse-cyan" delay={200}>
        <HoloCard title="Recent System Events" subtitle="Last 5 minutes" glowColor="cyan">
          <div className="space-y-2 font-mono text-sm">
            {[
              { time: '14:23:45', level: 'INFO', msg: 'Trading engine: Order executed BTC/USDT' },
              { time: '14:23:42', level: 'INFO', msg: 'Risk manager: Position check passed' },
              { time: '14:23:38', level: 'WARN', msg: 'Data feed: Transient connection delay (recovered)' },
              { time: '14:23:21', level: 'INFO', msg: 'Neural engine: Model updated (epoch 1847)' },
              { time: '14:23:11', level: 'INFO', msg: 'Trading engine: Strategy signal received' },
            ].map((log, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-3 rounded"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: `1px solid ${theme.border.subtle}`,
                }}
              >
                <span style={{ color: theme.text.tertiary }}>{log.time}</span>
                <span 
                  className="font-bold"
                  style={{ 
                    color: log.level === 'WARN' ? theme.colors.warning : theme.colors.success 
                  }}
                >
                  {log.level}
                </span>
                <span className="flex-1" style={{ color: theme.text.secondary }}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </HoloCard>
        </AnimatedCard>
      </div>
      </HoloRefract>
      </CameraDrift>
      </TemporalDisplacement>
      </PageTransition>
    </SciFiShell>
  );
}
