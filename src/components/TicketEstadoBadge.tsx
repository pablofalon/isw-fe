import type { TicketEstadoCodigo } from '../types/ticket';
import './TicketEstadoBadge.css';

const LABELS: Record<TicketEstadoCodigo, string> = {
  NUEVO: 'Nuevo',
  PENDIENTE_CORRECCION: 'Pendiente de corrección',
  VALIDADO: 'Validado',
  EN_ANALISIS: 'En análisis',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
  REABIERTO: 'Reabierto',
};

export function TicketEstadoBadge({ estado }: { estado: TicketEstadoCodigo }) {
  return <span className={`estado-badge estado-${estado.toLowerCase()}`}>{LABELS[estado]}</span>;
}
