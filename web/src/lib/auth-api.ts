import { api } from './api-client';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  name: string;
}

export const authApi = {
  register: (input: { email: string; password: string; name: string }) =>
    api.post<AuthResponse>('/auth/register', input),
  login: (input: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', input),
  /** Invalidates every token issued for this account, on every device. */
  logoutAll: () => api.post<void>('/auth/logout-all'),
};
