'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'
import { useTheme } from 'next-themes'

function ThemeClassManager({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()
  const isProcessing = React.useRef(false)
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Si no hay tema guardado, establecer "system" por defecto
    const storedTheme = localStorage.getItem('theme')
    if (!storedTheme) {
      setTheme('system')
      return
    }
    
    if (isProcessing.current) return
    
    isProcessing.current = true
    
    // Usar requestAnimationFrame para ejecutar después del render
    requestAnimationFrame(() => {
      const root = document.documentElement
      
      // SIEMPRE remover todas las clases de tema primero
      root.classList.remove('light', 'dark', 'grayscale', 'colorblind', 'daltonismo-general')
      
      // Solo agregar clases si el usuario seleccionó explícitamente un tema
      if (theme === 'light') {
        root.classList.add('light')
      } else if (theme === 'dark') {
        root.classList.add('dark')
      } else if (theme === 'grayscale') {
        root.classList.add('grayscale')
      } else if (theme === 'colorblind') {
        root.classList.add('colorblind')
      } else if (theme === 'daltonismo-general') {
        root.classList.add('daltonismo-general')
      }
      // Si theme === 'system' o undefined, NO agregamos ninguna clase
      // Esto hace que use :root (colores originales del sistema)
      
      isProcessing.current = false
    })
  }, [theme, setTheme])
  
  // Escuchar cambios en localStorage para actualizar el tema cuando se inicie sesión
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        setTheme(e.newValue as 'light' | 'dark' | 'system' | 'grayscale' | 'colorblind' | 'daltonismo-general')
      }
    }
    
    // Escuchar eventos de storage (cuando se cambia desde otra pestaña)
    window.addEventListener('storage', handleStorageChange)
    
    // Escuchar eventos personalizados (cuando se cambia desde la misma pestaña)
    const handleCustomStorageChange = () => {
      const storedTheme = localStorage.getItem('theme')
      if (storedTheme && storedTheme !== theme) {
        setTheme(storedTheme as 'light' | 'dark' | 'system' | 'grayscale' | 'colorblind' | 'daltonismo-general')
      }
    }
    
    window.addEventListener('theme-changed', handleCustomStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('theme-changed', handleCustomStorageChange)
    }
  }, [theme, setTheme])
  
  return <>{children}</>
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      {...props}
      attribute="class"
      enableSystem={true}
      disableTransitionOnChange
      storageKey="theme"
    >
      <ThemeClassManager>{children}</ThemeClassManager>
    </NextThemesProvider>
  )
}
