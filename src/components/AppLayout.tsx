import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { PERMISOS_BANDEJA } from '../types/auth';
import { RUTA_CAMBIAR_PASSWORD } from '../auth/rutas';
import { cantidadNoLeidas, EVENTO_NOTIFICACIONES } from '../api/notificaciones';
import {
  IconBell,
  IconChart,
  IconClock,
  IconFile,
  IconHelp,
  IconHome,
  IconList,
  IconLogo,
  IconLogout,
  IconPlus,
  IconShield,
  IconTicket,
  IconUser,
  IconUsers,
} from './icons';
import './AppLayout.css';

export function AppLayout() {
  const { token, nombreCompleto, rol, logout, tienePermiso } = useAuth();
  const veBandeja = PERMISOS_BANDEJA.some(tienePermiso);
  const { pathname } = useLocation();
  const [noLeidas, setNoLeidas] = useState(0);

  // Se refresca al navegar, cuando el panel marca leídas y cada 30 s (las acciones de otros generan avisos).
  useEffect(() => {
    if (!token) return;
    const actualizar = () => {
      cantidadNoLeidas(token)
        .then(setNoLeidas)
        .catch(() => setNoLeidas(0));
    };
    actualizar();
    window.addEventListener(EVENTO_NOTIFICACIONES, actualizar);
    const intervalo = window.setInterval(actualizar, 30000);
    return () => {
      window.removeEventListener(EVENTO_NOTIFICACIONES, actualizar);
      window.clearInterval(intervalo);
    };
  }, [token, pathname]);

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
          {tienePermiso('TICKET_VER_TODOS') && (
            <>
              <NavLink to="/tickets/operativos" className="app-sidebar-link">
                <IconList />
                Tickets operativos
              </NavLink>
              <NavLink to="/tiempos-respuesta" className="app-sidebar-link">
                <IconClock />
                Tiempos de respuesta
              </NavLink>
            </>
          )}
          {tienePermiso('REPORTES_CONSULTAR') && (
            <>
              <NavLink to="/dashboard" className="app-sidebar-link">
                <IconChart />
                Dashboard
              </NavLink>
              <NavLink to="/reportes" className="app-sidebar-link">
                <IconFile />
                Reportes
              </NavLink>
            </>
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

          <NavLink to="/notificaciones" className="app-sidebar-link">
            <IconBell />
            Notificaciones
            {noLeidas > 0 && <span className="app-sidebar-badge">{noLeidas}</span>}
          </NavLink>
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
