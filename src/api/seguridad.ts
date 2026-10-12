import { apiFetch } from './http';
import type { ComponentePermiso, CuentaSeguridad } from '../types/seguridad';

export function listarComponentes(token: string): Promise<ComponentePermiso[]> {
  return apiFetch<ComponentePermiso[]>('/api/seguridad/componentes', { token });
}

export function crearGrupo(token: string, codigo: string, descripcion: string): Promise<ComponentePermiso> {
  return apiFetch<ComponentePermiso>('/api/seguridad/grupos', {
    method: 'POST',
    token,
    body: { codigo, descripcion },
  });
}

export function agregarHijo(token: string, idGrupo: number, idComponente: number): Promise<ComponentePermiso> {
  return apiFetch<ComponentePermiso>(`/api/seguridad/grupos/${idGrupo}/hijos`, {
    method: 'POST',
    token,
    body: { idComponente },
  });
}

export function quitarHijo(token: string, idGrupo: number, idHijo: number): Promise<ComponentePermiso> {
  return apiFetch<ComponentePermiso>(`/api/seguridad/grupos/${idGrupo}/hijos/${idHijo}`, {
    method: 'DELETE',
    token,
  });
}

export function listarCuentas(token: string): Promise<CuentaSeguridad[]> {
  return apiFetch<CuentaSeguridad[]>('/api/seguridad/cuentas', { token });
}

export function asignarComponentes(token: string, idCuenta: number, idsComponentes: number[]): Promise<CuentaSeguridad> {
  return apiFetch<CuentaSeguridad>(`/api/seguridad/cuentas/${idCuenta}/componentes`, {
    method: 'PUT',
    token,
    body: { idsComponentes },
  });
}
