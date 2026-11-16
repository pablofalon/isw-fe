import { apiFetch } from './http';
import type {
  AuditoriaParametro,
  CategoriaAdmin,
  CategoriaInput,
  GrupoParametros,
  ParametroGeneral,
  Parametros,
  PrioridadAdmin,
} from '../types/parametros';

export function obtenerParametros(token: string): Promise<Parametros> {
  return apiFetch<Parametros>('/api/parametros', { token });
}

export function obtenerAuditoria(token: string): Promise<AuditoriaParametro[]> {
  return apiFetch<AuditoriaParametro[]>('/api/parametros/auditoria', { token });
}

export function crearCategoria(token: string, input: CategoriaInput): Promise<CategoriaAdmin> {
  return apiFetch<CategoriaAdmin>('/api/parametros/categorias', { method: 'POST', token, body: input });
}

export function modificarCategoria(token: string, id: number, input: CategoriaInput): Promise<CategoriaAdmin> {
  return apiFetch<CategoriaAdmin>(`/api/parametros/categorias/${id}`, { method: 'PUT', token, body: input });
}

export function cambiarEstadoCategoria(token: string, id: number, activa: boolean): Promise<CategoriaAdmin> {
  return apiFetch<CategoriaAdmin>(`/api/parametros/categorias/${id}/${activa ? 'activar' : 'desactivar'}`, {
    method: 'POST',
    token,
  });
}

export function modificarPrioridad(
  token: string,
  id: number,
  descripcion: string,
  tiempoObjetivoRespuesta: number,
): Promise<PrioridadAdmin> {
  return apiFetch<PrioridadAdmin>(`/api/parametros/prioridades/${id}`, {
    method: 'PUT',
    token,
    body: { descripcion, tiempoObjetivoRespuesta },
  });
}

export function modificarParametroGeneral(token: string, clave: string, valor: number): Promise<ParametroGeneral> {
  return apiFetch<ParametroGeneral>(`/api/parametros/generales/${clave}`, { method: 'PUT', token, body: { valor } });
}

export function restaurarParametros(token: string, grupo: GrupoParametros): Promise<Parametros> {
  return apiFetch<Parametros>(`/api/parametros/${grupo}/restaurar`, { method: 'POST', token });
}
