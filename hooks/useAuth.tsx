"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { hashPassword, verifyPassword } from "@/lib/auth"
import { useAccessibility } from "./useAccessibility"
import { Rol } from "@/lib/types/roles-modules"

interface CreateUserData {
  numero_empleado: string | number
  nombre: string
  apellidos: string
  curp: string
  horario?: string
  telefono?: string
  rol_id: string
  activo: boolean
  password: string
}

interface UpdateUserData {
  numero_empleado?: string | number
  nombre?: string
  apellidos?: string
  curp?: string
  horario?: string
  telefono?: string
  rol_id?: string
  activo?: boolean
  password?: string
}

interface Usuario {
  id: string
  numero_empleado: number
  nombre: string
  apellidos: string
  curp: string
  horario?: string
  telefono?: string
  rol_id?: string
  rol_nombre?: string
  activo: boolean
  password_hash?: string
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

interface AuthContextType {
  usuario: Usuario | null
  login: (numeroEmpleado: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  createUser: (userData: CreateUserData) => Promise<boolean>
  updateUser: (id: string, userData: UpdateUserData) => Promise<boolean>
  deleteUser: (id: string) => Promise<boolean>
  usuarios: Usuario[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay un usuario logueado en localStorage
    const checkStoredUser = () => {
      // Solo ejecutar en el cliente
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }
      
      try {
        const storedUser = localStorage.getItem('usuario')
        if (storedUser) {
          setUsuario(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error('Error loading stored user:', error)
        localStorage.removeItem('usuario')
      }
      setIsLoading(false)
    }

    checkStoredUser()
  }, [])

  const login = async (numeroEmpleado: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      // Convertir string a número
      const numeroEmpleadoInt = parseInt(numeroEmpleado)
      if (isNaN(numeroEmpleadoInt)) {
        console.error('Número de empleado inválido')
        setIsLoading(false)
        return false
      }
      

      // Buscar usuario por número de empleado y obtener rol_nombre
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('numero_empleado', numeroEmpleadoInt)
        .eq('activo', true)
        .single()

      if (userError || !userData) {
        console.error('Usuario no encontrado:', userError)
        setIsLoading(false)
        return false
      }

      // Obtener nombre del rol
      let rolNombre = 'Sin rol'
      if (userData.rol_id) {
        const { data: rolData } = await supabase
          .from('roles')
          .select('nombre')
          .eq('id', userData.rol_id)
          .single()
        
        if (rolData) {
          rolNombre = rolData.nombre
        }
      }

      const data = { ...userData, rol_nombre: rolNombre }

      // Verificar contraseña
      if (!data.password_hash) {
        console.error('Usuario sin contraseña configurada')
        setIsLoading(false)
        return false
      }

      const isValidPassword = await verifyPassword(password, data.password_hash)
      if (!isValidPassword) {
        console.error('Contraseña incorrecta')
        console.log(isValidPassword)
        console.log(password, data.password_hash)
        setIsLoading(false)
        return false
      }

      // Guardar usuario en estado y localStorage
      setUsuario(data)
      if (typeof window !== 'undefined') {
        localStorage.setItem('usuario', JSON.stringify(data))
        // Establecer tema a "system" por defecto al iniciar sesión
        localStorage.setItem('theme', 'system')
        // Disparar evento personalizado para que ThemeProvider actualice el tema
        window.dispatchEvent(new CustomEvent('theme-changed'))
      }
      
      // Registrar en audit trail
      try {
        await supabase.from('audit_trail').insert([{
          modulo: 'Login',
          accion: 'login',
          entidad: 'Sesión',
          entidad_id: data.id,
          usuario_id: data.id,
          usuario_nombre: data.nombre,
          usuario_apellidos: data.apellidos,
          numero_empleado: data.numero_empleado.toString(),
          detalles: {
            numero_empleado: data.numero_empleado,
            nombre: data.nombre,
            rol: data.rol_nombre || 'Sin rol'
          }
        }])
      } catch (auditError) {
        console.error('Error creating audit entry for login:', auditError)
      }
      
      setIsLoading(false)
      return true

    } catch (error) {
      console.error('Error during login:', error)
      setIsLoading(false)
      return false
    }
  }

  const logout = async () => {
  try {
    // audit trail...
    setUsuario(null)
    localStorage.removeItem('usuario')
    router.push("/login")
  } catch (error) {
    setUsuario(null)
    localStorage.removeItem('usuario')
    router.push("/login")
  }
}


  const loadUsuarios = async () => {
    try {
      // Intentar cargar desde usuarios_audit primero
      const { data: auditData, error: auditError } = await supabase
        .from('usuarios_audit')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false })

      if (!auditError) {
        // Obtener rol_nombre desde roles_modulos si está disponible
        const usuariosConRol = auditData?.map(usuario => ({
          ...usuario,
          rol_nombre: usuario.rol_nombre || 'Sin rol'
        })) || []
        setUsuarios(usuariosConRol)
        return
      }

      // Si la vista no existe, cargar desde la tabla usuarios directamente
      console.warn('Vista usuarios_audit no encontrada, cargando desde tabla usuarios')
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading usuarios:', error)
        return
      }

      // Mapear los datos para incluir rol_nombre
      const usuariosConRol = data?.map(usuario => ({
        ...usuario,
        rol_nombre: 'Sin rol' // Valor por defecto
      })) || []

      setUsuarios(usuariosConRol)
    } catch (error) {
      console.error('Error en loadUsuarios:', error)
    }
  }

  useEffect(() => {
    if (usuario) {
      loadUsuarios()
    }
  }, [usuario])

  const createUser = async (userData: CreateUserData): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      // Hashear la contraseña
      const passwordHash = await hashPassword(userData.password)

      // Convertir numero_empleado a número si viene como string
      const numeroEmpleado = typeof userData.numero_empleado === 'string' 
        ? parseInt(userData.numero_empleado) 
        : userData.numero_empleado

      if (isNaN(numeroEmpleado)) {
        console.error('Número de empleado inválido')
        setIsLoading(false)
        return false
      }

      // Crear usuario en la base de datos con auditoría
      const { error } = await supabase
        .from('usuarios')
        .insert({
          numero_empleado: numeroEmpleado,
          nombre: userData.nombre,
          apellidos: userData.apellidos,
          curp: userData.curp,
          horario: userData.horario,
          telefono: userData.telefono,
          password_hash: passwordHash,
          rol_id: userData.rol_id,
          activo: userData.activo,
          creado_por: usuario?.id, // Usuario actual que crea
          modificado_por: usuario?.id // Usuario actual que crea
        })

      if (error) {
        console.error('Error creating usuario:', error)
        setIsLoading(false)
        return false
      }

      // Recargar lista de usuarios
      await loadUsuarios()
      setIsLoading(false)
      return true

    } catch (error) {
      console.error('Error creating user:', error)
      setIsLoading(false)
      return false
    }
  }

  const updateUser = async (id: string, userData: UpdateUserData): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const updateData: any = {
        nombre: userData.nombre,
        apellidos: userData.apellidos,
        curp: userData.curp,
        horario: userData.horario,
        telefono: userData.telefono,
        rol_id: userData.rol_id,
        activo: userData.activo,
        modificado_por: usuario?.id // Usuario actual que modifica
      }

      // Convertir numero_empleado a número si viene como string
      if (userData.numero_empleado !== undefined) {
        const numeroEmpleado = typeof userData.numero_empleado === 'string' 
          ? parseInt(userData.numero_empleado) 
          : userData.numero_empleado

        if (isNaN(numeroEmpleado)) {
          console.error('Número de empleado inválido')
          setIsLoading(false)
          return false
        }
        updateData.numero_empleado = numeroEmpleado
      }

      // Si se proporciona una nueva contraseña, hashearla
      if (userData.password) {
        updateData.password_hash = await hashPassword(userData.password)
      }

      const { error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.error('Error updating usuario:', error)
        setIsLoading(false)
        return false
      }

      // Recargar lista de usuarios
      await loadUsuarios()
      setIsLoading(false)
      return true

    } catch (error) {
      console.error('Error updating user:', error)
      setIsLoading(false)
      return false
    }
  }

  const deleteUser = async (id: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: false })
        .eq('id', id)

      if (error) {
        console.error('Error deleting usuario:', error)
        setIsLoading(false)
        return false
      }

      // Recargar lista de usuarios
      await loadUsuarios()
      setIsLoading(false)
      return true

    } catch (error) {
      console.error('Error deleting user:', error)
      setIsLoading(false)
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, isLoading, createUser, updateUser, deleteUser, usuarios }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}