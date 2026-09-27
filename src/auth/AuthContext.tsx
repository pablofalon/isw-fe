import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { ApiError } from '../api/http';
import type { Rol } from '../types/auth';

const STORAGE_KEY = 'sistematicket.session';

interface StoredSession {
  token: string;
  rol: Rol;
  nombreCompleto: string;
}

interface AuthContextValue {
  token: string | null;
  rol: Rol | null;
  nombreCompleto: string | null;
  isAuthenticated: boolean;
  login: (usuarioLogin: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): StoredSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => readStoredSession());

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  async function login(usuarioLogin: string, password: string) {
    const { token, rol, nombreCompleto } = await authApi.login({ usuarioLogin, password });
    setSession({ token, rol, nombreCompleto });
  }

  async function logout() {
    if (session) {
      try {
        await authApi.logout(session.token);
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
      }
    }
    setSession(null);
  }

  const value: AuthContextValue = {
    token: session?.token ?? null,
    rol: session?.rol ?? null,
    nombreCompleto: session?.nombreCompleto ?? null,
    isAuthenticated: session !== null,
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
