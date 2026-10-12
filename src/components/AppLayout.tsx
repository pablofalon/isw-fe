import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { PERMISOS_BANDEJA } from '../types/auth';
import { RUTA_CAMBIAR_PASSWORD } from '../auth/rutas';
import { IconBell, IconHelp, IconHome, IconLogo, IconLogout, IconPlus, IconShield, IconTicket, IconUser, IconUsers } from './icons';
import './AppLayout.css';

export function AppLayout() {
  const { nombreCompleto, rol, logout, tienePermiso } = useAuth();
  const veBandeja = PERMISOS_BANDEJA.some(tienePermiso);

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-sidebar-logo">
          <IconLogo />
          <span>Gestión de Tickets</span>
        </div>

        <nav className="app-sidebar-nav">
          <button type="button" className="app-sidebar-link" disabled title="Próximamente">
            <IconHome />
            Inicio
          </button>

          {veBandeja ? (
            <NavLink to="/" end className="app-sidebar-link">
              <IconTicket />
              Bandeja
            </NavLink>
          ) : (
            tienePermiso('TICKET_VER_PROPIOS') && (
              <NavLink to="/" end className="app-sidebar-link">
                <IconTicket />
                Mis Tickets
              </NavLink>
            )
          )}
          {tienePermiso('TICKET_CREAR') && (
            <NavLink to="/tickets/nuevo" className="app-sidebar-link">
              <IconPlus />
              Nuevo Ticket
            </NavLink>
          )}
          {tienePermiso('USUARIOS_ADMINISTRAR') && (
            <NavLink to="/usuarios" className="app-sidebar-link">
              <IconUsers />
              Usuarios
            </NavLink>
          )}
          {tienePermiso('SEGURIDAD_ADMINISTRAR') && (
            <NavLink to="/seguridad" className="app-sidebar-link">
              <IconShield />
              Seguridad
            </NavLink>
          )}

          <button type="button" className="app-sidebar-link" disabled title="Próximamente">
            <IconBell />
            Notificaciones
          </button>
          <NavLink to={RUTA_CAMBIAR_PASSWORD} className="app-sidebar-link">
            <IconUser />
            Cambiar contraseña
          </NavLink>
          <button type="button" className="app-sidebar-link" disabled title="Próximamente">
            <IconHelp />
            Ayuda
          </button>
        </nav>

        <button type="button" className="app-sidebar-logout" onClick={() => logout()}>
          <IconLogout />
          Cerrar sesión
        </button>
      </aside>

      <div className="app-body">
        <header className="app-topbar">
          <div className="app-topbar-greeting">
            <strong>Hola, {nombreCompleto}</strong>
            {rol && <span className="app-topbar-rol"> · {rol}</span>}
          </div>
          <div className="app-topbar-user">
            <span className="app-topbar-avatar">
              <IconUser size={16} />
            </span>
          </div>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
