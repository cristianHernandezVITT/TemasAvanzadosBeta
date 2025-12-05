"use client"

import * as React from "react"
import { Moon, Sun, Palette, Eye } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  // Evitar hidratación incorrecta
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Escuchar eventos de voz para abrir/cerrar el dropdown
  React.useEffect(() => {
    const handleOpenTemas = () => {
      console.log("Evento: abrir temas")
      setIsOpen(true)
    }

    const handleCloseTemas = () => {
      console.log("Evento: cerrar temas")
      setIsOpen(false)
    }

    window.addEventListener("voice-open-temas", handleOpenTemas)
    window.addEventListener("voice-close-temas", handleCloseTemas)

    return () => {
      window.removeEventListener("voice-open-temas", handleOpenTemas)
      window.removeEventListener("voice-close-temas", handleCloseTemas)
    }
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-5 w-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-inherit hover:opacity-80"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Cambiar tema</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Temas</p>
          </TooltipContent>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setTheme("light"); setIsOpen(false); }}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Claro</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setTheme("dark"); setIsOpen(false); }}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Oscuro</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setTheme("system"); setIsOpen(false); }}>
              <span className="mr-2 h-4 w-4">💻</span>
              <span>Sistema</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setTheme("grayscale"); setIsOpen(false); }}>
              <Palette className="mr-2 h-4 w-4" />
              <span>Escala de Grises</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setTheme("colorblind"); setIsOpen(false); }}>
              <Eye className="mr-2 h-4 w-4" />
              <span>Accesible para Daltónicos</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setTheme("daltonismo-general"); setIsOpen(false); }}>
              <Palette className="mr-2 h-4 w-4" />
              <span>Daltonismo general</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  )
}
