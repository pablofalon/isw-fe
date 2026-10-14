import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  activarUsuario,
  blanquearPassword,
  crearUsuario,
  desactivarUsuario,
  listarUsuarios,
  modificarUsuario,
} from '../api/usuarios';
import type { Rol } from '../types/auth';
import type { Usuario } from '../types/usuario';
import './BandejaPage.css';
import './UsuariosPage.css';

const TIPOS: { id: Rol; label: string }[] = [
  { id: 'USUARIO', label: 'Usuario' },
  { id: 'OPERADOR', label: 'Operador' },
  { id: 'ADMINISTRADOR', label: 'Administrador' },
];

type Editor = { modo: 'alta' } | { modo: 'edicion'; usuario: Usuario } | { modo: 'blanqueo'; usuario: Usuario } | null;

/** CU24 - ABM de usuarios: alta con contraseña temporal, modificación, baja lógica y blanqueo. */
export function UsuariosPage() {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<Rol | ''>('');
  const [filtroEstado, setFiltroEstado] = useState<'' | 'activas' | 'inactivas'>('');
  const [editor, setEditor] = useState<Editor>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function recargar() {
    listarUsuarios(token!, {
      tipo: filtroTipo || undefined,
      activa: filtroEstado === '' ? undefined : filtroEstado === 'activas',
    })
      .then(setUsuarios)
      .catch(() => setError('No se pudo cargar el listado de usuarios.'));
  }

  useEffect(recargar, [token, filtroTipo, filtroEstado]);

  async function ejecutar(accion: () => Promise<unknown>, mensaje: string) {
    setError(null);
    setAviso(null);
    try {
      await accion();
      setEditor(null);
      setAviso(mensaje);
      recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la operación.');
    }
  }

  return (
    <div className="usuarios">
      <div className="usuarios-encabezado">
        <h2>Usuarios</h2>
        <button type="button" className="usuarios-primario" onClick={() => setEditor({ modo: 'alta' })}>
          Nuevo usuario
        </button>
      </div>

      <div className="usuarios-filtros">
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as Rol | '')}>
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)}>
          <option value="">Todos los estados</option>
          <option value="activas">Activas</option>
          <option value="inactivas">Inactivas</option>
        </select>
      </div>

      {error && <p className="usuarios-error">{error}</p>}
      {aviso && <p className="usuarios-aviso">{aviso}</p>}

      {editor && (
        <div className="usuarios-panel">
          {editor.modo === 'alta' && (
            <UsuarioForm
              onCancelar={() => setEditor(null)}
              onGuardar={(datos) =>
                ejecutar(
                  () => crearUsuario(token!, datos),
                  `Se creó el usuario ${datos.usuarioLogin.trim().toLowerCase()}. Comunicale la contraseña temporal: se le pedirá cambiarla al ingresar.`,
                )
              }
            />
          )}
          {editor.modo === 'edicion' && (
            <UsuarioForm
              usuario={editor.usuario}
              onCancelar={() => setEditor(null)}
              onGuardar={(datos) =>
                ejecutar(() => modificarUsuario(token!, editor.usuario.id, datos), 'Los datos se actualizaron.')
              }
            />
          )}
          {editor.modo === 'blanqueo' && (
            <BlanqueoForm
              usuario={editor.usuario}
              onCancelar={() => setEditor(null)}
              onGuardar={(password) =>
                ejecutar(
                  () => blanquearPassword(token!, editor.usuario.id, password),
                  `Se blanqueó la contraseña de ${editor.usuario.usuarioLogin}. Deberá cambiarla al ingresar.`,
                )
              }
            />
          )}
        </div>
      )}

      {usuarios === null && !error && <p>Cargando...</p>}
      {usuarios !== null && usuarios.length === 0 && <p className="bandeja-vacio">No hay usuarios con esos filtros.</p>}
      {usuarios !== null && usuarios.length > 0 && (
        <div className="usuarios-tabla">
          <table className="bandeja-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Correo</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.usuarioLogin}</strong>
                  </td>
                  <td>
                    {u.nombre} {u.apellido}
                  </td>
                  <td>{TIPOS.find((t) => t.id === u.tipo)?.label}</td>
                  <td>{u.correoElectronico}</td>
                  <td>
                    <EstadoBadge usuario={u} />
                  </td>
                  <td>{u.fechaUltimoAcceso ? new Date(u.fechaUltimoAcceso).toLocaleString() : '—'}</td>
                  <td className="usuarios-acciones">
                    <button type="button" onClick={() => setEditor({ modo: 'edicion', usuario: u })}>
                      Editar
                    </button>
                    <button type="button" onClick={() => setEditor({ modo: 'blanqueo', usuario: u })}>
                      Blanquear contraseña
                    </button>
                    {u.bloqueadaPorIntentos && (
                      <button type="button" onClick={() => ejecutar(() => activarUsuario(token!, u.id), `${u.usuarioLogin} quedó desbloqueado.`)}>
                        Desbloquear
                      </button>
                    )}
                    {u.activa ? (
                      <button
                        type="button"
                        className="usuarios-peligro"
                        onClick={() => {
                          if (window.confirm(`¿Dar de baja a ${u.usuarioLogin}? No podrá ingresar hasta que se reactive.`)) {
                            ejecutar(() => desactivarUsuario(token!, u.id), `${u.usuarioLogin} quedó inactivo.`);
                          }
                        }}
                      >
                        Dar de baja
                      </button>
                    ) : (
                      <button type="button" onClick={() => ejecutar(() => activarUsuario(token!, u.id), `${u.usuarioLogin} quedó activo.`)}>
                        Reactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EstadoBadge({ usuario }: { usuario: Usuario }) {
  if (usuario.bloqueadaPorIntentos) return <span className="usuarios-badge usuarios-badge-peligro">Bloqueada</span>;
  if (!usuario.activa) return <span className="usuarios-badge usuarios-badge-inactiva">Inactiva</span>;
  if (usuario.debeCambiarPassword) return <span className="usuarios-badge usuarios-badge-aviso">Contraseña temporal</span>;
  return <span className="usuarios-badge usuarios-badge-ok">Activa</span>;
}

/** Sugiere una contraseña temporal que cumple la política (8+ caracteres, letras y números). */
function generarTemporal(): string {
  const letras = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const digitos = '23456789';
  const elegir = (fuente: string, n: number) =>
    Array.from(crypto.getRandomValues(new Uint32Array(n)), (v) => fuente[v % fuente.length]).join('');
  return elegir(letras, 6) + elegir(digitos, 4);
}

type DatosForm = {
  tipo: Rol;
  usuarioLogin: string;
  passwordTemporal: string;
  nombre: string;
  apellido: string;
  correoElectronico: string;
  telefono: string;
  area: string;
  cargo: string;
};

function UsuarioForm({
  usuario,
  onGuardar,
  onCancelar,
}: {
  usuario?: Usuario;
  onGuardar: (datos: DatosForm) => Promise<void>;
  onCancelar: () => void;
}) {
  const esAlta = !usuario;
  const [datos, setDatos] = useState<DatosForm>({
    tipo: usuario?.tipo ?? 'USUARIO',
    usuarioLogin: usuario?.usuarioLogin ?? '',
    passwordTemporal: esAlta ? generarTemporal() : '',
    nombre: usuario?.nombre ?? '',
    apellido: usuario?.apellido ?? '',
    correoElectronico: usuario?.correoElectronico ?? '',
    telefono: usuario?.telefono ?? '',
    area: usuario?.area ?? '',
    cargo: usuario?.cargo ?? '',
  });
  const esUsuarioFinal = datos.tipo === 'USUARIO';

  function campo(nombre: keyof DatosForm) {
    return {
      value: datos[nombre],
      onChange: (e: { target: { value: string } }) => setDatos({ ...datos, [nombre]: e.target.value }),
    };
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    await onGuardar(datos);
  }

  return (
    <form className="usuarios-form" onSubmit={enviar}>
      <h3>{esAlta ? 'Nuevo usuario' : `Editar ${usuario.usuarioLogin}`}</h3>
      <div className="usuarios-grilla">
        <label>
          Tipo
          <select {...campo('tipo')} disabled={!esAlta}>
            {TIPOS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Usuario
          <input {...campo('usuarioLogin')} disabled={!esAlta} placeholder="ej. lucia.fernandez" required />
        </label>
        {esAlta && (
          <label>
            Contraseña temporal
            <span className="usuarios-inline">
              <input {...campo('passwordTemporal')} required />
              <button type="button" onClick={() => setDatos({ ...datos, passwordTemporal: generarTemporal() })}>
                Generar
              </button>
            </span>
          </label>
        )}
        <label>
          Nombre
          <input {...campo('nombre')} required />
        </label>
        <label>
          Apellido
          <input {...campo('apellido')} required />
        </label>
        <label>
          Correo electrónico
          <input type="email" {...campo('correoElectronico')} required />
        </label>
        {esUsuarioFinal ? (
          <label>
            Teléfono
            <input {...campo('telefono')} />
          </label>
        ) : (
          <>
            <label>
              Área
              <input {...campo('area')} placeholder="ej. soporte técnico" />
            </label>
            <label>
              Cargo
              <input {...campo('cargo')} />
            </label>
          </>
        )}
      </div>
      {esAlta && (
        <p className="usuarios-ayuda">
          Se le asigna el grupo de permisos de su tipo; los ajustes se hacen desde Seguridad. El primer ingreso le pedirá
          cambiar la contraseña temporal.
        </p>
      )}
      <div className="usuarios-botones">
        <button type="submit" className="usuarios-primario">
          {esAlta ? 'Crear usuario' : 'Guardar cambios'}
        </button>
        <button type="button" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function BlanqueoForm({
  usuario,
  onGuardar,
  onCancelar,
}: {
  usuario: Usuario;
  onGuardar: (password: string) => Promise<void>;
  onCancelar: () => void;
}) {
  const [password, setPassword] = useState(() => generarTemporal());

  async function enviar(e: FormEvent) {
    e.preventDefault();
    await onGuardar(password);
  }

  return (
    <form className="usuarios-form" onSubmit={enviar}>
      <h3>Blanquear contraseña de {usuario.usuarioLogin}</h3>
      <label>
        Contraseña temporal
        <span className="usuarios-inline">
          <input value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="button" onClick={() => setPassword(generarTemporal())}>
            Generar
          </button>
        </span>
      </label>
      <p className="usuarios-ayuda">Se cierran sus sesiones abiertas y deberá cambiarla en el próximo ingreso.</p>
      <div className="usuarios-botones">
        <button type="submit" className="usuarios-primario">
          Blanquear
        </button>
        <button type="button" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
