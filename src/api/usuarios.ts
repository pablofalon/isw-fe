import { apiFetch } from './http';
import type { Rol } from '../types/auth';
import type { AltaUsuarioInput, DatosPersonaInput, Usuario } from '../types/usuario';

export function listarUsuarios(token: string, filtros: { tipo?: Rol; activa?: boolean } = {}): Promise<Usuario[]> {
  const params = new URLSearchParams();
  if (filtros.tipo) params.set('tipo', filtros.tipo);
  if (filtros.activa !== undefined) params.set('activa', String(filtros.activa));
  const query = params.toString();
  return apiFetch<Usuario[]>(`/api/usuarios${query ? `?${query}` : ''}`, { token });
}

export function crearUsuario(token: string, input: AltaUsuarioInput): Promise<Usuario> {
  return apiFetch<Usuario>('/api/usuarios', { method: 'POST', token, body: input });
}

export function modificarUsuario(token: string, id: number, input: DatosPersonaInput): Promise<Usuario> {
  return apiFetch<Usuario>(`/api/usuarios/${id}`, { method: 'PUT', token, body: input });
}

export function desactivarUsuario(token: string, id: number): Promise<Usuario> {
  return apiFetch<Usuario>(`/api/usuarios/${id}/desactivar`, { method: 'POST', token });
}

export function activarUsuario(token: string, id: number): Promise<Usuario> {
  return apiFetch<Usuario>(`/api/usuarios/${id}/activar`, { method: 'POST', token });
}

export function blanquearPassword(token: string, id: number, passwordTemporal: string): Promise<Usuario> {
  return apiFetch<Usuario>(`/api/usuarios/${id}/blanquear-password`, {
    method: 'POST',
    token,
    body: { passwordTemporal },
  });
}
