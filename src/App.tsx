import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { NuevoTicketPage } from './pages/NuevoTicketPage';
import { TicketDetallePage } from './pages/TicketDetallePage';

function SoloUsuario({ children }: { children: React.ReactNode }) {
  const { rol } = useAuth();
  if (rol !== 'USUARIO') {
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
                <SoloUsuario>
                  <NuevoTicketPage />
                </SoloUsuario>
              }
            />
            <Route path="tickets/:id" element={<TicketDetallePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
