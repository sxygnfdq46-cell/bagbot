"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Skeleton from "@/components/ui/skeleton";
import MetricLabel from "@/components/ui/metric-label";
import TerminalShell from "@/components/ui/terminal-shell";
import Tag from "@/components/ui/tag";
import { useToast } from "@/components/ui/toast-provider";
import { learningApi, type LearningProposal } from "@/lib/api/learning";

export default function LearningProposalsPage() {
  const { notify } = useToast();
  const [proposals, setProposals] = useState<LearningProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'backend' | 'mock'>('mock');
  const [notice, setNotice] = useState<string | undefined>(undefined);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const feed = await learningApi.listProposals();
      setProposals(feed.proposals ?? []);
      setSource(feed.source);
      setNotice(feed.notice);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load proposals';
      setError(message);
      notify({ title: 'Proposals unavailable', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // single fetch on mount; manual refresh only
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TerminalShell className="stack-gap-lg">
      <div className="rounded-xl border border-[color:var(--border-soft)] bg-base/70 px-4 py-3 text-sm text-[color:var(--accent-gold)]">
        OBSERVATION MODE — READ-ONLY (NO LIVE TRADING)
      </div>
      <header className="stack-gap-xxs">
        <MetricLabel className="text-[color:var(--accent-gold)]">Learning Proposals</MetricLabel>
        <h1 className="text-3xl font-semibold leading-tight">Read-only proposal feed</h1>
        <p className="muted-premium">View proposed learning updates without taking action.</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={load} isLoading={loading}>
            Refresh proposals
          </Button>
          {source === 'backend' && <Tag variant="success">Backend feed</Tag>}
          {source === 'mock' && <Tag variant="warning">Mock fallback{notice ? ` — ${notice}` : ''}</Tag>}
          {error && <Tag variant="danger">{error}</Tag>}
        </div>
      </header>

      <Card title="Proposals" subtitle="No approvals in observation mode">
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : proposals.length ? (
          <ul className="stack-gap-sm">
            {proposals.map((proposal) => (
              <li key={proposal.id} className="data-soft-fade rounded-[0.85rem] border border-[color:var(--border-soft)] bg-base/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="stack-gap-xxs">
                    <p className="text-sm font-semibold">{proposal.title}</p>
                    <p className="text-xs text-[color:var(--text-main)] opacity-60">
                      Created {new Date(proposal.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Tag variant={proposal.status === 'approved' ? 'success' : proposal.status === 'rejected' ? 'danger' : 'warning'}>
                    {proposal.status}
                  </Tag>
                </div>
                <p className="mt-2 text-sm text-[color:var(--text-main)] opacity-80">{proposal.summary}</p>
                {proposal.updatedAt && (
                  <p className="mt-2 text-xs text-[color:var(--accent-cyan)]">Updated {new Date(proposal.updatedAt).toLocaleString()}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm muted-premium">No proposals available.</p>
        )}
      </Card>
    </TerminalShell>
  );
}
