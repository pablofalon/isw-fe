import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { misTickets } from '../api/tickets';
import type { Ticket } from '../types/ticket';
import { TicketEstadoBadge } from '../components/TicketEstadoBadge';
import './MisTicketsPage.css';

export function MisTicketsPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      <div className="mis-tickets-header">
        <h2>Mis tickets</h2>
        <Link to="/tickets/nuevo" className="mis-tickets-nuevo">
          + Nuevo ticket
        </Link>
      </div>
      <table className="mis-tickets-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Categoría</th>
            <th>Estado</th>
            <th>Creado</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>
                <Link to={`/tickets/${ticket.id}`}>{ticket.titulo}</Link>
              </td>
              <td>{ticket.categoria?.nombre ?? '—'}</td>
              <td>
                <TicketEstadoBadge estado={ticket.estado} />
              </td>
              <td>{new Date(ticket.fechaCreacion).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
