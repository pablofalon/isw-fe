import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  cambiarEstadoCategoria,
  crearCategoria,
  modificarCategoria,
  modificarParametroGeneral,
  modificarPrioridad,
  obtenerAuditoria,
  obtenerParametros,
  restaurarParametros,
} from '../api/parametros';
import type {
  AuditoriaParametro,
  CategoriaAdmin,
  GrupoParametros,
  ParametroGeneral,
  Parametros,
  PrioridadAdmin,
} from '../types/parametros';
import { formatearFechaHora } from '../utils/fechas';
import './BandejaPage.css';
import './UsuariosPage.css';
import './ParametrosPage.css';

const NOMBRE_GRUPO: Record<GrupoParametros, string> = {
  CATEGORIAS: 'las categorías',
  PRIORIDADES: 'las prioridades',
  GENERALES: 'los parámetros generales',
};

type EditorCategoria = { categoria?: CategoriaAdmin } | null;

/** CU25 - Configurar parámetros: categorías, tiempos máximos de prioridad y parámetros generales. */
export function ParametrosPage() {
  const { token } = useAuth();
  const [parametros, setParametros] = useState<Parametros | null>(null);
  const [auditoria, setAuditoria] = useState<AuditoriaParametro[]>([]);
  const [editorCategoria, setEditorCategoria] = useState<EditorCategoria>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const recargar = useCallback(() => {
    Promise.all([obtenerParametros(token!), obtenerAuditoria(token!)])
      .then(([p, a]) => {
        setParametros(p);
        setAuditoria(a);
      })
      .catch(() => setError('No se pudieron cargar los parámetros.'));
  }, [token]);

  useEffect(recargar, [recargar]);

  async function ejecutar(accion: () => Promise<unknown>, mensaje: string): Promise<boolean> {
    setError(null);
    setAviso(null);
    try {
      await accion();
      setAviso(mensaje);
      recargar();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la operación.');
      return false;
    }
  }

  function restaurar(grupo: GrupoParametros) {
    if (window.confirm(`¿Restaurar ${NOMBRE_GRUPO[grupo]} a los valores por defecto? Se pierden los cambios hechos.`)) {
      ejecutar(() => restaurarParametros(token!, grupo), `Se restauraron ${NOMBRE_GRUPO[grupo]}.`);
    }
  }

  if (parametros === null) {
    return (
      <div className="usuarios parametros">
        <h2>Parámetros</h2>
        {error ? <p className="usuarios-error">{error}</p> : <p>Cargando...</p>}
      </div>
    );
  }

  return (
    <div className="usuarios parametros">
      <h2>Parámetros</h2>
      {error && <p className="usuarios-error">{error}</p>}
      {aviso && <p className="usuarios-aviso">{aviso}</p>}

      <section>
        <div className="parametros-seccion-encabezado">
          <h3>Categorías de tickets</h3>
          <div className="parametros-acciones-seccion">
            <button type="button" className="usuarios-primario" onClick={() => setEditorCategoria({})}>
              Nueva categoría
            </button>
            <button type="button" onClick={() => restaurar('CATEGORIAS')}>
              Restaurar valores por defecto
            </button>
          </div>
        </div>
        {editorCategoria && (
          <CategoriaForm
            key={editorCategoria.categoria?.id ?? 'nueva'}
            categoria={editorCategoria.categoria}
            onCancelar={() => setEditorCategoria(null)}
            onGuardar={async (datos) => {
              const categoria = editorCategoria.categoria;
              const ok = await ejecutar(
                () => (categoria ? modificarCategoria(token!, categoria.id, datos) : crearCategoria(token!, datos)),
                categoria ? 'La categoría se actualizó.' : `Se creó la categoría ${datos.nombre.trim()}.`,
              );
              if (ok) setEditorCategoria(null);
            }}
          />
        )}
        <div className="usuarios-tabla">
          <table className="bandeja-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Área</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {parametros.categorias.map((c) => (
                <tr key={c.id} className={c.activa ? '' : 'parametros-inactiva'}>
                  <td>
                    <strong>{c.nombre}</strong>
                  </td>
                  <td>{c.descripcion ?? '—'}</td>
                  <td>{c.area ?? '—'}</td>
                  <td>
                    <span className={`usuarios-badge ${c.activa ? 'usuarios-badge-ok' : 'usuarios-badge-inactiva'}`}>
                      {c.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="usuarios-acciones">
                    <button type="button" onClick={() => setEditorCategoria({ categoria: c })}>
                      Editar
                    </button>
                    {c.activa ? (
                      <button
                        type="button"
                        className="usuarios-peligro"
                        onClick={() => {
                          if (window.confirm(`¿Desactivar la categoría ${c.nombre}? No podrá elegirse en tickets nuevos.`)) {
                            ejecutar(() => cambiarEstadoCategoria(token!, c.id, false), `${c.nombre} quedó inactiva.`);
                          }
                        }}
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => ejecutar(() => cambiarEstadoCategoria(token!, c.id, true), `${c.nombre} quedó activa.`)}
                      >
                        Activar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="parametros-seccion-encabezado">
          <h3>Niveles de prioridad</h3>
          <button type="button" onClick={() => restaurar('PRIORIDADES')}>
            Restaurar valores por defecto
          </button>
        </div>
        <p className="parametros-ayuda">
          Los niveles son fijos; se edita el tiempo máximo de respuesta, que usa el monitoreo de tiempos.
        </p>
        <div className="usuarios-tabla">
          <table className="bandeja-table">
            <thead>
              <tr>
                <th>Nivel</th>
                <th>Descripción</th>
                <th>Tiempo máximo (horas)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {parametros.prioridades.map((p) => (
                <PrioridadFila
                  key={`${p.id}-${p.descripcion}-${p.tiempoObjetivoRespuesta}`}
                  prioridad={p}
                  onGuardar={(descripcion, horas) =>
                    ejecutar(() => modificarPrioridad(token!, p.id, descripcion, horas), `Se actualizó la prioridad ${p.nivel}.`)
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="parametros-seccion-encabezado">
          <h3>Parámetros generales</h3>
          <button type="button" onClick={() => restaurar('GENERALES')}>
            Restaurar valores por defecto
          </button>
        </div>
        {parametros.generales.map((g) => (
          <GeneralFila
            key={`${g.clave}-${g.valor}`}
            parametro={g}
            onGuardar={(valor) =>
              ejecutar(() => modificarParametroGeneral(token!, g.clave, valor), `Se actualizó "${g.descripcion}".`)
            }
          />
        ))}
      </section>

      <section>
        <h3>Últimos cambios</h3>
        {auditoria.length === 0 ? (
          <p className="bandeja-vacio">Todavía no se registraron cambios.</p>
        ) : (
          <div className="usuarios-tabla">
            <table className="bandeja-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Administrador</th>
                  <th>Elemento</th>
                  <th>Acción</th>
                  <th>Valor anterior</th>
                  <th>Valor nuevo</th>
                </tr>
              </thead>
              <tbody>
                {auditoria.map((a) => (
                  <tr key={a.id}>
                    <td>{formatearFechaHora(a.fecha)}</td>
                    <td>{a.administrador}</td>
                    <td>{a.elemento}</td>
                    <td>{a.accion}</td>
                    <td>{a.valorAnterior ?? '—'}</td>
                    <td>{a.valorNuevo ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function CategoriaForm({
  categoria,
  onGuardar,
  onCancelar,
}: {
  categoria?: CategoriaAdmin;
  onGuardar: (datos: { nombre: string; descripcion: string; area: string }) => Promise<void>;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(categoria?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? '');
  const [area, setArea] = useState(categoria?.area ?? '');

  async function enviar(e: FormEvent) {
    e.preventDefault();
    await onGuardar({ nombre, descripcion, area });
  }

  return (
    <form className="usuarios-form usuarios-panel" onSubmit={enviar}>
      <h3>{categoria ? `Editar ${categoria.nombre}` : 'Nueva categoría'}</h3>
      <div className="usuarios-grilla">
        <label>
          Nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </label>
        <label>
          Descripción
          <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </label>
        <label>
          Área que la atiende
          <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="ej. soporte técnico" />
        </label>
      </div>
      <div className="usuarios-botones">
        <button type="submit" className="usuarios-primario">
          {categoria ? 'Guardar cambios' : 'Crear categoría'}
        </button>
        <button type="button" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function PrioridadFila({
  prioridad,
  onGuardar,
}: {
  prioridad: PrioridadAdmin;
  onGuardar: (descripcion: string, horas: number) => Promise<boolean>;
}) {
  const [descripcion, setDescripcion] = useState(prioridad.descripcion ?? '');
  const [horas, setHoras] = useState(String(prioridad.tiempoObjetivoRespuesta ?? ''));
  const modificada =
    descripcion !== (prioridad.descripcion ?? '') || horas !== String(prioridad.tiempoObjetivoRespuesta ?? '');

  return (
    <tr>
      <td>
        <strong>{prioridad.nivel}</strong>
      </td>
      <td>
        <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </td>
      <td>
        <input
          className="parametros-numero"
          type="number"
          min={1}
          value={horas}
          onChange={(e) => setHoras(e.target.value)}
        />
      </td>
      <td className="usuarios-acciones">
        <button type="button" disabled={!modificada} onClick={() => onGuardar(descripcion, Number(horas))}>
          Guardar
        </button>
      </td>
    </tr>
  );
}

function GeneralFila({
  parametro,
  onGuardar,
}: {
  parametro: ParametroGeneral;
  onGuardar: (valor: number) => Promise<boolean>;
}) {
  const [valor, setValor] = useState(String(parametro.valor));
  const modificado = valor !== String(parametro.valor);

  return (
    <div className="parametros-general">
      <div className="parametros-general-texto">
        {parametro.descripcion}
        <span className="parametros-general-rango">
          Entre {parametro.minimo} y {parametro.maximo} {parametro.unidad ?? ''} · por defecto {parametro.valorDefecto}
        </span>
      </div>
      <input
        className="parametros-numero"
        type="number"
        min={parametro.minimo}
        max={parametro.maximo}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
      <span>{parametro.unidad}</span>
      <button type="button" disabled={!modificado} onClick={() => onGuardar(Number(valor))}>
        Guardar
      </button>
    </div>
  );
}
