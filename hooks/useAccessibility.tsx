'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AccessibilityPreferences {
  // Visuales
  altoContraste: boolean
  ajusteTamanoLetra: 'normal' | 'grande' | 'extra-grande'
  tipoLetra: string // Tipo de letra
  lupaZoom: number // 100, 120, 150, 200
  inversionColores: boolean
  lupaCursor: boolean
  lupaCursorZoom: number // Zoom para la lupa cursor (150, 200, 250, 300)
  quitarEstilosCSS: boolean // Quitar estilos CSS del sistema
  espaciadoTexto: 'normal' | 'aumentado' | 'extra-aumentado' // Espaciado entre letras y líneas
  areaClicAumentada: boolean // Aumentar área de clic de botones y enlaces
  notificacionesVisuales: boolean // Notificaciones visuales para eventos de audio
  modoMonocromatico: boolean // Ver todo en escala de grises
  resaltadoEnlaces: boolean // Resaltar todos los enlaces de manera más visible
  guiaPasoAPaso: boolean // Guía paso a paso que resalta qué hacer primero, segundo, etc.
  // Motoras y físicas
  tecladoPantalla: boolean
  tamanoTeclas: 'normal' | 'grande' | 'extra-grande' // Tamaño de teclas del teclado virtual
  pulsacionLenta: boolean
  tiempoPulsacion: number // Tiempo mínimo en ms para reconocer una pulsación (100-2000)
  punteroGrande: boolean
  tamanoPuntero: number // Tamaño del puntero grande (1-5)
  controlVoz: boolean
  // Cognitivas
  lecturaVozAlta: boolean // Lectura en voz alta del contenido (antes lectoresPantalla)
  volumenAmplificacion: number // Volumen de amplificación del sonido (0-100)
  simplificacionInterfaz: boolean
  enfoqueLineaHorizontal: boolean // Enfoque en línea horizontal donde va el cursor
  lenguajeSenas: boolean // Lenguaje de señas con avatar animado
  alfabetoSenas: boolean // Alfabeto de señas con imágenes
}

interface AccessibilityContextType {
  preferences: AccessibilityPreferences
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void
  setAllPreferences: (data: Partial<AccessibilityPreferences>) => void
  resetToDefault: () => void
}

const defaultPreferences: AccessibilityPreferences = {
  altoContraste: false,
  ajusteTamanoLetra: 'normal',
  tipoLetra: 'default',
  lupaZoom: 100,
  inversionColores: false,
  lupaCursor: false,
  lupaCursorZoom: 200,
  quitarEstilosCSS: false,
  espaciadoTexto: 'normal',
  areaClicAumentada: false,
  notificacionesVisuales: false,
  modoMonocromatico: false,
  resaltadoEnlaces: false,
  guiaPasoAPaso: false,
  tecladoPantalla: false,
  tamanoTeclas: 'normal',
  pulsacionLenta: false,
  tiempoPulsacion: 300, // 300ms por defecto
  punteroGrande: false,
  tamanoPuntero: 2, // 2x el tamaño normal
  controlVoz: false,
  lecturaVozAlta: false,
  volumenAmplificacion: 50,
  simplificacionInterfaz: false,
  enfoqueLineaHorizontal: false,
  lenguajeSenas: false,
  alfabetoSenas: false,
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)


export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaultPreferences)
  const resetToDefault = () => {
  setPreferences(defaultPreferences);

  // limpiar localStorage para que no se vuelva a cargar la anterior configuración
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessibility-preferences");
  }
};
  const setAllPreferences = (newPrefs: Partial<AccessibilityPreferences>) => {
  setPreferences(prev => ({ ...prev, ...newPrefs }))
  }

  // Cargar preferencias desde localStorage al montar
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('accessibility-preferences')
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferences({ ...defaultPreferences, ...parsed })
      }
    } catch (error) {
      console.error('Error loading accessibility preferences:', error)
    }
  }, [])

  // Aplicar preferencias al DOM - usar requestAnimationFrame para asegurar que se aplique después del render
  useEffect(() => {
    if (typeof window === 'undefined') return

    const applyPreferences = () => {
      const root = document.documentElement

      // 1. Alto contraste
      if (preferences.altoContraste) {
        root.classList.add('high-contrast')
      } else {
        root.classList.remove('high-contrast')
      }

      // 2. Ajuste de tamaño de letra
      root.classList.remove('font-size-normal', 'font-size-large', 'font-size-extra-large')
      if (preferences.ajusteTamanoLetra === 'normal') {
        root.classList.add('font-size-normal')
      } else if (preferences.ajusteTamanoLetra === 'grande') {
        root.classList.add('font-size-large')
      } else if (preferences.ajusteTamanoLetra === 'extra-grande') {
        root.classList.add('font-size-extra-large')
      }

      // 3. Tipo de letra - aplicar a todo el sistema
      const fontMap: Record<string, string> = {
        'default': 'Geist, "Geist Fallback", system-ui, -apple-system, sans-serif',
        // Fuentes para dislexia
        'opendyslexic': 'OpenDyslexic, sans-serif',
        'dyslexie-font': '"Dyslexie Font", sans-serif',
        'sylexiad': 'Sylexiad, sans-serif',
        'read-regular': '"Read Regular", sans-serif',
        'easyreading': 'EasyReading, sans-serif',
        'dislexie': 'Dislexie, sans-serif',
        'fs-me': '"FS Me", sans-serif',
        'luciole-dyslexia': '"Luciole Dyslexia", sans-serif',
        'tiresias-pcfont': '"Tiresias PCfont", sans-serif',
        'aphont': 'APHont, sans-serif',
        'atkinson-hyperlegible': '"Atkinson Hyperlegible", sans-serif',
        // Fuentes estándar
        'clearview': 'Clearview, sans-serif',
        'frutiger': 'Frutiger, sans-serif',
        'luciole': 'Luciole, sans-serif',
        'verdana': 'Verdana, sans-serif',
        'tahoma': 'Tahoma, sans-serif',
        'arial': 'Arial, sans-serif',
        'helvetica': 'Helvetica, Arial, sans-serif',
        'helvetica-neue': '"Helvetica Neue", Helvetica, Arial, sans-serif',
        'source-sans': '"Source Sans Pro", sans-serif',
        // Fuentes Lexend
        'lexend': 'Lexend, sans-serif',
        'lexend-deca': '"Lexend Deca", sans-serif',
        'lexend-exa': '"Lexend Exa", sans-serif',
        'lexend-giga': '"Lexend Giga", sans-serif',
        'lexend-mega': '"Lexend Mega", sans-serif',
        // Fuentes adicionales
        'comic-sans': 'Comic Sans MS, cursive',
        'gothic': 'Century Gothic, sans-serif',
        'trebuchet': 'Trebuchet MS, sans-serif',
        'calibri': 'Calibri, sans-serif',
        'nunito': 'Nunito, sans-serif',
        'ubuntu': 'Ubuntu, sans-serif',
        'roboto': 'Roboto, sans-serif',
        'inter': 'Inter, sans-serif',
        'open-sans': '"Open Sans", sans-serif',
        'noto-sans': '"Noto Sans", sans-serif',
        'pt-sans': '"PT Sans", sans-serif',
        'ibm-plex-sans': '"IBM Plex Sans", sans-serif',
        'work-sans': '"Work Sans", sans-serif',
        'lato': 'Lato, sans-serif',
        'mulish': 'Mulish, sans-serif',
        'karla': 'Karla, sans-serif',
        'assistant': 'Assistant, sans-serif',
        // Fuentes adicionales del sistema original
        'georgia': 'Georgia, serif',
        'times': 'Times New Roman, serif',
        'courier': 'Courier New, monospace',
        'impact': 'Impact, fantasy',
        'lucida': 'Lucida Console, monospace',
        'palatino': 'Palatino Linotype, Book Antiqua, serif',
        'franklin': 'Franklin Gothic Medium, sans-serif',
        'bookman': 'Bookman Old Style, serif',
        'garamond': 'Garamond, serif',
        'baskerville': 'Baskerville, serif',
        'cambria': 'Cambria, serif',
        'consolas': 'Consolas, monospace',
        'montserrat': 'Montserrat, sans-serif',
        'raleway': 'Raleway, sans-serif',
        'playfair': 'Playfair Display, serif',
        'merriweather': 'Merriweather, serif',
        'oswald': 'Oswald, sans-serif',
      }
      const selectedFont = fontMap[preferences.tipoLetra] || 'inherit'
      
      // Aplicar la fuente de manera agresiva a todo el sistema
      root.style.fontFamily = selectedFont
      root.setAttribute('data-font-family', selectedFont)
      
      // Aplicar también al body y forzar en todos los elementos
      if (document.body) {
        document.body.style.fontFamily = selectedFont
        // Crear o actualizar un estilo dinámico para forzar la fuente en todos los elementos
        let styleElement = document.getElementById('dynamic-font-style')
        if (!styleElement) {
          styleElement = document.createElement('style')
          styleElement.id = 'dynamic-font-style'
          document.head.appendChild(styleElement)
        }
        if (preferences.tipoLetra === 'default') {
          // Si es default, remover el estilo forzado
          styleElement.textContent = ''
          root.style.fontFamily = ''
          if (document.body) {
            document.body.style.fontFamily = ''
          }
        } else {
          // Forzar la fuente en todos los elementos del sistema
          styleElement.textContent = `
            html, body, body *, 
            [class*="card"], [class*="button"], [class*="input"], 
            [class*="label"], [class*="select"], [class*="table"],
            h1, h2, h3, h4, h5, h6, p, span, div, a, button, input, 
            textarea, select, label, td, th, li, ul, ol {
              font-family: ${selectedFont} !important;
            }
          `
        }
      }

      // 4. Zoom de pantalla
      root.style.zoom = `${preferences.lupaZoom}%`

      // 5. Inversión de colores
      if (preferences.inversionColores) {
        root.classList.add('color-invert')
      } else {
        root.classList.remove('color-invert')
      }

      // 5. Lupa cursor - se maneja con componente MagnifierCursor
      
      // 6. Puntero grande
      if (preferences.punteroGrande) {
        root.classList.add('large-cursor')
      } else {
        root.classList.remove('large-cursor')
      }

      // 8. Simplificación de interfaz
      if (preferences.simplificacionInterfaz) {
        root.classList.add('simplified-ui')
      } else {
        root.classList.remove('simplified-ui')
      }

      // 9. Espaciado de texto
      root.classList.remove('text-spacing-normal', 'text-spacing-increased', 'text-spacing-extra-increased')
      if (preferences.espaciadoTexto === 'normal') {
        root.classList.add('text-spacing-normal')
      } else if (preferences.espaciadoTexto === 'aumentado') {
        root.classList.add('text-spacing-increased')
      } else if (preferences.espaciadoTexto === 'extra-aumentado') {
        root.classList.add('text-spacing-extra-increased')
      }

      // 10. Área de clic aumentada
      if (preferences.areaClicAumentada) {
        root.classList.add('increased-click-area')
      } else {
        root.classList.remove('increased-click-area')
      }

      // 11. Modo monocromático
      if (preferences.modoMonocromatico) {
        root.classList.add('monochrome-mode')
      } else {
        root.classList.remove('monochrome-mode')
      }

      // 12. Resaltado de enlaces
      if (preferences.resaltadoEnlaces) {
        root.classList.add('highlight-links')
      } else {
        root.classList.remove('highlight-links')
      }

      // 13. Quitar estilos CSS
      let noStylesElement = document.getElementById('no-styles-override')
      if (preferences.quitarEstilosCSS) {
        // Deshabilitar todos los estilos CSS externos
        const styleSheets = Array.from(document.styleSheets)
        styleSheets.forEach(sheet => {
          try {
            if (sheet.ownerNode && sheet.ownerNode instanceof HTMLLinkElement) {
              sheet.disabled = true
            } else if (sheet.ownerNode && sheet.ownerNode instanceof HTMLStyleElement) {
              // No deshabilitar el style tag que vamos a crear
              if (sheet.ownerNode.id !== 'no-styles-override') {
                sheet.disabled = true
              }
            }
          } catch (e) {
            // Ignorar errores de CORS
          }
        })
        
        if (!noStylesElement) {
          noStylesElement = document.createElement('style')
          noStylesElement.id = 'no-styles-override'
          // Insertar al final del head para que tenga máxima prioridad
          document.head.appendChild(noStylesElement)
        }
        // Aplicar estilos mínimos que sobrescriben todo
        noStylesElement.textContent = `
          * {
            all: unset !important;
            display: revert !important;
            box-sizing: border-box !important;
          }
          html, body {
            font-family: serif !important;
            font-size: 16px !important;
            line-height: 1.5 !important;
            color: #000 !important;
            background: #fff !important;
            margin: 0 !important;
            padding: 8px !important;
            width: 100% !important;
            height: auto !important;
          }
          h1, h2, h3, h4, h5, h6 {
            font-weight: bold !important;
            margin: 1em 0 0.5em 0 !important;
            display: block !important;
          }
          h1 { font-size: 2em !important; }
          h2 { font-size: 1.5em !important; }
          h3 { font-size: 1.17em !important; }
          h4 { font-size: 1em !important; }
          h5 { font-size: 0.83em !important; }
          h6 { font-size: 0.67em !important; }
          p, div, span, section, article, main, aside, header, footer, nav {
            display: block !important;
            margin: 0.5em 0 !important;
            width: auto !important;
            height: auto !important;
          }
          span, strong, em, b, i, u, small, mark, del, ins, sub, sup {
            display: inline !important;
            margin: 0 !important;
          }
          a {
            color: #0000EE !important;
            text-decoration: underline !important;
            cursor: pointer !important;
            display: inline !important;
          }
          a:visited {
            color: #551A8B !important;
          }
          button, input, select, textarea {
            border: 1px solid #000 !important;
            padding: 4px 8px !important;
            display: inline-block !important;
            font-family: serif !important;
            font-size: 16px !important;
            background: #fff !important;
            color: #000 !important;
          }
          button {
            cursor: pointer !important;
            background: #f0f0f0 !important;
          }
          button:hover {
            background: #e0e0e0 !important;
          }
          table {
            border-collapse: collapse !important;
            display: table !important;
            width: 100% !important;
            margin: 1em 0 !important;
          }
          thead, tbody, tfoot {
            display: table-row-group !important;
          }
          tr { 
            display: table-row !important;
          }
          td, th {
            border: 1px solid #000 !important;
            padding: 4px 8px !important;
            display: table-cell !important;
            text-align: left !important;
          }
          th {
            font-weight: bold !important;
          }
          ul, ol {
            display: block !important;
            margin: 1em 0 !important;
            padding-left: 40px !important;
          }
          li {
            display: list-item !important;
            margin: 0.25em 0 !important;
          }
          img {
            display: inline-block !important;
            max-width: 100% !important;
            height: auto !important;
          }
          form {
            display: block !important;
            margin: 1em 0 !important;
          }
          label {
            display: inline-block !important;
            margin: 0.5em 0 !important;
          }
          /* Estilos para modales y diálogos - solo mostrar cuando están abiertos */
          [data-slot="dialog-portal"]:has([data-state="open"]),
          [data-slot="sheet-portal"]:has([data-state="open"]),
          [data-slot="alert-dialog-portal"]:has([data-state="open"]) {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 9999 !important;
            display: block !important;
          }
          [data-slot="dialog-overlay"][data-state="open"],
          [data-slot="sheet-overlay"][data-state="open"],
          [data-slot="alert-dialog-overlay"][data-state="open"] {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: rgba(0, 0, 0, 0.5) !important;
            z-index: 9998 !important;
            display: block !important;
          }
          [data-slot="dialog-content"][data-state="open"],
          [data-slot="alert-dialog-content"][data-state="open"] {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            background: #fff !important;
            border: 2px solid #000 !important;
            padding: 20px !important;
            max-width: 90% !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
            z-index: 10000 !important;
            display: block !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
          }
          [data-slot="sheet-content"][data-state="open"] {
            position: fixed !important;
            background: #fff !important;
            border: 2px solid #000 !important;
            padding: 20px !important;
            z-index: 10000 !important;
            display: block !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
            overflow-y: auto !important;
            max-height: 100vh !important;
          }
          /* Sheet desde la derecha */
          [data-slot="sheet-content"][data-state="open"][class*="right"] {
            top: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 300px !important;
            max-width: 80% !important;
          }
          /* Sheet desde la izquierda */
          [data-slot="sheet-content"][data-state="open"][class*="left"] {
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 300px !important;
            max-width: 80% !important;
          }
          /* Sheet desde arriba */
          [data-slot="sheet-content"][data-state="open"][class*="top"] {
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-height: 50vh !important;
          }
          /* Sheet desde abajo */
          [data-slot="sheet-content"][data-state="open"][class*="bottom"] {
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-height: 50vh !important;
          }
          /* Ocultar modales cerrados */
          [data-slot="dialog-content"][data-state="closed"],
          [data-slot="sheet-content"][data-state="closed"],
          [data-slot="alert-dialog-content"][data-state="closed"],
          [data-slot="dialog-overlay"][data-state="closed"],
          [data-slot="sheet-overlay"][data-state="closed"],
          [data-slot="alert-dialog-overlay"][data-state="closed"] {
            display: none !important;
          }
          [data-slot="dialog-header"],
          [data-slot="sheet-header"],
          [data-slot="alert-dialog-header"] {
            display: block !important;
            margin-bottom: 1em !important;
            padding-bottom: 0.5em !important;
            border-bottom: 1px solid #000 !important;
          }
          [data-slot="dialog-footer"],
          [data-slot="sheet-footer"],
          [data-slot="alert-dialog-footer"] {
            display: block !important;
            margin-top: 1em !important;
            padding-top: 0.5em !important;
            border-top: 1px solid #000 !important;
          }
          [data-slot="dialog-close"],
          [data-slot="sheet-close"],
          [data-slot="alert-dialog-cancel"],
          [data-slot="alert-dialog-action"] {
            position: absolute !important;
            top: 10px !important;
            right: 10px !important;
            background: #f0f0f0 !important;
            border: 1px solid #000 !important;
            padding: 4px 8px !important;
            cursor: pointer !important;
            display: inline-block !important;
            z-index: 10001 !important;
          }
          [data-slot="dialog-close"]:hover,
          [data-slot="sheet-close"]:hover {
            background: #e0e0e0 !important;
          }
          /* Asegurar que los elementos dentro de modales sean visibles */
          [data-slot="dialog-content"] *,
          [data-slot="sheet-content"] *,
          [data-slot="alert-dialog-content"] * {
            color: #000 !important;
            background: transparent !important;
          }
          [data-slot="dialog-content"] button,
          [data-slot="sheet-content"] button,
          [data-slot="alert-dialog-content"] button {
            background: #f0f0f0 !important;
            border: 1px solid #000 !important;
            padding: 8px 16px !important;
            margin: 4px !important;
            display: inline-block !important;
            cursor: pointer !important;
          }
          [data-slot="dialog-content"] input,
          [data-slot="sheet-content"] input,
          [data-slot="alert-dialog-content"] input,
          [data-slot="dialog-content"] select,
          [data-slot="sheet-content"] select,
          [data-slot="alert-dialog-content"] select,
          [data-slot="dialog-content"] textarea,
          [data-slot="sheet-content"] textarea,
          [data-slot="alert-dialog-content"] textarea {
            background: #fff !important;
            border: 1px solid #000 !important;
            padding: 4px 8px !important;
            display: block !important;
            width: 100% !important;
            margin: 4px 0 !important;
          }
          /* Estilos para sliders/barritas de volumen y otros controles */
          input[type="range"] {
            -webkit-appearance: none !important;
            appearance: none !important;
            width: 100% !important;
            height: 8px !important;
            background: #ddd !important;
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            outline: none !important;
            display: block !important;
            margin: 8px 0 !important;
            cursor: pointer !important;
          }
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none !important;
            appearance: none !important;
            width: 20px !important;
            height: 20px !important;
            background: #000 !important;
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            cursor: pointer !important;
          }
          input[type="range"]::-moz-range-thumb {
            width: 20px !important;
            height: 20px !important;
            background: #000 !important;
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            cursor: pointer !important;
          }
          input[type="range"]::-ms-thumb {
            width: 20px !important;
            height: 20px !important;
            background: #000 !important;
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            cursor: pointer !important;
          }
          /* Sliders de Radix UI */
          [data-slot="slider"] {
            position: relative !important;
            display: flex !important;
            width: 100% !important;
            align-items: center !important;
            margin: 8px 0 !important;
            touch-action: none !important;
            user-select: none !important;
          }
          [data-slot="slider-track"] {
            position: relative !important;
            flex: 1 !important;
            height: 8px !important;
            background: #ddd !important;
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            display: block !important;
          }
          [data-slot="slider-range"] {
            position: absolute !important;
            height: 100% !important;
            background: #000 !important;
            border-radius: 0 !important;
            display: block !important;
          }
          [data-slot="slider-thumb"] {
            position: absolute !important;
            width: 20px !important;
            height: 20px !important;
            background: #000 !important;
            border: 2px solid #fff !important;
            border-radius: 0 !important;
            display: block !important;
            cursor: grab !important;
            transform: translate(-50%, -50%) !important;
            top: 50% !important;
          }
          [data-slot="slider-thumb"]:hover {
            background: #333 !important;
          }
          [data-slot="slider-thumb"]:active {
            cursor: grabbing !important;
          }
        `
      } else {
        // Restaurar estilos
        if (noStylesElement) {
          noStylesElement.remove()
        }
        // Rehabilitar todos los estilos CSS externos
        const styleSheets = Array.from(document.styleSheets)
        styleSheets.forEach(sheet => {
          try {
            if (sheet.ownerNode && (sheet.ownerNode instanceof HTMLLinkElement || sheet.ownerNode instanceof HTMLStyleElement)) {
              sheet.disabled = false
            }
          } catch (e) {
            // Ignorar errores de CORS
          }
        })
      }
    }

    // Aplicar inmediatamente
    applyPreferences()

    // También aplicar después del siguiente frame para asegurar que se aplique después de cambios de ruta
    requestAnimationFrame(() => {
      requestAnimationFrame(applyPreferences)
    })
  }, [preferences])

  // Guardar en localStorage en un efecto separado para evitar actualizaciones durante el render
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem('accessibility-preferences', JSON.stringify(preferences))
    } catch (error) {
      console.error('Error saving accessibility preferences:', error)
    }
  }, [preferences])

  // Escuchar cambios de ruta para reaplicar preferencias
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleRouteChange = () => {
      // Reaplicar preferencias después de un cambio de ruta
      requestAnimationFrame(() => {
        const root = document.documentElement

        if (preferences.altoContraste) {
          root.classList.add('high-contrast')
        }
        if (preferences.ajusteTamanoLetra !== 'normal') {
          root.classList.add(`font-size-${preferences.ajusteTamanoLetra}`)
        }
        const fontMap: Record<string, string> = {
          'default': 'Geist, "Geist Fallback", system-ui, -apple-system, sans-serif',
          // Fuentes para dislexia
          'opendyslexic': 'OpenDyslexic, sans-serif',
          'dyslexie-font': '"Dyslexie Font", sans-serif',
          'sylexiad': 'Sylexiad, sans-serif',
          'read-regular': '"Read Regular", sans-serif',
          'easyreading': 'EasyReading, sans-serif',
          'dislexie': 'Dislexie, sans-serif',
          'fs-me': '"FS Me", sans-serif',
          'luciole-dyslexia': '"Luciole Dyslexia", sans-serif',
          'tiresias-pcfont': '"Tiresias PCfont", sans-serif',
          'aphont': 'APHont, sans-serif',
          'atkinson-hyperlegible': '"Atkinson Hyperlegible", sans-serif',
          // Fuentes estándar
          'clearview': 'Clearview, sans-serif',
          'frutiger': 'Frutiger, sans-serif',
          'luciole': 'Luciole, sans-serif',
          'verdana': 'Verdana, sans-serif',
          'tahoma': 'Tahoma, sans-serif',
          'arial': 'Arial, sans-serif',
          'helvetica': 'Helvetica, Arial, sans-serif',
          'helvetica-neue': '"Helvetica Neue", Helvetica, Arial, sans-serif',
          'source-sans': '"Source Sans Pro", sans-serif',
          // Fuentes Lexend
          'lexend': 'Lexend, sans-serif',
          'lexend-deca': '"Lexend Deca", sans-serif',
          'lexend-exa': '"Lexend Exa", sans-serif',
          'lexend-giga': '"Lexend Giga", sans-serif',
          'lexend-mega': '"Lexend Mega", sans-serif',
          // Fuentes adicionales
          'comic-sans': 'Comic Sans MS, cursive',
          'gothic': 'Century Gothic, sans-serif',
          'trebuchet': 'Trebuchet MS, sans-serif',
          'calibri': 'Calibri, sans-serif',
          'nunito': 'Nunito, sans-serif',
          'ubuntu': 'Ubuntu, sans-serif',
          'roboto': 'Roboto, sans-serif',
          'inter': 'Inter, sans-serif',
          'open-sans': '"Open Sans", sans-serif',
          'noto-sans': '"Noto Sans", sans-serif',
          'pt-sans': '"PT Sans", sans-serif',
          'ibm-plex-sans': '"IBM Plex Sans", sans-serif',
          'work-sans': '"Work Sans", sans-serif',
          'lato': 'Lato, sans-serif',
          'mulish': 'Mulish, sans-serif',
          'karla': 'Karla, sans-serif',
          'assistant': 'Assistant, sans-serif',
          // Fuentes adicionales del sistema original
          'georgia': 'Georgia, serif',
          'times': 'Times New Roman, serif',
          'courier': 'Courier New, monospace',
          'impact': 'Impact, fantasy',
          'lucida': 'Lucida Console, monospace',
          'palatino': 'Palatino Linotype, Book Antiqua, serif',
          'franklin': 'Franklin Gothic Medium, sans-serif',
          'bookman': 'Bookman Old Style, serif',
          'garamond': 'Garamond, serif',
          'baskerville': 'Baskerville, serif',
          'cambria': 'Cambria, serif',
          'consolas': 'Consolas, monospace',
          'montserrat': 'Montserrat, sans-serif',
          'raleway': 'Raleway, sans-serif',
          'playfair': 'Playfair Display, serif',
          'merriweather': 'Merriweather, serif',
          'oswald': 'Oswald, sans-serif',
        }
        const selectedFont = fontMap[preferences.tipoLetra] || 'inherit'
        
        // Aplicar la fuente de manera agresiva a todo el sistema
        root.style.fontFamily = selectedFont
        root.setAttribute('data-font-family', selectedFont)
        
        // Aplicar también al body y forzar en todos los elementos
        if (document.body) {
          document.body.style.fontFamily = selectedFont
          // Crear un estilo dinámico para forzar la fuente en todos los elementos
          let styleElement = document.getElementById('dynamic-font-style')
          if (!styleElement) {
            styleElement = document.createElement('style')
            styleElement.id = 'dynamic-font-style'
            document.head.appendChild(styleElement)
          }
          styleElement.textContent = `
            * {
              font-family: ${selectedFont} !important;
            }
          `
        }
        root.style.zoom = `${preferences.lupaZoom}%`
        if (preferences.inversionColores) {
          root.classList.add('color-invert')
        }
        if (preferences.punteroGrande) {
          root.classList.add('large-cursor')
        }
        if (preferences.simplificacionInterfaz) {
          root.classList.add('simplified-ui')
        }
        // Reaplicar quitar estilos CSS si está activo
        if (preferences.quitarEstilosCSS) {
          // Deshabilitar todos los estilos CSS externos
          const styleSheets = Array.from(document.styleSheets)
          styleSheets.forEach(sheet => {
            try {
              if (sheet.ownerNode && sheet.ownerNode instanceof HTMLLinkElement) {
                sheet.disabled = true
              } else if (sheet.ownerNode && sheet.ownerNode instanceof HTMLStyleElement) {
                if (sheet.ownerNode.id !== 'no-styles-override') {
                  sheet.disabled = true
                }
              }
            } catch (e) {
              // Ignorar errores de CORS
            }
          })
          
          let noStylesElement = document.getElementById('no-styles-override')
          if (!noStylesElement) {
            noStylesElement = document.createElement('style')
            noStylesElement.id = 'no-styles-override'
            document.head.appendChild(noStylesElement)
          }
          noStylesElement.textContent = `
            * {
              all: unset !important;
              display: revert !important;
              box-sizing: border-box !important;
            }
            html, body {
              font-family: serif !important;
              font-size: 16px !important;
              line-height: 1.5 !important;
              color: #000 !important;
              background: #fff !important;
              margin: 0 !important;
              padding: 8px !important;
              width: 100% !important;
              height: auto !important;
            }
            h1, h2, h3, h4, h5, h6 {
              font-weight: bold !important;
              margin: 1em 0 0.5em 0 !important;
              display: block !important;
            }
            h1 { font-size: 2em !important; }
            h2 { font-size: 1.5em !important; }
            h3 { font-size: 1.17em !important; }
            h4 { font-size: 1em !important; }
            h5 { font-size: 0.83em !important; }
            h6 { font-size: 0.67em !important; }
            p, div, span, section, article, main, aside, header, footer, nav {
              display: block !important;
              margin: 0.5em 0 !important;
              width: auto !important;
              height: auto !important;
            }
            span, strong, em, b, i, u, small, mark, del, ins, sub, sup {
              display: inline !important;
              margin: 0 !important;
            }
            a {
              color: #0000EE !important;
              text-decoration: underline !important;
              cursor: pointer !important;
              display: inline !important;
            }
            a:visited {
              color: #551A8B !important;
            }
            button, input, select, textarea {
              border: 1px solid #000 !important;
              padding: 4px 8px !important;
              display: inline-block !important;
              font-family: serif !important;
              font-size: 16px !important;
              background: #fff !important;
              color: #000 !important;
            }
            button {
              cursor: pointer !important;
              background: #f0f0f0 !important;
            }
            button:hover {
              background: #e0e0e0 !important;
            }
            table {
              border-collapse: collapse !important;
              display: table !important;
              width: 100% !important;
              margin: 1em 0 !important;
            }
            thead, tbody, tfoot {
              display: table-row-group !important;
            }
            tr { 
              display: table-row !important;
            }
            td, th {
              border: 1px solid #000 !important;
              padding: 4px 8px !important;
              display: table-cell !important;
              text-align: left !important;
            }
            th {
              font-weight: bold !important;
            }
            ul, ol {
              display: block !important;
              margin: 1em 0 !important;
              padding-left: 40px !important;
            }
            li {
              display: list-item !important;
              margin: 0.25em 0 !important;
            }
            img {
              display: inline-block !important;
              max-width: 100% !important;
              height: auto !important;
            }
            form {
              display: block !important;
              margin: 1em 0 !important;
            }
            label {
              display: inline-block !important;
              margin: 0.5em 0 !important;
            }
            /* Estilos para modales y diálogos - solo mostrar cuando están abiertos */
            [data-slot="dialog-portal"]:has([data-state="open"]),
            [data-slot="sheet-portal"]:has([data-state="open"]),
            [data-slot="alert-dialog-portal"]:has([data-state="open"]) {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              z-index: 9999 !important;
              display: block !important;
            }
            [data-slot="dialog-overlay"][data-state="open"],
            [data-slot="sheet-overlay"][data-state="open"],
            [data-slot="alert-dialog-overlay"][data-state="open"] {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              background: rgba(0, 0, 0, 0.5) !important;
              z-index: 9998 !important;
              display: block !important;
            }
            [data-slot="dialog-content"][data-state="open"],
            [data-slot="alert-dialog-content"][data-state="open"] {
              position: fixed !important;
              top: 50% !important;
              left: 50% !important;
              transform: translate(-50%, -50%) !important;
              background: #fff !important;
              border: 2px solid #000 !important;
              padding: 20px !important;
              max-width: 90% !important;
              max-height: 90vh !important;
              overflow-y: auto !important;
              z-index: 10000 !important;
              display: block !important;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
            }
            [data-slot="sheet-content"][data-state="open"] {
              position: fixed !important;
              background: #fff !important;
              border: 2px solid #000 !important;
              padding: 20px !important;
              z-index: 10000 !important;
              display: block !important;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
              overflow-y: auto !important;
              max-height: 100vh !important;
            }
            /* Sheet desde la derecha */
            [data-slot="sheet-content"][data-state="open"][class*="right"] {
              top: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              width: 300px !important;
              max-width: 80% !important;
            }
            /* Sheet desde la izquierda */
            [data-slot="sheet-content"][data-state="open"][class*="left"] {
              top: 0 !important;
              left: 0 !important;
              bottom: 0 !important;
              width: 300px !important;
              max-width: 80% !important;
            }
            /* Sheet desde arriba */
            [data-slot="sheet-content"][data-state="open"][class*="top"] {
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
              max-height: 50vh !important;
            }
            /* Sheet desde abajo */
            [data-slot="sheet-content"][data-state="open"][class*="bottom"] {
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
              max-height: 50vh !important;
            }
            /* Ocultar modales cerrados */
            [data-slot="dialog-content"][data-state="closed"],
            [data-slot="sheet-content"][data-state="closed"],
            [data-slot="alert-dialog-content"][data-state="closed"],
            [data-slot="dialog-overlay"][data-state="closed"],
            [data-slot="sheet-overlay"][data-state="closed"],
            [data-slot="alert-dialog-overlay"][data-state="closed"] {
              display: none !important;
            }
            [data-slot="dialog-header"],
            [data-slot="sheet-header"],
            [data-slot="alert-dialog-header"] {
              display: block !important;
              margin-bottom: 1em !important;
              padding-bottom: 0.5em !important;
              border-bottom: 1px solid #000 !important;
            }
            [data-slot="dialog-footer"],
            [data-slot="sheet-footer"],
            [data-slot="alert-dialog-footer"] {
              display: block !important;
              margin-top: 1em !important;
              padding-top: 0.5em !important;
              border-top: 1px solid #000 !important;
            }
            [data-slot="dialog-close"],
            [data-slot="sheet-close"],
            [data-slot="alert-dialog-cancel"],
            [data-slot="alert-dialog-action"] {
              position: absolute !important;
              top: 10px !important;
              right: 10px !important;
              background: #f0f0f0 !important;
              border: 1px solid #000 !important;
              padding: 4px 8px !important;
              cursor: pointer !important;
              display: inline-block !important;
              z-index: 10001 !important;
            }
            [data-slot="dialog-close"]:hover,
            [data-slot="sheet-close"]:hover {
              background: #e0e0e0 !important;
            }
            /* Asegurar que los elementos dentro de modales sean visibles */
            [data-slot="dialog-content"] *,
            [data-slot="sheet-content"] *,
            [data-slot="alert-dialog-content"] * {
              color: #000 !important;
              background: transparent !important;
            }
            [data-slot="dialog-content"] button,
            [data-slot="sheet-content"] button,
            [data-slot="alert-dialog-content"] button {
              background: #f0f0f0 !important;
              border: 1px solid #000 !important;
              padding: 8px 16px !important;
              margin: 4px !important;
              display: inline-block !important;
              cursor: pointer !important;
            }
            [data-slot="dialog-content"] input,
            [data-slot="sheet-content"] input,
            [data-slot="alert-dialog-content"] input,
            [data-slot="dialog-content"] select,
            [data-slot="sheet-content"] select,
            [data-slot="alert-dialog-content"] select,
            [data-slot="dialog-content"] textarea,
            [data-slot="sheet-content"] textarea,
            [data-slot="alert-dialog-content"] textarea {
              background: #fff !important;
              border: 1px solid #000 !important;
              padding: 4px 8px !important;
              display: block !important;
              width: 100% !important;
              margin: 4px 0 !important;
            }
            /* Estilos para sliders/barritas de volumen y otros controles */
            input[type="range"] {
              -webkit-appearance: none !important;
              appearance: none !important;
              width: 100% !important;
              height: 8px !important;
              background: #ddd !important;
              border: 1px solid #000 !important;
              border-radius: 0 !important;
              outline: none !important;
              display: block !important;
              margin: 8px 0 !important;
              cursor: pointer !important;
            }
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none !important;
              appearance: none !important;
              width: 20px !important;
              height: 20px !important;
              background: #000 !important;
              border: 1px solid #000 !important;
              border-radius: 0 !important;
              cursor: pointer !important;
            }
            input[type="range"]::-moz-range-thumb {
              width: 20px !important;
              height: 20px !important;
              background: #000 !important;
              border: 1px solid #000 !important;
              border-radius: 0 !important;
              cursor: pointer !important;
            }
            input[type="range"]::-ms-thumb {
              width: 20px !important;
              height: 20px !important;
              background: #000 !important;
              border: 1px solid #000 !important;
              border-radius: 0 !important;
              cursor: pointer !important;
            }
            /* Sliders de Radix UI */
            [data-slot="slider"] {
              position: relative !important;
              display: flex !important;
              width: 100% !important;
              align-items: center !important;
              margin: 8px 0 !important;
              touch-action: none !important;
              user-select: none !important;
            }
            [data-slot="slider-track"] {
              position: relative !important;
              flex: 1 !important;
              height: 8px !important;
              background: #ddd !important;
              border: 1px solid #000 !important;
              border-radius: 0 !important;
              display: block !important;
            }
            [data-slot="slider-range"] {
              position: absolute !important;
              height: 100% !important;
              background: #000 !important;
              border-radius: 0 !important;
              display: block !important;
            }
            [data-slot="slider-thumb"] {
              position: absolute !important;
              width: 20px !important;
              height: 20px !important;
              background: #000 !important;
              border: 2px solid #fff !important;
              border-radius: 0 !important;
              display: block !important;
              cursor: grab !important;
              transform: translate(-50%, -50%) !important;
              top: 50% !important;
            }
            [data-slot="slider-thumb"]:hover {
              background: #333 !important;
            }
            [data-slot="slider-thumb"]:active {
              cursor: grabbing !important;
            }
          `
        } else {
          const noStylesElement = document.getElementById('no-styles-override')
          if (noStylesElement) {
            noStylesElement.remove()
          }
          // Rehabilitar todos los estilos CSS externos
          const styleSheets = Array.from(document.styleSheets)
          styleSheets.forEach(sheet => {
            try {
              if (sheet.ownerNode && (sheet.ownerNode instanceof HTMLLinkElement || sheet.ownerNode instanceof HTMLStyleElement)) {
                sheet.disabled = false
              }
            } catch (e) {
              // Ignorar errores de CORS
            }
          })
        }
      })
    }

    // Escuchar eventos de navegación
    window.addEventListener('popstate', handleRouteChange)
    
    // También escuchar cambios en el pathname usando MutationObserver
    const observer = new MutationObserver(handleRouteChange)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      observer.disconnect()
    }
  }, [preferences])

  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  return (
    <AccessibilityContext.Provider value={{ preferences, updatePreference, setAllPreferences, resetToDefault }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

