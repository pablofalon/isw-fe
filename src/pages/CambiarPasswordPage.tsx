import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { cambiarPassword } from '../api/cuenta';
import './CambiarPasswordPage.css';

/** Cambio de contraseña propio; obligatorio tras un alta o un blanqueo (contraseña temporal). */
export function CambiarPasswordPage() {
  const { token, debeCambiarPassword, marcarPasswordCambiada } = useAuth();
  const navigate = useNavigate();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (nueva !== confirmacion) {
      setError('La confirmación no coincide con la contraseña nueva.');
      return;
    }
    setEnviando(true);
    try {
      await cambiarPassword(token!, actual, nueva);
      const eraObligatorio = debeCambiarPassword;
      marcarPasswordCambiada();
      setActual('');
      setNueva('');
      setConfirmacion('');
      if (eraObligatorio) {
        navigate('/', { replace: true });
      } else {
        setExito(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="cambiar-password">
      <h2>Cambiar contraseña</h2>
      {debeCambiarPassword && (
        <p className="cambiar-password-aviso">
          Estás usando una contraseña temporal. Para continuar, elegí una contraseña nueva.
        </p>
      )}
      <form className="cambiar-password-card" onSubmit={enviar}>
        <label htmlFor="actual">Contraseña actual</label>
        <input
          id="actual"
          type="password"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          autoComplete="current-password"
          required
        />
        <label htmlFor="nueva">Contraseña nueva</label>
        <input
          id="nueva"
          type="password"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          autoComplete="new-password"
          required
        />
        <label htmlFor="confirmacion">Repetí la contraseña nueva</label>
        <input
          id="confirmacion"
          type="password"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          autoComplete="new-password"
          required
        />
        <p className="cambiar-password-ayuda">Mínimo 8 caracteres, con letras y números.</p>
        {error && <p className="cambiar-password-error">{error}</p>}
        {exito && <p className="cambiar-password-exito">La contraseña se cambió correctamente.</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  );
}
