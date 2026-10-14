import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { EVENTO_NOTIFICACIONES, marcarLeida, marcarTodasLeidas, misNotificaciones } from '../api/notificaciones';
import type { Notificacion } from '../types/notificacion';
import './NotificacionesPage.css';

export function NotificacionesPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState<Notificacion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function cargar() {
    misNotificaciones(token!)
      .then(setNotificaciones)
      .catch(() => setError('No se pudieron cargar las notificaciones.'));
  }

  useEffect(cargar, [token]);

  async function abrir(notificacion: Notificacion) {
    if (notificacion.estado !== 'LEIDA') {
      await marcarLeida(token!, notificacion.id).catch(() => null);
      window.dispatchEvent(new Event(EVENTO_NOTIFICACIONES));
    }
    if (notificacion.ticketId) {
      navigate(`/tickets/${notificacion.ticketId}`);
    } else {
      cargar();
    }
  }

  async function leerTodas() {
    await marcarTodasLeidas(token!);
    window.dispatchEvent(new Event(EVENTO_NOTIFICACIONES));
    cargar();
  }

  if (error) {
    return <p className="notificaciones-error">{error}</p>;
  }

  if (notificaciones === null) {
    return <p>Cargando...</p>;
  }

  const hayNuevas = notificaciones.some((n) => n.estado !== 'LEIDA');

  return (
    <div>
      <div className="notificaciones-header">
        <h2>Notificaciones</h2>
        {hayNuevas && (
          <button type="button" className="notificaciones-leer-todas" onClick={leerTodas}>
            Marcar todas como leídas
          </button>
        )}
      </div>

      {notificaciones.length === 0 ? (
        <p className="notificaciones-vacio">No tenés notificaciones.</p>
      ) : (
        <ul className="notificaciones-lista">
          {notificaciones.map((n) => (
            <li key={n.id} className={n.estado === 'LEIDA' ? 'notificacion-leida' : 'notificacion-nueva'}>
              <button type="button" onClick={() => abrir(n)}>
                <span className="notificacion-mensaje">{n.mensaje}</span>
                <span className="notificacion-meta">
                  {new Date(n.fechaEnvio).toLocaleString()}
                  {n.estado !== 'LEIDA' && <span className="notificacion-badge">Nueva</span>}
                  {n.ticketId && <span className="notificacion-ver">Ver ticket →</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
