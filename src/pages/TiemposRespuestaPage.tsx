import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { monitorearTiempos } from '../api/tickets';
import { listarCategorias, listarPrioridades } from '../api/catalogos';
import type {
  Categoria,
  CumplimientoTiempo,
  FiltrosTiempos,
  MonitoreoTiempos,
  Prioridad,
  VistaTickets,
} from '../types/ticket';
import './Seguimiento.css';

const CUMPLIMIENTOS: { codigo: CumplimientoTiempo; nombre: string }[] = [
  { codigo: 'VENCIDO', nombre: 'Vencido' },
  { codigo: 'PROXIMO_A_VENCER', nombre: 'Próximo a vencer' },
  { codigo: 'EN_PLAZO', nombre: 'En plazo' },
  { codigo: 'SIN_PRIORIDAD', nombre: 'Sin prioridad' },
];

const NOMBRE_CUMPLIMIENTO = Object.fromEntries(CUMPLIMIENTOS.map((c) => [c.codigo, c.nombre])) as Record<
  CumplimientoTiempo,
  string
>;

const SIN_FILTROS: FiltrosTiempos = { idPrioridad: '', idCategoria: '', cumplimiento: '', desde: '', hasta: '' };

function formatearHoras(horas: number): string {
  return horas.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

/** CU11 - Monitorear tiempos de respuesta frente al objetivo de cada prioridad. */
export function TiemposRespuestaPage() {
  const { token } = useAuth();
  const [alcance, setAlcance] = useState<VistaTickets>('MIS_TICKETS');
  const [filtros, setFiltros] = useState<FiltrosTiempos>(SIN_FILTROS);
  const [monitoreo, setMonitoreo] = useState<MonitoreoTiempos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [prioridades, setPrioridades] = useState<Prioridad[]>([]);

  useEffect(() => {
    listarCategorias(token!).then(setCategorias).catch(() => setCategorias([]));
    listarPrioridades(token!).then(setPrioridades).catch(() => setPrioridades([]));
  }, [token]);

  const cargar = useCallback(() => {
    setMonitoreo(null);
    setError(null);
    monitorearTiempos(token!, alcance, filtros)
      .then(setMonitoreo)
      .catch((e: Error) => setError(e.message || 'No se pudieron calcular los tiempos.'));
  }, [token, alcance, filtros]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cambiar<K extends keyof FiltrosTiempos>(campo: K, valor: FiltrosTiempos[K]) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(SIN_FILTROS);

  return (
    <div>
      <div className="seguimiento-header">
        <h2>Tiempos de respuesta</h2>
        <div className="seguimiento-vistas">
          <button
            type="button"
            className={`seguimiento-vista${alcance === 'MIS_TICKETS' ? ' seguimiento-vista-activa' : ''}`}
            onClick={() => setAlcance('MIS_TICKETS')}
          >
            Mis tickets
          </button>
          <button
            type="button"
            className={`seguimiento-vista${alcance === 'TODOS' ? ' seguimiento-vista-activa' : ''}`}
            onClick={() => setAlcance('TODOS')}
          >
            Todos los tickets
          </button>
        </div>
      </div>

      <div className="seguimiento-filtros">
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
        <label>
          Cumplimiento
          <select
            value={filtros.cumplimiento}
            onChange={(e) => cambiar('cumplimiento', e.target.value as FiltrosTiempos['cumplimiento'])}
          >
            <option value="">Todos</option>
            {CUMPLIMIENTOS.map((cumplimiento) => (
              <option key={cumplimiento.codigo} value={cumplimiento.codigo}>
                {cumplimiento.nombre}
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
      {monitoreo === null && !error && <p>Cargando...</p>}

      {monitoreo !== null && (
        <>
          <div className="seguimiento-resumen">
            <div className="seguimiento-tarjeta">
              <span>En plazo</span>
              <strong>{monitoreo.resumen.enPlazo}</strong>
            </div>
            <div className="seguimiento-tarjeta">
              <span>Próximos a vencer</span>
              <strong>{monitoreo.resumen.proximosAVencer}</strong>
            </div>
            <div className="seguimiento-tarjeta">
              <span>Vencidos</span>
              <strong>{monitoreo.resumen.vencidos}</strong>
            </div>
            <div className="seguimiento-tarjeta">
              <span>Sin prioridad</span>
              <strong>{monitoreo.resumen.sinPrioridad}</strong>
            </div>
            <div className="seguimiento-tarjeta">
              <span>Promedio (h)</span>
              <strong>{formatearHoras(monitoreo.resumen.promedioHoras)}</strong>
            </div>
          </div>

          {monitoreo.tickets.length === 0 ? (
            <div className="seguimiento-vacio">
              <p>{hayFiltros ? 'Ningún ticket coincide con los filtros seleccionados.' : 'No hay tickets operativos para monitorear.'}</p>
              {hayFiltros && (
                <button type="button" className="seguimiento-boton" onClick={() => setFiltros(SIN_FILTROS)}>
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <table className="seguimiento-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Título</th>
                  <th>Prioridad</th>
                  <th>Objetivo (h)</th>
                  <th>Transcurrido (h)</th>
                  <th>Consumido</th>
                  <th>Cumplimiento</th>
                </tr>
              </thead>
              <tbody>
                {monitoreo.tickets.map((item) => (
                  <tr key={item.ticket.id}>
                    <td>TK-{String(item.ticket.id).padStart(6, '0')}</td>
                    <td>
                      <Link to={`/tickets/${item.ticket.id}`}>{item.ticket.titulo}</Link>
                      {item.cumplimiento === 'SIN_PRIORIDAD' && <div>Debe priorizarse</div>}
                    </td>
                    <td>{item.ticket.prioridad?.nivel ?? 'Sin prioridad'}</td>
                    <td>{item.horasObjetivo ?? '—'}</td>
                    <td>
                      {formatearHoras(item.horasTranscurridas)} {item.atendido ? '(hasta la primera atención)' : '(sin atender)'}
                    </td>
                    <td>{item.porcentajeConsumido !== null ? `${formatearHoras(item.porcentajeConsumido)} %` : '—'}</td>
                    <td>
                      <span className={`cumplimiento-badge cumplimiento-${item.cumplimiento.toLowerCase()}`}>
                        {NOMBRE_CUMPLIMIENTO[item.cumplimiento]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
