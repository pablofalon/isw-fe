import { apiFetch } from './http';

export function cambiarPassword(token: string, passwordActual: string, passwordNueva: string): Promise<void> {
  return apiFetch<void>('/api/cuenta/cambiar-password', {
    method: 'POST',
    token,
    body: { passwordActual, passwordNueva },
  });
}
