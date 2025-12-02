import { api } from '../api-client';

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
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>('/api/auth/login', {
      body: payload,
      skipAuth: true
    }),
  logout: () => api.post<{ success: boolean }>('/api/auth/logout')
};
