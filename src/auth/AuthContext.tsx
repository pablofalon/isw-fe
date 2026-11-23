import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { ApiError, registrarManejadorSesionExpirada } from '../api/http';
import type { Permiso, Rol } from '../types/auth';

const STORAGE_KEY = 'sistematicket.session';

interface StoredSession {
  token: string;
  rol: Rol;
  nombreCompleto: string;
  permisos: Permiso[];
  debeCambiarPassword: boolean;
}

interface AuthContextValue {
  token: string | null;
  rol: Rol | null;
  nombreCompleto: string | null;
  permisos: Permiso[];
  /** La UI decide qué mostrar por permiso, igual que el backend decide qué autorizar. */
  tienePermiso: (permiso: Permiso) => boolean;
  isAuthenticated: boolean;
  /** true si la sesión se cerró porque el servidor la dio por expirada (no por un cierre voluntario). */
  sesionExpirada: boolean;
  debeCambiarPassword: boolean;
  marcarPasswordCambiada: () => void;
  login: (usuarioLogin: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): StoredSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as StoredSession;
    // Sesiones guardadas antes del módulo de permisos: se descartan para forzar un login nuevo.
    return Array.isArray(session.permisos) ? session : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => readStoredSession());
  const [sesionExpirada, setSesionExpirada] = useState(false);
  const cerrandoSesion = useRef(false);

  // Cualquier 401 con token (sesión expirada o invalidada) cierra la sesión local: ProtectedRoute
  // redirige al login conservando la ruta actual para volver después de ingresar.
  useEffect(() => {
    registrarManejadorSesionExpirada(() => {
      if (cerrandoSesion.current) return;
      setSesionExpirada(true);
      setSession(null);
    });
    return () => registrarManejadorSesionExpirada(null);
  }, []);

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  async function login(usuarioLogin: string, password: string) {
    const { token, rol, nombreCompleto, permisos, debeCambiarPassword } = await authApi.login({ usuarioLogin, password });
    setSesionExpirada(false);
    setSession({ token, rol, nombreCompleto, permisos, debeCambiarPassword });
  }

  async function logout() {
    cerrandoSesion.current = true;
    try {
      if (session) {
        try {
          await authApi.logout(session.token);
        } catch (error) {
          if (!(error instanceof ApiError)) throw error;
        }
      }
      setSesionExpirada(false);
      setSession(null);
    } finally {
      cerrandoSesion.current = false;
    }
  }

  const value: AuthContextValue = {
    token: session?.token ?? null,
    rol: session?.rol ?? null,
    nombreCompleto: session?.nombreCompleto ?? null,
    permisos: session?.permisos ?? [],
    tienePermiso: (permiso) => session?.permisos.includes(permiso) ?? false,
    isAuthenticated: session !== null,
    sesionExpirada,
    debeCambiarPassword: session?.debeCambiarPassword ?? false,
    marcarPasswordCambiada: () => setSession((actual) => (actual ? { ...actual, debeCambiarPassword: false } : actual)),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
