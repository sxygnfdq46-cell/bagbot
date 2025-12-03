'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/card';
import Skeleton from '@/components/ui/skeleton';
import Tag from '@/components/ui/tag';
import PageTransition from '@/components/ui/page-transition';
import GlobalHeroBadge from '@/components/ui/global-hero-badge';
import { useToast } from '@/components/ui/toast-provider';
import { signalsApi, type SignalRecord, type SignalStatus } from '@/lib/api/signals';

export default function SignalsPage() {
  const [signals, setSignals] = useState<SignalRecord[]>([]);
  const [status, setStatus] = useState<SignalStatus>('connecting');
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

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
    <PageTransition>
      <div className="stack-gap-lg">
        <GlobalHeroBadge
          badge="SIGNAL FABRIC"
          metaText="LIVE LINK"
          title="Signal Intelligence"
          description="Track conviction throughput as signals stream from the core fabric."
          statusLabel="Link"
          statusValue={status === 'connected' ? 'Live' : status === 'connecting' ? 'Dialing' : 'Degraded'}
        />
        <div className="stack-gap-xxs">
          <p className="metric-label text-[color:var(--accent-gold)]">Signal Fabric</p>
          <div className="stack-gap-xxs">
            <h1 className="text-3xl font-semibold">Monitor live conviction throughput</h1>
            <p className="muted-premium max-w-2xl">
              Every signal arrives with contextual confidence and strength markers so you can choreograph the execution layer in real time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Tag variant={status === 'connected' ? 'success' : status === 'connecting' ? 'warning' : 'danger'}>
              {status === 'connected' ? 'Link secured' : status === 'connecting' ? 'Negotiating link' : 'Link offline'}
            </Tag>
            <p className="metric-label text-xs uppercase tracking-[0.4em] text-[color:var(--accent-green)]">
              Signal layer: {status}
            </p>
          </div>
        </div>

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
      </div>
    </PageTransition>
  );
}

function SignalCard({ signal }: { signal: SignalRecord }) {
  return (
    <div className="flex flex-col gap-3 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="metric-label text-[color:var(--accent-green)]">{signal.asset}</p>
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
          <dt className="metric-label">Confidence</dt>
          <dd className="metric-value" data-variant="muted">
            {Number.isFinite(signal.confidence) ? `${signal.confidence.toFixed(1)}%` : '0.0%'}
          </dd>
        </div>
        <div>
          <dt className="metric-label">Strength</dt>
          <dd className="metric-value">{signal.strength ?? 'Unranked'}</dd>
        </div>
        <div>
          <dt className="metric-label">Action clock</dt>
          <dd className="metric-value text-base">
            {signal.timestamp ? new Date(signal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
