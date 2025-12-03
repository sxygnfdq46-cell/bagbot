'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/card';
import Skeleton from '@/components/ui/skeleton';
import Tag from '@/components/ui/tag';
import GlobalHeroBadge from '@/components/ui/global-hero-badge';
import MetricLabel from '@/components/ui/metric-label';
import { useToast } from '@/components/ui/toast-provider';
import { signalsApi, type SignalRecord, type SignalStatus } from '@/lib/api/signals';
import TerminalShell from '@/components/ui/terminal-shell';

export default function SignalsPage() {
  const [signals, setSignals] = useState<SignalRecord[]>([]);
  const [status, setStatus] = useState<SignalStatus>('connecting');
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();
  const heroStatus = status === 'connected' ? 'LINK LIVE' : status === 'connecting' ? 'DIALING' : 'DEGRADED';
  const heroHint = status === 'connected' ? 'Streaming core feed' : status === 'connecting' ? 'Negotiating link' : 'Holding cache';

  useEffect(() => {
    let mounted = true;
    let warned = false;
    let lastStatus: SignalStatus | null = null;

    const hydrate = async (request: () => ReturnType<typeof signalsApi.getSnapshot>) => {
      try {
        const response = await request();
        if (!mounted) return;
        setSignals(response.signals);
        setStatus(response.status);
        setLoading(false);
        warned = false;
        if (lastStatus !== response.status) {
          lastStatus = response.status;
          if (response.status === 'connected') {
            notify({ title: 'Signal feed secured', description: 'Mock stream stabilized', variant: 'success' });
          } else if (response.status === 'degraded') {
            notify({ title: 'Signal feed degraded', description: 'Holding latest buffered snapshot', variant: 'info' });
          }
        }
      } catch (error) {
        if (!mounted) return;
        setStatus('degraded');
        setLoading(false);
        if (!warned) {
          warned = true;
           notify({ title: 'Signal feed offline', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
        }
      }
    };

    hydrate(() => signalsApi.getSnapshot());
    const interval = setInterval(() => hydrate(() => signalsApi.pollFeed()), 3600);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [notify]);

  return (
      <TerminalShell className="stack-gap-lg w-full">
        <GlobalHeroBadge
          badge="SIGNAL FABRIC"
          metaText="LIVE LINK"
          title="Signal Intelligence"
          description="Track conviction throughput as signals stream from the core fabric."
          statusAdornment={
            <div>
              <MetricLabel className="text-[color:var(--accent-gold)]">Link</MetricLabel>
              <p className="text-lg font-semibold text-[color:var(--text-main)]">{heroStatus}</p>
              <span className="status-indicator text-[color:var(--accent-cyan)]">{heroHint}</span>
            </div>
          }
        />
        <section className="stack-gap-sm w-full">
          <header className="stack-gap-xxs w-full">
            <MetricLabel className="text-[color:var(--accent-gold)]">Signal Fabric</MetricLabel>
            <h2 className="text-3xl font-semibold leading-tight">Monitor live conviction throughput</h2>
            <p className="muted-premium">
              Every signal arrives with contextual confidence and strength markers so you can choreograph the execution layer in real time.
            </p>
          </header>
          <div className="stack-gap-xxs w-full">
            <div className="flex flex-wrap items-center gap-3">
              <Tag variant={status === 'connected' ? 'success' : status === 'connecting' ? 'warning' : 'danger'}>
                {status === 'connected' ? 'Link secured' : status === 'connecting' ? 'Negotiating link' : 'Link offline'}
              </Tag>
              <MetricLabel className="text-xs uppercase tracking-[0.4em] text-[color:var(--accent-green)]">
                Signal layer: {status}
              </MetricLabel>
            </div>
          </div>
        </section>

        <Card title="Live Signals" subtitle="Streaming priority decisions">
          <div className="divide-y divide-[color:var(--border-soft)]">
            {signals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
            {loading && (
              <div className="grid-premium py-4 sm:grid-cols-2">
                {[0, 1, 2, 3].map((index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            )}
            {!loading && signals.length === 0 && <p className="py-6 text-sm muted-premium">Awaiting live signal feed...</p>}
          </div>
        </Card>
      </TerminalShell>
  );
}

function SignalCard({ signal }: { signal: SignalRecord }) {
  return (
    <div className="flex flex-col gap-3 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <MetricLabel className="text-[color:var(--accent-green)]">{signal.asset}</MetricLabel>
          <p className="text-xs muted-premium">
            {signal.timestamp ? new Date(signal.timestamp).toLocaleTimeString() : 'Just now'}
          </p>
        </div>
        <Tag variant={signal.action === 'LONG' ? 'success' : signal.action === 'SHORT' ? 'danger' : 'warning'}>
          {signal.action ?? 'HOLD'}
        </Tag>
      </div>
      <dl className="grid-premium sm:grid-cols-3">
        <div>
          <MetricLabel as="dt">Confidence</MetricLabel>
          <dd className="metric-value" data-variant="muted">
            {Number.isFinite(signal.confidence) ? `${signal.confidence.toFixed(1)}%` : '0.0%'}
          </dd>
        </div>
        <div>
          <MetricLabel as="dt">Strength</MetricLabel>
          <dd className="metric-value">{signal.strength ?? 'Unranked'}</dd>
        </div>
        <div>
          <MetricLabel as="dt">Action clock</MetricLabel>
          <dd className="metric-value text-base">
            {signal.timestamp ? new Date(signal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
