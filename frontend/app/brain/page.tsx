'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast-provider';
import {
  brainApi,
  type BrainDecision,
  type BrainLink,
  type BrainActivityEvent,
  type BrainActivityResponse,
  type BrainLoadMetrics,
  type BrainLoadResponse
} from '@/lib/api/brain';
import PageTransition from '@/components/ui/page-transition';
import GlobalHeroBadge from '@/components/ui/global-hero-badge';

export default function BrainPage() {
  return (
    <PageTransition>
      <div className="stack-gap-lg">
        <GlobalHeroBadge
          badge="NEURAL"
          metaText="INTELLIGENCE"
          title="Brain Command Surface"
          description="Audit and steer the neural fabric powering Bagbot's live intelligence."
          statusLabel="Telemetry"
          statusValue="Live"
        />
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
    </PageTransition>
  );
}

function ActivityMapPanel() {
  const { notify } = useToast();
  const [events, setEvents] = useState<BrainActivityEvent[]>([]);
  const [status, setStatus] = useState<BrainActivityResponse['status']>('syncing');

  useEffect(() => {
    let warnedOffline = false;
    let mounted = true;
    const notifyOffline = () =>
      notify({ title: 'Activity stream offline', description: 'Using cached neural telemetry', variant: 'error' });
    const load = async () => {
      try {
        const response = await brainApi.getActivityMap();
        if (!mounted) return;
        setEvents(response.events);
        setStatus(response.status);
        if (response.status !== 'offline') {
          warnedOffline = false;
        }
      } catch (error) {
        if (!mounted) return;
        setStatus('offline');
        if (!warnedOffline) {
          notifyOffline();
          warnedOffline = true;
        }
      }
    };

    load();
    const interval = setInterval(load, 4500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [notify]);

  return (
    <Card title="Activity Map" subtitle="Live neuron firing and routing">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.3em] text-[color:var(--text-main)]">
        <span>Channel brain_activity</span>
        <span
          className={`rounded-full px-3 py-1 ${status === 'live' ? 'bg-[color:var(--accent-green)] text-black' : status === 'syncing' ? 'bg-[color:var(--accent-gold)]/30' : 'border border-[color:var(--border-soft)]'}`}
        >
          {status === 'live' ? 'Live' : status === 'syncing' ? 'Syncing' : 'Offline'}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {status === 'offline' && (
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

function NeuralLoadPanel() {
  const { notify } = useToast();
  const [metrics, setMetrics] = useState<BrainLoadMetrics>({ load: 0.38, temperature: 45, saturation: 0.32 });
  const [status, setStatus] = useState<BrainLoadResponse['status']>('syncing');

  useEffect(() => {
    let warnedOffline = false;
    let mounted = true;
    const load = async () => {
      try {
        const response = await brainApi.getLoadMetrics();
        if (!mounted) return;
        setMetrics(response.metrics);
        setStatus(response.status);
        if (response.status !== 'offline') {
          warnedOffline = false;
        }
      } catch (error) {
        if (!mounted) return;
        setStatus('offline');
        if (!warnedOffline) {
          notify({ title: 'Load telemetry offline', description: 'Using cached neural load metrics', variant: 'error' });
          warnedOffline = true;
        }
      }
    };
    load();
    const interval = setInterval(load, 4200);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [notify]);

  return (
    <Card title="Neural Load" subtitle="Compute, thermal, and saturation">
      {status === 'offline' && (
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

const getStatusColor = (status: string | undefined) => {
  if (!status) return 'border border-[color:var(--border-soft)] text-[color:var(--text-main)]';
  const normalized = status.toLowerCase();
  if (normalized.includes('fault') || normalized.includes('down')) return 'bg-red-500/20 text-red-200';
  if (normalized.includes('pending') || normalized.includes('queue')) return 'bg-[color:var(--accent-gold)]/20 text-[color:var(--accent-gold)]';
  return 'bg-[color:var(--accent-green)]/20 text-[color:var(--accent-green)]';
};
