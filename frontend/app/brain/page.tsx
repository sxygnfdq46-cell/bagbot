'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useToast } from '@/components/ui/toast-provider';
import { brainApi, type BrainDecision, type BrainLink } from '@/lib/api/brain';
import { wsClient, type WsStatus } from '@/lib/ws-client';

export default function BrainPage() {
  return (
    <ProtectedRoute>
      <div className="stack-gap-lg">
        <header className="stack-gap-xxs">
          <p className="metric-label text-[color:var(--accent-gold)]">Brain Intelligence</p>
          <h1 className="page-title text-3xl font-semibold">Neural Command Surface</h1>
          <p className="muted-premium">
            Monitor cognitive load, signal routing, and manual overrides for the live intelligence engine.
          </p>
        </header>

        <div className="grid-premium lg:grid-cols-3">
          <ActivityMapPanel />
          <NeuralLoadPanel />
          <ManualControlPanel />
        </div>

        <div className="grid-premium lg:grid-cols-2">
          <LinkageGraphPanel />
          <DecisionTimelinePanel />
        </div>
      </div>
    </ProtectedRoute>
  );
}

type ActivityEvent = {
  id: string;
  label: string;
  location: string;
  intensity: number;
  status: 'stable' | 'spike' | 'offline' | 'degraded';
  timestamp: string;
};

function ActivityMapPanel() {
  const { notify } = useToast();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [wsStatus, setWsStatus] = useState<WsStatus>('disconnected');
  const statusRef = useRef<WsStatus>('disconnected');

  useEffect(() => {
    const unsubscribe = wsClient.subscribe('brain_activity', (payload) => {
      const event = normalizeActivity(payload);
      if (!event) return;
      setEvents((prev) => [event, ...prev].slice(0, 14));
    });
    const stopTracking = wsClient.onStatusChange((nextStatus) => {
      setWsStatus(nextStatus);
      if (nextStatus === 'disconnected' && statusRef.current !== 'disconnected') {
        notify({ title: 'Activity stream offline', description: 'Channel brain_activity disconnected', variant: 'error' });
      }
      if (nextStatus === 'connected' && statusRef.current === 'disconnected') {
        notify({ title: 'Activity stream restored', description: 'Channel brain_activity reconnected', variant: 'success' });
      }
      statusRef.current = nextStatus;
    });
    return () => {
      unsubscribe?.();
      stopTracking?.();
    };
  }, [notify]);

  const statusLabel = useMemo(() => {
    switch (wsStatus) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return 'Syncing';
      default:
        return 'Offline';
    }
  }, [wsStatus]);

  return (
    <Card title="Activity Map" subtitle="Live neuron firing and routing">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.3em] text-[color:var(--text-main)]">
        <span>Channel brain_activity</span>
        <span className={`rounded-full px-3 py-1 ${wsStatus === 'connected' ? 'bg-[color:var(--accent-green)] text-black' : 'border border-[color:var(--border-soft)]'}`}>
          {statusLabel}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {wsStatus === 'disconnected' && (
          <p className="text-xs text-red-400">Channel offline — attempting to resubscribe.</p>
        )}
        {events.length === 0 ? (
          <p className="text-sm text-[color:var(--text-main)] opacity-60">Awaiting telemetry…</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="data-soft-fade rounded-2xl border border-[color:var(--border-soft)] bg-base/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.3em]">
                <span>{event.location}</span>
                <span className="opacity-60">{event.timestamp}</span>
              </div>
              <p className="mt-2 text-sm font-semibold">{event.label}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${event.status === 'spike' ? 'bg-[color:var(--accent-gold)]' : event.status === 'offline' ? 'bg-red-500/70' : 'bg-[color:var(--accent-green)]'}`}
                  style={{ width: `${Math.min(100, Math.max(0, event.intensity * 100))}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

type LoadMetrics = {
  load: number;
  temperature: number;
  saturation: number;
};

function NeuralLoadPanel() {
  const { notify } = useToast();
  const [metrics, setMetrics] = useState<LoadMetrics>({ load: 0.38, temperature: 45, saturation: 0.32 });
  const [status, setStatus] = useState<WsStatus>('disconnected');
  const statusRef = useRef<WsStatus>('disconnected');

  useEffect(() => {
    const unsubscribe = wsClient.subscribe('brain_metrics', (payload) => {
      const metric = normalizeMetrics(payload);
      if (!metric) return;
      setMetrics(metric);
    });
    const stopTracking = wsClient.onStatusChange((nextStatus) => {
      setStatus(nextStatus);
      if (nextStatus === 'disconnected' && statusRef.current !== 'disconnected') {
        notify({ title: 'Load telemetry offline', description: 'Channel brain_metrics disconnected', variant: 'error' });
      }
      if (nextStatus === 'connected' && statusRef.current === 'disconnected') {
        notify({ title: 'Load telemetry restored', description: 'Channel brain_metrics reconnected', variant: 'success' });
      }
      statusRef.current = nextStatus;
    });
    return () => {
      unsubscribe?.();
      stopTracking?.();
    };
  }, [notify]);

  return (
    <Card title="Neural Load" subtitle="Compute, thermal, and saturation">
      {status === 'disconnected' && (
        <p className="text-xs text-red-400">Telemetry offline — showing last received snapshot.</p>
      )}
      <dl className="space-y-4 text-sm">
        <MetricRow label="Cognitive Load" value={`${(metrics.load * 100).toFixed(0)}%`} progress={metrics.load} accent={metrics.load > 0.75 ? 'warning' : undefined} />
        <MetricRow label="Die Temperature" value={`${metrics.temperature.toFixed?.(1) ?? metrics.temperature}°C`} progress={Math.min(1, metrics.temperature / 100)} accent={metrics.temperature > 70 ? 'warning' : undefined} />
        <MetricRow label="Signal Saturation" value={`${(metrics.saturation * 100).toFixed(0)}%`} progress={metrics.saturation} />
      </dl>
    </Card>
  );
}

function ManualControlPanel() {
  const { notify } = useToast();
  const [pending, setPending] = useState<'diagnostic' | 'reset' | null>(null);

  const run = (action: 'diagnostic' | 'reset') => {
    setPending(action);
    const request = action === 'diagnostic' ? brainApi.runDiagnostic() : brainApi.resetEngine();
    request
      .then((response) => {
        notify({
          title: action === 'diagnostic' ? 'Diagnostic launched' : 'Engine reset issued',
          description: response.message ?? 'Command accepted by orchestration layer.',
          variant: 'success'
        });
      })
      .catch((error) => {
        notify({ title: 'Control command failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
      })
      .finally(() => setPending(null));
  };

  return (
    <Card title="Manual Controls" subtitle="Direct overrides for edge cases">
      <p className="text-sm text-[color:var(--text-main)] opacity-70">
        All actions propagate through change control and are recorded in the audit timeline.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <Button onClick={() => run('diagnostic')} isLoading={pending === 'diagnostic'} loadingText="Running checks..." className="w-full">
          Launch Diagnostic Sweep
        </Button>
        <Button variant="secondary" onClick={() => run('reset')} isLoading={pending === 'reset'} loadingText="Resetting..." className="w-full">
          Issue Engine Reset
        </Button>
      </div>
    </Card>
  );
}

function LinkageGraphPanel() {
  const [nodes, setNodes] = useState<BrainLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    brainApi
      .getLinkage()
      .then((response) => {
        if (mounted) {
          setNodes(response.nodes ?? []);
        }
      })
      .catch((error) => {
        notify({ title: 'Linkage fetch failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [notify]);

  return (
    <Card title="Linkage Graph" subtitle="Strategies linked to neural fabric">
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : nodes.length === 0 ? (
        <p className="text-sm text-[color:var(--text-main)] opacity-60">No linkage data returned.</p>
      ) : (
        <ul className="space-y-3">
          {nodes.map((node) => (
            <li key={node.id} className="data-soft-fade rounded-2xl border border-[color:var(--border-soft)] bg-base/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-[160px]">
                  <p className="text-sm font-semibold">{node.strategyName}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-main)] opacity-60">{node.id}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.3em] ${getStatusColor(node.status)}`}>
                  {node.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function DecisionTimelinePanel() {
  const [decisions, setDecisions] = useState<BrainDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    brainApi
      .getRecentDecisions()
      .then((response) => {
        if (mounted) setDecisions(response.decisions ?? []);
      })
      .catch((error) => {
        notify({ title: 'Decision feed offline', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [notify]);

  return (
    <Card title="Decision Timeline" subtitle="Latest calls, confidence, and outcomes">
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : decisions.length === 0 ? (
        <p className="text-sm text-[color:var(--text-main)] opacity-60">No recorded decisions.</p>
      ) : (
        <ul className="space-y-3">
          {decisions.map((decision) => (
            <li key={decision.id} className="data-soft-fade rounded-2xl border border-[color:var(--border-soft)] bg-base/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.3em]">
                <span>{decision.timestamp}</span>
                <span className="text-[color:var(--accent-green)]">{(decision.confidence * 100).toFixed(0)}% conf.</span>
              </div>
              <p className="mt-2 text-sm font-semibold">{decision.outcome}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function MetricRow({ label, value, progress = 0, accent }: { label: string; value: string; progress?: number; accent?: 'warning' }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] opacity-60">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent === 'warning' ? 'text-red-400' : ''}`}>{value}</p>
      <div className="mt-2 h-1 rounded-full bg-white/10">
        <div
          className={`h-full ${accent === 'warning' ? 'bg-red-500/70' : 'bg-[color:var(--accent-green)]'}`}
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </div>
    </div>
  );
}

const normalizeActivity = (payload: unknown): ActivityEvent | null => {
  if (!payload || typeof payload !== 'object') return null;
  const source = payload as Record<string, unknown>;
  const intensity = Number(source.intensity ?? source.load ?? 0.4);
  const rawStatus = typeof source.status === 'string' ? source.status.toLowerCase() : '';
  const normalizedStatus: ActivityEvent['status'] = rawStatus.includes('spike')
    ? 'spike'
    : rawStatus.includes('offline') || rawStatus.includes('down')
    ? 'offline'
    : rawStatus.includes('degrad')
    ? 'degraded'
    : 'stable';
  return {
    id: String(source.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    label: typeof source.label === 'string' ? source.label : typeof source.signal === 'string' ? source.signal : 'Unknown signal',
    location: typeof source.location === 'string' ? source.location : typeof source.region === 'string' ? source.region : 'Unmapped',
    intensity: Number.isFinite(intensity) ? intensity : 0.4,
    status: normalizedStatus,
    timestamp: typeof source.timestamp === 'string' ? source.timestamp : new Date().toLocaleTimeString()
  };
};

const normalizeMetrics = (payload: unknown): LoadMetrics | null => {
  if (!payload || typeof payload !== 'object') return null;
  const source = payload as Record<string, unknown>;
  const load = Number(source.load ?? source.utilization ?? 0.3);
  const saturation = Number(source.saturation ?? source.bandwidth ?? 0.25);
  const temperature = Number(source.temperature ?? 45);
  return {
    load: Number.isFinite(load) ? Math.max(0, Math.min(1, load)) : 0.3,
    temperature: Number.isFinite(temperature) ? temperature : 45,
    saturation: Number.isFinite(saturation) ? Math.max(0, Math.min(1, saturation)) : 0.25
  };
};

const getStatusColor = (status: string | undefined) => {
  if (!status) return 'border border-[color:var(--border-soft)] text-[color:var(--text-main)]';
  const normalized = status.toLowerCase();
  if (normalized.includes('fault') || normalized.includes('down')) return 'bg-red-500/20 text-red-200';
  if (normalized.includes('pending') || normalized.includes('queue')) return 'bg-[color:var(--accent-gold)]/20 text-[color:var(--accent-gold)]';
  return 'bg-[color:var(--accent-green)]/20 text-[color:var(--accent-green)]';
};
