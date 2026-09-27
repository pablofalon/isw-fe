export type Rol = 'USUARIO' | 'OPERADOR' | 'ADMINISTRADOR';

export interface LoginCredentials {
  usuarioLogin: string;
  password: string;
}

export interface Session {
  token: string;
  rol: Rol;
  nombreCompleto: string;
}
