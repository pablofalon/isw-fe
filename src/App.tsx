import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { NuevoTicketPage } from './pages/NuevoTicketPage';
import { TicketDetallePage } from './pages/TicketDetallePage';
import { SeguridadPage } from './pages/SeguridadPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { CambiarPasswordPage } from './pages/CambiarPasswordPage';
import { RUTA_CAMBIAR_PASSWORD } from './auth/rutas';
import type { Permiso } from './types/auth';

function RequierePermiso({ permiso, children }: { permiso: Permiso; children: React.ReactNode }) {
  const { tienePermiso } = useAuth();
  if (!tienePermiso(permiso)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route
              path="tickets/nuevo"
              element={
                <RequierePermiso permiso="TICKET_CREAR">
                  <NuevoTicketPage />
                </RequierePermiso>
              }
            />
            <Route
              path="seguridad"
              element={
                <RequierePermiso permiso="SEGURIDAD_ADMINISTRAR">
                  <SeguridadPage />
                </RequierePermiso>
              }
            />
            <Route
              path="usuarios"
              element={
                <RequierePermiso permiso="USUARIOS_ADMINISTRAR">
                  <UsuariosPage />
                </RequierePermiso>
              }
            />
            <Route path={RUTA_CAMBIAR_PASSWORD.slice(1)} element={<CambiarPasswordPage />} />
            <Route path="tickets/:id" element={<TicketDetallePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
