import { mockResponse } from '@/lib/api/mock-service';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user?: {
    name?: string;
  };
};

export const auth = {
  login: async (payload: LoginPayload) =>
    mockResponse<LoginResponse>({
      token: 'offline-preview-token',
      user: { name: payload.email.split('@')[0]?.toUpperCase?.() ?? 'Guest' }
    }),
  logout: async () => mockResponse({ success: true })
};
