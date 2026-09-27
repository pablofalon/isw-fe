import type { HistorialEstadoEntry } from '../types/ticket';
import './HistorialTimeline.css';

function actorLabel(entry: HistorialEstadoEntry): string {
  if (entry.actorUsuario) {
    return `${entry.actorUsuario.nombre} ${entry.actorUsuario.apellido}`;
  }
  if (entry.actorOperador) {
    return `${entry.actorOperador.nombre} ${entry.actorOperador.apellido} (operador)`;
  }
  return 'Sistema';
}

export function HistorialTimeline({ historial }: { historial: HistorialEstadoEntry[] }) {
  if (historial.length === 0) {
    return null;
  }

  return (
    <div className="historial-timeline">
      <h3>Historial</h3>
      <ul>
        {historial.map((entry, index) => (
          <li key={index}>
            <div className="historial-item-header">
              <strong>{entry.estado}</strong>
              <span>{new Date(entry.fechaCambio).toLocaleString()}</span>
            </div>
            <div className="historial-item-actor">{actorLabel(entry)}</div>
            {entry.observacion && <div className="historial-item-detalle">{entry.observacion}</div>}
            {entry.motivoCambio && <div className="historial-item-detalle">{entry.motivoCambio}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
