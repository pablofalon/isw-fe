import { apiFetch } from './http';
import type { LoginCredentials, Session } from '../types/auth';

export function login(credentials: LoginCredentials): Promise<Session> {
  return apiFetch<Session>('/login', {
    method: 'POST',
    body: credentials,
  });
}

export function logout(token: string): Promise<void> {
  return apiFetch<void>('/logout', {
    method: 'POST',
    token,
  });
}
