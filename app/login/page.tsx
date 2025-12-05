"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { AccessibilityModal } from "@/components/ModalDeAccesibilidad"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, User, GraduationCap } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { ThemeToggle } from "@/components/ThemeToggle"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { useArtyomVoice } from "@/hooks/useArtyomVoice"
import { useAccessibility } from "@/hooks/useAccessibility"
import { toast } from "sonner"
import { useTheme } from "next-themes"

export default function LoginPage() {
  const [numeroEmpleado, setNumeroEmpleado] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [ayudasOpen, setAyudasOpen] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { preferences, updatePreference } = useAccessibility()
  const { setTheme } = useTheme()
  const numeroEmpleadoRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  
  // Estado para controlar qué input está activo para escritura por voz
  const [activeInput, setActiveInput] = useState<"numero" | "password" | null>(null)


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const success = await login(numeroEmpleado, password)
      if (success) {
        router.push("/")
      } else {
        setError("Credenciales inválidas. Por favor, inténtalo de nuevo.")
      }
    } catch (err) {
      setError("Error al iniciar sesión. Por favor, inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // Comandos de voz específicos para el login
  const voiceCommands = useMemo(() => [
    {
      id: "focus-numero-empleado",
      keywords: ["número de empleado", "numero de empleado", "empleado", "número empleado", "numero empleado"],
      description: "Enfocar campo número de empleado",
      action: () => {
        console.log("Comando: activar número de empleado")
        setActiveInput("numero")
        setTimeout(() => numeroEmpleadoRef.current?.focus(), 100)
      },
    },
    {
      id: "focus-password",
      keywords: ["contraseña", "password", "clave"],
      description: "Enfocar campo contraseña",
      action: () => {
        console.log("Comando: activar contraseña")
        setActiveInput("password")
        setTimeout(() => passwordRef.current?.focus(), 100)
      },
    },
    {
      id: "show-password",
      keywords: ["mostrar contraseña", "mostrar password", "ver contraseña", "mostrar clave", "ver clave", "mostrar"],
      description: "Mostrar contraseña",
      action: () => {
        console.log("Comando: mostrar contraseña")
        setShowPassword(true)
      },
    },
    {
      id: "hide-password",
      keywords: ["ocultar contraseña", "ocultar password", "esconder contraseña", "ocultar clave", "esconder clave", "ocultar"],
      description: "Ocultar contraseña",
      action: () => {
        console.log("Comando: ocultar contraseña")
        setShowPassword(false)
      },
    },
    {
      id: "submit-login",
      keywords: ["iniciar sesión", "iniciar sesion", "login", "entrar"],
      description: "Iniciar sesión",
      action: () => {
        console.log("Comando: iniciar sesión")
        if (formRef.current && !isLoading) {
          formRef.current.requestSubmit()
        }
      },
    },
    {
      id: "deactivate-input",
      keywords: ["okey", "ok", "listo", "terminado", "desactivar"],
      description: "Desactivar input actual",
      action: () => {
        console.log("Comando: desactivar input")
        setActiveInput(null)
        numeroEmpleadoRef.current?.blur()
        passwordRef.current?.blur()
      },
    },
    {
      id: "clear-input",
      keywords: ["borrar", "eliminar", "limpiar", "vaciar"],
      description: "Limpiar input actual",
      action: () => {
        console.log("Comando: limpiar input", activeInput)
        if (activeInput === "numero") {
          setNumeroEmpleado("")
        } else if (activeInput === "password") {
          setPassword("")
        }
      },
    },
    {
      id: "open-ayudas",
      keywords: ["ayudas", "abrir ayudas", "accesibilidad", "abrir accesibilidad"],
      description: "Abrir modal de ayudas",
      action: () => {
        console.log("Comando: abrir ayudas")
        setAyudasOpen(true)
      },
    },
    {
      id: "close-ayudas",
      keywords: ["cerrar", "cerrar ayudas", "cerrar modal"],
      description: "Cerrar modal de ayudas",
      action: () => {
        console.log("Comando: cerrar ayudas")
        setAyudasOpen(false)
        window.dispatchEvent(new CustomEvent("voice-close-temas"))
      },
    },
    // Comando para abrir/cerrar menú de temas
    {
      id: "abrir-temas",
      keywords: ["abrir temas", "temas", "ver temas", "mostrar temas"],
      description: "Abrir menú de temas",
      action: () => {
        console.log("Comando: abrir temas")
        window.dispatchEvent(new CustomEvent("voice-open-temas"))
      },
    },
    {
      id: "cerrar-temas",
      keywords: ["cerrar temas", "ocultar temas"],
      description: "Cerrar menú de temas",
      action: () => {
        console.log("Comando: cerrar temas")
        window.dispatchEvent(new CustomEvent("voice-close-temas"))
      },
    },
    // Comandos de temas
    {
      id: "tema-claro",
      keywords: ["tema claro", "modo claro", "claro", "light"],
      description: "Cambiar a tema claro",
      action: () => {
        console.log("Comando: tema claro")
        setTheme("light")
        window.dispatchEvent(new CustomEvent("voice-close-temas"))
      },
    },
    {
      id: "tema-oscuro",
      keywords: ["tema oscuro", "modo oscuro", "oscuro", "dark"],
      description: "Cambiar a tema oscuro",
      action: () => {
        console.log("Comando: tema oscuro")
        setTheme("dark")
        window.dispatchEvent(new CustomEvent("voice-close-temas"))
      },
    },
    {
      id: "tema-sistema",
      keywords: ["tema sistema", "modo sistema", "sistema", "system"],
      description: "Cambiar a tema del sistema",
      action: () => {
        console.log("Comando: tema sistema")
        setTheme("system")
        window.dispatchEvent(new CustomEvent("voice-close-temas"))
      },
    },
    {
      id: "tema-escala-grises",
      keywords: ["escala de grises", "grises", "gris", "grayscale"],
      description: "Cambiar a escala de grises",
      action: () => {
        console.log("Comando: escala de grises")
        setTheme("grayscale")
        window.dispatchEvent(new CustomEvent("voice-close-temas"))
      },
    },
    {
      id: "tema-daltonicos",
      keywords: ["accesible para daltónicos", "accesible para daltonicos", "daltónicos", "daltonicos", "colorblind"],
      description: "Cambiar a accesible para daltónicos",
      action: () => {
        console.log("Comando: accesible daltónicos")
        setTheme("colorblind")
        window.dispatchEvent(new CustomEvent("voice-close-temas"))
      },
    },
    {
      id: "tema-daltonismo-general",
      keywords: ["daltonismo general", "daltonismo", "modo daltónico", "daltonico"],
      description: "Cambiar a daltonismo general",
      action: () => {
        console.log("Comando: daltonismo general")
        setTheme("daltonismo-general")
        window.dispatchEvent(new CustomEvent("voice-close-temas"))
      },
    },
    // Comandos de checkboxes de accesibilidad
    {
      id: "toggle-alto-contraste",
      keywords: ["alto contraste", "contraste alto", "activar alto contraste", "seleccionar alto contraste", "quitar alto contraste"],
      description: "Toggle alto contraste",
      action: (cmd: string) => {
        const isDeactivate = cmd.includes("quitar") || cmd.includes("desactivar")
        console.log("Comando: alto contraste", isDeactivate ? "desactivar" : "activar")
        if (isDeactivate) {
          updatePreference("altoContraste", false)
        } else if (cmd.includes("activar") || cmd.includes("seleccionar")) {
          updatePreference("altoContraste", true)
        } else {
          updatePreference("altoContraste", !preferences.altoContraste)
        }
      },
    },
    {
      id: "toggle-control-voz",
      keywords: ["control de voz", "control voz", "activar voz", "desactivar voz"],
      description: "Toggle control de voz",
      action: (cmd: string) => {
        const isDeactivate = cmd.includes("desactivar")
        console.log("Comando: control voz", isDeactivate ? "desactivar" : "activar")
        updatePreference("controlVoz", !isDeactivate)
      },
    },
    {
      id: "toggle-inversion-colores",
      keywords: ["inversión de colores", "inversion de colores", "invertir colores", "activar inversión", "quitar inversión"],
      description: "Toggle inversión de colores",
      action: (cmd: string) => {
        const isDeactivate = cmd.includes("quitar") || cmd.includes("desactivar")
        console.log("Comando: inversión colores", isDeactivate ? "desactivar" : "activar")
        if (isDeactivate) {
          updatePreference("inversionColores", false)
        } else if (cmd.includes("activar") || cmd.includes("seleccionar")) {
          updatePreference("inversionColores", true)
        } else {
          updatePreference("inversionColores", !preferences.inversionColores)
        }
      },
    },
    {
      id: "toggle-modo-monocromatico",
      keywords: ["monocromático", "monocromatico", "blanco y negro", "modo monocromático"],
      description: "Toggle modo monocromático",
      action: (cmd: string) => {
        const isDeactivate = cmd.includes("quitar") || cmd.includes("desactivar")
        console.log("Comando: monocromático", isDeactivate ? "desactivar" : "activar")
        if (isDeactivate) {
          updatePreference("modoMonocromatico", false)
        } else {
          updatePreference("modoMonocromatico", !preferences.modoMonocromatico)
        }
      },
    },
    {
      id: "toggle-lupa",
      keywords: ["lupa", "lupa cursor", "zoom cursor", "activar lupa", "quitar lupa"],
      description: "Toggle lupa cursor",
      action: (cmd: string) => {
        const isDeactivate = cmd.includes("quitar") || cmd.includes("desactivar")
        console.log("Comando: lupa", isDeactivate ? "desactivar" : "activar")
        if (isDeactivate) {
          updatePreference("lupaCursor", false)
        } else {
          updatePreference("lupaCursor", !preferences.lupaCursor)
        }
      },
    },
    {
      id: "toggle-puntero-grande",
      keywords: ["puntero grande", "cursor grande", "puntero", "activar puntero", "quitar puntero"],
      description: "Toggle puntero grande",
      action: (cmd: string) => {
        const isDeactivate = cmd.includes("quitar") || cmd.includes("desactivar")
        console.log("Comando: puntero grande", isDeactivate ? "desactivar" : "activar")
        if (isDeactivate) {
          updatePreference("punteroGrande", false)
        } else {
          updatePreference("punteroGrande", !preferences.punteroGrande)
        }
      },
    },
    {
      id: "toggle-lectura-voz",
      keywords: ["lectura en voz alta", "lectura voz alta", "leer en voz alta", "activar lectura", "quitar lectura"],
      description: "Toggle lectura en voz alta",
      action: (cmd: string) => {
        const isDeactivate = cmd.includes("quitar") || cmd.includes("desactivar")
        console.log("Comando: lectura voz", isDeactivate ? "desactivar" : "activar")
        if (isDeactivate) {
          updatePreference("lecturaVozAlta", false)
        } else {
          updatePreference("lecturaVozAlta", !preferences.lecturaVozAlta)
        }
      },
    },
  ], [activeInput, isLoading, setTheme, updatePreference, preferences])

  // Función para convertir texto hablado a caracteres
  const convertVoiceToChar = (text: string): string => {
    const lowerText = text.toLowerCase().trim()
    
    // Mapa de palabras a números
    const numberMap: { [key: string]: string } = {
      "cero": "0", "uno": "1", "dos": "2", "tres": "3", "cuatro": "4",
      "cinco": "5", "seis": "6", "siete": "7", "ocho": "8", "nueve": "9",
    }
    
    // Mapa de nombres de letras a minúsculas
    const letterNamesLower: { [key: string]: string } = {
      "a": "a", "be": "b", "ce": "c", "de": "d", "e": "e", "efe": "f",
      "ge": "g", "hache": "h", "i": "i", "jota": "j", "ka": "k", "ele": "l",
      "eme": "m", "ene": "n", "eñe": "ñ", "o": "o", "pe": "p", "cu": "q",
      "erre": "r", "ese": "s", "te": "t", "u": "u", "uve": "v", "uve doble": "w",
      "doble uve": "w", "equis": "x", "ye": "y", "i griega": "y", "zeta": "z",
    }
    
    // Mapa de nombres de letras a mayúsculas
    const letterNamesUpper: { [key: string]: string } = {
      "a": "A", "be": "B", "ce": "C", "de": "D", "e": "E", "efe": "F",
      "ge": "G", "hache": "H", "i": "I", "jota": "J", "ka": "K", "ele": "L",
      "eme": "M", "ene": "N", "eñe": "Ñ", "o": "O", "pe": "P", "cu": "Q",
      "erre": "R", "ese": "S", "te": "T", "u": "U", "uve": "V", "uve doble": "W",
      "doble uve": "W", "equis": "X", "ye": "Y", "i griega": "Y", "zeta": "Z",
    }
    
    // Verificar si es "X mayúscula" o "mayúscula X"
    const mayusculaMatch = lowerText.match(/^(.+)\s+mayúscula$|^(.+)\s+mayuscula$|^mayúscula\s+(.+)$|^mayuscula\s+(.+)$/)
    if (mayusculaMatch) {
      const letter = (mayusculaMatch[1] || mayusculaMatch[2] || mayusculaMatch[3] || mayusculaMatch[4]).trim()
      console.log("Detectado mayúscula para:", letter)
      
      // Si es una sola letra, convertir a mayúscula
      if (letter.length === 1) {
        return letter.toUpperCase()
      }
      // Si es el nombre de una letra
      if (letterNamesUpper[letter]) {
        return letterNamesUpper[letter]
      }
      return letter.toUpperCase()
    }
    
    // Si es un número en palabras
    if (numberMap[lowerText]) {
      return numberMap[lowerText]
    }
    
    // Si es el nombre de una letra (sin mayúscula), devolver en minúscula
    if (letterNamesLower[lowerText]) {
      console.log("Letra en minúscula:", letterNamesLower[lowerText])
      return letterNamesLower[lowerText]
    }
    
    // Si es una sola letra, mantenerla en minúscula
    if (lowerText.length === 1 && /[a-zñ]/.test(lowerText)) {
      return lowerText
    }
    
    // Limpiar puntuación y retornar en minúscula
    const cleaned = text.trim().replace(/[.,;:!?]+/g, "").replace(/\s+/g, "")
    return cleaned.toLowerCase()
  }

  // Callback para texto libre capturado por voz
  const handleTextCaptured = useCallback((text: string) => {
    console.log("Texto capturado:", text, "activeInput:", activeInput)
    
    if (!activeInput) {
      console.log("No hay input activo, ignorando")
      return
    }

    if (activeInput === "numero") {
      // Extraer solo números del texto
      const converted = convertVoiceToChar(text)
      const numbers = converted.replace(/\D/g, "")
      console.log("Números extraídos:", numbers)
      if (numbers) {
        setNumeroEmpleado(prev => prev + numbers)
      }
    } else if (activeInput === "password") {
      // Convertir el texto hablado a caracteres
      const converted = convertVoiceToChar(text)
      console.log("Texto para contraseña:", converted)
      if (converted) {
        setPassword(prev => prev + converted)
      }
    }
  }, [activeInput])

  // Usar el hook de voz
  // Usar el hook de voz con el callback para texto libre
  const { isListening, error: voiceError, lastCommand } = useArtyomVoice(
    preferences.controlVoz ? voiceCommands : [],
    { onTextCaptured: handleTextCaptured }
  )


  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 text-slate-800 flex flex-row items-center justify-center gap-2">
          <ThemeToggle />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="size-6"
                  onClick={() => setAyudasOpen(true)}
                  aria-label="Abrir ayudas de accesibilidad"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                    />
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ayudas</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
      </div>
      <div className="w-full max-w-4xl bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-border">
        {/* Left Section - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-sm">
            {/* Branding */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-2" role="img" aria-label="Logo del Sistema Escolar">
                  <GraduationCap className="w-8 h-8 text-white" aria-hidden="true" />
                </div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Sistema Escolar</h1>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Por favor ingrese los detalles de su cuenta</p>
            </div>

            {/* Form */}
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" aria-label="Formulario de inicio de sesión">
              <div className="space-y-2">
                <Label htmlFor="numeroEmpleado" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Número de Empleado <span className="text-red-500" aria-label="campo obligatorio">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" aria-hidden="true" />
                  <Input
                    ref={numeroEmpleadoRef}
                    id="numeroEmpleado"
                    type="text"
                    placeholder="Número de empleado"
                    value={numeroEmpleado}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || /^\d+$/.test(value)) {
                        setNumeroEmpleado(value)
                      }
                    }}
                    onFocus={() => setActiveInput("numero")}
                    onBlur={() => {
                      if (document.activeElement !== passwordRef.current) {
                        setActiveInput(null)
                      }
                    }}
                    className="pl-10 h-12 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-slate-500/20 dark:focus:ring-slate-400/20 text-slate-900 dark:text-slate-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                    aria-required="true"
                    aria-describedby="numeroEmpleado-description"
                  />
                  <span id="numeroEmpleado-description" className="sr-only">Campo obligatorio. Ingrese su número de empleado.</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Contraseña <span className="text-red-500" aria-label="campo obligatorio">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" aria-hidden="true" />
                  <Input
                    ref={passwordRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setActiveInput("password")}
                    onBlur={() => {
                      if (document.activeElement !== numeroEmpleadoRef.current) {
                        setActiveInput(null)
                      }
                    }}
                    className="pl-10 pr-12 h-12 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-slate-500/20 dark:focus:ring-slate-400/20 text-slate-900 dark:text-slate-100"
                    required
                    aria-required="true"
                    aria-describedby="password-description"
                  />
                  <span id="password-description" className="sr-only">Campo obligatorio. Ingrese su contraseña.</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-12 px-3 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                    <span className="sr-only">{showPassword ? "Ocultar" : "Mostrar"} contraseña</span>
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </div>
        </div>

        {/* Right Section - Visual/Branding */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 relative overflow-hidden min-h-[400px] lg:min-h-[600px]">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-slate-400 rounded-full blur-3xl"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center px-6">
            <div className="mb-6">
              {/* Abstract Illustration */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-44 h-44">
                  {/* Main circle with dashed border */}
                  <div className="absolute inset-0 rounded-full border-4 border-dashed border-white/40 animate-spin-slow" aria-hidden="true"></div>
                  {/* Inner elements */}
                  <div className="absolute top-8 left-12 w-5 h-5 bg-white rounded-full shadow-lg" aria-hidden="true"></div>
                  <div className="absolute top-16 right-14 w-2 h-2 bg-white rounded-full shadow-lg" aria-hidden="true"></div>
                  <div className="absolute bottom-12 left-8 w-2 h-2 bg-white rounded-full shadow-lg" aria-hidden="true"></div>
                  <div className="absolute bottom-20 right-12 w-3 h-3 bg-white rounded-full shadow-lg" aria-hidden="true"></div>
                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-6" role="img" aria-label="Icono de graduación">
                      <GraduationCap className="w-12 h-12 text-white" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Welcome Text */}
            <div className="text-white">
              <p className="text-lg md:text-xl font-bold mb-3">Bienvenido a</p>
              <p className="text-4xl md:text-6xl font-bold text-slate-200 leading-tight">Sistema Escolar</p>
            </div>
          </div>
        </div>
      </div>
      <AccessibilityModal
        open={ayudasOpen}
        onOpenChange={setAyudasOpen}
        showSaveButton={false}
      />
    </div>
  )
}
