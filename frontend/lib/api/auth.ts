import { api } from '@/lib/api-client';

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
  login: async (payload: LoginPayload) => api.post<LoginResponse>('/api/auth/login', { body: payload, skipAuth: true }),
  logout: async () => api.post('/api/auth/logout', { skipAuth: true })
};
