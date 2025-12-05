"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { usuario, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !usuario) {
      console.log('No user found, redirecting to login...')
      router.push("/login")
    }
  }, [usuario, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <Spinner className="w-8 h-8 text-blue-600 mb-4" />
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  return <>{children}</>
}
