"use client"

import { useEffect, useRef } from "react"
import { useAccessibility } from "@/hooks/useAccessibility"

export function SlowClickHandler() {
  const { preferences } = useAccessibility()
  const isActive = preferences.pulsacionLenta
  const minTime = preferences.tiempoPulsacion
  const clickStartTimeRef = useRef<Map<HTMLElement, number>>(new Map())
  const pendingClicksRef = useRef<Map<HTMLElement, () => void>>(new Map())
  const minTimeRef = useRef(minTime)

  // Actualizar la referencia cuando cambie minTime
  useEffect(() => {
    minTimeRef.current = minTime
  }, [minTime])

  useEffect(() => {
    if (!isActive) {
      // Limpiar todos los clicks pendientes si se desactiva
      pendingClicksRef.current.forEach((cancel) => cancel())
      pendingClicksRef.current.clear()
      clickStartTimeRef.current.clear()
      return
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target) return

      // Solo aplicar a botones, enlaces y elementos clickeables
      const isClickable =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.getAttribute('role') === 'button' ||
        target.onclick !== null ||
        target.style.cursor === 'pointer'

      if (!isClickable) return

      const clickableElement = target.closest('button, a, [role="button"]') as HTMLElement || target
      
      // Prevenir el click inmediato
      e.preventDefault()
      e.stopPropagation()

      // Registrar el tiempo de inicio
      const startTime = Date.now()
      clickStartTimeRef.current.set(clickableElement, startTime)

      // Agregar indicador visual
      clickableElement.style.opacity = '0.6'
      clickableElement.style.transition = 'opacity 0.2s'

      // Crear un timeout para el click real usando la referencia actualizada
      const currentMinTime = minTimeRef.current
      const timeoutId = setTimeout(() => {
        const storedStartTime = clickStartTimeRef.current.get(clickableElement)
        const currentTime = minTimeRef.current
        if (storedStartTime && Date.now() - storedStartTime >= currentTime) {
          // Restaurar opacidad
          clickableElement.style.opacity = '1'

          // Disparar el click real
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: e.button,
            buttons: e.buttons,
            clientX: e.clientX,
            clientY: e.clientY,
          })
          clickableElement.dispatchEvent(clickEvent)

          // Limpiar
          clickStartTimeRef.current.delete(clickableElement)
          pendingClicksRef.current.delete(clickableElement)
        }
      }, currentMinTime)

      // Guardar función de cancelación
      pendingClicksRef.current.set(clickableElement, () => {
        clearTimeout(timeoutId)
        clickableElement.style.opacity = '1'
        clickStartTimeRef.current.delete(clickableElement)
      })
    }

    const handleMouseUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target) return

      const clickableElement = target.closest('button, a, [role="button"]') as HTMLElement || target
      const cancel = pendingClicksRef.current.get(clickableElement)

      if (cancel) {
        // Si se suelta antes del tiempo mínimo, cancelar
        cancel()
        pendingClicksRef.current.delete(clickableElement)
        clickableElement.style.opacity = '1'
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Aplicar también a teclas Enter y Space en elementos interactivos
      if (e.key !== 'Enter' && e.key !== ' ') return

      const target = e.target as HTMLElement
      if (!target) return

      const isInteractive =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.getAttribute('role') === 'button' ||
        target.closest('button') ||
        target.closest('a')

      if (!isInteractive) return

      const interactiveElement = target.closest('button, a, [role="button"]') as HTMLElement || target

      e.preventDefault()
      e.stopPropagation()

      const startTime = Date.now()
      clickStartTimeRef.current.set(interactiveElement, startTime)

      interactiveElement.style.opacity = '0.6'
      interactiveElement.style.transition = 'opacity 0.2s'

      const currentMinTime = minTimeRef.current
      const timeoutId = setTimeout(() => {
        const storedStartTime = clickStartTimeRef.current.get(interactiveElement)
        const currentTime = minTimeRef.current
        if (storedStartTime && Date.now() - storedStartTime >= currentTime) {
          interactiveElement.style.opacity = '1'

          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
          })
          interactiveElement.dispatchEvent(clickEvent)

          clickStartTimeRef.current.delete(interactiveElement)
          pendingClicksRef.current.delete(interactiveElement)
        }
      }, currentMinTime)

      pendingClicksRef.current.set(interactiveElement, () => {
        clearTimeout(timeoutId)
        interactiveElement.style.opacity = '1'
        clickStartTimeRef.current.delete(interactiveElement)
      })
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return

      const target = e.target as HTMLElement
      if (!target) return

      const interactiveElement = target.closest('button, a, [role="button"]') as HTMLElement || target
      const cancel = pendingClicksRef.current.get(interactiveElement)

      if (cancel) {
        cancel()
        pendingClicksRef.current.delete(interactiveElement)
        interactiveElement.style.opacity = '1'
      }
    }

    document.addEventListener('mousedown', handleMouseDown, true)
    document.addEventListener('mouseup', handleMouseUp, true)
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keyup', handleKeyUp, true)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true)
      document.removeEventListener('mouseup', handleMouseUp, true)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keyup', handleKeyUp, true)

      // Limpiar todos los clicks pendientes
      pendingClicksRef.current.forEach((cancel) => cancel())
      pendingClicksRef.current.clear()
      clickStartTimeRef.current.clear()
    }
  }, [isActive, minTime])

  return null
}

