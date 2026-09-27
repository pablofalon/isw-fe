import { apiFetch } from './http';
import type { Categoria, OperadorResumen, Prioridad } from '../types/ticket';

export function listarCategorias(token: string): Promise<Categoria[]> {
  return apiFetch<Categoria[]>('/api/categorias', { token });
}

export function listarPrioridades(token: string): Promise<Prioridad[]> {
  return apiFetch<Prioridad[]>('/api/prioridades', { token });
}

export function listarOperadores(token: string): Promise<OperadorResumen[]> {
  return apiFetch<OperadorResumen[]>('/api/operadores', { token });
}
