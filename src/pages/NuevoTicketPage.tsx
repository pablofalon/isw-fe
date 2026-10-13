import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { adjuntarArchivo, limitesAdjuntos, registrarTicket } from '../api/tickets';
import { listarCategorias, listarPrioridades } from '../api/catalogos';
import { TicketForm } from '../components/TicketForm';
import { IconCheck } from '../components/icons';
import type { Categoria, LimitesAdjuntos, Prioridad, Ticket } from '../types/ticket';
import './NuevoTicketPage.css';

export function NuevoTicketPage() {
  const { token } = useAuth();
  const [creado, setCreado] = useState<Ticket | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [prioridades, setPrioridades] = useState<Prioridad[]>([]);
  const [limites, setLimites] = useState<LimitesAdjuntos | null>(null);

  useEffect(() => {
    listarCategorias(token!).then(setCategorias).catch(() => setCategorias([]));
    listarPrioridades(token!).then(setPrioridades).catch(() => setPrioridades([]));
    // Sin límites el formulario valida solo el formato; el backend rechaza igual lo que se pase.
    limitesAdjuntos(token!).then(setLimites).catch(() => setLimites(null));
  }, [token]);

  async function handleSubmit(input: {
    titulo: string;
    descripcion: string;
    idCategoria: number;
    idPrioridadSugerida?: number;
    adjuntos: File[];
  }) {
    const ticket = await registrarTicket(token!, {
      titulo: input.titulo,
      descripcion: input.descripcion,
      idCategoria: input.idCategoria,
      idPrioridadSugerida: input.idPrioridadSugerida,
    });

    for (const file of input.adjuntos) {
      await adjuntarArchivo(token!, ticket.id, file);
    }

    setCreado(ticket);
  }

  if (creado) {
    return (
      <div className="nuevo-ticket-confirmacion">
        <div className="nuevo-ticket-confirmacion-icono">
          <IconCheck size={28} />
        </div>
        <h2>¡Su reclamo fue registrado correctamente!</h2>
        <p className="nuevo-ticket-confirmacion-subtitulo">Se generó el siguiente número de ticket:</p>
        <p className="nuevo-ticket-confirmacion-numero">TK-{String(creado.id).padStart(6, '0')}</p>
        <span className="estado-badge estado-nuevo">Estado: NUEVO</span>

        <dl className="nuevo-ticket-confirmacion-datos">
          <div>
            <dt>Fecha y hora de creación</dt>
            <dd>{new Date(creado.fechaCreacion).toLocaleString()}</dd>
          </div>
          <div>
            <dt>Resumen</dt>
            <dd>{creado.titulo}</dd>
          </div>
        </dl>

        <p className="nuevo-ticket-confirmacion-info">
          En breve nuestro equipo de operadores tomará su reclamo.
        </p>

        <div className="nuevo-ticket-confirmacion-acciones">
          <Link to="/" className="nuevo-ticket-confirmacion-ver">
            Ver mis tickets
          </Link>
          <button type="button" onClick={() => setCreado(null)}>
            Crear nuevo ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Nuevo Ticket</h2>
      <p className="nuevo-ticket-subtitulo">Completá el formulario para registrar tu reclamo.</p>
      <TicketForm categorias={categorias} prioridades={prioridades} limites={limites} onSubmit={handleSubmit} />
    </div>
  );
}
