import { ApiError, apiFetch } from './http';
import type { Adjunto, CrearTicketInput, Ticket } from '../types/ticket';

export function registrarTicket(token: string, input: CrearTicketInput): Promise<Ticket> {
  return apiFetch<Ticket>('/api/tickets', {
    method: 'POST',
    token,
    body: input,
  });
}

export function misTickets(token: string): Promise<Ticket[]> {
  return apiFetch<Ticket[]>('/api/tickets/mios', { token });
}

export function obtenerTicket(token: string, id: number): Promise<Ticket> {
  return apiFetch<Ticket>(`/api/tickets/${id}`, { token });
}

export function reenviarTicket(
  token: string,
  ticketId: number,
  input: { titulo?: string; descripcion?: string },
): Promise<Ticket> {
  return apiFetch<Ticket>(`/api/tickets/${ticketId}/reenviar`, { method: 'POST', token, body: input });
}

// CU04 - Clasificar
export function pendientesClasificacion(token: string): Promise<Ticket[]> {
  return apiFetch<Ticket[]>('/api/tickets/pendientes-clasificacion', { token });
}

export function clasificarTicket(token: string, ticketId: number, idCategoria: number): Promise<Ticket> {
  return apiFetch<Ticket>(`/api/tickets/${ticketId}/clasificar`, {
    method: 'POST',
    token,
    body: { idCategoria },
  });
}

// CU05 - Asignar prioridad
export function asignarPrioridad(token: string, ticketId: number, idPrioridad: number): Promise<Ticket> {
  return apiFetch<Ticket>(`/api/tickets/${ticketId}/prioridad`, {
    method: 'POST',
    token,
    body: { idPrioridad },
  });
}

// CU06 - Validar ticket
export function validarTicket(token: string, ticketId: number): Promise<Ticket> {
  return apiFetch<Ticket>(`/api/tickets/${ticketId}/validar`, { method: 'POST', token });
}

export function marcarIncompleto(token: string, ticketId: number, observacion: string): Promise<Ticket> {
  return apiFetch<Ticket>(`/api/tickets/${ticketId}/marcar-incompleto`, {
    method: 'POST',
    token,
    body: { observacion },
  });
}

// CU13 - Asignar ticket
export function sinAsignar(token: string): Promise<Ticket[]> {
  return apiFetch<Ticket[]>('/api/tickets/sin-asignar', { token });
}

export function asignadosAMi(token: string): Promise<Ticket[]> {
  return apiFetch<Ticket[]>('/api/tickets/asignados-a-mi', { token });
}

export function asignarOperador(token: string, ticketId: number, idOperador: number): Promise<Ticket> {
  return apiFetch<Ticket>(`/api/tickets/${ticketId}/asignar`, {
    method: 'POST',
    token,
    body: { idOperador },
  });
}

// CU14 - Reasignar ticket
export function reasignarOperador(
  token: string,
  ticketId: number,
  idOperadorNuevo: number,
  motivo: string,
): Promise<Ticket> {
  return apiFetch<Ticket>(`/api/tickets/${ticketId}/reasignar`, {
    method: 'POST',
    token,
    body: { idOperadorNuevo, motivo },
  });
}

export function marcarResuelto(token: string, ticketId: number): Promise<Ticket> {
  return apiFetch<Ticket>(`/api/tickets/${ticketId}/resolver`, { method: 'POST', token });
}

// CU17 - Cerrar ticket
export function cerrarTicket(token: string, ticketId: number, solucion: string): Promise<Ticket> {
  return apiFetch<Ticket>(`/api/tickets/${ticketId}/cerrar`, {
    method: 'POST',
    token,
    body: { solucion },
  });
}

// CU18 - Validar resolución
export function validarResolucion(token: string, ticketId: number): Promise<Ticket> {
  return apiFetch<Ticket>(`/api/tickets/${ticketId}/validar-resolucion`, { method: 'POST', token });
}

// CU19 - Reabrir ticket
export function reabrirTicket(token: string, ticketId: number, motivo: string): Promise<Ticket> {
  return apiFetch<Ticket>(`/api/tickets/${ticketId}/reabrir`, {
    method: 'POST',
    token,
    body: { motivo },
  });
}

export async function adjuntarArchivo(token: string, ticketId: number, file: File): Promise<Adjunto> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tickets/${ticketId}/adjuntos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new ApiError(errorBody?.message ?? `Error ${response.status}`, response.status);
  }

  return response.json() as Promise<Adjunto>;
}
