import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  asignarOperador,
  asignarPrioridad,
  cerrarTicket,
  clasificarTicket,
  marcarIncompleto,
  marcarResuelto,
  obtenerTicket,
  reabrirTicket,
  reasignarOperador,
  reenviarTicket,
  validarResolucion,
  validarTicket,
} from '../api/tickets';
import { listarCategorias, listarOperadores, listarPrioridades } from '../api/catalogos';
import type { Categoria, OperadorResumen, Prioridad, Ticket } from '../types/ticket';
import { TicketEstadoBadge } from '../components/TicketEstadoBadge';
import { HistorialTimeline } from '../components/HistorialTimeline';
import { TicketAccionConTexto } from '../components/TicketAccionConTexto';
import { ReabrirModal } from '../components/ReabrirModal';
import { IconThumbDown, IconThumbUp } from '../components/icons';
import { ApiError } from '../api/http';
import './TicketDetallePage.css';

function numeroTicket(id: number): string {
  return `TK-${String(id).padStart(6, '0')}`;
}

export function TicketDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { token, rol } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accionError, setAccionError] = useState<string | null>(null);
  const [modalReabrir, setModalReabrir] = useState(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [prioridades, setPrioridades] = useState<Prioridad[]>([]);
  const [operadores, setOperadores] = useState<OperadorResumen[]>([]);

  const ticketId = Number(id);
  const esOperativo = rol === 'OPERADOR' || rol === 'ADMINISTRADOR';
  const esUsuario = rol === 'USUARIO';

  function cargar() {
    obtenerTicket(token!, ticketId)
      .then(setTicket)
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
          setError('No se encontró el ticket o no tenés acceso a él.');
        } else {
          setError('No se pudo cargar el ticket.');
        }
      });
  }

  useEffect(cargar, [token, ticketId]);

  useEffect(() => {
    if (!esOperativo) return;
    listarCategorias(token!).then(setCategorias).catch(() => setCategorias([]));
    listarPrioridades(token!).then(setPrioridades).catch(() => setPrioridades([]));
    listarOperadores(token!).then(setOperadores).catch(() => setOperadores([]));
  }, [token, esOperativo]);

  if (error) {
    return (
      <div>
        <p className="ticket-detalle-error">{error}</p>
        <Link to="/">Volver</Link>
      </div>
    );
  }

  if (!ticket) {
    return <p>Cargando...</p>;
  }

  async function ejecutar(accion: () => Promise<Ticket>) {
    setAccionError(null);
    try {
      setTicket(await accion());
    } catch (err) {
      setAccionError(err instanceof Error ? err.message : 'No se pudo completar la acción.');
    }
  }

  async function reabrir(motivo: string) {
    setTicket(await reabrirTicket(token!, ticketId, motivo));
    setModalReabrir(false);
  }

  return (
    <div className="ticket-detalle">
      <Link to="/" className="ticket-detalle-back">
        ← Volver
      </Link>

      <div className="ticket-detalle-toolbar">
        <div className="ticket-detalle-header">
          <h2>Ticket #{numeroTicket(ticket.id)}</h2>
          <TicketEstadoBadge estado={ticket.estado} />
        </div>
        {esOperativo && ticket.operador && ticket.estado === 'CERRADO' && (
          <button type="button" className="ticket-detalle-reabrir-btn" onClick={() => setModalReabrir(true)}>
            Reabrir Ticket
          </button>
        )}
      </div>

      <div className="ticket-detalle-layout">
        <div className="ticket-detalle-main">
          <div className="ticket-detalle-card">
            <h3 className="ticket-detalle-titulo">{ticket.titulo}</h3>
            <p className="ticket-detalle-meta">
              Creado el {new Date(ticket.fechaCreacion).toLocaleString()} por {ticket.usuario.nombre}{' '}
              {ticket.usuario.apellido}
              {ticket.categoria && <> · Categoría: {ticket.categoria.nombre}</>}
              {ticket.prioridad ? (
                <> · Prioridad: {ticket.prioridad.nivel}</>
              ) : (
                ticket.prioridadSugerida && <> · Prioridad sugerida por el usuario: {ticket.prioridadSugerida.nivel}</>
              )}
              {ticket.operador && (
                <>
                  {' '}
                  · Operador: {ticket.operador.nombre} {ticket.operador.apellido}
                </>
              )}
            </p>

            <h4>Descripción del problema</h4>
            <p className="ticket-detalle-descripcion">{ticket.descripcion}</p>

            {ticket.adjuntos.length > 0 && (
              <div className="ticket-detalle-adjuntos">
                <h4>Adjuntos</h4>
                <ul>
                  {ticket.adjuntos.map((adjunto) => (
                    <li key={adjunto.id}>
                      {adjunto.nombreArchivo}
                      <span className="ticket-detalle-adjunto-tamanio">{(adjunto.tamano / 1024).toFixed(0)} KB</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ticket.motivoCierre && (
              <div className="ticket-detalle-solucion">
                <h4>Solución aplicada</h4>
                <p>{ticket.motivoCierre}</p>
              </div>
            )}

            {ticket.motivoReapertura && (
              <div className="ticket-detalle-solucion">
                <h4>Motivo de la última reapertura</h4>
                <p>{ticket.motivoReapertura}</p>
              </div>
            )}
          </div>

          {accionError && <p className="ticket-detalle-error">{accionError}</p>}

          {/* ---- Panel Usuario ---- */}
          {esUsuario && ticket.estado === 'PENDIENTE_CORRECCION' && (
            <ReenviarPanel
              ticket={ticket}
              onReenviar={(titulo, descripcion) =>
                ejecutar(() => reenviarTicket(token!, ticketId, { titulo, descripcion }))
              }
            />
          )}

          {esUsuario && ticket.estado === 'CERRADO' && !ticket.validado && (
            <div className="ticket-detalle-validacion">
              <p className="ticket-detalle-validacion-pregunta">¿La solución brindada resolvió su problema?</p>
              <div className="ticket-detalle-validacion-opciones">
                <button
                  type="button"
                  className="ticket-detalle-validacion-confirmar"
                  onClick={() => ejecutar(() => validarResolucion(token!, ticketId))}
                >
                  <IconThumbUp size={22} />
                  <span>Confirmar resolución</span>
                  <small>El problema fue resuelto</small>
                </button>
                <button
                  type="button"
                  className="ticket-detalle-validacion-rechazar"
                  onClick={() => setModalReabrir(true)}
                >
                  <IconThumbDown size={22} />
                  <span>Rechazar resolución</span>
                  <small>El problema no fue resuelto</small>
                </button>
              </div>
            </div>
          )}

          {esUsuario && ticket.estado === 'CERRADO' && ticket.validado && (
            <p className="ticket-detalle-info">Ya confirmaste esta resolución. Gracias por tu respuesta.</p>
          )}

          {/* ---- Panel Operador / Administrador ---- */}
          {esOperativo && (ticket.estado === 'NUEVO' || ticket.estado === 'PENDIENTE_CORRECCION') && (
            <ClasificacionPanel
              ticket={ticket}
              categorias={categorias}
              prioridades={prioridades}
              onClasificar={(idCategoria) => ejecutar(() => clasificarTicket(token!, ticketId, idCategoria))}
              onPriorizar={(idPrioridad) => ejecutar(() => asignarPrioridad(token!, ticketId, idPrioridad))}
              onValidar={() => ejecutar(() => validarTicket(token!, ticketId))}
              onMarcarIncompleto={(observacion) =>
                ejecutar(() => marcarIncompleto(token!, ticketId, observacion))
              }
            />
          )}

          {esOperativo && ticket.estado === 'VALIDADO' && !ticket.operador && (
            <AsignacionPanel
              operadores={operadores}
              onAsignar={(idOperador) => ejecutar(() => asignarOperador(token!, ticketId, idOperador))}
            />
          )}

          {esOperativo && (ticket.estado === 'EN_ANALISIS' || ticket.estado === 'REABIERTO') && ticket.operador && (
            <>
              <ReasignacionPanel
                operadores={operadores.filter((o) => o.id !== ticket.operador!.id)}
                onReasignar={(idOperadorNuevo, motivo) =>
                  ejecutar(() => reasignarOperador(token!, ticketId, idOperadorNuevo, motivo))
                }
              />
              <div className="ticket-detalle-accion-simple">
                <button onClick={() => ejecutar(() => marcarResuelto(token!, ticketId))}>Marcar como resuelto</button>
              </div>
            </>
          )}

          {esOperativo && ticket.estado === 'RESUELTO' && (
            <TicketAccionConTexto
              titulo="Cerrar ticket"
              placeholder="Describí la solución aplicada"
              etiquetaBoton="Cerrar ticket"
              onConfirmar={async (solucion) => setTicket(await cerrarTicket(token!, ticketId, solucion))}
            />
          )}
        </div>

        <div className="ticket-detalle-aside">
          <HistorialTimeline historial={ticket.historialEstados} />
        </div>
      </div>

      {modalReabrir && (
        <ReabrirModal ticketNumero={numeroTicket(ticket.id)} onCancelar={() => setModalReabrir(false)} onConfirmar={reabrir} />
      )}
    </div>
  );
}

function ClasificacionPanel({
  ticket,
  categorias,
  prioridades,
  onClasificar,
  onPriorizar,
  onValidar,
  onMarcarIncompleto,
}: {
  ticket: Ticket;
  categorias: Categoria[];
  prioridades: Prioridad[];
  onClasificar: (idCategoria: number) => void;
  onPriorizar: (idPrioridad: number) => void;
  onValidar: () => void;
  onMarcarIncompleto: (observacion: string) => void;
}) {
  const [idCategoria, setIdCategoria] = useState(String(ticket.categoria?.id ?? ''));
  const [idPrioridad, setIdPrioridad] = useState(String(ticket.prioridad?.id ?? ''));
  const [observacion, setObservacion] = useState('');

  return (
    <div className="panel-operador">
      <h4>Clasificación y priorización (CU04 / CU05 / CU06)</h4>

      <label>Categoría</label>
      <div className="panel-operador-fila">
        <select value={idCategoria} onChange={(e) => setIdCategoria(e.target.value)}>
          <option value="">Seleccioná una categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <button type="button" disabled={!idCategoria} onClick={() => onClasificar(Number(idCategoria))}>
          Guardar categoría
        </button>
      </div>

      <label>Prioridad</label>
      {ticket.prioridadSugerida && (
        <p className="panel-operador-hint">
          Prioridad sugerida por el usuario: <strong>{ticket.prioridadSugerida.nivel}</strong>
        </p>
      )}
      <div className="panel-operador-fila">
        <select value={idPrioridad} onChange={(e) => setIdPrioridad(e.target.value)} disabled={!ticket.categoria}>
          <option value="">Seleccioná una prioridad</option>
          {prioridades.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nivel}
            </option>
          ))}
        </select>
        <button type="button" disabled={!idPrioridad || !ticket.categoria} onClick={() => onPriorizar(Number(idPrioridad))}>
          Guardar prioridad
        </button>
      </div>

      <div className="panel-operador-validacion">
        <button
          type="button"
          className="panel-operador-validar"
          disabled={!ticket.categoria || !ticket.prioridad}
          onClick={onValidar}
        >
          Validar ticket
        </button>
      </div>

      <label>Marcar como incompleto</label>
      <div className="panel-operador-fila">
        <input
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          placeholder="¿Qué información falta o es inconsistente?"
        />
        <button
          type="button"
          className="panel-operador-incompleto"
          disabled={!observacion.trim()}
          onClick={() => onMarcarIncompleto(observacion)}
        >
          Marcar incompleto
        </button>
      </div>
    </div>
  );
}

function AsignacionPanel({
  operadores,
  onAsignar,
}: {
  operadores: OperadorResumen[];
  onAsignar: (idOperador: number) => void;
}) {
  const [idOperador, setIdOperador] = useState('');

  return (
    <div className="panel-operador">
      <h4>Asignar operador (CU13)</h4>
      <div className="panel-operador-fila">
        <select value={idOperador} onChange={(e) => setIdOperador(e.target.value)}>
          <option value="">Seleccioná un operador</option>
          {operadores.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre} {o.apellido} {o.area ? `— ${o.area}` : ''}
            </option>
          ))}
        </select>
        <button type="button" disabled={!idOperador} onClick={() => onAsignar(Number(idOperador))}>
          Asignar ticket
        </button>
      </div>
    </div>
  );
}

function ReasignacionPanel({
  operadores,
  onReasignar,
}: {
  operadores: OperadorResumen[];
  onReasignar: (idOperadorNuevo: number, motivo: string) => void;
}) {
  const [idOperador, setIdOperador] = useState('');
  const [motivo, setMotivo] = useState('');

  return (
    <div className="panel-operador">
      <h4>Reasignar operador (CU14)</h4>
      <div className="panel-operador-fila">
        <select value={idOperador} onChange={(e) => setIdOperador(e.target.value)}>
          <option value="">Nuevo operador responsable</option>
          {operadores.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre} {o.apellido} {o.area ? `— ${o.area}` : ''}
            </option>
          ))}
        </select>
      </div>
      <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de la reasignación" />
      <button
        type="button"
        disabled={!idOperador || !motivo.trim()}
        onClick={() => onReasignar(Number(idOperador), motivo)}
      >
        Reasignar ticket
      </button>
    </div>
  );
}

function ReenviarPanel({
  ticket,
  onReenviar,
}: {
  ticket: Ticket;
  onReenviar: (titulo: string, descripcion: string) => void;
}) {
  const [titulo, setTitulo] = useState(ticket.titulo);
  const [descripcion, setDescripcion] = useState(ticket.descripcion);

  return (
    <div className="panel-operador">
      <h4>Tu ticket necesita corrección</h4>
      <p>Corregí la información faltante o inconsistente y reenvialo para que sea revisado nuevamente.</p>
      <label>Título</label>
      <input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      <label>Descripción</label>
      <textarea rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      <button type="button" onClick={() => onReenviar(titulo, descripcion)}>
        Reenviar ticket
      </button>
    </div>
  );
}
