const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type ManejadorSesionExpirada = () => void;
let manejadorSesionExpirada: ManejadorSesionExpirada | null = null;

/** El AuthProvider registra qué hacer cuando el servidor rechaza el token (sesión expirada o invalidada). */
export function registrarManejadorSesionExpirada(manejador: ManejadorSesionExpirada | null) {
  manejadorSesionExpirada = manejador;
}

/** Un 401 con token enviado significa que la sesión ya no es válida; sin token (login) es un error de credenciales. */
export function avisarSiSesionExpirada(status: number, token: string | null | undefined) {
  if (status === 401 && token) {
    manejadorSesionExpirada?.();
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string | null;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    avisarSiSesionExpirada(response.status, token);
    const errorBody = await response.json().catch(() => null);
    throw new ApiError(errorBody?.message ?? `Error ${response.status}`, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/** Arma el query string con los parámetros informados (los vacíos se omiten). */
export function queryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      search.set(clave, String(valor));
    }
  }
  const texto = search.toString();
  return texto ? `?${texto}` : '';
}
