"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Rol, Modulo, RolModulo } from "@/lib/types/roles-modules"
import { useAuth } from "@/hooks/useAuth"

interface CreateRoleData {
  nombre: string
  descripcion?: string
  activo?: boolean
  modulosSeleccionados?: string[] // Array de IDs de módulos
}

interface UpdateRoleData {
  nombre?: string
  descripcion?: string
  activo?: boolean
  modulosSeleccionados?: string[] // Array de IDs de módulos
}

interface DeleteRoleResult {
  success: boolean
  hasActiveUsers?: boolean
  hasInactiveUsers?: boolean
}

interface RolesModulesContextType {
  roles: Rol[]
  modulos: Modulo[]
  rolesModulos: RolModulo[]
  isLoading: boolean
  loadRoles: () => Promise<void>
  loadModulos: () => Promise<void>
  loadRolesModulos: () => Promise<void>
  getModulosByUsuario: (usuarioId: string) => Modulo[]
  getModulosByRol: (rolId: string) => Modulo[]
  hasAccessToModulo: (usuarioId: string, ruta: string) => boolean
  createRole: (roleData: CreateRoleData) => Promise<boolean>
  updateRole: (id: string, roleData: UpdateRoleData) => Promise<boolean>
  deleteRole: (id: string) => Promise<DeleteRoleResult>
}

const RolesModulesContext = createContext<RolesModulesContextType | undefined>(undefined)

export function RolesModulesProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<Rol[]>([])
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [rolesModulos, setRolesModulos] = useState<RolModulo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { usuario } = useAuth()

  const loadRoles = async () => {
    try {
      // Intentar cargar desde la vista roles_audit primero
      const { data: auditData, error: auditError } = await supabase
        .from('roles_audit')
        .select('*')
        .order('nombre')

      if (!auditError) {
        setRoles(auditData || [])
        return
      }

      // Si la vista no existe, cargar desde la tabla roles
      console.warn('Vista roles_audit no encontrada, cargando desde tabla roles:', auditError.message)
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('nombre')

      if (error) {
        console.error('Error loading roles:', error)
        return
      }

      setRoles(data || [])
    } catch (error) {
      console.error('Error loading roles:', error)
    }
  }

  const loadModulos = async () => {
    try {
      const { data, error } = await supabase
        .from('modulos')
        .select('*')
        .order('orden', { ascending: true })

      if (error) {
        console.error('Error loading modulos:', error)
        return
      }

      setModulos(data || [])
    } catch (error) {
      console.error('Error loading modulos:', error)
    }
  }

  const loadRolesModulos = async () => {
    try {
      const { data, error } = await supabase
        .from('roles_modulos')
        .select('*')

      if (error) {
        console.error('Error loading roles_modulos:', error)
        return
      }

      setRolesModulos(data || [])
    } catch (error) {
      console.error('Error loading roles_modulos:', error)
    }
  }

  const getModulosByUsuario = useCallback((usuarioId: string): Modulo[] => {
    // Esta función necesita obtener el rol_id del usuario y luego
    // filtrar los módulos basándose en roles_modulos
    
    // Por ahora, vamos a hacer una implementación que funcione
    // Necesitamos obtener el rol_id del usuario desde el contexto de auth
    // o desde la tabla usuarios
    
    // Implementación temporal: retornar todos los módulos
    // Esto debería ser reemplazado por la lógica real de permisos
    return modulos.filter(modulo => modulo.activo)
  }, [modulos])

  // Nueva función que recibe el rol_id directamente
  const getModulosByRol = useCallback((rolId: string): Modulo[] => {
    if (!rolId) return []
    
    // Obtener los módulos asignados a este rol
    const modulosDelRol = rolesModulos
      .filter(rm => rm.rol_id === rolId)
      .map(rm => rm.modulo_id)
    
    // Filtrar los módulos activos que están asignados al rol
    return modulos.filter(modulo => 
      modulo.activo && modulosDelRol.includes(modulo.id)
    )
  }, [modulos, rolesModulos])

  const hasAccessToModulo = useCallback((usuarioId: string, ruta: string): boolean => {
    const modulosUsuario = getModulosByUsuario(usuarioId)
    return modulosUsuario.some(modulo => modulo.ruta === ruta)
  }, [getModulosByUsuario])

  const createRole = async (roleData: CreateRoleData): Promise<boolean> => {
    try {
      // Usar el usuario actual del contexto de auth
      const usuarioId = usuario?.id || null

      // Crear el rol
      const { data: newRole, error: roleError } = await supabase
        .from('roles')
        .insert({
          nombre: roleData.nombre,
          descripcion: roleData.descripcion,
          activo: roleData.activo !== false,
          creado_por: usuarioId,
          modificado_por: usuarioId
        })
        .select()
        .single()

      if (roleError) {
        console.error('Error creating role:', roleError)
        return false
      }

      // Asignar módulos al rol si se proporcionaron
      if (roleData.modulosSeleccionados && roleData.modulosSeleccionados.length > 0) {
        const rolesModulosData = roleData.modulosSeleccionados.map(moduloId => ({
          rol_id: newRole.id,
          modulo_id: moduloId
        }))

        const { error: rolesModulosError } = await supabase
          .from('roles_modulos')
          .insert(rolesModulosData)

        if (rolesModulosError) {
          console.error('Error assigning modules to role:', rolesModulosError)
          // No retornamos false aquí porque el rol ya se creó
        }
      }

      await loadRoles()
      await loadRolesModulos()
      return true
    } catch (error) {
      console.error('Error creating role:', error)
      return false
    }
  }

  const updateRole = async (id: string, roleData: UpdateRoleData): Promise<boolean> => {
    try {
      // Usar el usuario actual del contexto de auth
      const usuarioId = usuario?.id || null

      // Actualizar el rol
      const updateData: any = {}
      
      if (roleData.nombre !== undefined) updateData.nombre = roleData.nombre
      if (roleData.descripcion !== undefined) updateData.descripcion = roleData.descripcion
      if (roleData.activo !== undefined) updateData.activo = roleData.activo
      updateData.modificado_por = usuarioId

      const { error: roleError } = await supabase
        .from('roles')
        .update(updateData)
        .eq('id', id)

      if (roleError) {
        console.error('Error updating role:', roleError)
        return false
      }

      // Actualizar módulos del rol si se proporcionaron
      if (roleData.modulosSeleccionados !== undefined) {
        // Eliminar módulos existentes
        const { error: deleteError } = await supabase
          .from('roles_modulos')
          .delete()
          .eq('rol_id', id)

        if (deleteError) {
          console.error('Error deleting existing role modules:', deleteError)
          return false
        }

        // Insertar nuevos módulos
        if (roleData.modulosSeleccionados.length > 0) {
          const rolesModulosData = roleData.modulosSeleccionados.map(moduloId => ({
            rol_id: id,
            modulo_id: moduloId
          }))

          const { error: insertError } = await supabase
            .from('roles_modulos')
            .insert(rolesModulosData)

          if (insertError) {
            console.error('Error inserting new role modules:', insertError)
            return false
          }
        }
      }

      await loadRoles()
      await loadRolesModulos()
      return true
    } catch (error) {
      console.error('Error updating role:', error)
      return false
    }
  }

  const deleteRole = async (id: string): Promise<DeleteRoleResult> => {
    try {
      // Verificar si el rol está siendo usado por usuarios activos
      const { data: usuariosActivos, error: usuariosActivosError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('rol_id', id)
        .eq('activo', true)
        .limit(1)

      if (usuariosActivosError) {
        console.error('Error checking active users for role:', usuariosActivosError)
        return { success: false }
      }

      // Si hay usuarios activos, no se puede eliminar
      if (usuariosActivos && usuariosActivos.length > 0) {
        console.error('Cannot delete role: it is being used by active users')
        return { 
          success: false, 
          hasActiveUsers: true,
          hasInactiveUsers: false
        }
      }

      // Verificar si hay usuarios inactivos
      const { data: usuariosInactivos, error: usuariosInactivosError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('rol_id', id)
        .eq('activo', false)
        .limit(1)

      if (usuariosInactivosError) {
        console.error('Error checking inactive users for role:', usuariosInactivosError)
        return { success: false }
      }

      const hasInactiveUsers = usuariosInactivos && usuariosInactivos.length > 0

      // Si hay usuarios inactivos, primero actualizar sus referencias antes de eliminar el rol
      if (hasInactiveUsers) {
        // Opción 1: Actualizar usuarios inactivos para que no tengan rol asignado
        // Primero necesitamos verificar si hay un rol por defecto o establecer NULL
        // Por ahora, vamos a actualizar a NULL si la columna lo permite
        const { error: updateError } = await supabase
          .from('usuarios')
          .update({ rol_id: null })
          .eq('rol_id', id)
          .eq('activo', false)

        if (updateError) {
          console.error('Error updating inactive users before role deletion:', updateError)
          // Si no se puede actualizar (probablemente por constraints), no se puede eliminar
          return { 
            success: false, 
            hasActiveUsers: false,
            hasInactiveUsers: true
          }
        }
      }

      // Eliminar el rol (ahora es seguro porque no hay referencias activas)
      const { error, data } = await supabase
        .from('roles')
        .delete()
        .eq('id', id)
        .select()

      if (error) {
        console.error('Error deleting role:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return { success: false }
      }

      await loadRoles()
      return { 
        success: true, 
        hasActiveUsers: false,
        hasInactiveUsers: hasInactiveUsers 
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      return { success: false }
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      await Promise.all([loadRoles(), loadModulos(), loadRolesModulos()])
      setIsLoading(false)
    }
    fetchData()
  }, [])

  return (
    <RolesModulesContext.Provider value={{
      roles,
      modulos,
      rolesModulos,
      isLoading,
      loadRoles,
      loadModulos,
      loadRolesModulos,
      getModulosByUsuario,
      getModulosByRol,
      hasAccessToModulo,
      createRole,
      updateRole,
      deleteRole
    }}>
      {children}
    </RolesModulesContext.Provider>
  )
}

export function useRolesModules() {
  const context = useContext(RolesModulesContext)
  if (context === undefined) {
    throw new Error('useRolesModules must be used within a RolesModulesProvider')
  }
  return context
}
