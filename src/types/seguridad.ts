import type { Rol } from './auth';

export type TipoComponente = 'PERMISO' | 'GRUPO';

export interface ComponentePermiso {
  id: number;
  codigo: string;
  descripcion: string | null;
  tipo: TipoComponente;
  hijos: number[];
}

export interface CuentaSeguridad {
  id: number;
  usuarioLogin: string;
  rol: Rol;
  activa: boolean;
  componentes: number[];
  permisos: string[];
}
