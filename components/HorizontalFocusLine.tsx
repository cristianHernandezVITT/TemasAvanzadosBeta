"use client"

import { useEffect, useRef } from "react"
import { useAccessibility } from "@/hooks/useAccessibility"

export function HorizontalFocusLine() {
  const { preferences } = useAccessibility()
  const isActive = preferences.enfoqueLineaHorizontal
  const overlayTopRef = useRef<HTMLDivElement | null>(null)
  const overlayBottomRef = useRef<HTMLDivElement | null>(null)
  const overlayLeftRef = useRef<HTMLDivElement | null>(null)
  const overlayRightRef = useRef<HTMLDivElement | null>(null)
  const lineRef = useRef<HTMLDivElement | null>(null)

  const createOverlay = (id: string, zIndex: number) => {
    const overlay = document.createElement('div')
    overlay.id = id
    overlay.style.position = 'fixed'
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.75)' // Fondo oscuro
    overlay.style.zIndex = zIndex.toString()
    overlay.style.pointerEvents = 'none'
    overlay.style.transition = 'all 0.1s ease-out'
    return overlay
  }

  useEffect(() => {
    if (!isActive) {
      // Remover todos los overlays y la línea
      if (overlayTopRef.current) {
        overlayTopRef.current.remove()
        overlayTopRef.current = null
      }
      if (overlayBottomRef.current) {
        overlayBottomRef.current.remove()
        overlayBottomRef.current = null
      }
      if (overlayLeftRef.current) {
        overlayLeftRef.current.remove()
        overlayLeftRef.current = null
      }
      if (overlayRightRef.current) {
        overlayRightRef.current.remove()
        overlayRightRef.current = null
      }
      if (lineRef.current) {
        lineRef.current.remove()
        lineRef.current = null
      }
      return
    }

    // Crear overlays para las 4 áreas (arriba, abajo, izquierda, derecha)
    if (!overlayTopRef.current) {
      const overlay = createOverlay('horizontal-focus-overlay-top', 9998)
      document.body.appendChild(overlay)
      overlayTopRef.current = overlay
    }

    if (!overlayBottomRef.current) {
      const overlay = createOverlay('horizontal-focus-overlay-bottom', 9998)
      document.body.appendChild(overlay)
      overlayBottomRef.current = overlay
    }

    if (!overlayLeftRef.current) {
      const overlay = createOverlay('horizontal-focus-overlay-left', 9998)
      document.body.appendChild(overlay)
      overlayLeftRef.current = overlay
    }

    if (!overlayRightRef.current) {
      const overlay = createOverlay('horizontal-focus-overlay-right', 9998)
      document.body.appendChild(overlay)
      overlayRightRef.current = overlay
    }

    // Crear la línea horizontal azul
    if (!lineRef.current) {
      const line = document.createElement('div')
      line.id = 'horizontal-focus-line'
      line.style.position = 'fixed'
      line.style.height = '2px'
      line.style.backgroundColor = '#3b82f6' // Azul
      line.style.zIndex = '9999'
      line.style.pointerEvents = 'none'
      line.style.transition = 'all 0.1s ease-out'
      line.style.boxShadow = '0 0 8px rgba(59, 130, 246, 0.8)'
      document.body.appendChild(line)
      lineRef.current = line
    }

    const handleMouseMove = (e: MouseEvent) => {
      const y = e.clientY
      const windowHeight = window.innerHeight
      const windowWidth = window.innerWidth
      
      // Área enfocada: toda la pantalla horizontalmente, solo una franja vertical
      const focusTop = Math.max(0, y - 30)
      const focusBottom = Math.min(windowHeight, y + 30)

      // Actualizar overlay superior (cubre toda la pantalla incluyendo sidebar)
      if (overlayTopRef.current) {
        overlayTopRef.current.style.top = '0'
        overlayTopRef.current.style.left = '0'
        overlayTopRef.current.style.width = '100%'
        overlayTopRef.current.style.height = `${focusTop}px`
      }

      // Actualizar overlay inferior (cubre toda la pantalla incluyendo sidebar)
      if (overlayBottomRef.current) {
        overlayBottomRef.current.style.top = `${focusBottom}px`
        overlayBottomRef.current.style.left = '0'
        overlayBottomRef.current.style.width = '100%'
        overlayBottomRef.current.style.height = `${windowHeight - focusBottom}px`
      }

      // No necesitamos overlays laterales porque queremos que toda la pantalla horizontal esté visible
      if (overlayLeftRef.current) {
        overlayLeftRef.current.style.display = 'none'
      }

      if (overlayRightRef.current) {
        overlayRightRef.current.style.display = 'none'
      }

      // No mostrar la línea azul
      if (lineRef.current) {
        lineRef.current.style.display = 'none'
      }
    }

    // Inicializar posición
    handleMouseMove({ clientY: window.innerHeight / 2 } as MouseEvent)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', () => {
      handleMouseMove({ clientY: window.innerHeight / 2 } as MouseEvent)
    })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', () => {
        handleMouseMove({ clientY: window.innerHeight / 2 } as MouseEvent)
      })
      
      // Limpiar todos los overlays y la línea
      if (overlayTopRef.current) {
        overlayTopRef.current.remove()
        overlayTopRef.current = null
      }
      if (overlayBottomRef.current) {
        overlayBottomRef.current.remove()
        overlayBottomRef.current = null
      }
      if (overlayLeftRef.current) {
        overlayLeftRef.current.remove()
        overlayLeftRef.current = null
      }
      if (overlayRightRef.current) {
        overlayRightRef.current.remove()
        overlayRightRef.current = null
      }
      if (lineRef.current) {
        lineRef.current.remove()
        lineRef.current = null
      }
    }
  }, [isActive])

  return null
}

