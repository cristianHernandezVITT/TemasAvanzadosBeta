// Interfaces para el sistema de roles y módulos
export interface Rol {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
  creado_por?: string
  modificado_por?: string
  created_at: string
  updated_at: string
  // Campos de auditoría de la vista
  creado_por_numero_empleado?: number
  creado_por_nombre?: string
  creado_por_apellidos?: string
  modificado_por_numero_empleado?: number
  modificado_por_nombre?: string
  modificado_por_apellidos?: string
}

export interface Modulo {
  id: string
  nombre: string
  descripcion?: string
  ruta: string
  icono?: string
  orden: number
  activo: boolean
  created_at: string
  updated_at: string
}

export interface RolModulo {
  id: string
  rol_id: string
  modulo_id: string
  created_at: string
}

export interface UsuarioModulo {
  usuario_id: string
  numero_empleado: number
  usuario_nombre: string
  usuario_apellidos: string
  rol_nombre: string
  modulo_nombre: string
  modulo_ruta: string
  modulo_icono?: string
  modulo_orden: number
}

export interface ModuloPermiso {
  modulo: Modulo
  tieneAcceso: boolean
}
