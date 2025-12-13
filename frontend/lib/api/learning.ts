import { api, ApiError } from '@/lib/api-client';
import { mockResponse, nowIso } from '@/lib/api/mock-service';

export type ProposalStatus = 'draft' | 'approved' | 'rejected' | 'pending' | string;

export type LearningProposal = {
  id: string;
  title: string;
  summary: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt?: string;
};

export type ProposalFeed = {
  proposals: LearningProposal[];
  source: 'backend' | 'mock';
  notice?: string;
};

const mockProposals: LearningProposal[] = [
  {
    id: 'lp-1',
    title: 'Rebalance latency bands',
    summary: 'Tighten reaction window on volatility spikes by 15%.',
    status: 'draft',
    createdAt: nowIso(60)
  },
  {
    id: 'lp-2',
    title: 'Reduce leverage on ETH pairs',
    summary: 'Cap leverage to 2.5x during Asia open.',
    status: 'approved',
    createdAt: nowIso(180),
    updatedAt: nowIso(30)
  },
  {
    id: 'lp-3',
    title: 'Pause low-liquidity alts',
    summary: 'Auto-pause alts below $5M 24h volume.',
    status: 'rejected',
    createdAt: nowIso(240),
    updatedAt: nowIso(120)
  }
];

const buildMockFeed = async (): Promise<ProposalFeed> =>
  mockResponse({ proposals: mockProposals, source: 'mock' });

export const learningApi = {
  listProposals: async (): Promise<ProposalFeed> => {
    try {
      const backend = await api.get<Partial<ProposalFeed>>('/api/learning/proposals');
      return {
        proposals: backend.proposals ?? [],
        source: 'backend'
      };
    } catch (error) {
      const detail = error instanceof ApiError ? error.message : 'Learning proposals unavailable';
      const fallback = await buildMockFeed();
      return { ...fallback, notice: detail };
    }
  }
};
