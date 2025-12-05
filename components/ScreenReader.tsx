'use client'

import { useEffect } from 'react'
import { useAccessibility } from '@/hooks/useAccessibility'
import { usePathname } from 'next/navigation'

export function ScreenReader() {
  const { preferences } = useAccessibility()
  const pathname = usePathname()
  const isActive = preferences.lecturaVozAlta
  const speechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null
  const volumen = preferences.volumenAmplificacion / 100 // Convertir de 0-100 a 0-1

  useEffect(() => {
    if (!isActive || !speechSynthesis) return

    let currentUtterance: SpeechSynthesisUtterance | null = null

    const getElementText = (element: Element): string => {
      // Obtener texto del elemento
      const text = element.textContent?.trim() || ''
      
      // Si es un botón, obtener el aria-label o el texto
      if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
        return element.getAttribute('aria-label') || text || 'Botón'
      }
      
      // Si es un input, obtener el label o placeholder
      if (element.tagName === 'INPUT') {
        const input = element as HTMLInputElement
        const label = document.querySelector(`label[for="${input.id}"]`)
        return label?.textContent?.trim() || input.placeholder || input.value || 'Campo de entrada'
      }
      
      // Si tiene aria-label, usarlo
      const ariaLabel = element.getAttribute('aria-label')
      if (ariaLabel) return ariaLabel
      
      // Si tiene title, usarlo
      const title = element.getAttribute('title')
      if (title) return title
      
      // Devolver el texto del elemento
      return text
    }

    const speak = (text: string) => {
      // Cancelar cualquier lectura anterior
      if (currentUtterance) {
        speechSynthesis.cancel()
      }

      if (!text) return

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'es-ES'
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = volumen // Usar el volumen configurado

      currentUtterance = utterance
      speechSynthesis.speak(utterance)
    }

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as Element
      if (!target) return

      const text = getElementText(target)
      if (text) {
        speak(text)
      }
    }

    const handleMouseLeave = () => {
      // Cancelar la lectura al salir del elemento
      if (speechSynthesis) {
        speechSynthesis.cancel()
      }
    }

    // Función para verificar si un elemento está dentro de un modal cerrado
    const isInClosedModal = (element: Element | Node): boolean => {
      // Asegurarse de que el elemento sea un HTMLElement
      if (!(element instanceof HTMLElement)) {
        return false
      }
      
      let current: HTMLElement | null = element as HTMLElement
      while (current) {
        // Verificar si está dentro de un Dialog/Modal de Radix UI
        const dialogContent = current.closest('[data-slot="dialog-content"], [data-slot="alert-dialog-content"]')
        if (dialogContent) {
          // Verificar el estado del modal usando el atributo data-state de Radix UI
          // Radix UI agrega data-state="open" o data-state="closed" al Content
          const state = dialogContent.getAttribute('data-state')
          if (state === 'closed') {
            return true
          }
          
          // Verificar si el modal está visible usando estilos computados
          const computedStyle = window.getComputedStyle(dialogContent)
          if (computedStyle.display === 'none' || 
              computedStyle.visibility === 'hidden' || 
              computedStyle.opacity === '0' ||
              computedStyle.pointerEvents === 'none') {
            return true
          }
          
          // Verificar si el portal del modal está oculto
          const portal = dialogContent.closest('[data-slot="dialog-portal"]')
          if (portal) {
            const portalStyle = window.getComputedStyle(portal)
            if (portalStyle.display === 'none') {
              return true
            }
          }
          
          // Verificar el estado del Dialog Root
          const dialogRoot = dialogContent.closest('[data-slot="dialog"]')
          if (dialogRoot) {
            // Verificar si el Dialog tiene open={false}
            const dialogElement = dialogRoot as HTMLElement
            // Radix UI puede usar aria-hidden cuando está cerrado
            if (dialogElement.getAttribute('aria-hidden') === 'true') {
              return true
            }
          }
        }
        current = current.parentElement
      }
      return false
    }

    // Usar delegación de eventos para mejor rendimiento y para que funcione con elementos dinámicos
    const handleDocumentMouseEnter = (e: MouseEvent) => {
      const target = e.target
      if (!target) return

      // Verificar que el target sea un Element (tiene el método matches)
      if (!(target instanceof Element)) {
        return
      }

      // No leer si el elemento está dentro de un modal cerrado
      if (isInClosedModal(target)) {
        return
      }

      // Verificar si es un elemento interactivo
      const isInteractive = target.matches('button, a, input, textarea, select, [role="button"], [role="link"], [tabindex], label, [aria-label]')
      if (isInteractive) {
        handleMouseEnter(e)
      }
    }

    // Usar delegación de eventos en el documento (capture phase para mejor rendimiento)
    document.addEventListener('mouseenter', handleDocumentMouseEnter as EventListener, true)
    document.addEventListener('mouseleave', handleMouseLeave, true)

    // También para texto seleccionado
    const handleTextSelection = () => {
      const selection = window.getSelection()
      if (selection && selection.toString().trim()) {
        speak(selection.toString().trim())
      }
    }

    document.addEventListener('mouseup', handleTextSelection)

    return () => {
      document.removeEventListener('mouseenter', handleDocumentMouseEnter as EventListener, true)
      document.removeEventListener('mouseleave', handleMouseLeave, true)
      document.removeEventListener('mouseup', handleTextSelection)
      if (speechSynthesis) {
        speechSynthesis.cancel()
      }
    }
  }, [isActive, speechSynthesis, pathname, volumen])

  return null
}

