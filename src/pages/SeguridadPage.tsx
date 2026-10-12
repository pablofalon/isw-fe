import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  agregarHijo,
  asignarComponentes,
  crearGrupo,
  listarComponentes,
  listarCuentas,
  quitarHijo,
} from '../api/seguridad';
import type { ComponentePermiso, CuentaSeguridad } from '../types/seguridad';
import { IconClose } from '../components/icons';
import './BandejaPage.css';
import './SeguridadPage.css';

type Tab = 'grupos' | 'cuentas';

/** ABM del módulo de seguridad: arma el árbol de grupos/permisos (Composite) y lo asigna a cuentas. */
export function SeguridadPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('grupos');
  const [componentes, setComponentes] = useState<ComponentePermiso[] | null>(null);
  const [cuentas, setCuentas] = useState<CuentaSeguridad[]>([]);
  const [error, setError] = useState<string | null>(null);

  function recargar() {
    Promise.all([listarComponentes(token!), listarCuentas(token!)])
      .then(([c, u]) => {
        setComponentes(c);
        setCuentas(u);
      })
      .catch(() => setError('No se pudo cargar la configuración de seguridad.'));
  }

  useEffect(recargar, [token]);

  async function ejecutar(accion: () => Promise<unknown>) {
    setError(null);
    try {
      await accion();
      recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la operación.');
    }
  }

  if (componentes === null) {
    return error ? <p className="seguridad-error">{error}</p> : <p>Cargando...</p>;
  }

  const porId = new Map(componentes.map((c) => [c.id, c]));
  const grupos = componentes.filter((c) => c.tipo === 'GRUPO');
  const permisos = componentes.filter((c) => c.tipo === 'PERMISO');

  return (
    <div className="seguridad">
      <h2>Seguridad</h2>
      <p className="seguridad-ayuda">
        Los permisos son atómicos; los grupos agrupan permisos y otros grupos. Una cuenta obtiene la unión
        de todo lo que alcanzan sus componentes. Los cambios aplican de inmediato en el servidor; los menús de cada
        usuario se actualizan cuando vuelve a iniciar sesión.
      </p>

      <div className="bandeja-tabs">
        <button
          type="button"
          className={`bandeja-tab${tab === 'grupos' ? ' bandeja-tab-active' : ''}`}
          onClick={() => setTab('grupos')}
        >
          Grupos
        </button>
        <button
          type="button"
          className={`bandeja-tab${tab === 'cuentas' ? ' bandeja-tab-active' : ''}`}
          onClick={() => setTab('cuentas')}
        >
          Cuentas
        </button>
      </div>

      {error && <p className="seguridad-error">{error}</p>}

      {tab === 'grupos' ? (
        <>
          <NuevoGrupoForm onCrear={(codigo, descripcion) => ejecutar(() => crearGrupo(token!, codigo, descripcion))} />
          <div className="seguridad-grupos">
            {grupos.map((grupo) => (
              <GrupoCard
                key={grupo.id}
                grupo={grupo}
                porId={porId}
                candidatos={componentes.filter((c) => c.id !== grupo.id && !grupo.hijos.includes(c.id))}
                onAgregar={(idHijo) => ejecutar(() => agregarHijo(token!, grupo.id, idHijo))}
                onQuitar={(idHijo) => ejecutar(() => quitarHijo(token!, grupo.id, idHijo))}
              />
            ))}
          </div>
          <h3 className="seguridad-subtitulo">Permisos del sistema</h3>
          <table className="bandeja-table">
            <tbody>
              {permisos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <code>{p.codigo}</code>
                  </td>
                  <td>{p.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <table className="bandeja-table">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Rol</th>
              <th>Componentes asignados</th>
              <th>Permisos efectivos</th>
            </tr>
          </thead>
          <tbody>
            {cuentas.map((cuenta) => (
              <CuentaFila
                key={cuenta.id}
                cuenta={cuenta}
                porId={porId}
                componentes={componentes}
                onAsignar={(ids) => ejecutar(() => asignarComponentes(token!, cuenta.id, ids))}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function NuevoGrupoForm({ onCrear }: { onCrear: (codigo: string, descripcion: string) => Promise<void> }) {
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  async function enviar(e: FormEvent) {
    e.preventDefault();
    await onCrear(codigo, descripcion);
    setCodigo('');
    setDescripcion('');
  }

  return (
    <form className="seguridad-nueva" onSubmit={enviar}>
      <input placeholder="Código (ej. MESA_DE_AYUDA)" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
      <input placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      <button type="submit" disabled={!codigo.trim()}>
        Crear grupo
      </button>
    </form>
  );
}

function GrupoCard({
  grupo,
  porId,
  candidatos,
  onAgregar,
  onQuitar,
}: {
  grupo: ComponentePermiso;
  porId: Map<number, ComponentePermiso>;
  candidatos: ComponentePermiso[];
  onAgregar: (idHijo: number) => void;
  onQuitar: (idHijo: number) => void;
}) {
  const [seleccion, setSeleccion] = useState('');

  return (
    <div className="seguridad-card">
      <div className="seguridad-card-header">
        <strong>{grupo.codigo}</strong>
        {grupo.descripcion && <span className="seguridad-muted"> · {grupo.descripcion}</span>}
      </div>
      {grupo.hijos.length === 0 && <p className="seguridad-muted">Sin componentes.</p>}
      <ul className="seguridad-arbol">
        {grupo.hijos.map((id) => (
          <li key={id}>
            <Nodo id={id} porId={porId} />
            <button type="button" className="seguridad-quitar" title="Quitar del grupo" onClick={() => onQuitar(id)}>
              <IconClose size={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="seguridad-agregar">
        <select value={seleccion} onChange={(e) => setSeleccion(e.target.value)}>
          <option value="">Agregar componente…</option>
          {candidatos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.tipo === 'GRUPO' ? '▸ ' : ''}
              {c.codigo}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!seleccion}
          onClick={() => {
            onAgregar(Number(seleccion));
            setSeleccion('');
          }}
        >
          Agregar
        </button>
      </div>
    </div>
  );
}

/** Dibuja un componente y, si es grupo, su subárbol completo (solo lectura). */
function Nodo({ id, porId }: { id: number; porId: Map<number, ComponentePermiso> }) {
  const componente = porId.get(id);
  if (!componente) return null;
  if (componente.tipo === 'PERMISO') {
    return <code className="seguridad-permiso">{componente.codigo}</code>;
  }
  return (
    <span>
      <span className="seguridad-grupo">▸ {componente.codigo}</span>
      <ul className="seguridad-arbol">
        {componente.hijos.map((hijo) => (
          <li key={hijo}>
            <Nodo id={hijo} porId={porId} />
          </li>
        ))}
      </ul>
    </span>
  );
}

function CuentaFila({
  cuenta,
  porId,
  componentes,
  onAsignar,
}: {
  cuenta: CuentaSeguridad;
  porId: Map<number, ComponentePermiso>;
  componentes: ComponentePermiso[];
  onAsignar: (ids: number[]) => void;
}) {
  const [seleccion, setSeleccion] = useState('');
  const disponibles = componentes.filter((c) => !cuenta.componentes.includes(c.id));

  return (
    <tr>
      <td>
        <strong>{cuenta.usuarioLogin}</strong>
        {!cuenta.activa && <span className="seguridad-inactiva">bloqueada</span>}
      </td>
      <td>{cuenta.rol}</td>
      <td>
        <div className="seguridad-chips">
          {cuenta.componentes.map((id) => (
            <span key={id} className="seguridad-chip">
              {porId.get(id)?.codigo}
              <button
                type="button"
                title="Quitar"
                onClick={() => onAsignar(cuenta.componentes.filter((c) => c !== id))}
              >
                <IconClose size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="seguridad-agregar">
          <select value={seleccion} onChange={(e) => setSeleccion(e.target.value)}>
            <option value="">Asignar…</option>
            {disponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.tipo === 'GRUPO' ? '▸ ' : ''}
                {c.codigo}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!seleccion}
            onClick={() => {
              onAsignar([...cuenta.componentes, Number(seleccion)]);
              setSeleccion('');
            }}
          >
            Asignar
          </button>
        </div>
      </td>
      <td>
        <details>
          <summary>{cuenta.permisos.length} permisos</summary>
          <ul className="seguridad-lista">
            {cuenta.permisos.map((p) => (
              <li key={p}>
                <code>{p}</code>
              </li>
            ))}
          </ul>
        </details>
      </td>
    </tr>
  );
}
