'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import Tag from '@/components/ui/tag';
import Sparkline from '@/components/ui/sparkline';
import GlobalHeroBadge from '@/components/ui/global-hero-badge';
import { useToast } from '@/components/ui/toast-provider';
import MetricLabel from '@/components/ui/metric-label';
import { botApi, type BotSnapshot, type BotStatus } from '@/lib/api/bot';
import TerminalShell from '@/components/ui/terminal-shell';
import { useRuntimeSnapshot } from '@/lib/runtime/use-runtime-snapshot';
import { applyRuntimeIntent } from '@/lib/runtime/runtime-intents';

export default function BotControlCenterPage() {
  const [snapshot, setSnapshot] = useState<BotSnapshot | null>(null);
  const [pendingCommand, setPendingCommand] = useState<BotStatus | 'restart' | null>(null);
  const errorRef = useRef(false);
  const { notify } = useToast();
  const { snapshot: runtimeSnapshot } = useRuntimeSnapshot();

  const runtimeBot = runtimeSnapshot.bot;
  const safeMode = runtimeSnapshot.system.safeMode === true;
  const derivedStatus: BotStatus = runtimeBot.state === 'RUNNING'
    ? 'running'
    : runtimeBot.state === 'STOPPED'
      ? 'stopped'
      : runtimeBot.status ?? snapshot?.status ?? 'running';
  const status = derivedStatus;
  const lastAction = runtimeBot.lastAction ?? snapshot?.lastAction ?? 'Boot sequence initializing';
  const botMetrics = useMemo(
    () =>
      snapshot?.metrics ?? {
        decisionsPerMinute: 0,
        latencyMs: 0,
        uptimeHours: 0,
        confidence: 0
      },
    [snapshot?.metrics]
  );
  const health = runtimeBot.health ?? snapshot?.health ?? { cpu: 0, ram: 0, load: 0 };
  const eventLog = snapshot?.eventLog ?? [];
  const outputSeries = snapshot?.outputSeries ?? [];
  const triggerSeries = snapshot?.triggerSeries ?? [];
  const isLoading = snapshot === null;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await botApi.getSnapshot();
        if (mounted) {
          setSnapshot(data);
          errorRef.current = false;
        }
      } catch (error) {
        if (!mounted || errorRef.current) return;
        errorRef.current = true;
        notify({ title: 'Bot telemetry offline', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
      }
    };

    load();
    const interval = setInterval(load, 5200);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [notify]);

  const handleCommand = async (command: BotStatus | 'restart') => {
    if (command === 'running' && !window.confirm('Start bot?')) return;
    if (command === 'stopped' && !window.confirm('Stop bot?')) return;
    setPendingCommand(command);
    try {
      if (command === 'running' || command === 'stopped') {
        applyRuntimeIntent({ type: 'SET_BOT_STATE', state: command === 'running' ? 'RUNNING' : 'STOPPED', source: 'bot-page' });
        notify({
          title: `${command.toUpperCase()} command sent`,
          description: getCommandMessage(command),
          variant: 'success'
        });
        setSnapshot((prev) => prev);
      } else {
        const data = await botApi.issueCommand(command);
        setSnapshot(data);
        notify({
          title: 'Restart issued',
          description: getCommandMessage(command),
          variant: 'success'
        });
      }
    } catch (error) {
      notify({
        title: 'Command failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error'
      });
      if (command === 'running' || command === 'stopped') {
        try {
          const data = await botApi.issueCommand(command);
          setSnapshot(data);
        } catch (_fallbackError) {
          /* fallback failed, keep prior snapshot */
        }
      }
    } finally {
      setPendingCommand(null);
    }
  };

  const metricsList = useMemo(
    () => [
      {
        label: 'Decisions / min',
        value: Math.round(botMetrics.decisionsPerMinute).toString(),
        accent: 'var(--accent-green)'
      },
      {
        label: 'Latency',
        value: `${botMetrics.latencyMs.toFixed(1)} ms`,
        accent: 'var(--accent-cyan)'
      },
      {
        label: 'Uptime',
        value: `${botMetrics.uptimeHours} h`,
        accent: 'var(--accent-gold)'
      },
      {
        label: 'Confidence',
        value: `${(botMetrics.confidence * 100).toFixed(1)}%`,
        accent: 'var(--accent-violet)'
      }
    ],
    [botMetrics]
  );

  return (
    <TerminalShell className="stack-gap-lg w-full">
      <GlobalHeroBadge
        badge="AUTONOMY"
        metaText="CONTROL CENTER"
        title="Bot Control Center"
        description="Command, audit, and stage BagBot's automation core. Every control reacts instantly inside the premium surface."
        statusAdornment={
          <div>
            <p className="metric-label text-[color:var(--accent-gold)]">Mode</p>
            <p className="text-lg font-semibold text-[color:var(--text-main)]">{status.toUpperCase()}</p>
            <span className="status-indicator text-[color:var(--accent-gold)]">Auto-refresh</span>
          </div>
        }
      />

      <section className="stack-gap-sm w-full">
        <header className="stack-gap-xxs w-full">
          <MetricLabel className="text-[color:var(--accent-gold)]">Autonomy Control</MetricLabel>
          <h2 className="text-3xl font-semibold leading-tight">Steer automation with confidence</h2>
          <p className="muted-premium">
            Review live state, issue commands, and audit telemetry without leaving the premium shell.
          </p>
        </header>
      </section>

      <div className="grid-premium lg:grid-cols-3">
        <Card title="Bot state panel" subtitle="Status, last action, and safety rail">
          <div className="stack-gap-sm">
            <Tag variant={statusTag(status)}>{status.toUpperCase()}</Tag>
            {isLoading ? <Skeleton className="h-4 w-40" /> : <p className="muted-premium text-sm">{lastAction}</p>}
            <div className="info-tablet">
              <MetricLabel>Safety rail</MetricLabel>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--accent-green)]">Adaptive • Guarded</p>
            </div>
          </div>
        </Card>
        <Card title="Command deck" subtitle="Start / Stop / Restart" padded>
          <div className="flex flex-wrap gap-3">
            <Button className="btn-start" onClick={() => handleCommand('running')} isLoading={pendingCommand === 'running'} disabled={safeMode}>
              Start
            </Button>
            <Button className="btn-stop" onClick={() => handleCommand('stopped')} isLoading={pendingCommand === 'stopped'} disabled={safeMode}>
              Stop
            </Button>
            <Button className="btn-restart" onClick={() => handleCommand('restart')} isLoading={pendingCommand === 'restart'}>
              Restart
            </Button>
          </div>
        </Card>
        <Card title="Bot metrics" subtitle="Decisions, latency, uptime, confidence">
          <div className="grid-premium sm:grid-cols-2">
            {metricsList.map((metric) => (
              <div key={metric.label} className="info-tablet">
                <MetricLabel tone={metric.accent}>{metric.label}</MetricLabel>
                <p className="metric-value" data-variant="muted">
                  {isLoading ? <Skeleton className="h-6 w-16" /> : metric.value}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Bot health dashboard" subtitle="CPU, RAM, load" padded>
        <div className="grid-premium sm:grid-cols-3">
          {[
            { label: 'CPU', value: health.cpu, suffix: '%', color: 'var(--accent-green)' },
            { label: 'RAM', value: health.ram, suffix: '%', color: 'var(--accent-cyan)' },
            { label: 'Load', value: health.load, suffix: '×', color: 'var(--accent-gold)', max: 2 }
          ].map((item) => (
            <div key={item.label} className="dashboard-tile">
              <div className="flex items-center justify-between text-sm">
                <MetricLabel>{item.label}</MetricLabel>
                {isLoading ? (
                  <Skeleton className="h-5 w-12" />
                ) : (
                  <span className="text-[color:var(--accent-cyan)]">{item.value.toFixed(item.suffix === '%' ? 0 : 2)}{item.suffix}</span>
                )}
              </div>
              <div className="mt-4 h-2 rounded-full bg-base/50">
                <span
                  className="block h-full rounded-full bg-[color:var(--accent-green)]"
                  style={{ width: `${progressWidth(item.value, item.max ?? 100)}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid-premium lg:grid-cols-2">
        <Card title="Live event log" subtitle="Rolling premium log">
          <div className="no-scrollbar max-h-72 overflow-y-auto stack-gap-sm">
            {eventLog.length === 0 && <Skeleton className="h-12 w-full" />}
            {eventLog.map((entry) => (
              <div key={entry.id} className="surface-float">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[color:var(--accent-cyan)]">
                  <span>{entry.timestamp}</span>
                  <span>{entry.level}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[color:var(--text-main)]">{entry.message}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Pattern telemetry" subtitle="Output patterns and triggers">
          <div className="grid-premium">
            <div className="dashboard-tile">
              <MetricLabel>Bot output pattern</MetricLabel>
              <div className="mt-4 h-24">
                {isLoading ? <Skeleton className="h-full w-full" /> : <Sparkline points={outputSeries} stroke="var(--accent-violet)" />}
              </div>
            </div>
            <div className="dashboard-tile">
              <MetricLabel>Recent triggers</MetricLabel>
              <div className="mt-4 h-24">
                {isLoading ? <Skeleton className="h-full w-full" /> : <Sparkline points={triggerSeries} stroke="var(--accent-green)" />}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </TerminalShell>
  );
}

function statusTag(status: BotStatus) {
  if (status === 'running') return 'success';
  if (status === 'stopped') return 'warning';
  return 'danger';
}

function getCommandMessage(status: BotStatus | 'restart') {
  if (status === 'running') return 'Bot resumed execution lane.';
  if (status === 'stopped') return 'Bot halted via operator command.';
  if (status === 'restart') return 'Bot kernel restarted gracefully.';
  return 'Error captured, safe mode engaged.';
}

function progressWidth(value: number, max: number) {
  if (max <= 1) return Math.min(100, (value / max) * 100);
  return Math.min(100, (value / max) * 100);
}
