import { useAuth } from '../auth/AuthContext';
import { MisTicketsPage } from './MisTicketsPage';
import { BandejaPage } from './BandejaPage';

/** Punto de entrada tras el login: cada perfil ve su propia pantalla principal (CU23). */
export function HomePage() {
  const { rol } = useAuth();

  if (rol === 'OPERADOR' || rol === 'ADMINISTRADOR') {
    return <BandejaPage />;
  }

  return <MisTicketsPage />;
}
