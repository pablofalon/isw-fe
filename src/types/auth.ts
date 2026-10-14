export type Rol = 'USUARIO' | 'OPERADOR' | 'ADMINISTRADOR';

/** Códigos de permiso que define el backend (org.proyecto.business.Permisos). */
export type Permiso =
  | 'TICKET_CREAR'
  | 'TICKET_VER_PROPIOS'
  | 'TICKET_VER_TODOS'
  | 'TICKET_REENVIAR'
  | 'TICKET_VALIDAR_RESOLUCION'
  | 'TICKET_REABRIR_PROPIO'
  | 'TICKET_CLASIFICAR'
  | 'TICKET_ASIGNAR'
  | 'TICKET_RESOLVER'
  | 'TICKET_REABRIR_OPERATIVO'
  | 'TICKET_GESTIONAR_TODOS'
  | 'SEGURIDAD_ADMINISTRAR'
  | 'USUARIOS_ADMINISTRAR';

/** Permisos que habilitan la bandeja operativa (alcanza con cualquiera de ellas). */
export const PERMISOS_BANDEJA: Permiso[] = ['TICKET_CLASIFICAR', 'TICKET_ASIGNAR', 'TICKET_RESOLVER'];

export interface LoginCredentials {
  usuarioLogin: string;
  password: string;
}

export interface Session {
  token: string;
  rol: Rol;
  nombreCompleto: string;
  permisos: Permiso[];
  /** Contraseña temporal (alta o blanqueo): hasta cambiarla, el backend rechaza el resto de las operaciones. */
  debeCambiarPassword: boolean;
}
