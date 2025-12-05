"use client"

import { useEffect, useState, useCallback, useRef } from "react"

type NavigationZone = 'sidebar' | 'main'

interface ElementPosition {
  el: HTMLElement
  rect: DOMRect
  centerX: number
  centerY: number
}

// Singleton para controlar que solo haya un listener global
let globalListenerActive = false
let currentGlobalZone: NavigationZone = 'main'
let globalIsActive = false
let zoneChangeCallbacks: Set<(zone: NavigationZone, active: boolean) => void> = new Set()

const notifyZoneChange = (zone: NavigationZone, active: boolean) => {
  currentGlobalZone = zone
  globalIsActive = active
  zoneChangeCallbacks.forEach(cb => cb(zone, active))
}

/**
 * Hook profesional para navegación espacial con flechas del teclado
 * 
 * Características:
 * - Navegación basada en coordenadas X/Y reales
 * - Tab para alternar entre barra lateral y contenido principal
 * - Flechas ↑↓←→ para navegación direccional precisa
 * - Enter para activar elementos
 * - Escape para desactivar navegación
 * - No salta elementos - encuentra el más cercano en cada dirección
 * - Singleton: solo un listener global aunque se llame múltiples veces
 */
export function useArrowNavigation(containerRef?: React.RefObject<HTMLElement | HTMLDivElement | null>) {
  const [isActive, setIsActive] = useState(globalIsActive)
  const [currentZone, setCurrentZone] = useState<NavigationZone>(currentGlobalZone)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const isMainInstance = useRef(false)

  // Selectores para elementos navegables
  const FOCUSABLE_SELECTORS = [
    'button:not([disabled]):not([aria-hidden="true"])',
    'a[href]:not([aria-hidden="true"])',
    'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"])',
    'select:not([disabled]):not([aria-hidden="true"])',
    'textarea:not([disabled]):not([aria-hidden="true"])',
    '[tabindex="0"]:not([aria-hidden="true"])',
    '[role="button"]:not([aria-disabled="true"]):not([aria-hidden="true"])',
    '[role="tab"]:not([aria-hidden="true"])',
    '[role="menuitem"]:not([aria-hidden="true"])',
    '[role="option"]:not([aria-hidden="true"])',
    '[role="checkbox"]:not([aria-hidden="true"])',
    '[role="radio"]:not([aria-hidden="true"])',
  ].join(', ')

  // Obtener elementos de una zona específica
  const getZoneElements = useCallback((zone: NavigationZone): ElementPosition[] => {
    const sidebar = document.querySelector('aside, [data-sidebar], nav[role="navigation"], .sidebar')
    const main = document.querySelector('main, [role="main"], .main-content')
    
    let container: Element | null = null
    
    if (zone === 'sidebar') {
      container = sidebar
    } else {
      container = main || document.body
    }
    
    if (!container) return []
    
    // Obtener elementos
    let elements: HTMLElement[]
    
    if (zone === 'main' && sidebar) {
      // Para main, excluir elementos del sidebar
      const allElements = Array.from(document.querySelectorAll(FOCUSABLE_SELECTORS)) as HTMLElement[]
      elements = allElements.filter(el => !sidebar.contains(el))
    } else if (container) {
      elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)) as HTMLElement[]
    } else {
      elements = []
    }
    
    // Filtrar elementos visibles y obtener sus posiciones
    return elements
      .filter(el => {
        const style = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        
        // Verificar visibilidad
        if (style.display === 'none' || 
            style.visibility === 'hidden' || 
            style.opacity === '0' ||
            rect.width === 0 ||
            rect.height === 0) {
          return false
        }
        
        // Verificar que esté en el viewport (con margen)
        const margin = 50
        if (rect.bottom < -margin || 
            rect.top > window.innerHeight + margin ||
            rect.right < -margin ||
            rect.left > window.innerWidth + margin) {
          return false
        }
        
        return true
      })
      .map(el => {
        const rect = el.getBoundingClientRect()
        return {
          el,
          rect,
          centerX: rect.left + rect.width / 2,
          centerY: rect.top + rect.height / 2
        }
      })
  }, [FOCUSABLE_SELECTORS])

  // Encontrar el elemento más cercano en una dirección específica
  const findClosestInDirection = useCallback((
    current: ElementPosition,
    candidates: ElementPosition[],
    direction: 'up' | 'down' | 'left' | 'right'
  ): ElementPosition | null => {
    // Tolerancia para considerar elementos "alineados" en la misma fila/columna
    const ALIGNMENT_TOLERANCE = 25
    
    let validCandidates: { pos: ElementPosition; score: number }[] = []
    
    for (const candidate of candidates) {
      if (candidate.el === current.el) continue
      
      let isValid = false
      let distance = 0
      let alignmentBonus = 0
      
      switch (direction) {
        case 'up': {
          // El candidato debe estar ARRIBA (su parte inferior arriba de nuestra parte superior)
          if (candidate.rect.bottom <= current.rect.top + 5) {
            isValid = true
            // Distancia vertical principal
            distance = current.rect.top - candidate.rect.bottom
            
            // Bonus por alineación horizontal (elementos en la misma columna)
            const horizontalOverlap = 
              Math.max(0, Math.min(current.rect.right, candidate.rect.right) - 
                        Math.max(current.rect.left, candidate.rect.left))
            
            if (horizontalOverlap > 0) {
              alignmentBonus = 1000 // Gran bonus por estar en la misma columna
            } else {
              // Penalización por distancia horizontal
              distance += Math.abs(current.centerX - candidate.centerX) * 0.5
            }
          }
          break
        }
        
        case 'down': {
          // El candidato debe estar ABAJO
          if (candidate.rect.top >= current.rect.bottom - 5) {
            isValid = true
            distance = candidate.rect.top - current.rect.bottom
            
            const horizontalOverlap = 
              Math.max(0, Math.min(current.rect.right, candidate.rect.right) - 
                        Math.max(current.rect.left, candidate.rect.left))
            
            if (horizontalOverlap > 0) {
              alignmentBonus = 1000
            } else {
              distance += Math.abs(current.centerX - candidate.centerX) * 0.5
            }
          }
          break
        }
        
        case 'left': {
          // El candidato debe estar a la IZQUIERDA
          if (candidate.rect.right <= current.rect.left + 5) {
            isValid = true
            distance = current.rect.left - candidate.rect.right
            
            // Bonus por estar en la misma fila
            const verticalOverlap = 
              Math.max(0, Math.min(current.rect.bottom, candidate.rect.bottom) - 
                        Math.max(current.rect.top, candidate.rect.top))
            
            if (verticalOverlap > 0 || Math.abs(current.centerY - candidate.centerY) < ALIGNMENT_TOLERANCE) {
              alignmentBonus = 1000
            } else {
              distance += Math.abs(current.centerY - candidate.centerY) * 0.5
            }
          }
          break
        }
        
        case 'right': {
          // El candidato debe estar a la DERECHA
          if (candidate.rect.left >= current.rect.right - 5) {
            isValid = true
            distance = candidate.rect.left - current.rect.right
            
            const verticalOverlap = 
              Math.max(0, Math.min(current.rect.bottom, candidate.rect.bottom) - 
                        Math.max(current.rect.top, candidate.rect.top))
            
            if (verticalOverlap > 0 || Math.abs(current.centerY - candidate.centerY) < ALIGNMENT_TOLERANCE) {
              alignmentBonus = 1000
            } else {
              distance += Math.abs(current.centerY - candidate.centerY) * 0.5
            }
          }
          break
        }
      }
      
      if (isValid && distance >= 0) {
        // Score: menor es mejor. alignmentBonus resta del score.
        const score = distance - alignmentBonus
        validCandidates.push({ pos: candidate, score })
      }
    }
    
    if (validCandidates.length === 0) return null
    
    // Ordenar por score (menor primero = mejor candidato)
    validCandidates.sort((a, b) => a.score - b.score)
    
    return validCandidates[0].pos
  }, [])

  // Enfocar el primer elemento de una zona
  const focusFirstInZone = useCallback((zone: NavigationZone) => {
    const elements = getZoneElements(zone)
    if (elements.length > 0) {
      // Ordenar por posición: primero arriba-izquierda
      elements.sort((a, b) => {
        if (Math.abs(a.centerY - b.centerY) < 20) {
          return a.centerX - b.centerX
        }
        return a.centerY - b.centerY
      })
      
      elements[0].el.focus()
      elements[0].el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [getZoneElements])

  // Cambiar entre zonas
  const toggleZone = useCallback(() => {
    const newZone: NavigationZone = currentGlobalZone === 'sidebar' ? 'main' : 'sidebar'
    notifyZoneChange(newZone, true)
    focusFirstInZone(newZone)
  }, [focusFirstInZone])

  // Suscribirse a cambios de zona globales
  useEffect(() => {
    const handleZoneChange = (zone: NavigationZone, active: boolean) => {
      setCurrentZone(zone)
      setIsActive(active)
    }
    
    zoneChangeCallbacks.add(handleZoneChange)
    
    return () => {
      zoneChangeCallbacks.delete(handleZoneChange)
    }
  }, [])

  // Registrar listener global solo una vez
  useEffect(() => {
    // Si ya hay un listener global activo, no registrar otro
    if (globalListenerActive) {
      return
    }
    
    globalListenerActive = true
    isMainInstance.current = true

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement
      
      // Verificar si estamos en un campo de texto
      const isTextInput = activeElement && (
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement.tagName === 'INPUT' && 
         ['text', 'email', 'password', 'search', 'url', 'tel', 'number'].includes(
           (activeElement as HTMLInputElement).type || 'text'
         ))
      )
      
      // Tab para cambiar entre zonas (solo si no hay modificadores)
      if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        // No capturar Tab en ciertos contextos
        const isInModal = activeElement?.closest('[role="dialog"]')
        const isInDropdown = activeElement?.closest('[role="menu"], [role="listbox"]')
        
        if (!isInModal && !isInDropdown) {
          e.preventDefault()
          e.stopPropagation()
          
          const newZone: NavigationZone = currentGlobalZone === 'sidebar' ? 'main' : 'sidebar'
          notifyZoneChange(newZone, true)
          
          // Enfocar primer elemento de la nueva zona
          setTimeout(() => {
            const sidebar = document.querySelector('[data-nav-zone="sidebar"], aside')
            const main = document.querySelector('[data-nav-zone="main"], main')
            
            const container = newZone === 'sidebar' ? sidebar : main
            if (container) {
              const firstFocusable = container.querySelector(
                'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]'
              ) as HTMLElement
              if (firstFocusable) {
                firstFocusable.focus()
                firstFocusable.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
              }
            }
          }, 10)
          return
        }
      }
      
      // Escape para desactivar
      if (e.key === 'Escape') {
        notifyZoneChange(currentGlobalZone, false)
        if (activeElement) {
          activeElement.blur()
        }
        return
      }
      
      // Flechas para navegación
      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      if (!arrowKeys.includes(e.key)) return
      
      // Si estamos en un texto y son flechas horizontales, permitir mover cursor
      if (isTextInput && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        return // Dejar que el input maneje las flechas horizontales
      }
      
      // Si estamos en un select abierto, no interferir
      if (activeElement?.tagName === 'SELECT') {
        return
      }
      
      e.preventDefault()
      e.stopPropagation()
      
      notifyZoneChange(currentGlobalZone, true)
      
      // Determinar zona actual basándose en el elemento activo
      const sidebar = document.querySelector('[data-nav-zone="sidebar"], aside')
      let effectiveZone = currentGlobalZone
      
      if (activeElement && sidebar?.contains(activeElement)) {
        effectiveZone = 'sidebar'
        if (currentGlobalZone !== 'sidebar') {
          notifyZoneChange('sidebar', true)
        }
      } else if (activeElement && !sidebar?.contains(activeElement)) {
        effectiveZone = 'main'
        if (currentGlobalZone !== 'main') {
          notifyZoneChange('main', true)
        }
      }
      
      // Obtener elementos navegables
      const selectorStr = [
        'button:not([disabled]):not([aria-hidden="true"])',
        'a[href]:not([aria-hidden="true"])',
        'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"])',
        'select:not([disabled]):not([aria-hidden="true"])',
        'textarea:not([disabled]):not([aria-hidden="true"])',
        '[tabindex="0"]:not([aria-hidden="true"])',
        '[role="button"]:not([aria-disabled="true"]):not([aria-hidden="true"])',
        '[role="tab"]:not([aria-hidden="true"])',
        '[role="menuitem"]:not([aria-hidden="true"])',
        '[role="checkbox"]:not([aria-hidden="true"])',
      ].join(', ')
      
      const main = document.querySelector('[data-nav-zone="main"], main')
      
      let container: Element | null = null
      if (effectiveZone === 'sidebar') {
        container = sidebar
      } else {
        container = main || document.body
      }
      
      if (!container) return
      
      // Obtener elementos visibles
      let elements: HTMLElement[]
      if (effectiveZone === 'main' && sidebar) {
        const allElements = Array.from(document.querySelectorAll(selectorStr)) as HTMLElement[]
        elements = allElements.filter(el => !sidebar.contains(el))
      } else {
        elements = Array.from(container.querySelectorAll(selectorStr)) as HTMLElement[]
      }
      
      // Filtrar elementos visibles
      const visibleElements = elements.filter(el => {
        const style = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        
        if (style.display === 'none' || 
            style.visibility === 'hidden' || 
            style.opacity === '0' ||
            rect.width === 0 ||
            rect.height === 0) {
          return false
        }
        
        if (rect.bottom < -50 || rect.top > window.innerHeight + 50) {
          return false
        }
        
        return true
      }).map(el => {
        const rect = el.getBoundingClientRect()
        return {
          el,
          rect,
          centerX: rect.left + rect.width / 2,
          centerY: rect.top + rect.height / 2
        }
      })
      
      if (visibleElements.length === 0) return
      
      // Encontrar elemento actual
      let currentEl = visibleElements.find(e => e.el === activeElement || e.el.contains(activeElement))
      
      if (!currentEl) {
        // Enfocar primer elemento
        visibleElements.sort((a, b) => {
          if (Math.abs(a.centerY - b.centerY) < 20) return a.centerX - b.centerX
          return a.centerY - b.centerY
        })
        visibleElements[0].el.focus()
        visibleElements[0].el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        return
      }
      
      // Encontrar siguiente en dirección
      const ALIGNMENT_TOLERANCE = 25
      let best: { el: HTMLElement; score: number } | null = null
      
      for (const candidate of visibleElements) {
        if (candidate.el === currentEl.el) continue
        
        let isValid = false
        let distance = 0
        let alignmentBonus = 0
        
        switch (e.key) {
          case 'ArrowUp':
            if (candidate.rect.bottom <= currentEl.rect.top + 5) {
              isValid = true
              distance = currentEl.rect.top - candidate.rect.bottom
              const hOverlap = Math.max(0, Math.min(currentEl.rect.right, candidate.rect.right) - 
                                        Math.max(currentEl.rect.left, candidate.rect.left))
              if (hOverlap > 0) alignmentBonus = 1000
              else distance += Math.abs(currentEl.centerX - candidate.centerX) * 0.5
            }
            break
          case 'ArrowDown':
            if (candidate.rect.top >= currentEl.rect.bottom - 5) {
              isValid = true
              distance = candidate.rect.top - currentEl.rect.bottom
              const hOverlap = Math.max(0, Math.min(currentEl.rect.right, candidate.rect.right) - 
                                        Math.max(currentEl.rect.left, candidate.rect.left))
              if (hOverlap > 0) alignmentBonus = 1000
              else distance += Math.abs(currentEl.centerX - candidate.centerX) * 0.5
            }
            break
          case 'ArrowLeft':
            if (candidate.rect.right <= currentEl.rect.left + 5) {
              isValid = true
              distance = currentEl.rect.left - candidate.rect.right
              const vOverlap = Math.max(0, Math.min(currentEl.rect.bottom, candidate.rect.bottom) - 
                                        Math.max(currentEl.rect.top, candidate.rect.top))
              if (vOverlap > 0 || Math.abs(currentEl.centerY - candidate.centerY) < ALIGNMENT_TOLERANCE) 
                alignmentBonus = 1000
              else distance += Math.abs(currentEl.centerY - candidate.centerY) * 0.5
            }
            break
          case 'ArrowRight':
            if (candidate.rect.left >= currentEl.rect.right - 5) {
              isValid = true
              distance = candidate.rect.left - currentEl.rect.right
              const vOverlap = Math.max(0, Math.min(currentEl.rect.bottom, candidate.rect.bottom) - 
                                        Math.max(currentEl.rect.top, candidate.rect.top))
              if (vOverlap > 0 || Math.abs(currentEl.centerY - candidate.centerY) < ALIGNMENT_TOLERANCE) 
                alignmentBonus = 1000
              else distance += Math.abs(currentEl.centerY - candidate.centerY) * 0.5
            }
            break
        }
        
        if (isValid && distance >= 0) {
          const score = distance - alignmentBonus
          if (!best || score < best.score) {
            best = { el: candidate.el, score }
          }
        }
      }
      
      if (best) {
        best.el.focus()
        best.el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }

    // Handler para Enter
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      
      const activeElement = document.activeElement as HTMLElement
      
      // No interferir con inputs, textareas, selects
      if (activeElement && 
          (activeElement.tagName === 'INPUT' || 
           activeElement.tagName === 'TEXTAREA' ||
           activeElement.tagName === 'SELECT')) {
        return
      }
      
      // Para botones y links, dejar que el navegador maneje el click
      // Solo para elementos con role="button" necesitamos click manual
      if (activeElement?.getAttribute('role') === 'button' ||
          activeElement?.getAttribute('role') === 'tab' ||
          activeElement?.getAttribute('role') === 'checkbox') {
        e.preventDefault()
        activeElement.click()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keydown', handleEnter, false)
    
    return () => {
      if (isMainInstance.current) {
        globalListenerActive = false
        window.removeEventListener('keydown', handleKeyDown, true)
        window.removeEventListener('keydown', handleEnter, false)
      }
    }
  }, [])

  return { 
    isActive, 
    currentZone, 
    focusedIndex, 
    setFocusedIndex,
    toggleZone,
    setIsActive
  }
}

