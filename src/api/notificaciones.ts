import { apiFetch } from './http';
import type { Notificacion } from '../types/notificacion';

// CU16 - Panel de notificaciones del destinatario
export function misNotificaciones(token: string): Promise<Notificacion[]> {
  return apiFetch<Notificacion[]>('/api/notificaciones', { token });
}

export async function cantidadNoLeidas(token: string): Promise<number> {
  return (await apiFetch<{ cantidad: number }>('/api/notificaciones/no-leidas', { token })).cantidad;
}

export function marcarLeida(token: string, id: number): Promise<Notificacion> {
  return apiFetch<Notificacion>(`/api/notificaciones/${id}/leida`, { method: 'POST', token });
}

export function marcarTodasLeidas(token: string): Promise<void> {
  return apiFetch<void>('/api/notificaciones/leidas', { method: 'POST', token });
}

/** Evento para que el contador del menú se actualice cuando el panel marca notificaciones como leídas. */
export const EVENTO_NOTIFICACIONES = 'notificaciones-actualizadas';
