'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAccessibility } from '@/hooks/useAccessibility'
import { usePathname } from 'next/navigation'
import { toPng } from 'html-to-image'

export function MagnifierCursor() {
  const { preferences } = useAccessibility()
  const pathname = usePathname()
  const magnifierRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isActive = preferences.lupaCursor && preferences.lupaCursorZoom > 0
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const imageDataRef = useRef<string | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const lastCaptureTime = useRef<number>(0)
  const isCapturingRef = useRef<boolean>(false)
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Captura del viewport
  const captureScreen = useCallback(async (force = false) => {
    const now = Date.now()
    if (!force && imageDataRef.current && now - lastCaptureTime.current < 1000) {
      return imageDataRef.current
    }

    if (isCapturingRef.current) {
      return imageDataRef.current
    }

    isCapturingRef.current = true

    try {
      const filter = (node: Node) => {
        if (node instanceof HTMLElement) {
          // Excluir la lupa misma
          if (node === magnifierRef.current || 
              (magnifierRef.current && node.contains(magnifierRef.current))) {
            return false
          }
          
          // Verificar si está dentro de un modal
          const dialogContent = node.closest('[data-slot="dialog-content"], [data-slot="alert-dialog-content"]')
          if (dialogContent) {
            const state = dialogContent.getAttribute('data-state')
            // Solo excluir si el modal está cerrado
            if (state === 'closed') {
              return false
            }
            // Verificar si el modal está visible
            const style = window.getComputedStyle(dialogContent)
            if (style.display === 'none' || 
                style.visibility === 'hidden' || 
                parseFloat(style.opacity) === 0) {
              return false
            }
            // Si el modal está abierto y visible, incluirlo
            return true
          }
          
          // Excluir overlays de modales cerrados
          if (node.hasAttribute('data-slot') && 
              node.getAttribute('data-slot') === 'dialog-overlay') {
            const dialogRoot = node.closest('[data-slot="dialog"]')
            if (dialogRoot) {
              const state = dialogRoot.getAttribute('data-state')
              if (state === 'closed') {
                return false
              }
            }
          }
        }
        // Incluir todo lo demás (contenido normal, modales abiertos, etc.)
        return true
      }

      const scrollX = window.scrollX
      const scrollY = window.scrollY
      
      // Optimizar calidad según si hay modales abiertos
      const hasOpenModal = document.querySelector('[data-slot="dialog-content"][data-state="open"]') !== null
      const quality = hasOpenModal ? 0.85 : 0.9
      const pixelRatio = hasOpenModal ? 1.5 : 2
      
      const dataUrl = await toPng(document.body, {
        quality,
        pixelRatio,
        backgroundColor: '#ffffff',
        cacheBust: false,
        skipFonts: false,
        skipAutoScale: false,
        x: scrollX,
        y: scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        filter,
      })
      
      if (dataUrl) {
        imageDataRef.current = dataUrl
        lastCaptureTime.current = now
        
        const img = new Image()
        img.onload = () => {
          imageRef.current = img
        }
        img.src = dataUrl
        
        return dataUrl
      }
      
      return imageDataRef.current
    } catch (error) {
      console.error('Error capturing screen:', error)
      return imageDataRef.current
    } finally {
      isCapturingRef.current = false
    }
  }, [])

  // Actualizar captura cuando cambia la ruta o se abren/cierran modales
  useEffect(() => {
    if (!isActive || typeof window === 'undefined') {
      imageDataRef.current = null
      imageRef.current = null
      return
    }

    const updateCapture = (delay = 0) => {
      imageDataRef.current = null
      imageRef.current = null
      if (delay > 0) {
        setTimeout(() => {
          captureScreen(true)
        }, delay)
      } else {
        // Usar requestAnimationFrame para actualización inmediata en el próximo frame
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            captureScreen(true)
          })
        })
      }
    }

    const handleModalClosed = () => {
      updateCapture(0) // Actualización inmediata usando requestAnimationFrame
    }
    
    window.addEventListener('modal-closed', handleModalClosed)

    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false
      let isOpening = false
      let isClosing = false

      mutations.forEach((mutation) => {
        // Detectar cambios en data-state
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-state') {
          const target = mutation.target as HTMLElement
          const newState = target.getAttribute('data-state')
          const oldState = mutation.oldValue
          
          if (target.hasAttribute('data-slot') && 
              (target.getAttribute('data-slot')?.includes('dialog-content') ||
               target.getAttribute('data-slot')?.includes('dialog'))) {
            if (oldState === 'closed' && newState === 'open') {
              isOpening = true
              shouldUpdate = true
            } else if (oldState === 'open' && newState === 'closed') {
              isClosing = true
              shouldUpdate = true
            }
          }
        }
        
        // Detectar cuando se agregan modales al DOM
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && 
                node.hasAttribute('data-slot') && 
                (node.getAttribute('data-slot')?.includes('dialog-content') ||
                 node.getAttribute('data-slot')?.includes('dialog-portal'))) {
              isOpening = true
              shouldUpdate = true
            }
          })
          
          // Detectar cuando se remueven modales del DOM
          mutation.removedNodes.forEach((node) => {
            if (node instanceof HTMLElement && 
                node.hasAttribute('data-slot') && 
                (node.getAttribute('data-slot')?.includes('dialog-content') ||
                 node.getAttribute('data-slot')?.includes('dialog-portal'))) {
              isClosing = true
              shouldUpdate = true
            }
          })
        }
      })

      if (shouldUpdate) {
        // Usar requestAnimationFrame doble para asegurar que el DOM se actualizó
        // Esto es más rápido que setTimeout y se sincroniza con el renderizado del navegador
        if (isOpening) {
          // Para apertura, esperar 2 frames para que se renderice
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              updateCapture(0)
            })
          })
        } else if (isClosing) {
          // Para cierre, actualizar inmediatamente
          updateCapture(0)
        } else {
          updateCapture(0)
        }
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state'],
      attributeOldValue: true,
    })

    // Captura inicial
    setTimeout(() => captureScreen(true), 100)

    return () => {
      observer.disconnect()
      window.removeEventListener('modal-closed', handleModalClosed)
    }
  }, [isActive, pathname, captureScreen])

  useEffect(() => {
    if (!isActive || typeof window === 'undefined') {
      setIsVisible(false)
      return
    }

    const magnifier = magnifierRef.current
    const canvas = canvasRef.current
    if (!magnifier || !canvas) return

    const size = 300
    const zoom = preferences.lupaCursorZoom / 100
    const offset = 20

    let rafId: number | null = null

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX
      const y = e.clientY

      const deltaX = Math.abs(x - lastMousePos.current.x)
      const deltaY = Math.abs(y - lastMousePos.current.y)
      if (deltaX < 1 && deltaY < 1) {
        return
      }
      lastMousePos.current = { x, y }

      let magnifierX = x + offset
      let magnifierY = y - size - offset

      if (magnifierX + size > window.innerWidth) {
        magnifierX = x - size - offset
      }
      if (magnifierY < 0) {
        magnifierY = y + offset
      }

      setPosition({ x: magnifierX, y: magnifierY })

      const img = imageRef.current
      if (!img || !img.complete) {
        setIsVisible(false)
        return
      }

      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const ctx = canvas.getContext('2d', { 
          willReadFrequently: false,
          alpha: false,
        })
        if (!ctx) return

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.clearRect(0, 0, size, size)
        
        const centerX = size / 2
        const centerY = size / 2
        
        // Mapear coordenadas del cursor a la imagen
        const pixelRatio = img.width / window.innerWidth
        const imageX = x * pixelRatio
        const imageY = y * pixelRatio
        
        const sourceX = imageX - (centerX / zoom)
        const sourceY = imageY - (centerY / zoom)
        const sourceSize = size / zoom

        const clampedSourceX = Math.max(0, Math.min(sourceX, img.width - sourceSize))
        const clampedSourceY = Math.max(0, Math.min(sourceY, img.height - sourceSize))
        const clampedSourceSize = Math.min(sourceSize, img.width - clampedSourceX, img.height - clampedSourceY)

        if (clampedSourceSize > 0) {
          ctx.drawImage(
            img,
            clampedSourceX, 
            clampedSourceY, 
            clampedSourceSize, 
            clampedSourceSize,
            0, 
            0, 
            size, 
            size
          )
        }
      })

      setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.body.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.body.removeEventListener('mouseleave', handleMouseLeave)
      if (rafId) cancelAnimationFrame(rafId)
      setIsVisible(false)
    }
  }, [isActive, preferences.lupaCursorZoom])

  if (!isActive) return null

  return (
    <div
      ref={magnifierRef}
      className="fixed pointer-events-none z-[9999] rounded-lg border-4 border-gray-800 dark:border-gray-200 shadow-2xl overflow-hidden bg-white dark:bg-black"
      style={{
        width: '300px',
        height: '300px',
        left: `${position.x}px`,
        top: `${position.y}px`,
        display: isVisible ? 'block' : 'none',
        willChange: 'transform, left, top',
      }}
    >
      <div
        className="absolute z-10 pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '3px',
          height: '3px',
          backgroundColor: 'red',
          borderRadius: '50%',
          boxShadow: '0 0 0 2px white, 0 0 0 4px red',
        }}
      />
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="w-full h-full"
      />
    </div>
  )
}
