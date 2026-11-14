export type CriterioAgrupamiento = 'CATEGORIA' | 'PRIORIDAD' | 'ESTADO' | 'OPERADOR';

export type FormatoExportacion = 'PDF' | 'EXCEL' | 'CSV';

/** Parámetros de CU20; los filtros vacíos no se envían. La exportación (CU22) reutiliza los mismos. */
export interface ConsultaReporte {
  desde: string;
  hasta: string;
  criterio: CriterioAgrupamiento;
  idCategoria: string;
  idPrioridad: string;
  estado: string;
  idOperador: string;
}

export interface GrupoReporte {
  clave: string;
  cantidad: number;
  abiertos: number;
  cerrados: number;
  /** Horas; null si el grupo no tiene tickets cerrados. */
  promedioResolucionHoras: number | null;
}

export interface Reporte {
  desde: string;
  hasta: string;
  criterio: CriterioAgrupamiento;
  grupos: GrupoReporte[];
  totales: {
    cantidad: number;
    abiertos: number;
    cerrados: number;
    promedioResolucionHoras: number | null;
  };
  sinDatos: boolean;
}

export interface Distribucion {
  clave: string;
  cantidad: number;
}

export interface Indicadores {
  desde: string;
  hasta: string;
  total: number;
  abiertos: number;
  cerrados: number;
  promedioResolucionHoras: number;
  porCategoria: Distribucion[];
  porPrioridad: Distribucion[];
  recurrentes: Distribucion[];
  sinDatos: boolean;
}
