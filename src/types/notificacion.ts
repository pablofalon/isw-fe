/** Estados de CU16: el destinatario ve como nuevas todas las que no están LEIDA. */
export type EstadoNotificacion = 'PENDIENTE' | 'ENVIADA' | 'FALLIDA' | 'LEIDA';

export interface Notificacion {
  id: number;
  mensaje: string;
  estado: EstadoNotificacion;
  fechaEnvio: string;
  fechaLectura: string | null;
  ticketId: number | null;
}
