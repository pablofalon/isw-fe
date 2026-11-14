import { ApiError, apiFetch, queryString } from './http';
import type { ConsultaReporte, FormatoExportacion, Indicadores, Reporte } from '../types/reporte';

const EXTENSIONES: Record<FormatoExportacion, string> = { PDF: 'pdf', EXCEL: 'xlsx', CSV: 'csv' };

// CU20 - Generar reportes
export function generarReporte(token: string, consulta: ConsultaReporte): Promise<Reporte> {
  return apiFetch<Reporte>(`/api/reportes${queryString({ ...consulta })}`, { token });
}

// CU21 - Consultar indicadores (sin período, el backend usa el mes en curso)
export function consultarIndicadores(token: string, desde?: string, hasta?: string): Promise<Indicadores> {
  return apiFetch<Indicadores>(`/api/reportes/indicadores${queryString({ desde, hasta })}`, { token });
}

// CU22 - Exportar reportes: el backend vuelve a calcular el reporte con los mismos parámetros y devuelve el archivo.
export async function exportarReporte(
  token: string,
  consulta: ConsultaReporte,
  formato: FormatoExportacion,
  incluirTotales: boolean,
): Promise<{ blob: Blob; nombre: string }> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/reportes/exportar${queryString({ ...consulta, formato, incluirTotales })}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new ApiError(errorBody?.message ?? `Error ${response.status}`, response.status);
  }

  const disposicion = response.headers.get('Content-Disposition') ?? '';
  const nombre =
    /filename="?([^";]+)"?/.exec(disposicion)?.[1] ??
    `reporte-tickets-${new Date().toISOString().slice(0, 10)}.${EXTENSIONES[formato]}`;
  return { blob: await response.blob(), nombre };
}
