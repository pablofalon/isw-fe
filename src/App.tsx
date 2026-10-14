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
import { NotificacionesPage } from './pages/NotificacionesPage';
import { OperativosPage } from './pages/OperativosPage';
import { TiemposRespuestaPage } from './pages/TiemposRespuestaPage';
import { HistorialTicketPage } from './pages/HistorialTicketPage';
import { ReportesPage } from './pages/ReportesPage';
import { DashboardPage } from './pages/DashboardPage';
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
            <Route
              path="tickets/operativos"
              element={
                <RequierePermiso permiso="TICKET_VER_TODOS">
                  <OperativosPage />
                </RequierePermiso>
              }
            />
            <Route
              path="tiempos-respuesta"
              element={
                <RequierePermiso permiso="TICKET_VER_TODOS">
                  <TiemposRespuestaPage />
                </RequierePermiso>
              }
            />
            <Route
              path="tickets/:id/historial"
              element={
                <RequierePermiso permiso="TICKET_VER_TODOS">
                  <HistorialTicketPage />
                </RequierePermiso>
              }
            />
            <Route
              path="dashboard"
              element={
                <RequierePermiso permiso="REPORTES_CONSULTAR">
                  <DashboardPage />
                </RequierePermiso>
              }
            />
            <Route
              path="reportes"
              element={
                <RequierePermiso permiso="REPORTES_CONSULTAR">
                  <ReportesPage />
                </RequierePermiso>
              }
            />
            <Route path={RUTA_CAMBIAR_PASSWORD.slice(1)} element={<CambiarPasswordPage />} />
            <Route path="tickets/:id" element={<TicketDetallePage />} />
            <Route path="notificaciones" element={<NotificacionesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
