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
  /** Área de operadores que atiende la categoría (CU13). */
  area: string | null;
}

/** Límites configurables de CU02 (app.adjuntos.* en el backend). */
export interface LimitesAdjuntos {
  tamanioMaximoBytes: number;
  maximoPorTicket: number;
  extensionesPermitidas: string[];
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
  /** Operador que lo subió como evidencia de una acción (CU08); null si lo subió el titular. */
  operadorAutor: OperadorResumen | null;
}

/** CAMBIO_ESTADO: transición; ACTUALIZACION: cambio sin transición; ACCION: registrada con CU08. */
export type TipoRegistroHistorial = 'CAMBIO_ESTADO' | 'ACTUALIZACION' | 'ACCION';

export interface HistorialEstadoEntry {
  estado: string;
  tipo: TipoRegistroHistorial;
  observacion: string | null;
  motivoCambio: string | null;
  fechaCambio: string;
  actorUsuario: UsuarioResumen | null;
  actorOperador: OperadorResumen | null;
}

/** CU15: autor = titular (usuarioAutor) u operador asignado (operadorAutor). */
export interface Comentario {
  id: number;
  contenido: string;
  fechaCreacion: string;
  usuarioAutor: UsuarioResumen | null;
  operadorAutor: OperadorResumen | null;
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
  /** Descripción de la resolución (CU09). */
  resolucion: string | null;
  validado: boolean;
  adjuntos: Adjunto[];
  historialEstados: HistorialEstadoEntry[];
  historialAsignaciones: HistorialAsignacionEntry[];
  /** CU07: estados a los que quien consulta puede llevar el ticket. */
  transicionesDisponibles: TicketEstadoCodigo[];
  /** CU08: si quien consulta puede registrar acciones. */
  puedeRegistrarAccion: boolean;
  comentarios: Comentario[];
  /** CU15: si quien consulta puede comentar. */
  puedeComentar: boolean;
}

export interface CrearTicketInput {
  titulo: string;
  descripcion: string;
  idCategoria: number;
  idPrioridadSugerida?: number;
}
