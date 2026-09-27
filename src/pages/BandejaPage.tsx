import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { asignadosAMi, pendientesClasificacion, sinAsignar } from '../api/tickets';
import type { Ticket } from '../types/ticket';
import { TicketEstadoBadge } from '../components/TicketEstadoBadge';
import './BandejaPage.css';

type Tab = 'pendientes' | 'sin-asignar' | 'mios';

const TABS: { id: Tab; label: string }[] = [
  { id: 'pendientes', label: 'Pendientes de clasificación' },
  { id: 'sin-asignar', label: 'Sin asignar' },
  { id: 'mios', label: 'Asignados a mí' },
];

export function BandejaPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('pendientes');
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTickets(null);
    setError(null);
    const cargar = tab === 'pendientes' ? pendientesClasificacion : tab === 'sin-asignar' ? sinAsignar : asignadosAMi;
    cargar(token!)
      .then(setTickets)
      .catch(() => setError('No se pudo cargar el listado.'));
  }, [token, tab]);

  return (
    <div>
      <h2>Bandeja de operador</h2>
      <div className="bandeja-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`bandeja-tab${tab === t.id ? ' bandeja-tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="bandeja-error">{error}</p>}
      {tickets === null && !error && <p>Cargando...</p>}
      {tickets !== null && tickets.length === 0 && <p className="bandeja-vacio">No hay tickets en esta bandeja.</p>}

      {tickets !== null && tickets.length > 0 && (
        <table className="bandeja-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Título</th>
              <th>Categoría</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Usuario</th>
              <th>Creado</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>
                  <Link to={`/tickets/${ticket.id}`}>#{ticket.id}</Link>
                </td>
                <td>{ticket.titulo}</td>
                <td>{ticket.categoria?.nombre ?? '—'}</td>
                <td>{ticket.prioridad?.nivel ?? ticket.prioridadSugerida?.nivel ?? '—'}</td>
                <td>
                  <TicketEstadoBadge estado={ticket.estado} />
                </td>
                <td>
                  {ticket.usuario.nombre} {ticket.usuario.apellido}
                </td>
                <td>{new Date(ticket.fechaCreacion).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
