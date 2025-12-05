"use client"

import { useEffect, useState, useRef } from "react"
import { useAccessibility } from "@/hooks/useAccessibility"
import Image from "next/image"

export function SignLanguageAlphabet() {
  const { preferences } = useAccessibility()
  const [letters, setLetters] = useState<string[]>([])
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastElementRef = useRef<Element | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!preferences.alfabetoSenas) {
      setLetters([])
      setIsVisible(false)
      lastElementRef.current = null
      return
    }

    const getElementText = (element: Element): string => {
      // Ignorar elementos de la guía paso a paso
      if (element.closest('[data-step-guide]')) {
        return ''
      }

      // Buscar el elemento interactivo más cercano
      const interactiveElement = element.closest('button, a, input, textarea, label, [role="button"], [role="link"], [role="tab"], [role="menuitem"]') || element

      // Para botones, obtener solo el texto visible del botón
      if (interactiveElement.tagName === 'BUTTON' || interactiveElement.getAttribute('role') === 'button') {
        const ariaLabel = interactiveElement.getAttribute('aria-label')
        if (ariaLabel && ariaLabel.length > 0 && ariaLabel.length <= 100) return ariaLabel
        
        // Obtener texto directo, ignorando iconos SVG y elementos ocultos
        const button = interactiveElement as HTMLElement
        
        // Primero intentar obtener texto de nodos de texto directos
        const directTextNodes: string[] = []
        Array.from(button.childNodes).forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim()
            if (text) directTextNodes.push(text)
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement
            // Solo incluir elementos que no sean SVG o iconos
            if (el.tagName !== 'SVG' && 
                !el.classList.toString().includes('icon') && 
                !el.classList.toString().includes('Icon') &&
                el.getAttribute('aria-hidden') !== 'true') {
              const text = el.textContent?.trim()
              if (text && text.length < 50) { // Solo texto corto de hijos directos
                directTextNodes.push(text)
              }
            }
          }
        })
        
        let text = directTextNodes.join(' ').trim()
        
        // Si no hay texto directo, usar clone pero limitar profundidad
        if (!text || text.length === 0) {
          const clone = button.cloneNode(true) as HTMLElement
          // Remover SVGs, iconos y elementos ocultos
          clone.querySelectorAll('svg, [class*="icon"], [class*="Icon"], [aria-hidden="true"], .sr-only, .hidden').forEach(el => el.remove())
          text = clone.textContent?.trim() || ''
        }
        
        // Limitar a 100 caracteres y validar que no sea demasiado largo
        if (text.length > 100) {
          // Si es muy largo, probablemente incluye texto de hijos no deseados
          // Intentar solo el primer fragmento de texto
          const firstPart = text.substring(0, 100).split(' ')[0]
          if (firstPart.length > 0 && firstPart.length <= 50) {
            return firstPart
          }
          return ''
        }
        
        return text
      }
      
      // Para inputs, obtener label o placeholder
      if (interactiveElement.tagName === 'INPUT' || interactiveElement.tagName === 'TEXTAREA') {
        const input = interactiveElement as HTMLInputElement
        const label = document.querySelector(`label[for="${input.id}"]`)
        const labelText = label?.textContent?.trim() || ''
        const placeholder = input.placeholder || ''
        const value = input.value || ''
        
        // Priorizar label, luego placeholder, luego value
        const result = labelText || placeholder || value
        return result.length > 100 ? result.substring(0, 100) : result
      }
      
      // Para labels, obtener solo su texto
      if (interactiveElement.tagName === 'LABEL') {
        const text = interactiveElement.textContent?.trim() || ''
        return text.length > 100 ? text.substring(0, 100) : text
      }
      
      // Para enlaces, obtener el texto del enlace
      if (interactiveElement.tagName === 'A') {
        const ariaLabel = interactiveElement.getAttribute('aria-label')
        if (ariaLabel && ariaLabel.length <= 100) return ariaLabel
        
        const clone = interactiveElement.cloneNode(true) as HTMLElement
        clone.querySelectorAll('svg, [class*="icon"]').forEach(el => el.remove())
        const text = clone.textContent?.trim() || ''
        return text.length > 100 ? text.substring(0, 100) : text
      }
      
      // Para elementos de tabla (td, th), obtener solo el texto de esa celda
      if (interactiveElement.tagName === 'TD' || interactiveElement.tagName === 'TH') {
        const text = interactiveElement.textContent?.trim() || ''
        return text.length > 100 ? text.substring(0, 100) : text
      }
      
      // Para otros elementos, obtener aria-label o title primero
      const ariaLabel = interactiveElement.getAttribute('aria-label')
      if (ariaLabel && ariaLabel.length <= 100) return ariaLabel
      
      const title = interactiveElement.getAttribute('title')
      if (title && title.length <= 100) return title
      
      // Si es un elemento de texto pequeño (p, span, h1-h6), obtener su texto
      if (['P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'].includes(interactiveElement.tagName)) {
        const text = interactiveElement.textContent?.trim() || ''
        // Solo usar si el texto es razonable (no más de 100 caracteres)
        if (text.length > 0 && text.length <= 100) {
          return text
        }
      }
      
      // No usar texto de elementos grandes que probablemente contienen muchos hijos
      return ''
    }

    const normalizeText = (text: string): string => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9]/g, '') // Remover TODO excepto letras y números (incluyendo espacios)
        .trim()
    }

    const getLettersFromText = (text: string): string[] => {
      const normalized = normalizeText(text)
      // Solo retornar letras y números, sin espacios
      return normalized.split('').filter(char => /[a-z0-9]/.test(char))
    }

    const showLetters = (text: string, x: number, y: number) => {
      const textLetters = getLettersFromText(text)
      
      if (textLetters.length > 0 && textLetters.length <= 50) { // Limitar a 50 letras máximo
        setLetters(textLetters)
        setPosition({ x, y })
        setIsVisible(true)
        
        // No ocultar automáticamente, solo cuando el cursor se mueva a un espacio vacío
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      } else {
        setIsVisible(false)
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as Element
      if (!target) {
        setIsVisible(false)
        lastElementRef.current = null
        return
      }

      // Ignorar si está sobre la guía paso a paso
      if (target.closest('[data-step-guide]')) {
        return
      }

      // Ignorar si el cursor está sobre el contenedor de las imágenes de señas
      if (target.closest('[data-sign-alphabet]')) {
        // Mantener visible si ya está mostrando algo
        if (isVisible && letters.length > 0) {
          return
        }
      }

      // Debounce para evitar demasiadas actualizaciones
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        // Buscar el elemento interactivo más cercano, priorizando elementos más específicos
        // Priorizar: button > a > input/textarea > label > td/th > span > otros
        let element: Element | null = null
        
        // Buscar en orden de prioridad
        element = target.closest('button, [role="button"]') ||
                 target.closest('a[href], [role="link"]') ||
                 target.closest('input, textarea') ||
                 target.closest('label') ||
                 target.closest('td, th') ||
                 target.closest('li') ||
                 (target.tagName === 'SPAN' && target.parentElement ? target.parentElement : null) ||
                 target
        
        if (!element) {
          // Si no hay elemento, verificar si el cursor está en un área vacía real
          // Solo ocultar si realmente está en un espacio sin contenido
          const bodyElement = document.body
          const isEmptyArea = !target.closest('div, section, article, main, header, footer, nav, aside') ||
                            target === bodyElement ||
                            (target.tagName === 'DIV' && !target.textContent?.trim())
          
          if (isEmptyArea) {
            setIsVisible(false)
            lastElementRef.current = null
          }
          return
        }
        
        // Si es el mismo elemento, mantener visible pero actualizar posición
        if (element === lastElementRef.current) {
          setPosition({ x: e.clientX, y: e.clientY })
          return
        }
        
        lastElementRef.current = element

        const text = getElementText(element)
        // Solo mostrar si el texto es razonable (entre 1 y 100 caracteres)
        if (text && text.length > 0 && text.length <= 100) {
          showLetters(text, e.clientX, e.clientY - 20)
        } else {
          // Si no hay texto válido, ocultar solo si realmente no hay texto
          const hasAnyText = element.textContent?.trim() || element.getAttribute('aria-label') || element.getAttribute('title')
          if (!hasAnyText) {
            setIsVisible(false)
            lastElementRef.current = null
          }
        }
      }, 200)
    }

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      // Ocultar cuando el mouse sale del área
      setIsVisible(false)
      lastElementRef.current = null
    }

    // Detectar cuando el screen reader está leyendo
    const handleSpeech = () => {
      if (preferences.lecturaVozAlta) {
        const speakingElement = document.querySelector('[aria-live]') || document.activeElement
        if (speakingElement instanceof HTMLElement) {
          const text = getElementText(speakingElement)
          if (text && text.length > 0 && text.length <= 100) {
            const rect = speakingElement.getBoundingClientRect()
            showLetters(text, rect.left + rect.width / 2, rect.top - 20)
          }
        }
      }
    }

    document.addEventListener("mousemove", handleMouseMove, true)
    document.addEventListener("mouseleave", handleMouseLeave, true)

    let observer: MutationObserver | null = null
    if (preferences.lecturaVozAlta) {
      observer = new MutationObserver(() => {
        // Debounce para evitar demasiadas actualizaciones
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }
        debounceRef.current = setTimeout(handleSpeech, 200)
      })
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      })
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove, true)
      document.removeEventListener("mouseleave", handleMouseLeave, true)
      if (observer) {
        observer.disconnect()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [preferences.alfabetoSenas, preferences.lecturaVozAlta])

  if (!preferences.alfabetoSenas || !isVisible || letters.length === 0) return null

  const getImagePath = (letter: string): string => {
    // Mapear números a letras si es necesario
    const letterMap: Record<string, string> = {
      '0': 'o',
      '1': 'i',
      '2': 'z',
      '3': 'e',
      '4': 'a',
      '5': 's',
      '6': 'g',
      '7': 't',
      '8': 'b',
      '9': 'g'
    }
    
    const normalizedLetter = letterMap[letter] || letter
    // Asegurar que la L mayúscula use la minúscula
    const finalLetter = normalizedLetter === 'l' ? 'L' : normalizedLetter
    return `/imglenguaje/${finalLetter}.png`
  }

  // Calcular posición para que aparezca arriba del cursor sin salirse de la pantalla
  const getAdjustedPosition = () => {
    const columnsPerRow = letters.length <= 10 ? letters.length : letters.length <= 20 ? 10 : 12
    const containerWidth = Math.min(columnsPerRow * 56 + 40, 600)
    // Calcular altura aproximada del contenedor (considerando múltiples filas)
    const rows = Math.ceil(letters.length / columnsPerRow)
    const containerHeight = rows * 56 + 40 // altura por fila + padding
    
    // Posicionar más arriba para que el cursor quede por debajo
    const offsetY = containerHeight + 60 // Espacio suficiente para que el cursor quede abajo
    
    // Calcular posición X centrada en el cursor
    let offsetX = position.x
    if (offsetX + containerWidth / 2 > window.innerWidth) {
      offsetX = window.innerWidth - containerWidth / 2 - 20
    } else if (offsetX - containerWidth / 2 < 0) {
      offsetX = containerWidth / 2 + 20
    }
    
    // Asegurar que esté arriba del cursor con suficiente espacio
    const adjustedY = Math.max(60, position.y - offsetY)
    
    return {
      left: `${offsetX}px`,
      top: `${adjustedY}px`,
      transform: 'translateX(-50%)',
    }
  }

  // Calcular cuántas columnas mostrar según el número de letras
  const getColumnsPerRow = () => {
    if (letters.length <= 10) return letters.length // Palabras cortas: todas en una fila
    if (letters.length <= 20) return 10 // Palabras medianas: 10 por fila
    return 12 // Palabras largas: 12 por fila
  }

  const columnsPerRow = getColumnsPerRow()

  return (
    <div
      ref={containerRef}
      data-sign-alphabet="true"
      className="fixed z-[100000] pointer-events-none"
      style={getAdjustedPosition()}
    >
      <div className="bg-background/98 backdrop-blur-md border-2 border-primary rounded-xl shadow-2xl p-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <div 
          className="flex flex-wrap gap-2 justify-center items-center"
          style={{
            maxWidth: `${Math.min(columnsPerRow * 56, 600)}px`,
          }}
        >
          {letters.map((letter, index) => (
            <div
              key={`${letter}-${index}`}
              className="relative w-12 h-12 flex items-center justify-center bg-primary/10 rounded-lg border-2 border-primary/30 shadow-sm transition-all animate-in fade-in-0 slide-in-from-bottom-2 flex-shrink-0"
              style={{
                animationDelay: `${index * 15}ms`,
              }}
            >
              <Image
                src={getImagePath(letter)}
                alt={`Seña para la letra ${letter.toUpperCase()}`}
                width={40}
                height={40}
                className="object-contain"
                unoptimized
                onError={(e) => {
                  // Si la imagen no existe, mostrar la letra como fallback
                  const target = e.target as HTMLImageElement
                  if (target) {
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `<span class="text-primary font-bold text-lg">${letter.toUpperCase()}</span>`
                    }
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

