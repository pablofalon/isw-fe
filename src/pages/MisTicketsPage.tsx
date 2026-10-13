import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { misTickets } from '../api/tickets';
import type { NivelPrioridad, Ticket, TicketEstadoCodigo } from '../types/ticket';
import { TicketEstadoBadge } from '../components/TicketEstadoBadge';
import './MisTicketsPage.css';

const NIVELES: NivelPrioridad[] = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];

interface Filtros {
  estado: TicketEstadoCodigo | '';
  prioridad: NivelPrioridad | '';
  idCategoria: string;
  desde: string;
  hasta: string;
}

const SIN_FILTROS: Filtros = { estado: '', prioridad: '', idCategoria: '', desde: '', hasta: '' };

/** Fecha local yyyy-mm-dd, comparable con el valor de un input type="date". */
function dia(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function cumple(ticket: Ticket, filtros: Filtros): boolean {
  if (filtros.estado && ticket.estado !== filtros.estado) return false;
  if (filtros.prioridad && ticket.prioridad?.nivel !== filtros.prioridad) return false;
  if (filtros.idCategoria && String(ticket.categoria?.id) !== filtros.idCategoria) return false;
  const creado = dia(ticket.fechaCreacion);
  if (filtros.desde && creado < filtros.desde) return false;
  if (filtros.hasta && creado > filtros.hasta) return false;
  return true;
}

export function MisTicketsPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(SIN_FILTROS);

  useEffect(() => {
    misTickets(token!)
      .then(setTickets)
      .catch(() => setError('No se pudieron cargar los tickets.'));
  }, [token]);

  if (error) {
    return <p className="mis-tickets-error">{error}</p>;
  }

  if (tickets === null) {
    return <p>Cargando...</p>;
  }

  if (tickets.length === 0) {
    return (
      <div className="mis-tickets-empty">
        <p>Todavía no registraste ningún ticket.</p>
        <Link to="/tickets/nuevo">Registrar el primero</Link>
      </div>
    );
  }

  // Las opciones salen de los propios tickets: solo se ofrece lo que puede dar resultados.
  const estados = new Map(tickets.map((t) => [t.estado, t.estadoNombre]));
  const categorias = new Map(
    tickets.filter((t) => t.categoria).map((t) => [String(t.categoria!.id), t.categoria!.nombre]),
  );
  const filtrados = tickets.filter((t) => cumple(t, filtros));
  const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(SIN_FILTROS);

  function cambiar<K extends keyof Filtros>(campo: K, valor: Filtros[K]) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  return (
    <div>
      <div className="mis-tickets-header">
        <h2>Mis tickets</h2>
        <Link to="/tickets/nuevo" className="mis-tickets-nuevo">
          + Nuevo ticket
        </Link>
      </div>

      <div className="mis-tickets-filtros">
        <label>
          Estado
          <select value={filtros.estado} onChange={(e) => cambiar('estado', e.target.value as Filtros['estado'])}>
            <option value="">Todos</option>
            {[...estados].map(([codigo, nombre]) => (
              <option key={codigo} value={codigo}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Prioridad
          <select
            value={filtros.prioridad}
            onChange={(e) => cambiar('prioridad', e.target.value as Filtros['prioridad'])}
          >
            <option value="">Todas</option>
            {NIVELES.map((nivel) => (
              <option key={nivel} value={nivel}>
                {nivel}
              </option>
            ))}
          </select>
        </label>
        <label>
          Categoría
          <select value={filtros.idCategoria} onChange={(e) => cambiar('idCategoria', e.target.value)}>
            <option value="">Todas</option>
            {[...categorias].map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
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
          <button type="button" className="mis-tickets-limpiar" onClick={() => setFiltros(SIN_FILTROS)}>
            Limpiar filtros
          </button>
        )}
      </div>

      {filtrados.length === 0 ? (
        <div className="mis-tickets-empty">
          <p>Ningún ticket coincide con los filtros seleccionados.</p>
          <button type="button" className="mis-tickets-limpiar" onClick={() => setFiltros(SIN_FILTROS)}>
            Limpiar filtros
          </button>
        </div>
      ) : (
        <table className="mis-tickets-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Título</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Creado</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((ticket) => (
              <tr key={ticket.id}>
                <td>TK-{String(ticket.id).padStart(6, '0')}</td>
                <td>
                  <Link to={`/tickets/${ticket.id}`}>{ticket.titulo}</Link>
                </td>
                <td>{ticket.categoria?.nombre ?? '—'}</td>
                <td>
                  <TicketEstadoBadge estado={ticket.estado} />
                </td>
                <td>{ticket.prioridad?.nivel ?? '—'}</td>
                <td>{new Date(ticket.fechaCreacion).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
