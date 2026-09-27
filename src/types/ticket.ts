export type TicketEstadoCodigo =
  | 'NUEVO'
  | 'PENDIENTE_CORRECCION'
  | 'VALIDADO'
  | 'EN_ANALISIS'
  | 'RESUELTO'
  | 'CERRADO'
  | 'REABIERTO';

export type NivelPrioridad = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface UsuarioResumen {
  id: number;
  nombre: string;
  apellido: string;
  correoElectronico: string;
}

export interface OperadorResumen {
  id: number;
  nombre: string;
  apellido: string;
  correoElectronico: string;
  area: string | null;
  activo: boolean;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface Prioridad {
  id: number;
  nivel: NivelPrioridad;
  descripcion: string | null;
  tiempoObjetivoRespuesta: number | null;
}

export interface Adjunto {
  id: number;
  nombreArchivo: string;
  tipoArchivo: string;
  tamano: number;
  fechaCarga: string;
  descripcion: string | null;
}

export interface HistorialEstadoEntry {
  estado: string;
  observacion: string | null;
  motivoCambio: string | null;
  fechaCambio: string;
  actorUsuario: UsuarioResumen | null;
  actorOperador: OperadorResumen | null;
}

export interface HistorialAsignacionEntry {
  tipoAccion: 'ASIGNACION' | 'REASIGNACION';
  motivo: string | null;
  fechaAsignacion: string;
  operadorAnterior: OperadorResumen | null;
  operadorNuevo: OperadorResumen;
  operadorResponsable: OperadorResumen;
}

export interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  estado: TicketEstadoCodigo;
  estadoNombre: string;
  usuario: UsuarioResumen;
  operador: OperadorResumen | null;
  categoria: Categoria | null;
  prioridadSugerida: Prioridad | null;
  prioridad: Prioridad | null;
  fechaCreacion: string;
  fechaUltimaActualizacion: string | null;
  fechaCierre: string | null;
  motivoCierre: string | null;
  motivoReapertura: string | null;
  validado: boolean;
  adjuntos: Adjunto[];
  historialEstados: HistorialEstadoEntry[];
  historialAsignaciones: HistorialAsignacionEntry[];
}

export interface CrearTicketInput {
  titulo: string;
  descripcion: string;
  idCategoria?: number;
  idPrioridadSugerida?: number;
}
