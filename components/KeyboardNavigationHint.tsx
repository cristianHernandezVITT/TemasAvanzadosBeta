"use client"

import { Keyboard, Info, X, ArrowLeftRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useArrowNavigation } from "@/hooks/useArrowNavigation"

const STORAGE_KEY = 'keyboard-navigation-hint-visible'

export function KeyboardNavigationHint() {
  const [isVisible, setIsVisible] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { currentZone, toggleZone, isActive } = useArrowNavigation()

  // Cargar estado desde localStorage al montar
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setIsVisible(stored === 'true')
    }
  }, [])

  // Guardar estado en localStorage cuando cambie
  const handleToggle = (visible: boolean) => {
    setIsVisible(visible)
    localStorage.setItem(STORAGE_KEY, visible.toString())
  }

  // Evitar hidratación incorrecta
  if (!mounted) {
    return null
  }

  // Si está oculto, mostrar botón pequeño para volver a mostrarlo
  if (!isVisible) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="fixed top-4 right-4 z-40 pointer-events-auto">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-background/95 backdrop-blur-sm border-primary/20 shadow-lg hover:bg-accent/90"
                onClick={() => handleToggle(true)}
                aria-label="Mostrar indicador de navegación por teclado"
              >
                <Keyboard className="h-4 w-4 text-primary" aria-hidden="true" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">Mostrar ayuda de navegación</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <div className="fixed top-4 right-4 z-40 pointer-events-auto max-w-xs flex flex-col gap-2">
        {/* Indicador de zona actual */}
        <div className="bg-background/95 backdrop-blur-sm border border-primary/20 shadow-lg rounded-lg p-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs font-medium text-muted-foreground">
              Zona: <span className="text-foreground font-semibold">
                {currentZone === 'sidebar' ? 'Barra lateral' : 'Contenido principal'}
              </span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 ml-auto text-xs hover:bg-primary/10"
              onClick={toggleZone}
              aria-label="Cambiar zona de navegación"
            >
              <ArrowLeftRight className="h-3 w-3 mr-1" />
              Tab
            </Button>
          </div>
        </div>

        {/* Panel de ayuda */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-background/95 backdrop-blur-sm border border-primary/20 shadow-lg rounded-lg p-2 group hover:bg-accent/90 transition-colors cursor-help">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium text-foreground">Navegación por teclado</span>
                <Info className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" aria-hidden="true" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-auto shrink-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggle(false)
                  }}
                  aria-label="Ocultar indicador de navegación"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-sm p-5 bg-popover border-2 border-border shadow-xl">
            <div className="space-y-4">
              <p className="font-bold text-base text-foreground">Navegación Espacial por Teclado</p>
              
              <div className="space-y-3 text-sm">
                {/* Cambiar zona */}
                <div className="p-2 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-3">
                    <kbd className="px-3 py-1.5 bg-primary/20 border border-primary/30 rounded-md text-sm font-mono font-semibold text-primary">Tab</kbd>
                    <span className="font-medium">Cambiar zona (Sidebar ↔ Contenido)</span>
                  </div>
                </div>

                {/* Navegación vertical */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-2.5 py-1.5 bg-muted border border-border rounded-md text-sm font-mono font-semibold min-w-[2rem] text-center">↑</kbd>
                    <kbd className="px-2.5 py-1.5 bg-muted border border-border rounded-md text-sm font-mono font-semibold min-w-[2rem] text-center">↓</kbd>
                  </div>
                  <span className="font-medium">Navegar arriba/abajo</span>
                </div>

                {/* Navegación horizontal */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-2.5 py-1.5 bg-muted border border-border rounded-md text-sm font-mono font-semibold min-w-[2rem] text-center">←</kbd>
                    <kbd className="px-2.5 py-1.5 bg-muted border border-border rounded-md text-sm font-mono font-semibold min-w-[2rem] text-center">→</kbd>
                  </div>
                  <span className="font-medium">Navegar izquierda/derecha</span>
                </div>

                {/* Activar */}
                <div className="flex items-center gap-3">
                  <kbd className="px-3 py-1.5 bg-muted border border-border rounded-md text-sm font-mono font-semibold">Enter</kbd>
                  <span className="font-medium">Activar elemento</span>
                </div>

                {/* Desactivar */}
                <div className="flex items-center gap-3">
                  <kbd className="px-3 py-1.5 bg-muted border border-border rounded-md text-sm font-mono font-semibold">Esc</kbd>
                  <span className="font-medium">Desactivar navegación</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  La navegación es espacial: se mueve al elemento más cercano en la dirección indicada.
                </p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

