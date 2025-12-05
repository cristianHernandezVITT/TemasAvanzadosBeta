"use client"

import { useEffect, useState, useRef } from "react"
import { useAccessibility } from "@/hooks/useAccessibility"
import { usePathname } from "next/navigation"
import { X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Step {
  number: number
  description: string
  selector?: string
  inputName?: string
  buttonText?: string
  labelText?: string
  inModal?: boolean
}

const moduleGuides: Record<string, Step[]> = {
  "/login": [
    { number: 1, description: "Ingresar número de empleado", inputName: "numeroEmpleado", labelText: "Número de Empleado", inModal: false },
    { number: 2, description: "Ingresar contraseña", inputName: "password", labelText: "Contraseña", inModal: false },
    { number: 3, description: "Hacer clic en 'Iniciar Sesión'", buttonText: "Iniciar Sesión", inModal: false }
  ],
  "/dashboard": [
    { number: 1, description: "Bajar para ver todas las gráficas", selector: "main, [class*='chart'], [class*='graph']" },
    { number: 2, description: "Exportar PDF o Exportar Excel", buttonText: "Exportar" }
  ],
  "/usuarios": [
    { number: 1, description: "Hacer clic en el botón 'Crear Usuario'", buttonText: "Crear Usuario", inModal: false },
    { number: 2, description: "Ingresar número de empleado", inputName: "empleado", labelText: "empleado", inModal: true },
    { number: 3, description: "Ingresar nombre", inputName: "nombre", labelText: "nombre", inModal: true },
    { number: 4, description: "Ingresar apellidos", inputName: "apellido", labelText: "apellido", inModal: true },
    { number: 5, description: "Ingresar contraseña", inputName: "password", labelText: "contraseña", inModal: true },
    { number: 6, description: "Ingresar CURP", inputName: "curp", labelText: "CURP", inModal: true },
    { number: 7, description: "Seleccionar rol", labelText: "rol", inModal: true },
    { number: 8, description: "Ingresar horario de inicio", inputName: "inicio", labelText: "inicio", inModal: true },
    { number: 9, description: "Ingresar horario de fin", inputName: "fin", labelText: "fin", inModal: true },
    { number: 10, description: "Ingresar teléfono", inputName: "telefono", labelText: "teléfono", inModal: true },
    { number: 11, description: "Hacer clic en 'Crear Usuario' del modal", buttonText: "Crear", inModal: true }
  ],
  "/roles": [
    { number: 1, description: "Hacer clic en el botón 'Crear Rol'", buttonText: "Crear Rol", inModal: false },
    { number: 2, description: "Ingresar nombre del rol", inputName: "nombre", labelText: "nombre", inModal: true },
    { number: 3, description: "Ingresar descripción", inputName: "descripcion", labelText: "descripción", inModal: true },
    { number: 4, description: "Activar 'Rol Activo'", labelText: "activo", inModal: true },
    { number: 5, description: "Seleccionar al menos un módulo de los checkboxes", labelText: "módulo", inModal: true },
    { number: 6, description: "Hacer clic en 'Crear Rol' del modal", buttonText: "Crear", inModal: true }
  ],
  "/registro-estudiantes": [
    { number: 1, description: "Tab 'Nuevo estudiante': Ingresar nombre", inputName: "nombre", labelText: "nombre", inModal: false },
    { number: 2, description: "Ingresar apellido paterno", inputName: "paterno", labelText: "paterno", inModal: false },
    { number: 3, description: "Ingresar apellido materno", inputName: "materno", labelText: "materno", inModal: false },
    { number: 4, description: "Ingresar matrícula", inputName: "matricula", labelText: "matrícula", inModal: false },
    { number: 5, description: "Seleccionar carrera", labelText: "carrera", inModal: false },
    { number: 6, description: "Seleccionar semestre", labelText: "semestre", inModal: false },
    { number: 7, description: "Ingresar correo", inputName: "email", labelText: "correo", inModal: false },
    { number: 8, description: "Ingresar teléfono", inputName: "telefono", labelText: "teléfono", inModal: false },
    { number: 9, description: "Seleccionar al menos un factor de riesgo", labelText: "riesgo", inModal: false },
    { number: 10, description: "Hacer clic en 'Registrar Estudiante'", buttonText: "Registrar", inModal: false },
    { number: 11, description: "Tab 'Asistencias': Seleccionar el estudiante", labelText: "estudiante" },
    { number: 12, description: "Seleccionar la fecha", inputName: "fecha", labelText: "fecha" },
    { number: 13, description: "Marcar 'Presente'", labelText: "presente" },
    { number: 14, description: "Hacer clic en 'Registrar Asistencia'", buttonText: "Registrar" },
    { number: 15, description: "Tab 'Calificaciones': Seleccionar botón 'Nueva Calificación'", buttonText: "Nueva", inModal: false },
    { number: 16, description: "En el modal: Seleccionar Unidad", labelText: "unidad", inModal: true },
    { number: 17, description: "Seleccionar estudiante", labelText: "estudiante", inModal: true },
    { number: 18, description: "Seleccionar materia", labelText: "materia", inModal: true },
    { number: 19, description: "Ingresar calificación", inputName: "calificacion", labelText: "calificación", inModal: true },
    { number: 20, description: "Seleccionar semestre", labelText: "semestre", inModal: true },
    { number: 21, description: "Hacer clic en 'Registrar'", buttonText: "Registrar", inModal: true },
    { number: 22, description: "Tab 'Eventos': Seleccionar estudiante", labelText: "estudiante" },
    { number: 23, description: "Seleccionar tipo de evento", labelText: "tipo" },
    { number: 24, description: "Seleccionar materia", labelText: "materia" },
    { number: 25, description: "Seleccionar semestre", labelText: "semestre" },
    { number: 26, description: "Ingresar descripción", inputName: "descripcion", labelText: "descripción" },
    { number: 27, description: "Seleccionar severidad", labelText: "severidad" },
    { number: 28, description: "Seleccionar fecha del evento", inputName: "fecha", labelText: "fecha" },
    { number: 29, description: "Hacer clic en 'Registrar Evento'", buttonText: "Registrar" },
    { number: 30, description: "Tab 'Indicadores': Seleccionar estudiante", labelText: "estudiante" },
    { number: 31, description: "Seleccionar semestre", labelText: "semestre" },
    { number: 32, description: "Seleccionar materia", labelText: "materia" },
    { number: 33, description: "Seleccionar riesgo de reprobación", labelText: "riesgo" },
    { number: 34, description: "Seleccionar probabilidad de deserción", labelText: "deserción" },
    { number: 35, description: "Seleccionar nivel de compromiso", labelText: "compromiso" },
    { number: 36, description: "Seleccionar tendencia de rendimiento", labelText: "tendencia" },
    { number: 37, description: "Ingresar historial de reprobaciones", inputName: "historial", labelText: "historial" },
    { number: 38, description: "Ingresar materias reprobadas", inputName: "reprobadas", labelText: "reprobadas" },
    { number: 39, description: "Ingresar materias aprobadas", inputName: "aprobadas", labelText: "aprobadas" },
    { number: 40, description: "Hacer clic en 'Registrar Indicador'", buttonText: "Registrar" }
  ],
  "/histograma": [
    { number: 1, description: "Seleccionar una materia", labelText: "materia" }
  ],
  "/diagrama-dispersion": [
    { number: 1, description: "Seleccionar variable X", labelText: "variable" },
    { number: 2, description: "Seleccionar variable Y", labelText: "variable" },
    { number: 3, description: "Seleccionar semestre", labelText: "semestre" },
    { number: 4, description: "Hacer clic en 'Generar Gráfico'", buttonText: "Generar" }
  ],
  "/grafico-control": [
    { number: 1, description: "Seleccionar todos los meses", labelText: "mes" },
    { number: 2, description: "Seleccionar todas las materias", labelText: "materia" },
    { number: 3, description: "Seleccionar todas las carreras", labelText: "carrera" }
  ],
  "/pareto": [
    { number: 1, description: "Seleccionar la carrera", labelText: "carrera" }
  ],
  "/auditrail": [
    { number: 1, description: "Seleccionar el módulo", labelText: "módulo" }
  ],
  "/carreras": [
    { number: 1, description: "Ingresar nombre", inputName: "nombre", labelText: "nombre", inModal: false },
    { number: 2, description: "Ingresar descripción", inputName: "descripcion", labelText: "descripción", inModal: false },
    { number: 3, description: "Activar 'Activa'", labelText: "activa", inModal: false },
    { number: 4, description: "Hacer clic en 'Crear Carrera'", buttonText: "Crear", inModal: false }
  ],
  "/materias": [
    { number: 1, description: "Ingresar nombre", inputName: "nombre", labelText: "nombre", inModal: false },
    { number: 2, description: "Ingresar clave", inputName: "clave", labelText: "clave", inModal: false },
    { number: 3, description: "Ingresar descripción", inputName: "descripcion", labelText: "descripción", inModal: false },
    { number: 4, description: "Ingresar créditos", inputName: "creditos", labelText: "créditos", inModal: false },
    { number: 5, description: "Ingresar semestre sugerido", inputName: "semestre", labelText: "semestre", inModal: false },
    { number: 6, description: "Hacer clic en 'Crear Materia'", buttonText: "Crear", inModal: false }
  ],
  "/asignacion": [
    { number: 1, description: "Seleccionar docente", labelText: "docente" },
    { number: 2, description: "Seleccionar materia", labelText: "materia" },
    { number: 3, description: "Seleccionar grupo", labelText: "grupo" },
    { number: 4, description: "Seleccionar período", labelText: "período" },
    { number: 5, description: "Hacer clic en 'Asignar Materia'", buttonText: "Asignar" }
  ]
}

export function StepByStepGuide() {
  const { preferences } = useAccessibility()
  const pathname = usePathname()
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // Obtener la guía para el módulo actual
  const getGuideForPath = (path: string): Step[] => {
    // Buscar coincidencia exacta o parcial
    for (const [key, steps] of Object.entries(moduleGuides)) {
      if (path.includes(key) || path === key) {
        return steps
      }
    }
    return []
  }

  const steps = getGuideForPath(pathname)

  // Función para limpiar todos los resaltados
  const clearAllHighlights = () => {
    document.querySelectorAll('.step-guide-highlight').forEach(el => {
      el.classList.remove('step-guide-highlight')
      el.style.animation = ''
      el.style.outline = ''
      el.style.outlineOffset = ''
      el.style.boxShadow = ''
      el.style.zIndex = ''
      el.style.position = ''
    })
  }

  // Función para encontrar y resaltar el elemento
  const highlightElement = (step: Step) => {
    if (!step) return

    // Remover resaltado anterior
    clearAllHighlights()

    let element: HTMLElement | null = null

    // Determinar dónde buscar según si el paso está en un modal o no
    const modals = Array.from(document.querySelectorAll('[role="dialog"]:not([aria-hidden="true"]), [class*="modal"]:not([aria-hidden="true"]), [class*="dialog"]:not([aria-hidden="true"])')) as HTMLElement[]
    
    // Si el paso está en un modal, buscar primero en modales, luego en el body
    // Si no está en un modal, buscar primero en el body, luego en modales
    const searchContainers = step.inModal 
      ? [...modals, document.body]
      : [document.body, ...modals]

    if (step.inputName) {
      for (const container of searchContainers) {
        // Buscar en inputs, textareas, selects y switches
        const inputs = Array.from(container.querySelectorAll('input, textarea, select, [role="switch"], [role="checkbox"], [data-state]'))
        element = inputs.find(input => {
          const name = input.getAttribute('name')?.toLowerCase() || ''
          const id = input.getAttribute('id')?.toLowerCase() || ''
          const placeholder = input.getAttribute('placeholder')?.toLowerCase() || ''
          const ariaLabel = input.getAttribute('aria-label')?.toLowerCase() || ''
          const searchTerm = step.inputName!.toLowerCase()
          return name.includes(searchTerm) || id.includes(searchTerm) || placeholder.includes(searchTerm) || ariaLabel.includes(searchTerm)
        }) as HTMLElement || null
        if (element) break
      }
    }

    // Si no se encontró, buscar por texto del botón
    if (!element && step.buttonText) {
      for (const container of searchContainers) {
        const buttons = Array.from(container.querySelectorAll('button, [role="button"], a[role="button"]'))
        element = buttons.find(btn => {
          const text = btn.textContent?.toLowerCase().trim() || ''
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || ''
          const searchTerm = step.buttonText!.toLowerCase()
          return text.includes(searchTerm) || ariaLabel.includes(searchTerm)
        }) as HTMLElement || null
        if (element) break
      }
    }

    // Si no se encontró, buscar por texto del label
    if (!element && step.labelText) {
      for (const container of searchContainers) {
        const labels = Array.from(container.querySelectorAll('label'))
        const label = labels.find(lbl => {
          const text = lbl.textContent?.toLowerCase() || ''
          const searchTerm = step.labelText!.toLowerCase().replace(/\*/g, '.*')
          const regex = new RegExp(searchTerm, 'i')
          return regex.test(text)
        })
        if (label) {
          const inputId = label.getAttribute('for')
          if (inputId) {
            element = document.getElementById(inputId) as HTMLElement
          } else {
            // Buscar el siguiente elemento input/select/textarea/switch
            let next = label.nextElementSibling
            while (next) {
              const tagName = next.tagName
              const role = (next as HTMLElement)?.getAttribute('role')
              if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tagName) || 
                  role === 'switch' || 
                  role === 'checkbox' ||
                  (next as HTMLElement)?.hasAttribute('data-state')) {
                element = next as HTMLElement
                break
              }
              next = next.nextElementSibling
            }
            // Si no se encontró, buscar dentro del label o en el contenedor padre
            if (!element) {
              const switchElement = label.querySelector('[role="switch"], [role="checkbox"], [data-state], button[type="button"]')
              if (switchElement) {
                element = switchElement as HTMLElement
              } else {
                // Buscar en el contenedor padre (común en componentes de UI)
                const parent = label.parentElement
                if (parent) {
                  const switchInParent = parent.querySelector('[role="switch"], [role="checkbox"], [data-state], button[type="button"]')
                  if (switchInParent) {
                    element = switchInParent as HTMLElement
                  }
                }
              }
            }
          }
          if (element) break
        }
      }
    }

    // Si no se encontró, buscar específicamente por select o switch
    if (!element && step.labelText) {
      for (const container of searchContainers) {
        // Buscar selects
        const selects = Array.from(container.querySelectorAll('select'))
        element = selects.find(sel => {
          const name = sel.getAttribute('name')?.toLowerCase() || ''
          const id = sel.getAttribute('id')?.toLowerCase() || ''
          const ariaLabel = sel.getAttribute('aria-label')?.toLowerCase() || ''
          const searchTerm = step.labelText!.toLowerCase()
          return name.includes(searchTerm) || id.includes(searchTerm) || ariaLabel.includes(searchTerm)
        }) as HTMLElement || null
        
        // Si no se encontró, buscar switches (Radix UI usa data-slot="switch")
        if (!element) {
          const switches = Array.from(container.querySelectorAll('[data-slot="switch"], [role="switch"], [role="checkbox"], button[data-state], [data-state]'))
          element = switches.find(sw => {
            const ariaLabel = sw.getAttribute('aria-label')?.toLowerCase() || ''
            const ariaLabelledBy = sw.getAttribute('aria-labelledby')
            const searchTerm = step.labelText!.toLowerCase()
            
            if (ariaLabel.includes(searchTerm)) return true
            
            if (ariaLabelledBy) {
              const labelElement = document.getElementById(ariaLabelledBy)
              if (labelElement) {
                const labelText = labelElement.textContent?.toLowerCase() || ''
                if (labelText.includes(searchTerm)) return true
              }
            }
            
            // Buscar label asociado en el contenedor padre
            let parent = sw.parentElement
            while (parent && parent !== container) {
              const label = parent.querySelector('label')
              if (label) {
                const labelText = label.textContent?.toLowerCase() || ''
                if (labelText.includes(searchTerm)) return true
              }
              parent = parent.parentElement
            }
            
            return false
          }) as HTMLElement || null
        }
        
        if (element) break
      }
    }

    // Si no se encontró, intentar selector CSS simple (sin :has-text)
    if (!element && step.selector) {
      try {
        // Limpiar selectores inválidos como :has-text()
        const cleanSelector = step.selector.split(',')[0].split(':has-text')[0].trim()
        if (cleanSelector) {
          for (const container of searchContainers) {
            const elements = container.querySelectorAll(cleanSelector)
            if (elements.length > 0) {
              element = elements[0] as HTMLElement
              break
            }
          }
        }
      } catch (e) {
        // Ignorar errores de selector
      }
    }

    // Si encontramos el elemento, resaltarlo
    if (element && element instanceof HTMLElement) {
      // Remover cualquier resaltado anterior del mismo elemento
      element.classList.remove('step-guide-highlight')
      
      // Forzar reflow para reiniciar la animación
      void element.offsetWidth
      
      element.classList.add('step-guide-highlight')
      element.style.zIndex = '10000'
      element.style.position = 'relative'
      
      // Scroll suave al elemento
      setTimeout(() => {
        element?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      }, 100)
    }
  }

  const handleStepClick = (index: number) => {
    setCurrentStep(index)
    setTimeout(() => highlightElement(steps[index]), 200)
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1
      setCurrentStep(newStep)
      setTimeout(() => highlightElement(steps[newStep]), 200)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)
      setTimeout(() => highlightElement(steps[newStep]), 200)
    }
  }

  useEffect(() => {
    if (preferences.guiaPasoAPaso && steps.length > 0) {
      const timer = setTimeout(() => {
        highlightElement(steps[currentStep])
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentStep, preferences.guiaPasoAPaso, pathname, steps])

  // Escuchar evento para resetear el paso (cuando se abre un modal de ayudas)
  useEffect(() => {
    const handleResetStep = () => {
      setCurrentStep(0)
      clearAllHighlights()
    }

    window.addEventListener('reset-step-guide', handleResetStep)
    return () => {
      window.removeEventListener('reset-step-guide', handleResetStep)
    }
  }, [])

  // Observar cambios en el DOM para resaltar cuando se abren modales
  useEffect(() => {
    if (!preferences.guiaPasoAPaso || steps.length === 0) return

    let timeoutId: NodeJS.Timeout | null = null

    const observer = new MutationObserver(() => {
      // Si hay un modal abierto, resaltar el elemento actual
      const hasModal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])')
      if (hasModal) {
        // Cancelar timeout anterior si existe
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          highlightElement(steps[currentStep])
          timeoutId = null
        }, 500)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-hidden', 'class']
    })

    return () => {
      observer.disconnect()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [preferences.guiaPasoAPaso, steps, currentStep])

  // Agregar atributo especial para que Radix UI ignore este elemento
  useEffect(() => {
    const guideElement = document.querySelector('[data-step-guide]')
    if (guideElement) {
      // Marcar como parte del modal para que Radix UI no lo cierre
      guideElement.setAttribute('data-radix-dialog-content', 'true')
    }
  }, [])

  // Limpiar resaltados cuando se desactiva la guía
  useEffect(() => {
    if (!preferences.guiaPasoAPaso) {
      clearAllHighlights()
    }
  }, [preferences.guiaPasoAPaso])

  // Early return después de todos los hooks
  if (!preferences.guiaPasoAPaso) return null
  if (steps.length === 0) return null

  return (
    <div
      data-step-guide="true"
      data-radix-dialog-content="true"
      className={cn(
        "fixed bottom-4 right-4 z-[99999] bg-card border-2 border-primary rounded-lg shadow-2xl transition-all duration-300 pointer-events-auto",
        isMinimized ? "w-64" : "w-96"
      )}
      style={{ zIndex: 99999 }}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
      onMouseUp={(e) => {
        e.stopPropagation()
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
      }}
      onPointerUp={(e) => {
        e.stopPropagation()
      }}
    >
      <div className="bg-primary text-primary-foreground p-3 rounded-t-lg flex items-center justify-between">
        <h3 className="font-semibold text-sm">Guía Paso a Paso</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setIsMinimized(!isMinimized)
            }}
            className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
          >
            {isMinimized ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  handleStepClick(index)
                }}
                className={cn(
                  "flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                  currentStep === index
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-accent/50 hover:bg-accent"
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    currentStep === index
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step.number}
                </div>
                <p
                  className={cn(
                    "text-sm flex-1",
                    currentStep === index ? "font-semibold" : "font-normal"
                  )}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {steps.length > 1 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  prevStep()
                }}
                disabled={currentStep === 0}
              >
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentStep + 1} de {steps.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  nextStep()
                }}
                disabled={currentStep === steps.length - 1}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}

      {isMinimized && (
        <div className="p-2 text-center">
          <p className="text-xs text-muted-foreground">
            Paso {currentStep + 1} de {steps.length}
          </p>
        </div>
      )}
    </div>
  )
}

