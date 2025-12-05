"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { KeyboardNavigationHint } from "@/components/KeyboardNavigationHint"
import { ResetZoomButton } from "@/components/ResetZoomButton"
import { useArrowNavigation } from "@/hooks/useArrowNavigation"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Inicializar navegación por flechas global
  useArrowNavigation()
  
  // Si estamos en la página de login, no mostrar sidebar
  if (pathname === "/login") {
    return <>{children}</>
  }
  
  // Para todas las demás páginas, mostrar con sidebar
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main 
        data-nav-zone="main"
        className="flex-1 p-3 md:p-6 overflow-auto max-h-screen w-full md:w-auto"
      >
        {children}
      </main>
      <KeyboardNavigationHint />
      <ResetZoomButton />
    </div>
  )
}
