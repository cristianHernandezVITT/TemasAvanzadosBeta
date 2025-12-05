"use client"

import { useEffect, useState, useRef } from "react"
import { useAccessibility } from "@/hooks/useAccessibility"
import Lottie from "lottie-react"
import { signLanguageMap, defaultNeutralAnimationPath, loadNeutralAnimation } from "@/lib/signLanguageMap"

// Función auxiliar para obtener texto de forma segura
function getTextFromElement(element: HTMLElement | null): string {
  if (!element) return ""
  
  const textContent = element.textContent?.trim()
  if (textContent && textContent.length > 0) {
    return textContent.substring(0, 100)
  }
  
  const ariaLabel = element.getAttribute("aria-label")
  if (ariaLabel) {
    return ariaLabel
  }
  
  const placeholder = element.getAttribute("placeholder")
  if (placeholder) {
    return placeholder
  }
  
  return ""
}

// Tokenizer mejorado: separa por espacios y signos de puntuación
// También maneja frases comunes de la aplicación
function tokenize(str: string): string[] {
  if (!str) return []
  
  const lowerStr = str.toLowerCase().trim()
  
  // Frases comunes de la aplicación (ordenadas de más largas a más cortas)
  const phrases = [
    "crear usuario",
    "editar usuario",
    "eliminar usuario",
    "exportar excel",
    "exportar pdf",
    "cerrar sesión",
    "cerrar sesion",
    "registro de estudiantes",
    "gestión de usuarios",
    "gestion de usuarios",
    "por favor",
    "de nada",
  ]
  
  let result: string[] = []
  let remaining = lowerStr
  
  // Buscar frases (de más largas a más cortas)
  for (const phrase of phrases) {
    while (remaining.includes(phrase)) {
      const index = remaining.indexOf(phrase)
      // Agregar texto antes de la frase
      const before = remaining.substring(0, index).trim()
      if (before) {
        result.push(...before.split(/\s+/).filter(Boolean))
      }
      // Agregar la frase completa
      result.push(phrase)
      // Continuar con el resto
      remaining = remaining.substring(index + phrase.length).trim()
    }
  }
  
  // Agregar el resto tokenizado
  if (remaining) {
    const tokens = remaining
      .replace(/[.,!?;:()\[\]"]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
    
    result.push(...tokens)
  }
  
  return result
}

// Helper para extraer token label de URL
function tokenToLabel(url: string | null): string | null {
  if (!url) return null
  try {
    const parts = url.split("/")
    const file = parts[parts.length - 1]
    return decodeURIComponent(file.replace(".json", ""))
  } catch {
    return url
  }
}

export function SignLanguageAvatar() {
  const { preferences } = useAccessibility()
  const [currentText, setCurrentText] = useState("")
  const [queue, setQueue] = useState<(string | null)[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [animData, setAnimData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const mouseOverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const playerRef = useRef<any>(null)

  // Cargar animación neutral al inicio
  useEffect(() => {
    if (preferences.lenguajeSenas) {
      loadNeutralAnimation().then((anim) => {
        if (anim && anim.v && Array.isArray(anim.layers)) {
          setAnimData(anim)
        }
      })
    }
  }, [preferences.lenguajeSenas])

  // Cuando cambia el texto, crear la cola de animaciones
  useEffect(() => {
    if (!preferences.lenguajeSenas || !currentText) {
      setQueue([])
      setCurrentIndex(0)
      loadNeutralAnimation().then((anim) => {
        if (anim && anim.v && Array.isArray(anim.layers)) {
          setAnimData(anim)
        }
      })
      return
    }

    const tokens = tokenize(currentText)
    const newQueue = tokens.map((t) => signLanguageMap[t] || null)
    setQueue(newQueue)
    setCurrentIndex(0)
  }, [currentText, preferences.lenguajeSenas])

  // Cargar la animación actual
  useEffect(() => {
    if (!preferences.lenguajeSenas) {
      return
    }

    if (!queue || queue.length === 0) {
      loadNeutralAnimation().then((anim) => {
        if (anim && anim.v && Array.isArray(anim.layers)) {
          setAnimData(anim)
        }
      })
      return
    }

    const item = queue[currentIndex]
    const url = item || defaultNeutralAnimationPath

    setIsLoading(true)
    
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch")
        return r.json()
      })
      .then((json) => {
        // Validar que sea un JSON válido de Lottie con estructura completa
        if (json && 
            typeof json === 'object' &&
            json.v && 
            Array.isArray(json.layers) &&
            json.layers.length > 0 &&
            typeof json.w === 'number' &&
            typeof json.h === 'number') {
          setAnimData(json)
        } else {
          throw new Error("Invalid Lottie format")
        }
        setIsLoading(false)
      })
      .catch((error) => {
        console.warn(`No se pudo cargar la animación ${url}:`, error)
        // Fallback a animación neutral
        loadNeutralAnimation().then((anim) => {
          if (anim && anim.v && Array.isArray(anim.layers)) {
            setAnimData(anim)
          }
          setIsLoading(false)
        })
      })
  }, [queue, currentIndex, preferences.lenguajeSenas])

  // Avanzar a la siguiente animación cuando termine la actual
  useEffect(() => {
    if (!animData || !animData.v || !Array.isArray(animData.layers) || !preferences.lenguajeSenas || isLoading) return

    // Calcular duración de la animación
    const frames = animData?.op ? animData.op - (animData.ip || 0) : 60
    const framerate = animData?.fr || 30
    let ms = (frames / framerate) * 1000

    // Mínimo 1.5 segundos, máximo 4 segundos para que se vea bien
    ms = Math.max(1500, Math.min(4000, ms))

    // Limpiar timeout anterior
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }

    // Avanzar a la siguiente animación
    animationTimeoutRef.current = setTimeout(() => {
      if (queue.length === 0) {
        // Si no hay más animaciones, mantener la última o volver a neutral
        return
      }

      const next = currentIndex + 1
      if (next < queue.length) {
        setCurrentIndex(next)
      } else {
        // Terminó la cola, volver a la primera si hay texto para repetir
        if (currentText && queue.length > 0) {
          setCurrentIndex(0)
        } else {
          // Si no hay texto, mantener la última animación
          setCurrentIndex(queue.length - 1)
        }
      }
    }, ms) // Sin buffer adicional para transición más fluida

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [animData, currentIndex, queue, currentText, preferences.lenguajeSenas, isLoading])

  // Detectar interacciones del usuario
  useEffect(() => {
    if (!preferences.lenguajeSenas) {
      setCurrentText("")
      if (mouseOverTimeoutRef.current) {
        clearTimeout(mouseOverTimeoutRef.current)
        mouseOverTimeoutRef.current = null
      }
      return
    }

    const handleInteraction = (event: Event) => {
      try {
        const target = event.target
        
        if (!target || typeof target !== "object" || !(target instanceof HTMLElement)) {
          return
        }
        
        const interactiveElement = target.closest("button, a, [role='button'], input, textarea, select, [onclick], [tabindex]")
        
        let text = ""
        
        if (interactiveElement instanceof HTMLElement) {
          text = getTextFromElement(interactiveElement)
          
          if (interactiveElement.tagName === "BUTTON") {
            text = text || "botón"
          } else if (interactiveElement.tagName === "A") {
            text = text || "enlace"
          } else if (interactiveElement.tagName === "INPUT" || interactiveElement.tagName === "TEXTAREA") {
            text = text || "campo"
          }
        } else {
          text = getTextFromElement(target)
        }

        if (text && text.length > 0) {
          setCurrentText(text)
        }
      } catch (error) {
        console.warn("Error en handleInteraction:", error)
      }
    }

    const handleMouseOver = (event: MouseEvent) => {
      try {
        const target = event.target
        
        if (!target || typeof target !== "object" || !(target instanceof HTMLElement)) {
          return
        }
        
        const isInteractive = target.closest("button, a, [role='button'], input, textarea, select, [onclick], [tabindex]")
        
        if (isInteractive) {
          handleInteraction(event)
        }
      } catch (error) {
        console.warn("Error en handleMouseOver:", error)
      }
    }

    const handleClick = (event: MouseEvent) => {
      try {
        handleInteraction(event)
      } catch (error) {
        console.warn("Error en handleClick:", error)
      }
    }

    const handleSpeech = () => {
      try {
        if (preferences.lecturaVozAlta && preferences.lenguajeSenas) {
          const speakingElement = document.querySelector('[aria-live]') || document.activeElement
          
          if (speakingElement instanceof HTMLElement) {
            const text = getTextFromElement(speakingElement)
            if (text && text.length > 0) {
              setCurrentText(text)
            }
          }
        }
      } catch (error) {
        console.warn("Error en handleSpeech:", error)
      }
    }

    const handleMouseOverDebounced = (event: MouseEvent) => {
      if (mouseOverTimeoutRef.current) {
        clearTimeout(mouseOverTimeoutRef.current)
      }
      mouseOverTimeoutRef.current = setTimeout(() => {
        handleMouseOver(event)
      }, 200)
    }
    
    document.addEventListener("mouseover", handleMouseOverDebounced, true)
    document.addEventListener("click", handleClick, true)
    
    let observer: MutationObserver | null = null
    if (preferences.lecturaVozAlta) {
      observer = new MutationObserver(handleSpeech)
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      })
    }
    
    return () => {
      document.removeEventListener("mouseover", handleMouseOverDebounced, true)
      document.removeEventListener("click", handleClick, true)
      if (observer) {
        observer.disconnect()
      }
      if (mouseOverTimeoutRef.current) {
        clearTimeout(mouseOverTimeoutRef.current)
        mouseOverTimeoutRef.current = null
      }
    }
  }, [preferences.lenguajeSenas, preferences.lecturaVozAlta])

  if (!preferences.lenguajeSenas) return null

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <div className="bg-background/95 backdrop-blur-sm border-2 border-primary rounded-lg shadow-2xl p-4 min-w-[400px] max-w-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="text-sm font-semibold text-foreground mb-2">
            Lenguaje de Señas
          </div>
          
          {/* Contenedor para animación Lottie */}
          <div 
            className="w-full h-96 bg-white rounded-lg overflow-hidden relative flex items-center justify-center"
            style={{ minHeight: "384px" }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <div className="text-xs text-muted-foreground">Cargando seña...</div>
                </div>
              </div>
            )}
            
            {(() => {
              // Validación completa y estricta de animData antes de renderizar
              const isValidAnimData = animData && 
                typeof animData === 'object' &&
                animData.v && 
                Array.isArray(animData.layers) &&
                animData.layers.length > 0 &&
                typeof animData.w === 'number' &&
                typeof animData.h === 'number' &&
                animData.layers.every((layer: any) => 
                  layer && 
                  typeof layer === 'object' &&
                  typeof layer.ty === 'number'
                )
              
              if (isValidAnimData && !isLoading) {
                // Crear una copia segura del animData con todas las propiedades necesarias
                const safeAnimData = {
                  v: animData.v,
                  fr: animData.fr || 30,
                  ip: animData.ip || 0,
                  op: animData.op || 60,
                  w: animData.w || 400,
                  h: animData.h || 400,
                  nm: animData.nm || "Animation",
                  ddd: animData.ddd || 0,
                  assets: Array.isArray(animData.assets) ? animData.assets : [],
                  layers: animData.layers.map((layer: any) => ({
                    ...layer,
                    shapes: Array.isArray(layer.shapes) ? layer.shapes : [],
                    ddd: layer.ddd !== undefined ? layer.ddd : 0,
                    ind: layer.ind !== undefined ? layer.ind : 1,
                    ty: layer.ty !== undefined ? layer.ty : 4,
                    sr: layer.sr !== undefined ? layer.sr : 1,
                    ao: layer.ao !== undefined ? layer.ao : 0,
                    ip: layer.ip !== undefined ? layer.ip : 0,
                    op: layer.op !== undefined ? layer.op : 60,
                    st: layer.st !== undefined ? layer.st : 0,
                    bm: layer.bm !== undefined ? layer.bm : 0,
                    ks: layer.ks || {
                      o: { a: 0, k: 100 },
                      r: { a: 0, k: 0 },
                      p: { a: 0, k: [200, 200, 0] },
                      a: { a: 0, k: [0, 0, 0] },
                      s: { a: 0, k: [100, 100, 100] }
                    }
                  }))
                }
                
                return (
                  <Lottie
                    lottieRef={playerRef}
                    animationData={safeAnimData}
                    loop={false}
                    autoplay={true}
                    style={{ width: "100%", height: "100%" }}
                  />
                )
              }
              
              if (!isLoading) {
                return (
                  <div className="text-center">
                    <div className="text-4xl mb-4 animate-pulse">👋</div>
                    <div className="text-sm text-muted-foreground">
                      {currentText ? "Buscando animación..." : "Listo para traducir"}
                    </div>
                  </div>
                )
              }
              
              return null
            })()}
          </div>
          
          {/* Texto que se está traduciendo */}
          {currentText && (
            <div className="mt-2 text-xs text-center text-foreground bg-primary/10 rounded px-3 py-2 max-w-full break-words">
              {currentText}
            </div>
          )}
          
          {/* Indicador de progreso */}
          {queue.length > 0 && (
            <div className="text-xs text-muted-foreground text-center">
              Seña {currentIndex + 1} de {queue.length}: {tokenToLabel(queue[currentIndex]) || "desconocido"}
            </div>
          )}
          
          {/* Indicador de estado */}
          <div className="text-xs text-muted-foreground text-center">
            {currentText ? "Traduciendo..." : "Listo para traducir"}
          </div>
        </div>
      </div>
    </div>
  )
}
