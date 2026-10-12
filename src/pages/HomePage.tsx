import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { PERMISOS_BANDEJA } from '../types/auth';
import { MisTicketsPage } from './MisTicketsPage';
import { BandejaPage } from './BandejaPage';

/** Punto de entrada tras el login: cada perfil ve su propia pantalla principal según sus permisos (CU23). */
export function HomePage() {
  const { tienePermiso } = useAuth();

  if (PERMISOS_BANDEJA.some(tienePermiso)) {
    return <BandejaPage />;
  }

  if (tienePermiso('TICKET_VER_PROPIOS')) {
    return <MisTicketsPage />;
  }

  if (tienePermiso('USUARIOS_ADMINISTRAR')) {
    return <Navigate to="/usuarios" replace />;
  }

  if (tienePermiso('SEGURIDAD_ADMINISTRAR')) {
    return <Navigate to="/seguridad" replace />;
  }

  return <p>Tu cuenta no tiene permisos asignados. Contactá a un administrador.</p>;
}
