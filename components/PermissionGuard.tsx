"use client"

import { useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useRolesModules } from "@/hooks/useRolesModules"

interface PermissionGuardProps {
  children: ReactNode
  requiredRoute: string
}

export function PermissionGuard({ children, requiredRoute }: PermissionGuardProps) {
  const { usuario, isLoading: isAuthLoading } = useAuth()
  const { getModulosByRol, isLoading: isRolesLoading } = useRolesModules()
  const router = useRouter()

  useEffect(() => {
    if (isAuthLoading || isRolesLoading) return

    if (!usuario) {
      router.push("/login")
      return
    }

    // Obtener módulos del usuario basándose en su rol
    const modulosUsuario = usuario.rol_id ? getModulosByRol(usuario.rol_id) : []
    const hasPermission = modulosUsuario.some(modulo => modulo.ruta === requiredRoute)

    if (!hasPermission) {
      console.warn(`User ${usuario.numero_empleado} (${usuario.nombre}) does not have permission for ${requiredRoute}. Redirecting.`)
      router.push("/") // Redirect to dashboard
    }
  }, [usuario, isAuthLoading, isRolesLoading, getModulosByRol, requiredRoute, router])

  if (isAuthLoading || isRolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando permisos...</p>
        </div>
      </div>
    )
  }

  // If user is not logged in, AuthGuard will handle redirection
  if (!usuario) {
    return null
  }

  // Obtener módulos del usuario basándose en su rol
  const modulosUsuario = usuario.rol_id ? getModulosByRol(usuario.rol_id) : []
  const hasPermission = modulosUsuario.some(modulo => modulo.ruta === requiredRoute)

  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-6">
            No tienes permisos para acceder a esta sección del sistema.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}