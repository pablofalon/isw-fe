import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { exportarReporte, generarReporte } from '../api/reportes';
import { listarCategorias, listarOperadores, listarPrioridades } from '../api/catalogos';
import type { Categoria, OperadorResumen, Prioridad, TicketEstadoCodigo } from '../types/ticket';
import type { ConsultaReporte, CriterioAgrupamiento, FormatoExportacion, Reporte } from '../types/reporte';
import { IconFile } from '../components/icons';
import './Reportes.css';

const CRITERIOS: { codigo: CriterioAgrupamiento; nombre: string }[] = [
  { codigo: 'CATEGORIA', nombre: 'Categoría' },
  { codigo: 'PRIORIDAD', nombre: 'Prioridad' },
  { codigo: 'ESTADO', nombre: 'Estado' },
  { codigo: 'OPERADOR', nombre: 'Operador asignado' },
];

const ESTADOS: { codigo: TicketEstadoCodigo; nombre: string }[] = [
  { codigo: 'NUEVO', nombre: 'Nuevo' },
  { codigo: 'PENDIENTE_CORRECCION', nombre: 'Pendiente de corrección' },
  { codigo: 'VALIDADO', nombre: 'Validado' },
  { codigo: 'EN_ANALISIS', nombre: 'En análisis' },
  { codigo: 'RESUELTO', nombre: 'Resuelto' },
  { codigo: 'CERRADO', nombre: 'Cerrado' },
  { codigo: 'REABIERTO', nombre: 'Reabierto' },
];

const FORMATOS: { codigo: FormatoExportacion; nombre: string }[] = [
  { codigo: 'PDF', nombre: 'PDF' },
  { codigo: 'EXCEL', nombre: 'Excel (.xlsx)' },
  { codigo: 'CSV', nombre: 'CSV' },
];

/** Fecha local yyyy-mm-dd, el formato de un input type="date". */
function formatoDia(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function consultaInicial(): ConsultaReporte {
  const hoy = new Date();
  return {
    desde: formatoDia(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
    hasta: formatoDia(hoy),
    criterio: 'CATEGORIA',
    idCategoria: '',
    idPrioridad: '',
    estado: '',
    idOperador: '',
  };
}

function formatearHoras(horas: number | null): string {
  return horas === null ? '—' : horas.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

/** CU20 - Generar reportes y CU22 - Exportar reportes (extiende al anterior). */
export function ReportesPage() {
  const { token } = useAuth();
  const [consulta, setConsulta] = useState<ConsultaReporte>(consultaInicial);
  const [reporte, setReporte] = useState<Reporte | null>(null);
  /** Parámetros con los que se generó el reporte visible: son los que usa la exportación. */
  const [consultaGenerada, setConsultaGenerada] = useState<ConsultaReporte | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [dialogoExportar, setDialogoExportar] = useState(false);
  const [formato, setFormato] = useState<FormatoExportacion | ''>('');
  const [incluirTotales, setIncluirTotales] = useState(true);
  const [errorExportar, setErrorExportar] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [prioridades, setPrioridades] = useState<Prioridad[]>([]);
  const [operadores, setOperadores] = useState<OperadorResumen[]>([]);

  useEffect(() => {
    listarCategorias(token!).then(setCategorias).catch(() => setCategorias([]));
    listarPrioridades(token!).then(setPrioridades).catch(() => setPrioridades([]));
    listarOperadores(token!).then(setOperadores).catch(() => setOperadores([]));
  }, [token]);

  function cambiar<K extends keyof ConsultaReporte>(campo: K, valor: ConsultaReporte[K]) {
    setConsulta((prev) => ({ ...prev, [campo]: valor }));
  }

  async function generar(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    // FA1: período inválido, se informa sin generar el reporte.
    if (!consulta.desde || !consulta.hasta) {
      setError('Indicá el período (desde y hasta).');
      return;
    }
    if (consulta.desde > consulta.hasta) {
      setError('La fecha desde no puede ser posterior a la fecha hasta.');
      return;
    }
    if (consulta.hasta > formatoDia(new Date())) {
      setError('El período no puede incluir fechas futuras.');
      return;
    }

    setGenerando(true);
    try {
      setReporte(await generarReporte(token!, consulta));
      setConsultaGenerada(consulta);
    } catch (e) {
      setError((e as Error).message || 'No se pudo generar el reporte.');
    } finally {
      setGenerando(false);
    }
  }

  function abrirDialogo() {
    setFormato('');
    setErrorExportar(null);
    setDialogoExportar(true);
  }

  async function confirmarExportacion() {
    // FA1 de CU22: hay que elegir un formato antes de continuar.
    if (!formato) {
      setErrorExportar('Elegí un formato para continuar.');
      return;
    }
    setExportando(true);
    setErrorExportar(null);
    try {
      const { blob, nombre } = await exportarReporte(token!, consultaGenerada!, formato, incluirTotales);
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombre;
      enlace.click();
      URL.revokeObjectURL(url);
      setDialogoExportar(false);
    } catch (e) {
      setErrorExportar(`${(e as Error).message || 'No se pudo generar el archivo.'} Podés reintentar o elegir otro formato.`);
    } finally {
      setExportando(false);
    }
  }

  const nombreCriterio = CRITERIOS.find((c) => c.codigo === reporte?.criterio)?.nombre ?? '';

  return (
    <div>
      <div className="reportes-header">
        <h2>Reportes</h2>
      </div>

      <form className="reportes-form" onSubmit={generar}>
        <label>
          Desde
          <input type="date" value={consulta.desde} onChange={(e) => cambiar('desde', e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={consulta.hasta} onChange={(e) => cambiar('hasta', e.target.value)} />
        </label>
        <label>
          Agrupar por
          <select value={consulta.criterio} onChange={(e) => cambiar('criterio', e.target.value as CriterioAgrupamiento)}>
            {CRITERIOS.map((criterio) => (
              <option key={criterio.codigo} value={criterio.codigo}>
                {criterio.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Categoría
          <select value={consulta.idCategoria} onChange={(e) => cambiar('idCategoria', e.target.value)}>
            <option value="">Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Prioridad
          <select value={consulta.idPrioridad} onChange={(e) => cambiar('idPrioridad', e.target.value)}>
            <option value="">Todas</option>
            {prioridades.map((prioridad) => (
              <option key={prioridad.id} value={prioridad.id}>
                {prioridad.nivel}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estado
          <select value={consulta.estado} onChange={(e) => cambiar('estado', e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS.map((estado) => (
              <option key={estado.codigo} value={estado.codigo}>
                {estado.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Operador
          <select value={consulta.idOperador} onChange={(e) => cambiar('idOperador', e.target.value)}>
            <option value="">Todos</option>
            {operadores.map((operador) => (
              <option key={operador.id} value={operador.id}>
                {operador.nombre} {operador.apellido}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="reportes-boton" disabled={generando}>
          {generando ? 'Generando...' : 'Generar reporte'}
        </button>
      </form>

      {error && <p className="reportes-error">{error}</p>}

      {reporte !== null && reporte.sinDatos && (
        <p className="reportes-aviso">
          No hay información para el período seleccionado. Probá ampliarlo o quitar filtros.
        </p>
      )}

      {reporte !== null && !reporte.sinDatos && (
        <>
          <div className="reportes-resultado-header">
            <h3>
              Tickets del {reporte.desde} al {reporte.hasta}, agrupados por {nombreCriterio.toLowerCase()}
            </h3>
            <button type="button" className="reportes-boton reportes-boton-secundario" onClick={abrirDialogo}>
              <IconFile size={14} /> Exportar reporte
            </button>
          </div>
          <table className="reportes-table">
            <thead>
              <tr>
                <th>{nombreCriterio}</th>
                <th className="reportes-numero">Tickets</th>
                <th className="reportes-numero">Abiertos</th>
                <th className="reportes-numero">Cerrados</th>
                <th className="reportes-numero">Promedio de resolución (h)</th>
              </tr>
            </thead>
            <tbody>
              {reporte.grupos.map((grupo) => (
                <tr key={grupo.clave}>
                  <td>{grupo.clave}</td>
                  <td className="reportes-numero">{grupo.cantidad}</td>
                  <td className="reportes-numero">{grupo.abiertos}</td>
                  <td className="reportes-numero">{grupo.cerrados}</td>
                  <td className="reportes-numero">{formatearHoras(grupo.promedioResolucionHoras)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td className="reportes-numero">{reporte.totales.cantidad}</td>
                <td className="reportes-numero">{reporte.totales.abiertos}</td>
                <td className="reportes-numero">{reporte.totales.cerrados}</td>
                <td className="reportes-numero">{formatearHoras(reporte.totales.promedioResolucionHoras)}</td>
              </tr>
            </tfoot>
          </table>
        </>
      )}

      {dialogoExportar && consultaGenerada && (
        <div className="reportes-modal-fondo" role="dialog" aria-modal="true">
          <div className="reportes-modal">
            <h3>Exportar reporte</h3>
            <p>
              Período {consultaGenerada.desde} a {consultaGenerada.hasta}, agrupado por{' '}
              {CRITERIOS.find((c) => c.codigo === consultaGenerada.criterio)?.nombre.toLowerCase()}.
            </p>
            <fieldset>
              {FORMATOS.map((opcion) => (
                <label key={opcion.codigo}>
                  <input
                    type="radio"
                    name="formato"
                    checked={formato === opcion.codigo}
                    onChange={() => setFormato(opcion.codigo)}
                  />{' '}
                  {opcion.nombre}
                </label>
              ))}
            </fieldset>
            <label>
              <input type="checkbox" checked={incluirTotales} onChange={(e) => setIncluirTotales(e.target.checked)} /> Incluir
              totales generales
            </label>
            {errorExportar && <p className="reportes-error">{errorExportar}</p>}
            <div className="reportes-modal-acciones">
              <button
                type="button"
                className="reportes-boton reportes-boton-secundario"
                onClick={() => setDialogoExportar(false)}
                disabled={exportando}
              >
                Cancelar
              </button>
              <button type="button" className="reportes-boton" onClick={confirmarExportacion} disabled={exportando}>
                {exportando ? 'Exportando...' : 'Exportar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
