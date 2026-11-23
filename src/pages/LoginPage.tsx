import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/http';
import './LoginPage.css';

export function LoginPage() {
  const { login, sesionExpirada } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const rutaDeRetorno = (location.state as { from?: string } | null)?.from ?? '/';
  const [usuarioLogin, setUsuarioLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(usuarioLogin, password);
      navigate(rutaDeRetorno, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Usuario o contraseña incorrectos.');
      } else if (err instanceof ApiError && err.status === 403) {
        // Cuenta inactiva o bloqueada temporalmente (CU23 FA2 / E1): el backend explica el motivo.
        setError(err.message);
      } else {
        setError('No se pudo conectar con el servidor.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Gestión de Tickets</h1>
        <p className="login-subtitle">Iniciá sesión para continuar</p>

        <label htmlFor="usuarioLogin">Usuario o correo electrónico</label>
        <input
          id="usuarioLogin"
          value={usuarioLogin}
          onChange={(e) => setUsuarioLogin(e.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {sesionExpirada && !error && <p className="login-error">Tu sesión expiró. Volvé a iniciar sesión para continuar.</p>}
        {error && <p className="login-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Ingresando...' : 'Iniciar sesión'}
        </button>

        <p className="login-hint">El sistema habilitará las funciones según tu perfil: usuario, operador o administrador.</p>
      </form>
    </div>
  );
}
