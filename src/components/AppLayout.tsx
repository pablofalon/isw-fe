import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { IconBell, IconHelp, IconHome, IconLogo, IconLogout, IconPlus, IconTicket, IconUser } from './icons';
import './AppLayout.css';

export function AppLayout() {
  const { nombreCompleto, rol, logout } = useAuth();
  const esOperativo = rol === 'OPERADOR' || rol === 'ADMINISTRADOR';

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

          {esOperativo ? (
            <NavLink to="/" end className="app-sidebar-link">
              <IconTicket />
              Bandeja
            </NavLink>
          ) : (
            <>
              <NavLink to="/" end className="app-sidebar-link">
                <IconTicket />
                Mis Tickets
              </NavLink>
              <NavLink to="/tickets/nuevo" className="app-sidebar-link">
                <IconPlus />
                Nuevo Ticket
              </NavLink>
            </>
          )}

          <button type="button" className="app-sidebar-link" disabled title="Próximamente">
            <IconBell />
            Notificaciones
          </button>
          <button type="button" className="app-sidebar-link" disabled title="Próximamente">
            <IconUser />
            Perfil
          </button>
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
