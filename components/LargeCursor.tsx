"use client"

import { useEffect, useRef } from "react"
import { useAccessibility } from "@/hooks/useAccessibility"

export function LargeCursor() {
  const { preferences } = useAccessibility()
  const isActive = preferences.punteroGrande
  const size = preferences.tamanoPuntero
  const styleRef = useRef<HTMLStyleElement | null>(null)

  useEffect(() => {
    // Limpiar estilos anteriores siempre
    if (styleRef.current && styleRef.current.parentNode) {
      styleRef.current.parentNode.removeChild(styleRef.current)
      styleRef.current = null
    }

    // Limpiar estilos inline
    document.documentElement.style.cursor = ''
    document.body.style.cursor = ''

    if (!isActive) {
      return
    }

    // Crear un cursor personalizado grande
    // Usar un tamaño base más grande para mejor visibilidad
    const cursorSize = Math.round(32 * size) // 32px base * multiplicador
    const hotSpotX = Math.round(cursorSize * 0.1) // Punto de activación cerca de la esquina
    const hotSpotY = Math.round(cursorSize * 0.1)
    
    // Crear SVG escalado correctamente
    const cursorSVG = `<svg width="${cursorSize}" height="${cursorSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="black" stroke="white" stroke-width="2"/>
    </svg>`
    
    // Codificar el SVG correctamente
    const encodedSVG = encodeURIComponent(cursorSVG.replace(/\s+/g, ' ').trim())
    const cursorDataURL = `data:image/svg+xml;charset=utf-8,${encodedSVG}`

    // Crear el estilo con un ID único basado en el tamaño para forzar actualización
    const style = document.createElement('style')
    style.id = `large-cursor-style-${size}`
    styleRef.current = style
    
    style.textContent = `
      * {
        cursor: url("${cursorDataURL}") ${hotSpotX} ${hotSpotY}, auto !important;
      }
      button, a, [role="button"], input, textarea, select, [tabindex], label {
        cursor: url("${cursorDataURL}") ${hotSpotX} ${hotSpotY}, pointer !important;
      }
      [data-slot="button"], [data-slot="link"] {
        cursor: url("${cursorDataURL}") ${hotSpotX} ${hotSpotY}, pointer !important;
      }
      /* Excluir sliders y controles de accesibilidad del cursor grande */
      [role="slider"], [data-slot="slider"], [data-slot="slider-thumb"], [data-slot="slider-track"], [data-slot="slider-range"], .slider-thumb, [class*="slider"] {
        cursor: default !important;
      }
      /* Excluir también elementos dentro de sliders */
      [data-slot="slider"] *, [data-slot="slider-thumb"] *, [data-slot="slider-track"] * {
        cursor: default !important;
      }
    `
    
    document.head.appendChild(style)

    // También aplicar directamente al html y body
    document.documentElement.style.cursor = `url("${cursorDataURL}") ${hotSpotX} ${hotSpotY}, auto`
    document.body.style.cursor = `url("${cursorDataURL}") ${hotSpotX} ${hotSpotY}, auto`

    return () => {
      document.documentElement.style.cursor = ''
      document.body.style.cursor = ''
      if (styleRef.current && styleRef.current.parentNode) {
        styleRef.current.parentNode.removeChild(styleRef.current)
        styleRef.current = null
      }
    }
  }, [isActive, size])

  return null
}

