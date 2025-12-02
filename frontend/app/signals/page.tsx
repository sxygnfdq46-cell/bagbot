'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/card';
import Skeleton from '@/components/ui/skeleton';
import Tag from '@/components/ui/tag';
import { wsClient, type WsStatus } from '@/lib/ws-client';
import { useToast } from '@/components/ui/toast-provider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

type Signal = {
  id: string;
  asset: string;
  action: 'LONG' | 'SHORT' | 'FLAT' | string;
  confidence: number;
  timestamp: string;
  strength?: string;
};

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const { notify } = useToast();

  useEffect(() => {
    let hasAnnouncedConnection = false;
    let hasWarnedFailure = false;
    setStatus('connecting');

    const unsubscribeStatus = wsClient.onStatusChange((nextStatus: WsStatus) => {
      setStatus(nextStatus);
      if (nextStatus === 'connected' && !hasAnnouncedConnection) {
        hasAnnouncedConnection = true;
        hasWarnedFailure = false;
        notify({ title: 'Signal feed secure', description: 'Live stream locked in', variant: 'success' });
      }
      if (nextStatus === 'disconnected') {
        if (hasAnnouncedConnection) {
          hasAnnouncedConnection = false;
          notify({ title: 'Signal feed closed', description: 'Connection dropped', variant: 'error' });
        } else if (!hasWarnedFailure) {
          hasWarnedFailure = true;
          notify({ title: 'Signal feed unavailable', description: 'Unable to establish WebSocket channel', variant: 'error' });
        }
      }
    });

    const unsubscribeSignals = wsClient.subscribe('signals', (payload) => {
      const normalized = normalizeSignal(payload);
      if (!normalized) return;
      setSignals((prev) => [normalized, ...prev].slice(0, 15));
    });

    return () => {
      unsubscribeStatus();
      unsubscribeSignals();
    };
  }, [notify]);

  return (
    <ProtectedRoute>
      <div className="stack-gap-lg">
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
              WebSocket status: {status}
            </p>
          </div>
        </div>

        <Card title="Live Signals" subtitle="Streaming priority decisions">
          <div className="divide-y divide-[color:var(--border-soft)]">
            {signals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
            {status === 'connecting' && signals.length === 0 && (
              <div className="grid-premium py-4 sm:grid-cols-2">
                {[0, 1, 2, 3].map((index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            )}
            {signals.length === 0 && status !== 'connecting' && (
              <p className="py-6 text-sm muted-premium">Awaiting live signal feed...</p>
            )}
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  return (
    <div className="data-soft-fade py-4">
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
      <dl className="mt-4 grid-premium sm:grid-cols-3">
        <div>
          <dt className="metric-label">Confidence</dt>
          <dd className="metric-value" data-variant="muted">
            {Number.isFinite(signal.confidence) ? `${signal.confidence.toFixed(1)}%` : '0.0%'}
          </dd>
        </div>
        <div>
          <dt className="metric-label">Strength</dt>
          <dd className="metric-value">
            {signal.strength ?? 'Unranked'}
          </dd>
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

function normalizeSignal(payload: unknown): Signal | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const source = payload as Record<string, unknown>;
  const asset = typeof source.asset === 'string'
    ? source.asset
    : typeof source.symbol === 'string'
      ? source.symbol
      : undefined;
  if (!asset) return null;

  const timestamp = typeof source.timestamp === 'string' ? source.timestamp : new Date().toISOString();
  const action = typeof source.action === 'string'
    ? source.action
    : typeof source.direction === 'string'
      ? source.direction
      : 'HOLD';
  const confidenceRaw = source.confidence ?? source.alignment;
  const confidence = typeof confidenceRaw === 'number' ? confidenceRaw : 0;

  return {
    id: String(source.id ?? `${asset}-${timestamp}`),
    asset,
    action,
    confidence,
    timestamp,
    strength: typeof source.strength === 'string' ? source.strength : undefined
  };
}
