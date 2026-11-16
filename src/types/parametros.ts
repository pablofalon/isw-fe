export type GrupoParametros = 'CATEGORIAS' | 'PRIORIDADES' | 'GENERALES';

export interface CategoriaAdmin {
  id: number;
  nombre: string;
  descripcion: string | null;
  area: string | null;
  activa: boolean;
}

export interface PrioridadAdmin {
  id: number;
  nivel: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  descripcion: string | null;
  tiempoObjetivoRespuesta: number | null;
}

export interface ParametroGeneral {
  clave: string;
  descripcion: string;
  unidad: string | null;
  valor: number;
  valorDefecto: number;
  minimo: number;
  maximo: number;
}

export interface Parametros {
  categorias: CategoriaAdmin[];
  prioridades: PrioridadAdmin[];
  generales: ParametroGeneral[];
}

export interface CategoriaInput {
  nombre: string;
  descripcion?: string;
  area?: string;
}

export interface AuditoriaParametro {
  id: number;
  fecha: string;
  administrador: string;
  grupo: GrupoParametros;
  elemento: string;
  accion: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
}
