import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { listarOperativos } from '../api/tickets';
import { listarCategorias, listarOperadores, listarPrioridades } from '../api/catalogos';
import type {
  Categoria,
  FiltrosOperativos,
  OperadorResumen,
  Prioridad,
  Ticket,
  TicketEstadoCodigo,
  VistaTickets,
} from '../types/ticket';
import { TicketEstadoBadge } from '../components/TicketEstadoBadge';
import './Seguimiento.css';

const ESTADOS: { codigo: TicketEstadoCodigo; nombre: string }[] = [
  { codigo: 'NUEVO', nombre: 'Nuevo' },
  { codigo: 'PENDIENTE_CORRECCION', nombre: 'Pendiente de corrección' },
  { codigo: 'VALIDADO', nombre: 'Validado' },
  { codigo: 'EN_ANALISIS', nombre: 'En análisis' },
  { codigo: 'RESUELTO', nombre: 'Resuelto' },
  { codigo: 'REABIERTO', nombre: 'Reabierto' },
  { codigo: 'CERRADO', nombre: 'Cerrado (incluye finalizados)' },
];

const SIN_FILTROS: FiltrosOperativos = {
  estado: '',
  idPrioridad: '',
  idCategoria: '',
  idOperador: '',
  desde: '',
  hasta: '',
  numero: '',
};

/** CU10 - Consultar tickets operativos: los asignados al operador o todos, con filtros. */
export function OperativosPage() {
  const { token } = useAuth();
  const [vista, setVista] = useState<VistaTickets>('MIS_TICKETS');
  const [filtros, setFiltros] = useState<FiltrosOperativos>(SIN_FILTROS);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [prioridades, setPrioridades] = useState<Prioridad[]>([]);
  const [operadores, setOperadores] = useState<OperadorResumen[]>([]);

  useEffect(() => {
    listarCategorias(token!).then(setCategorias).catch(() => setCategorias([]));
    listarPrioridades(token!).then(setPrioridades).catch(() => setPrioridades([]));
    listarOperadores(token!).then(setOperadores).catch(() => setOperadores([]));
  }, [token]);

  const cargar = useCallback(() => {
    setTickets(null);
    setError(null);
    listarOperativos(token!, vista, filtros)
      .then(setTickets)
      .catch((e: Error) => setError(e.message || 'No se pudo cargar el listado.'));
  }, [token, vista, filtros]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cambiar<K extends keyof FiltrosOperativos>(campo: K, valor: FiltrosOperativos[K]) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(SIN_FILTROS);

  return (
    <div>
      <div className="seguimiento-header">
        <h2>Tickets operativos</h2>
        <div className="seguimiento-vistas">
          <button
            type="button"
            className={`seguimiento-vista${vista === 'MIS_TICKETS' ? ' seguimiento-vista-activa' : ''}`}
            onClick={() => setVista('MIS_TICKETS')}
          >
            Mis tickets
          </button>
          <button
            type="button"
            className={`seguimiento-vista${vista === 'TODOS' ? ' seguimiento-vista-activa' : ''}`}
            onClick={() => setVista('TODOS')}
          >
            Todos los tickets
          </button>
        </div>
      </div>

      <div className="seguimiento-filtros">
        <label>
          Número
          <input
            type="text"
            placeholder="TK-000034"
            value={filtros.numero}
            onChange={(e) => cambiar('numero', e.target.value)}
          />
        </label>
        <label>
          Estado
          <select value={filtros.estado} onChange={(e) => cambiar('estado', e.target.value as FiltrosOperativos['estado'])}>
            <option value="">Operativos</option>
            {ESTADOS.map((estado) => (
              <option key={estado.codigo} value={estado.codigo}>
                {estado.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Prioridad
          <select value={filtros.idPrioridad} onChange={(e) => cambiar('idPrioridad', e.target.value)}>
            <option value="">Todas</option>
            {prioridades.map((prioridad) => (
              <option key={prioridad.id} value={prioridad.id}>
                {prioridad.nivel}
              </option>
            ))}
          </select>
        </label>
        <label>
          Categoría
          <select value={filtros.idCategoria} onChange={(e) => cambiar('idCategoria', e.target.value)}>
            <option value="">Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>
        {vista === 'TODOS' && (
          <label>
            Operador
            <select value={filtros.idOperador} onChange={(e) => cambiar('idOperador', e.target.value)}>
              <option value="">Todos</option>
              {operadores.map((operador) => (
                <option key={operador.id} value={operador.id}>
                  {operador.nombre} {operador.apellido}
                </option>
              ))}
            </select>
          </label>
        )}
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
      {tickets === null && !error && <p>Cargando...</p>}

      {tickets !== null && tickets.length === 0 && (
        <div className="seguimiento-vacio">
          <p>
            {hayFiltros
              ? 'Ningún ticket coincide con los filtros seleccionados.'
              : vista === 'MIS_TICKETS'
                ? 'No tenés tickets operativos asignados.'
                : 'No hay tickets operativos.'}
          </p>
          {hayFiltros && (
            <button type="button" className="seguimiento-boton" onClick={() => setFiltros(SIN_FILTROS)}>
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {tickets !== null && tickets.length > 0 && (
        <table className="seguimiento-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Título</th>
              <th>Usuario</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Operador</th>
              <th>Última actualización</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>TK-{String(ticket.id).padStart(6, '0')}</td>
                <td>
                  <Link to={`/tickets/${ticket.id}`}>{ticket.titulo}</Link>
                </td>
                <td>
                  {ticket.usuario.nombre} {ticket.usuario.apellido}
                </td>
                <td>{ticket.categoria?.nombre ?? '—'}</td>
                <td>
                  <TicketEstadoBadge estado={ticket.estado} />
                </td>
                <td>{ticket.prioridad?.nivel ?? '—'}</td>
                <td>{ticket.operador ? `${ticket.operador.nombre} ${ticket.operador.apellido}` : 'Sin asignar'}</td>
                <td>{new Date(ticket.fechaUltimaActualizacion ?? ticket.fechaCreacion).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
