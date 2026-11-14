import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/http';
import { historialTicket } from '../api/tickets';
import type { FiltrosHistorial, HistorialEstadoEntry } from '../types/ticket';
import { HistorialTimeline } from '../components/HistorialTimeline';
import './Seguimiento.css';

const ESTADOS: { codigo: FiltrosHistorial['estado']; nombre: string }[] = [
  { codigo: 'NUEVO', nombre: 'Nuevo' },
  { codigo: 'PENDIENTE_CORRECCION', nombre: 'Pendiente de corrección' },
  { codigo: 'VALIDADO', nombre: 'Validado' },
  { codigo: 'EN_ANALISIS', nombre: 'En análisis' },
  { codigo: 'RESUELTO', nombre: 'Resuelto' },
  { codigo: 'CERRADO', nombre: 'Cerrado' },
  { codigo: 'REABIERTO', nombre: 'Reabierto' },
];

const SIN_FILTROS: FiltrosHistorial = { estado: '', desde: '', hasta: '' };

/** CU12 - Historial completo de un ticket, el registro más reciente primero. */
export function HistorialTicketPage() {
  const { id } = useParams();
  const ticketId = Number(id);
  const { token } = useAuth();
  const [filtros, setFiltros] = useState<FiltrosHistorial>(SIN_FILTROS);
  const [historial, setHistorial] = useState<HistorialEstadoEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inexistente, setInexistente] = useState(false);

  const cargar = useCallback(() => {
    setHistorial(null);
    setError(null);
    historialTicket(token!, ticketId, filtros)
      .then(setHistorial)
      .catch((e: Error) => {
        if (e instanceof ApiError && e.status === 404) {
          setInexistente(true);
        } else {
          setError(e.message || 'No se pudo cargar el historial.');
        }
      });
  }, [token, ticketId, filtros]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cambiar<K extends keyof FiltrosHistorial>(campo: K, valor: FiltrosHistorial[K]) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  if (inexistente) {
    return (
      <div className="seguimiento-vacio">
        <p>El ticket no existe.</p>
        <Link to="/tickets/operativos">Volver al listado</Link>
      </div>
    );
  }

  const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(SIN_FILTROS);

  return (
    <div>
      <Link to={`/tickets/${ticketId}`} className="historial-ticket-volver">
        ← Volver al ticket
      </Link>
      <div className="seguimiento-header">
        <h2>Historial de TK-{String(ticketId).padStart(6, '0')}</h2>
      </div>

      <div className="seguimiento-filtros">
        <label>
          Estado
          <select value={filtros.estado} onChange={(e) => cambiar('estado', e.target.value as FiltrosHistorial['estado'])}>
            <option value="">Todos</option>
            {ESTADOS.map((estado) => (
              <option key={estado.codigo} value={estado.codigo}>
                {estado.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Desde
          <input type="date" value={filtros.desde} max={filtros.hasta || undefined} onChange={(e) => cambiar('desde', e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={filtros.hasta} min={filtros.desde || undefined} onChange={(e) => cambiar('hasta', e.target.value)} />
        </label>
        {hayFiltros && (
          <button type="button" className="seguimiento-boton" onClick={() => setFiltros(SIN_FILTROS)}>
            Limpiar filtros
          </button>
        )}
      </div>

      {error && (
        <p className="seguimiento-error">
          {error}{' '}
          <button type="button" className="seguimiento-boton" onClick={cargar}>
            Reintentar
          </button>
        </p>
      )}
      {historial === null && !error && <p>Cargando...</p>}

      {historial !== null && historial.length === 0 && (
        <div className="seguimiento-vacio">
          <p>No hay registros para los filtros seleccionados.</p>
          {hayFiltros && (
            <button type="button" className="seguimiento-boton" onClick={() => setFiltros(SIN_FILTROS)}>
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {historial !== null && historial.length > 0 && <HistorialTimeline historial={historial} />}
    </div>
  );
}
