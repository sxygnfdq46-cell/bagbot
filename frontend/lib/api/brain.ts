import { api } from '@/lib/api-client';

export type BrainLink = {
  id: string;
  strategyName: string;
  status: 'linked' | 'pending' | 'faulted' | string;
};

export type BrainDecision = {
  id: string;
  timestamp: string;
  outcome: string;
  confidence: number;
};

export type BrainLinkageResponse = {
  nodes: BrainLink[];
};

export type BrainDecisionsResponse = {
  decisions: BrainDecision[];
};

export type DiagnosticResponse = { success: boolean; message?: string };

export const brainApi = {
  getLinkage: () => api.get<BrainLinkageResponse>('/api/brain/linkage'),
  getRecentDecisions: () => api.get<BrainDecisionsResponse>('/api/brain/decisions/recent'),
  runDiagnostic: () => api.post<DiagnosticResponse>('/api/brain/diagnostic', { body: null }),
  resetEngine: () => api.post<DiagnosticResponse>('/api/brain/reset', { body: null })
};
