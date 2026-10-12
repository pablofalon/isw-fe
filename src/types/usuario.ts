import type { Rol } from './auth';

export interface Usuario {
  id: number;
  usuarioLogin: string;
  tipo: Rol;
  activa: boolean;
  bloqueadaPorIntentos: boolean;
  debeCambiarPassword: boolean;
  fechaUltimoAcceso: string | null;
  nombre: string;
  apellido: string;
  correoElectronico: string;
  telefono: string | null;
  area: string | null;
  cargo: string | null;
  grupos: string[];
}

export interface DatosPersonaInput {
  nombre: string;
  apellido: string;
  correoElectronico: string;
  telefono?: string;
  area?: string;
  cargo?: string;
}

export interface AltaUsuarioInput extends DatosPersonaInput {
  tipo: Rol;
  usuarioLogin: string;
  passwordTemporal: string;
}
