import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { consultarIndicadores } from '../api/reportes';
import type { Distribucion, Indicadores } from '../types/reporte';
import './Reportes.css';

/** Fecha local yyyy-mm-dd, el formato de un input type="date". */
function formatoDia(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function Distribuciones({ titulo, datos }: { titulo: string; datos: Distribucion[] }) {
  const maximo = Math.max(1, ...datos.map((d) => d.cantidad));
  return (
    <div className="dashboard-panel">
      <h3>{titulo}</h3>
      {datos.length === 0 ? (
        <p className="reportes-aviso">Sin datos.</p>
      ) : (
        <ul>
          {datos.map((dato) => (
            <li key={dato.clave}>
              <div className="dashboard-fila">
                <span>{dato.clave}</span>
                <strong>{dato.cantidad}</strong>
              </div>
              <div className="dashboard-barra">
                <div style={{ width: `${(dato.cantidad / maximo) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** CU21 - Indicadores de desempeño; por defecto, el mes en curso. */
export function DashboardPage() {
  const { token } = useAuth();
  const hoy = new Date();
  const [desde, setDesde] = useState(formatoDia(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
  const [hasta, setHasta] = useState(formatoDia(hoy));
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorPeriodo, setErrorPeriodo] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function cargar(desdeConsulta?: string, hastaConsulta?: string) {
    setCargando(true);
    setError(null);
    setErrorPeriodo(null);
    try {
      setIndicadores(await consultarIndicadores(token!, desdeConsulta, hastaConsulta));
    } catch (e) {
      // FA2: con un período inválido se conservan los indicadores anteriores.
      const mensaje = (e as Error).message || 'No se pudieron calcular los indicadores.';
      if (indicadores) {
        setErrorPeriodo(mensaje);
      } else {
        setError(mensaje);
      }
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // Solo al abrir la pantalla: después se actualiza con el botón.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function actualizar(evento: FormEvent) {
    evento.preventDefault();
    if (!desde || !hasta) {
      setErrorPeriodo('Indicá el período (desde y hasta).');
      return;
    }
    cargar(desde, hasta);
  }

  return (
    <div>
      <div className="reportes-header">
        <h2>Dashboard</h2>
      </div>

      <form className="reportes-form" onSubmit={actualizar}>
        <label>
          Desde
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <button type="submit" className="reportes-boton" disabled={cargando}>
          {cargando ? 'Calculando...' : 'Actualizar'}
        </button>
      </form>

      {errorPeriodo && <p className="reportes-error">{errorPeriodo}</p>}
      {error && (
        <p className="reportes-error">
          {error}{' '}
          <button type="button" className="reportes-boton reportes-boton-secundario" onClick={() => cargar()}>
            Reintentar
          </button>
        </p>
      )}
      {indicadores === null && !error && <p>Cargando...</p>}

      {indicadores !== null && (
        <>
          <p className="reportes-aviso">
            Tickets creados entre el {indicadores.desde} y el {indicadores.hasta}.
            {indicadores.sinDatos && ' No hay tickets en este período.'}
          </p>
          <div className="dashboard-resumen">
            <div className="dashboard-tarjeta">
              <span>Total de tickets</span>
              <strong>{indicadores.total}</strong>
            </div>
            <div className="dashboard-tarjeta">
              <span>Abiertos</span>
              <strong>{indicadores.abiertos}</strong>
            </div>
            <div className="dashboard-tarjeta">
              <span>Cerrados</span>
              <strong>{indicadores.cerrados}</strong>
            </div>
            <div className="dashboard-tarjeta">
              <span>Resolución promedio (h)</span>
              <strong>{indicadores.promedioResolucionHoras.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</strong>
            </div>
          </div>
          <div className="dashboard-paneles">
            <Distribuciones titulo="Por categoría" datos={indicadores.porCategoria} />
            <Distribuciones titulo="Por prioridad" datos={indicadores.porPrioridad} />
            <Distribuciones titulo="Incidencias recurrentes (top 3 categorías)" datos={indicadores.recurrentes} />
          </div>
        </>
      )}
    </div>
  );
}
