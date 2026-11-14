import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  actualizarEstado,
  agregarComentario,
  asignarOperador,
  asignarPrioridad,
  clasificarTicket,
  eliminarAdjunto,
  marcarIncompleto,
  obtenerTicket,
  reabrirTicket,
  reasignarOperador,
  reenviarTicket,
  registrarAccion,
  validarResolucion,
  validarTicket,
} from '../api/tickets';
import { listarCategorias, listarOperadores, listarPrioridades } from '../api/catalogos';
import type { Categoria, Comentario, OperadorResumen, Prioridad, Ticket, TicketEstadoCodigo } from '../types/ticket';
import { TicketEstadoBadge } from '../components/TicketEstadoBadge';
import { HistorialTimeline } from '../components/HistorialTimeline';
import { ReabrirModal } from '../components/ReabrirModal';
import { IconThumbDown, IconThumbUp, IconTrash } from '../components/icons';
import { ApiError } from '../api/http';
import './TicketDetallePage.css';

/** Estados en los que el titular puede agregar o quitar adjuntos (CU02). */
const ESTADOS_ADJUNTOS_EDITABLES: TicketEstadoCodigo[] = ['NUEVO', 'PENDIENTE_CORRECCION', 'EN_ANALISIS'];

function numeroTicket(id: number): string {
  return `TK-${String(id).padStart(6, '0')}`;
}

export function TicketDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { token, tienePermiso } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accionError, setAccionError] = useState<string | null>(null);
  const [modalReabrir, setModalReabrir] = useState(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [prioridades, setPrioridades] = useState<Prioridad[]>([]);
  const [operadores, setOperadores] = useState<OperadorResumen[]>([]);

  const ticketId = Number(id);
  const puedeClasificar = tienePermiso('TICKET_CLASIFICAR');
  const puedeAsignar = tienePermiso('TICKET_ASIGNAR');

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
    if (puedeClasificar) {
      listarCategorias(token!).then(setCategorias).catch(() => setCategorias([]));
      listarPrioridades(token!).then(setPrioridades).catch(() => setPrioridades([]));
    }
    if (puedeAsignar) {
      listarOperadores(token!).then(setOperadores).catch(() => setOperadores([]));
    }
  }, [token, puedeClasificar, puedeAsignar]);

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

  const puedeQuitarAdjuntos = tienePermiso('TICKET_CREAR') && ESTADOS_ADJUNTOS_EDITABLES.includes(ticket.estado);

  async function ejecutar(accion: () => Promise<Ticket>): Promise<boolean> {
    setAccionError(null);
    try {
      setTicket(await accion());
      return true;
    } catch (err) {
      setAccionError(err instanceof Error ? err.message : 'No se pudo completar la acción.');
      return false;
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
                      <span>
                        {adjunto.nombreArchivo}
                        {adjunto.operadorAutor && (
                          <span className="ticket-detalle-adjunto-evidencia">
                            evidencia de {adjunto.operadorAutor.nombre} {adjunto.operadorAutor.apellido}
                          </span>
                        )}
                      </span>
                      <span className="ticket-detalle-adjunto-info">
                        <span className="ticket-detalle-adjunto-tamanio">{(adjunto.tamano / 1024).toFixed(0)} KB</span>
                        {puedeQuitarAdjuntos && !adjunto.operadorAutor && (
                          <button
                            type="button"
                            className="ticket-detalle-adjunto-quitar"
                            aria-label={`Eliminar ${adjunto.nombreArchivo}`}
                            onClick={() => {
                              if (window.confirm(`¿Eliminar el archivo ${adjunto.nombreArchivo}?`)) {
                                ejecutar(() => eliminarAdjunto(token!, ticketId, adjunto.id));
                              }
                            }}
                          >
                            <IconTrash size={14} />
                          </button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ticket.resolucion && (
              <div className="ticket-detalle-solucion">
                <h4>Resolución del operador</h4>
                <p>{ticket.resolucion}</p>
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
          {tienePermiso('TICKET_REENVIAR') && ticket.estado === 'PENDIENTE_CORRECCION' && (
            <ReenviarPanel
              ticket={ticket}
              onReenviar={(titulo, descripcion) =>
                ejecutar(() => reenviarTicket(token!, ticketId, { titulo, descripcion }))
              }
            />
          )}

          {tienePermiso('TICKET_VALIDAR_RESOLUCION') && ticket.estado === 'CERRADO' && !ticket.validado && (
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
                {tienePermiso('TICKET_REABRIR_PROPIO') && (
                  <button
                    type="button"
                    className="ticket-detalle-validacion-rechazar"
                    onClick={() => setModalReabrir(true)}
                  >
                    <IconThumbDown size={22} />
                    <span>Rechazar resolución</span>
                    <small>El problema no fue resuelto</small>
                  </button>
                )}
              </div>
            </div>
          )}

          {tienePermiso('TICKET_VALIDAR_RESOLUCION') && ticket.estado === 'CERRADO' && ticket.validado && (
            <p className="ticket-detalle-info">Ya confirmaste esta resolución. Gracias por tu respuesta.</p>
          )}

          {/* ---- Panel Operador / Administrador ---- */}
          {puedeClasificar && (ticket.estado === 'NUEVO' || ticket.estado === 'PENDIENTE_CORRECCION') && (
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

          {puedeAsignar && ticket.estado === 'VALIDADO' && !ticket.operador && (
            <AsignacionPanel
              operadores={operadores}
              area={ticket.categoria?.area ?? null}
              onAsignar={(idOperador) => ejecutar(() => asignarOperador(token!, ticketId, idOperador))}
            />
          )}

          {(ticket.estado === 'EN_ANALISIS' || ticket.estado === 'REABIERTO') && ticket.operador && (
            <>
              {puedeAsignar && (
                <ReasignacionPanel
                  operadores={operadores.filter((o) => o.id !== ticket.operador!.id)}
                  onReasignar={(idOperadorNuevo, motivo) =>
                    ejecutar(() => reasignarOperador(token!, ticketId, idOperadorNuevo, motivo))
                  }
                />
              )}
            </>
          )}

          {ticket.puedeRegistrarAccion && (
            <RegistrarAccionPanel
              onRegistrar={(descripcion, archivo) => ejecutar(() => registrarAccion(token!, ticketId, descripcion, archivo))}
            />
          )}

          {ticket.transicionesDisponibles.length > 0 && (
            <ActualizarEstadoPanel
              key={ticket.estado}
              ticket={ticket}
              onConfirmar={(estado, observacion) => ejecutar(() => actualizarEstado(token!, ticketId, estado, observacion))}
            />
          )}

          <ComentariosPanel
            comentarios={ticket.comentarios}
            puedeComentar={ticket.puedeComentar}
            sinOperador={!ticket.operador && tienePermiso('TICKET_VER_PROPIOS')}
            onComentar={async (texto) => setTicket(await agregarComentario(token!, ticketId, texto))}
          />
        </div>

        <div className="ticket-detalle-aside">
          <HistorialTimeline historial={ticket.historialEstados} />
          {tienePermiso('TICKET_VER_TODOS') && (
            <Link to={`/tickets/${ticket.id}/historial`} className="historial-ticket-link">
              Ver historial completo
            </Link>
          )}
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

function mismaArea(a: string | null, b: string): boolean {
  return a !== null && a.trim().toLowerCase() === b.trim().toLowerCase();
}

function AsignacionPanel({
  operadores,
  area,
  onAsignar,
}: {
  operadores: OperadorResumen[];
  area: string | null;
  onAsignar: (idOperador: number) => void;
}) {
  const [idOperador, setIdOperador] = useState('');
  const [soloArea, setSoloArea] = useState(true);

  // Paso 4: se sugieren los operadores del área de la categoría. FA1: si no hay, se listan todos.
  const delArea = area ? operadores.filter((o) => mismaArea(o.area, area)) : [];
  const filtrar = area !== null && delArea.length > 0 && soloArea;
  const visibles = filtrar ? delArea : operadores;

  return (
    <div className="panel-operador">
      <h4>Asignar operador (CU13)</h4>
      {area && delArea.length === 0 && (
        <p className="panel-operador-hint">
          No hay operadores activos del área <strong>{area}</strong>. Se muestran todos los operadores activos.
        </p>
      )}
      {area && delArea.length > 0 && (
        <label className="panel-operador-check">
          <input
            type="checkbox"
            checked={soloArea}
            onChange={(e) => {
              setSoloArea(e.target.checked);
              setIdOperador('');
            }}
          />
          Solo operadores del área {area}
        </label>
      )}
      <div className="panel-operador-fila">
        <select value={idOperador} onChange={(e) => setIdOperador(e.target.value)}>
          <option value="">Seleccioná un operador</option>
          {visibles.map((o) => (
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

/** Qué pide cada estado destino de CU07 y a qué caso de uso corresponde. */
const DESTINOS_CU07: Partial<Record<TicketEstadoCodigo, { opcion: string; etiqueta: string; placeholder: string; boton: string }>> = {
  RESUELTO: {
    opcion: 'Resuelto (CU09)',
    etiqueta: 'Descripción de la resolución *',
    placeholder: 'Qué se hizo para resolver el reclamo',
    boton: 'Marcar como resuelto',
  },
  CERRADO: {
    opcion: 'Cerrado (CU17)',
    etiqueta: 'Solución aplicada *',
    placeholder: 'Solución definitiva que verá el usuario',
    boton: 'Cerrar ticket',
  },
  REABIERTO: {
    opcion: 'Reabierto (CU19)',
    etiqueta: 'Motivo de la reapertura *',
    placeholder: 'Por qué el problema persiste',
    boton: 'Reabrir ticket',
  },
};

function ActualizarEstadoPanel({
  ticket,
  onConfirmar,
}: {
  ticket: Ticket;
  onConfirmar: (estado: TicketEstadoCodigo, observacion: string) => Promise<boolean>;
}) {
  const unico = ticket.transicionesDisponibles.length === 1 ? ticket.transicionesDisponibles[0] : null;
  const [destino, setDestino] = useState<TicketEstadoCodigo | ''>(unico ?? '');
  // Al cerrar se propone la resolución de CU09 como punto de partida de la solución.
  const [texto, setTexto] = useState(unico === 'CERRADO' ? (ticket.resolucion ?? '') : '');
  const [error, setError] = useState<string | null>(null);

  const config = destino ? DESTINOS_CU07[destino] : undefined;
  // CU09 FA2: se advierte si no hay acciones registradas (CU08), sin bloquear.
  const sinAcciones = !ticket.historialEstados.some((h) => h.tipo === 'ACCION');

  function elegir(nuevo: TicketEstadoCodigo | '') {
    setDestino(nuevo);
    setError(null);
    setTexto(nuevo === 'CERRADO' ? (ticket.resolucion ?? '') : '');
  }

  async function confirmar() {
    if (!destino) return;
    if (!texto.trim()) {
      setError('Completá el campo antes de confirmar.');
      return;
    }
    if (destino === 'RESUELTO' && sinAcciones && !window.confirm('No hay acciones registradas sobre el ticket. ¿Resolverlo igual?')) {
      return;
    }
    setError(null);
    await onConfirmar(destino, texto.trim());
  }

  return (
    <div className="panel-operador">
      <h4>Actualizar estado (CU07)</h4>
      <p className="panel-operador-hint">
        Estado actual: <strong>{ticket.estadoNombre}</strong>
      </p>
      <label htmlFor="cu07-destino">Nuevo estado</label>
      <select id="cu07-destino" value={destino} onChange={(e) => elegir(e.target.value as TicketEstadoCodigo | '')}>
        {!unico && <option value="">Seleccioná el nuevo estado</option>}
        {ticket.transicionesDisponibles.map((estado) => (
          <option key={estado} value={estado}>
            {DESTINOS_CU07[estado]?.opcion ?? estado}
          </option>
        ))}
      </select>
      {config && (
        <>
          <label htmlFor="cu07-texto">{config.etiqueta}</label>
          <textarea
            id="cu07-texto"
            rows={3}
            value={texto}
            placeholder={config.placeholder}
            onChange={(e) => setTexto(e.target.value)}
          />
          {destino === 'RESUELTO' && sinAcciones && (
            <p className="panel-operador-aviso">Todavía no hay acciones registradas sobre este ticket (CU08).</p>
          )}
          {error && <p className="panel-operador-error">{error}</p>}
          <div className="panel-operador-fila">
            <button type="button" onClick={confirmar}>
              {config.boton}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function RegistrarAccionPanel({
  onRegistrar,
}: {
  onRegistrar: (descripcion: string, archivo: File | null) => Promise<boolean>;
}) {
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  async function registrar() {
    if (!descripcion.trim()) {
      setError('Describí la acción realizada.');
      return;
    }
    setError(null);
    setEnviando(true);
    const ok = await onRegistrar(descripcion.trim(), archivo);
    setEnviando(false);
    if (ok) {
      setDescripcion('');
      setArchivo(null);
      setInputKey((k) => k + 1);
    }
  }

  return (
    <div className="panel-operador">
      <h4>Registrar acción (CU08)</h4>
      <label htmlFor="cu08-descripcion">Acción realizada *</label>
      <textarea
        id="cu08-descripcion"
        rows={3}
        value={descripcion}
        placeholder="Intervención, tarea u observación sobre el ticket"
        onChange={(e) => setDescripcion(e.target.value)}
      />
      <label htmlFor="cu08-archivo">Evidencia (opcional)</label>
      <input
        key={inputKey}
        id="cu08-archivo"
        type="file"
        accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
        onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
      />
      {error && <p className="panel-operador-error">{error}</p>}
      <div className="panel-operador-fila">
        <button type="button" onClick={registrar} disabled={enviando}>
          {enviando ? 'Registrando...' : 'Registrar acción'}
        </button>
      </div>
    </div>
  );
}

const LARGO_MAXIMO_COMENTARIO = 2000;

function autorComentario(comentario: Comentario): string {
  if (comentario.operadorAutor) {
    return `${comentario.operadorAutor.nombre} ${comentario.operadorAutor.apellido} (operador)`;
  }
  return comentario.usuarioAutor ? `${comentario.usuarioAutor.nombre} ${comentario.usuarioAutor.apellido}` : 'Sistema';
}

function ComentariosPanel({
  comentarios,
  puedeComentar,
  sinOperador,
  onComentar,
}: {
  comentarios: Comentario[];
  puedeComentar: boolean;
  sinOperador: boolean;
  onComentar: (texto: string) => Promise<void>;
}) {
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    // FA1: vacío o más largo que el máximo.
    if (!texto.trim()) {
      setError('Escribí el comentario antes de enviarlo.');
      return;
    }
    if (texto.length > LARGO_MAXIMO_COMENTARIO) {
      setError(`El comentario no puede superar los ${LARGO_MAXIMO_COMENTARIO} caracteres.`);
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await onComentar(texto.trim());
      setTexto('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el comentario.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="ticket-detalle-card ticket-detalle-comentarios">
      <h4>Comentarios ({comentarios.length})</h4>
      {comentarios.length === 0 ? (
        <p className="ticket-detalle-comentarios-vacio">Todavía no hay comentarios.</p>
      ) : (
        <ul>
          {comentarios.map((c) => (
            <li key={c.id} className={c.operadorAutor ? 'comentario-operador' : 'comentario-usuario'}>
              <div className="comentario-header">
                <strong>{autorComentario(c)}</strong>
                <span>{new Date(c.fechaCreacion).toLocaleString()}</span>
              </div>
              <p>{c.contenido}</p>
            </li>
          ))}
        </ul>
      )}
      {puedeComentar && (
        <div className="ticket-detalle-comentar">
          <textarea
            rows={3}
            value={texto}
            placeholder="Escribí una consulta, aclaración o novedad"
            onChange={(e) => setTexto(e.target.value)}
          />
          <div className="ticket-detalle-comentar-pie">
            <span className={texto.length > LARGO_MAXIMO_COMENTARIO ? 'comentario-largo-excedido' : ''}>
              {texto.length}/{LARGO_MAXIMO_COMENTARIO}
            </span>
            <button type="button" onClick={enviar} disabled={enviando}>
              {enviando ? 'Enviando...' : 'Agregar comentario'}
            </button>
          </div>
          {sinOperador && (
            <p className="ticket-detalle-comentarios-vacio">
              Todavía no hay un operador asignado: el comentario queda registrado y lo va a ver quien tome el caso.
            </p>
          )}
          {error && <p className="ticket-detalle-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
