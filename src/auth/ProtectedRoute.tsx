import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { RUTA_CAMBIAR_PASSWORD } from './rutas';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, debeCambiarPassword } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Con contraseña temporal la única pantalla disponible es la de cambiarla.
  if (debeCambiarPassword && location.pathname !== RUTA_CAMBIAR_PASSWORD) {
    return <Navigate to={RUTA_CAMBIAR_PASSWORD} replace />;
  }

  return <>{children}</>;
}
