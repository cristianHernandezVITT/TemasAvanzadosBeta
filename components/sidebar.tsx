"use client";

import { supabase } from "@/lib/supabase";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRolesModules } from "@/hooks/useRolesModules";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  UserPlus,
  BarChart3,
  ScatterChart,
  LineChart,
  TrendingUp,
  Menu,
  X,
  GraduationCap,
  LogOut,
  User,
  Shield,
  ScrollText,
  HelpCircle,
  Eye,
  Type,
  ZoomIn,
  Palette,
  Volume2,
  Mic,
  Hand,
  MousePointerClick,
  Brain,
  BookOpen,
  Focus,
  Bell,
  Menu as MenuIcon,
  FileText,
  Keyboard as KeyboardIcon,
  Code2,
  AlignLeft,
  MousePointer2,
  Palette as PaletteIcon,
  Link2,
  ListChecks,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAccessibility } from "@/hooks/useAccessibility";
import { useVoiceControl } from "@/hooks/useVoiceControl";
import { useArtyomVoice } from "@/hooks/useArtyomVoice";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const menuItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Usuarios",
    href: "/usuarios",
    icon: UserPlus,
  },
  {
    title: "Registro de Estudiantes",
    href: "/registro",
    icon: UserPlus,
  },
  {
    title: "Histograma",
    href: "/histograma",
    icon: BarChart3,
  },
  {
    title: "Diagrama de Dispersión",
    href: "/dispersion",
    icon: ScatterChart,
  },
  {
    title: "Gráfico de Control",
    href: "/control",
    icon: LineChart,
  },
  {
    title: "Pareto",
    href: "/pareto",
    icon: TrendingUp,
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [ayudasOpen, setAyudasOpen] = useState(false);
  const { preferences, updatePreference, setAllPreferences } = useAccessibility();
  const pathname = usePathname();
  const { usuario, logout } = useAuth();
  const { getModulosByRol } = useRolesModules();
  const isMobile = useIsMobile();
  const navRef = useRef<HTMLElement>(null);

  
  const { resetToDefault } = useAccessibility();
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  }, [isMobile]);

  const {
    audioLevel,
    error: voiceError,
    microphones,
    lastCommand,
  } = useVoiceControl();

  const router = useRouter();
  const { setTheme } = useTheme();

  // Comandos de voz del sistema
  const systemVoiceCommands = useMemo(() => [
    // Navegación a módulos
    {
      id: "nav-dashboard",
      keywords: ["dashboard", "módulo dashboard", "ir a dashboard", "panel"],
      description: "Ir al Dashboard",
      action: () => {
        console.log("Navegando a Dashboard")
        router.push("/")
      },
    },
    {
      id: "nav-usuarios",
      keywords: ["módulo usuarios", "módulo de usuarios", "ir a usuarios", "usuarios"],
      description: "Ir a Usuarios",
      action: () => {
        console.log("Navegando a Usuarios")
        router.push("/usuarios")
      },
    },
    {
      id: "nav-roles",
      keywords: ["módulo roles", "módulo de roles", "ir a roles", "roles"],
      description: "Ir a Roles",
      action: () => {
        console.log("Navegando a Roles")
        router.push("/roles")
      },
    },
    {
      id: "nav-registro",
      keywords: ["módulo registro", "registro de estudiantes", "ir a registro", "registro estudiantes"],
      description: "Ir a Registro de Estudiantes",
      action: () => {
        console.log("Navegando a Registro")
        router.push("/registro")
      },
    },
    {
      id: "nav-histograma",
      keywords: ["módulo histograma", "ir a histograma", "histograma"],
      description: "Ir a Histograma",
      action: () => {
        console.log("Navegando a Histograma")
        router.push("/histograma")
      },
    },
    {
      id: "nav-dispersion",
      keywords: ["módulo dispersión", "diagrama de dispersión", "ir a dispersión", "dispersión"],
      description: "Ir a Diagrama de Dispersión",
      action: () => {
        console.log("Navegando a Dispersión")
        router.push("/dispersion")
      },
    },
    {
      id: "nav-control",
      keywords: ["módulo control", "gráfico de control", "ir a control", "control"],
      description: "Ir a Gráfico de Control",
      action: () => {
        console.log("Navegando a Control")
        router.push("/control")
      },
    },
    {
      id: "nav-pareto",
      keywords: ["módulo pareto", "ir a pareto", "pareto"],
      description: "Ir a Pareto",
      action: () => {
        console.log("Navegando a Pareto")
        router.push("/pareto")
      },
    },
    {
      id: "nav-audittrail",
      keywords: ["módulo audit trail", "audit trail", "ir a audit trail", "auditoría"],
      description: "Ir a Audit Trail",
      action: () => {
        console.log("Navegando a Audit Trail")
        router.push("/audit-trail")
      },
    },
    {
      id: "nav-materias",
      keywords: ["módulo materias", "ir a materias", "materias", "ver materias"],
      description: "Ir a Materias",
      action: () => {
        console.log("Navegando a Materias")
        router.push("/materias")
      },
    },
    {
      id: "nav-carreras",
      keywords: ["módulo carreras", "ir a carreras", "carreras", "ver carreras"],
      description: "Ir a Carreras",
      action: () => {
        console.log("Navegando a Carreras")
        router.push("/carreras")
      },
    },
    {
      id: "nav-asignacion",
      keywords: ["módulo asignación", "ir a asignación", "asignación", "asignación de materias", "asignar materias"],
      description: "Ir a Asignación de Materias",
      action: () => {
        console.log("Navegando a Asignación de Materias")
        router.push("/asignacion-materias")
      },
    },
    // Ayudas
    {
      id: "open-ayudas",
      keywords: ["ayudas", "abrir ayudas", "accesibilidad", "abrir accesibilidad"],
      description: "Abrir modal de ayudas",
      action: () => {
        console.log("Abriendo ayudas")
        setAyudasOpen(true)
      },
    },
    {
      id: "close-ayudas",
      keywords: ["cerrar ayudas", "cerrar accesibilidad", "cerrar modal ayudas"],
      description: "Cerrar modal de ayudas",
      action: () => {
        console.log("Cerrando ayudas")
        setAyudasOpen(false)
        window.dispatchEvent(new CustomEvent("voice-close-temas"))
      },
    },
    // Temas
    {
      id: "abrir-temas",
      keywords: ["abrir temas", "temas", "cambiar tema"],
      description: "Abrir selector de temas",
      action: () => {
        console.log("Abriendo temas")
        window.dispatchEvent(new CustomEvent("voice-open-temas"))
      },
    },
    {
      id: "cerrar-temas",
      keywords: ["cerrar temas"],
      description: "Cerrar selector de temas",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-close-temas"))
      },
    },
    {
      id: "tema-claro",
      keywords: ["tema claro", "modo claro", "light"],
      description: "Cambiar a tema claro",
      action: () => {
        setTheme("light")
      },
    },
    {
      id: "tema-oscuro",
      keywords: ["tema oscuro", "modo oscuro", "dark"],
      description: "Cambiar a tema oscuro",
      action: () => {
        setTheme("dark")
      },
    },
    {
      id: "tema-sistema",
      keywords: ["tema sistema", "modo sistema", "system"],
      description: "Cambiar a tema del sistema",
      action: () => {
        setTheme("system")
      },
    },
    {
      id: "tema-daltonismo",
      keywords: ["daltonismo", "daltonismo general", "colorblind"],
      description: "Cambiar a tema daltonismo",
      action: () => {
        setTheme("daltonismo-general")
      },
    },
    // Exportar (genérico - detecta el módulo actual)
    {
      id: "exportar-excel",
      keywords: ["exportar excel", "excel", "descargar excel", "exportar csv"],
      description: "Exportar a Excel",
      action: () => {
        const path = window.location.pathname
        console.log("Comando: exportar Excel - path:", path)
        if (path.includes("/dispersion")) {
          window.dispatchEvent(new CustomEvent("voice-dispersion-export-excel"))
        } else if (path.includes("/histograma")) {
          window.dispatchEvent(new CustomEvent("voice-histograma-excel-general"))
        } else {
          // Evento genérico para usuarios, roles, dashboard, etc.
          window.dispatchEvent(new CustomEvent("voice-export-excel"))
        }
      },
    },
    {
      id: "exportar-pdf",
      keywords: ["exportar pdf", "pdf", "descargar pdf"],
      description: "Exportar a PDF",
      action: () => {
        const path = window.location.pathname
        console.log("Comando: exportar PDF - path:", path)
        if (path.includes("/dispersion")) {
          window.dispatchEvent(new CustomEvent("voice-dispersion-export-pdf"))
        } else if (path.includes("/histograma")) {
          window.dispatchEvent(new CustomEvent("voice-histograma-pdf-general"))
        } else {
          // Evento genérico para usuarios, roles, dashboard, etc.
          window.dispatchEvent(new CustomEvent("voice-export-pdf"))
        }
      },
    },
    // Usuarios
    {
      id: "crear-usuario",
      keywords: ["crear usuario", "nuevo usuario", "agregar usuario"],
      description: "Crear nuevo usuario",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-crear-usuario"))
      },
    },
    {
      id: "editar-usuario",
      keywords: ["editar"],
      description: "Editar usuario por número",
      action: (command: string) => {
        // Extraer número del comando: "editar 12345"
        const match = command.match(/editar\s*(\d+)/i)
        if (match) {
          const numEmpleado = match[1]
          console.log("Editando usuario:", numEmpleado)
          window.dispatchEvent(new CustomEvent("voice-editar-usuario", { detail: { numEmpleado } }))
        }
      },
    },
    {
      id: "eliminar-usuario",
      keywords: ["eliminar"],
      description: "Eliminar usuario por número",
      action: (command: string) => {
        // Extraer número del comando: "eliminar 12345"
        const match = command.match(/eliminar\s*(\d+)/i)
        if (match) {
          const numEmpleado = match[1]
          console.log("Eliminando usuario:", numEmpleado)
          window.dispatchEvent(new CustomEvent("voice-eliminar-usuario", { detail: { numEmpleado } }))
        }
      },
    },
    // Roles
    {
      id: "crear-rol",
      keywords: ["crear rol", "nuevo rol", "agregar rol"],
      description: "Crear nuevo rol",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-crear-rol"))
      },
    },
    {
      id: "editar-rol",
      keywords: ["editar rol"],
      description: "Editar rol por nombre",
      action: (command: string) => {
        // Extraer nombre del comando: "editar rol admin"
        const match = command.match(/editar\s*rol\s+(.+)/i)
        if (match) {
          const rolNombre = match[1].trim()
          console.log("Editando rol:", rolNombre)
          window.dispatchEvent(new CustomEvent("voice-editar-rol", { detail: { rolNombre } }))
        }
      },
    },
    {
      id: "eliminar-rol",
      keywords: ["eliminar rol"],
      description: "Eliminar rol por nombre",
      action: (command: string) => {
        // Extraer nombre del comando: "eliminar rol admin"
        const match = command.match(/eliminar\s*rol\s+(.+)/i)
        if (match) {
          const rolNombre = match[1].trim()
          console.log("Eliminando rol:", rolNombre)
          window.dispatchEvent(new CustomEvent("voice-eliminar-rol", { detail: { rolNombre } }))
        }
      },
    },
    // Dispersión - comandos específicos
    {
      id: "dispersion-var-x",
      keywords: ["variable x", "abrir variable x"],
      description: "Abrir selector de Variable X",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-dispersion-open-var-x"))
      },
    },
    {
      id: "dispersion-var-y",
      keywords: ["variable y", "abrir variable y"],
      description: "Abrir selector de Variable Y",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-dispersion-open-var-y"))
      },
    },
    {
      id: "dispersion-semestre",
      keywords: ["semestre", "abrir semestre"],
      description: "Abrir selector de Semestre",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-dispersion-open-semestre"))
      },
    },
    {
      id: "dispersion-generar",
      keywords: ["generar gráfico", "generar", "generar grafico"],
      description: "Generar gráfico de dispersión",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-dispersion-generar"))
      },
    },
    // Selección de opciones para dispersión
    {
      id: "dispersion-promedio",
      keywords: ["promedio general", "promedio"],
      description: "Seleccionar promedio general",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-dispersion-var-x", { detail: { value: "promedio" } }))
      },
    },
    {
      id: "dispersion-asistencia",
      keywords: ["asistencia", "porcentaje asistencia", "porcentaje de asistencia"],
      description: "Seleccionar asistencia",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-dispersion-var-x", { detail: { value: "porcentaje_asistencia" } }))
      },
    },
    {
      id: "dispersion-calificaciones",
      keywords: ["total calificaciones", "calificaciones"],
      description: "Seleccionar total calificaciones",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-dispersion-var-x", { detail: { value: "total_calificaciones" } }))
      },
    },
    {
      id: "dispersion-riesgo",
      keywords: ["factores riesgo", "factores de riesgo", "riesgo"],
      description: "Seleccionar factores de riesgo",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-dispersion-var-x", { detail: { value: "factores_riesgo" } }))
      },
    },
    // Histograma - filtros
    {
      id: "histograma-excel-general",
      keywords: ["exportar excel general", "excel general", "exportar excel histograma general"],
      description: "Exportar Excel histograma general",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-histograma-excel-general"))
      },
    },
    {
      id: "histograma-excel-filtrado",
      keywords: ["exportar excel filtrado", "excel filtrado", "exportar excel histograma filtrado"],
      description: "Exportar Excel histograma filtrado",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-histograma-excel-filtrado"))
      },
    },
    {
      id: "histograma-pdf-general",
      keywords: ["exportar pdf general", "pdf general", "exportar pdf histograma general"],
      description: "Exportar PDF histograma general",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-histograma-pdf-general"))
      },
    },
    {
      id: "histograma-pdf-filtrado",
      keywords: ["exportar pdf filtrado", "pdf filtrado", "exportar pdf histograma filtrado"],
      description: "Exportar PDF histograma filtrado",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-histograma-pdf-filtrado"))
      },
    },
    // Modal inputs genéricos
    {
      id: "modal-nombre",
      keywords: ["nombre", "campo nombre", "input nombre"],
      description: "Activar campo nombre",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-modal-input", { detail: { field: "nombre" } }))
      },
    },
    {
      id: "modal-numero-empleado",
      keywords: ["número de empleado", "numero de empleado", "número empleado", "numero empleado"],
      description: "Activar campo número de empleado",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-modal-input", { detail: { field: "num_empleado" } }))
      },
    },
    {
      id: "modal-password",
      keywords: ["contraseña", "password", "clave"],
      description: "Activar campo contraseña",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-modal-input", { detail: { field: "password" } }))
      },
    },
    {
      id: "modal-mostrar-password",
      keywords: ["mostrar contraseña", "mostrar password", "ver contraseña"],
      description: "Mostrar contraseña",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-modal-password", { detail: { show: true } }))
      },
    },
    {
      id: "modal-ocultar-password",
      keywords: ["ocultar contraseña", "ocultar password", "esconder contraseña"],
      description: "Ocultar contraseña",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-modal-password", { detail: { show: false } }))
      },
    },
    {
      id: "modal-borrar",
      keywords: ["borrar", "limpiar", "vaciar"],
      description: "Borrar contenido del campo activo",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-modal-borrar"))
      },
    },
    {
      id: "modal-okey",
      keywords: ["okey", "ok", "listo"],
      description: "Desactivar campo activo",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-modal-okey"))
      },
    },
    {
      id: "modal-cerrar",
      keywords: ["cerrar modal", "cancelar"],
      description: "Cerrar modal",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-modal-cerrar"))
      },
    },
    {
      id: "modal-guardar",
      keywords: ["guardar", "guardar cambios"],
      description: "Guardar cambios del modal",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-modal-guardar"))
      },
    },
    // Texto libre para inputs
    {
      id: "modal-espacio",
      keywords: ["espacio"],
      description: "Insertar espacio",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-modal-escribir", { detail: { texto: " " } }))
      },
    },
    {
      id: "modal-punto",
      keywords: ["punto"],
      description: "Insertar punto",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-modal-escribir", { detail: { texto: "." } }))
      },
    },
    {
      id: "modal-coma",
      keywords: ["coma"],
      description: "Insertar coma",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-modal-escribir", { detail: { texto: "," } }))
      },
    },
    {
      id: "modal-guion",
      keywords: ["guion", "guión"],
      description: "Insertar guión",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-modal-escribir", { detail: { texto: "-" } }))
      },
    },
    {
      id: "modal-arroba",
      keywords: ["arroba"],
      description: "Insertar arroba",
      action: () => {
        window.dispatchEvent(new CustomEvent("voice-modal-escribir", { detail: { texto: "@" } }))
      },
    },
    // Cerrar sesión
    {
      id: "cerrar-sesion",
      keywords: ["cerrar sesión", "cerrar sesion", "logout", "salir"],
      description: "Cerrar sesión",
      action: () => {
        console.log("Cerrando sesión")
        logout()
      },
    },
    // Desplazamiento de página
    {
      id: "scroll-bajar",
      keywords: ["bajar", "baja", "abajo", "desplazar abajo", "scroll abajo"],
      description: "Desplazarse hacia abajo",
      action: () => {
        console.log("Desplazando hacia abajo")
        const main = document.querySelector("main")
        if (main) {
          main.scrollBy({ top: 300, behavior: "smooth" })
        } else {
          window.scrollBy({ top: 300, behavior: "smooth" })
        }
      },
    },
    {
      id: "scroll-bajar-mucho",
      keywords: ["bajar más", "baja más", "bajar mucho", "más abajo"],
      description: "Desplazarse mucho hacia abajo",
      action: () => {
        console.log("Desplazando mucho hacia abajo")
        const main = document.querySelector("main")
        if (main) {
          main.scrollBy({ top: 600, behavior: "smooth" })
        } else {
          window.scrollBy({ top: 600, behavior: "smooth" })
        }
      },
    },
    {
      id: "scroll-subir",
      keywords: ["subir", "sube", "arriba", "desplazar arriba", "scroll arriba"],
      description: "Desplazarse hacia arriba",
      action: () => {
        console.log("Desplazando hacia arriba")
        const main = document.querySelector("main")
        if (main) {
          main.scrollBy({ top: -300, behavior: "smooth" })
        } else {
          window.scrollBy({ top: -300, behavior: "smooth" })
        }
      },
    },
    {
      id: "scroll-subir-mucho",
      keywords: ["subir más", "sube más", "subir mucho", "más arriba"],
      description: "Desplazarse mucho hacia arriba",
      action: () => {
        console.log("Desplazando mucho hacia arriba")
        const main = document.querySelector("main")
        if (main) {
          main.scrollBy({ top: -600, behavior: "smooth" })
        } else {
          window.scrollBy({ top: -600, behavior: "smooth" })
        }
      },
    },
    {
      id: "scroll-inicio",
      keywords: ["inicio", "ir al inicio", "principio", "inicio de página", "al principio"],
      description: "Ir al inicio de la página",
      action: () => {
        console.log("Ir al inicio de la página")
        const main = document.querySelector("main")
        if (main) {
          main.scrollTo({ top: 0, behavior: "smooth" })
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      },
    },
    {
      id: "scroll-final",
      keywords: ["final", "ir al final", "fin", "final de página", "al final", "abajo del todo"],
      description: "Ir al final de la página",
      action: () => {
        console.log("Ir al final de la página")
        const main = document.querySelector("main")
        if (main) {
          main.scrollTo({ top: main.scrollHeight, behavior: "smooth" })
        } else {
          window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
        }
      },
    },
    // Registro de Estudiantes - Navegación entre pestañas
    {
      id: "registro-nuevo-estudiante",
      keywords: ["nuevo estudiante", "pestaña nuevo estudiante", "ir a nuevo estudiante", "vista nuevo estudiante"],
      description: "Ir a pestaña Nuevo Estudiante",
      action: () => {
        console.log("Cambiando a pestaña: Nuevo Estudiante")
        window.dispatchEvent(new CustomEvent("voice-registro-tab", { detail: { tab: "nuevo" } }))
      },
    },
    {
      id: "registro-nueva-calificacion",
      keywords: ["nueva calificación", "nueva calificacion", "agregar calificación", "agregar calificacion", "registrar calificación"],
      description: "Abrir modal de nueva calificación",
      action: () => {
        console.log("Abriendo modal de nueva calificación")
        window.dispatchEvent(new CustomEvent("voice-nueva-calificacion"))
      },
    },
    {
      id: "registro-asistencias",
      keywords: ["ver asistencias", "pestaña asistencias", "ir a asistencias", "vista asistencias", "módulo asistencias", "subir asistencias"],
      description: "Ir a pestaña Asistencias",
      action: () => {
        console.log("Cambiando a pestaña: Asistencias")
        window.dispatchEvent(new CustomEvent("voice-registro-tab", { detail: { tab: "asistencias" } }))
      },
    },
    {
      id: "registro-calificaciones",
      keywords: ["calificaciones", "pestaña calificaciones", "ir a calificaciones", "vista calificaciones"],
      description: "Ir a pestaña Calificaciones",
      action: () => {
        console.log("Cambiando a pestaña: Calificaciones")
        window.dispatchEvent(new CustomEvent("voice-registro-tab", { detail: { tab: "calificaciones" } }))
      },
    },
    {
      id: "registro-eventos",
      keywords: ["eventos", "pestaña eventos", "ir a eventos", "vista eventos", "eventos académicos"],
      description: "Ir a pestaña Eventos",
      action: () => {
        console.log("Cambiando a pestaña: Eventos")
        window.dispatchEvent(new CustomEvent("voice-registro-tab", { detail: { tab: "eventos" } }))
      },
    },
    {
      id: "registro-indicadores",
      keywords: ["indicadores", "pestaña indicadores", "ir a indicadores", "vista indicadores", "indicadores de desempeño"],
      description: "Ir a pestaña Indicadores",
      action: () => {
        console.log("Cambiando a pestaña: Indicadores")
        window.dispatchEvent(new CustomEvent("voice-registro-tab", { detail: { tab: "indicadores" } }))
      },
    },
  ], [router, setTheme, logout]);

  // Activar comandos de voz del sistema
  useArtyomVoice(systemVoiceCommands);

  useEffect(() => {
  if (!usuario?.id) return;

  const loadPreferences = async () => {
    const { data } = await supabase
      .from("accesibilidad_usuarios")
      .select("preferencias")
      .eq("usuario_id", usuario.id)
      .single();

    if (data?.preferencias) {
      setAllPreferences(data.preferencias);
    }
  };

  loadPreferences();
}, [usuario?.id]);


  useEffect(() => {
    const handleOpenAyudas = () => setAyudasOpen(true);
    window.addEventListener("open-ayudas", handleOpenAyudas);
    return () => window.removeEventListener("open-ayudas", handleOpenAyudas);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [pathname, isMobile]);

  // Mapeo de iconos por nombre de módulo
  const iconMap: Record<string, any> = {
    Dashboard: LayoutDashboard,
    Usuarios: UserPlus,
    Roles: Shield,
    "Registro de Estudiantes": GraduationCap,
    Histograma: BarChart3,
    "Diagrama de Dispersión": ScatterChart,
    "Gráfico de Control": LineChart,
    Pareto: TrendingUp,
    "Audit Trail": ScrollText,
    Carreras: BookOpen,
    Materias: BookOpen,
    Asignación: UserPlus,
  };

  // Obtener módulos del usuario actual basándose en su rol
  const modulosUsuario = usuario?.rol_id ? getModulosByRol(usuario.rol_id) : [];

  // La navegación por teclado ahora se maneja globalmente con useArrowNavigation
  // Esto evita duplicación y conflictos con el handler global

  // Función helper para verificar si hay al menos un checkbox seleccionado
  // Solo verifica los checkboxes booleanos que el usuario puede activar directamente
  // Usa useMemo para recalcular cuando cambien las preferencias específicas
  const hasAnyPreferenceActive = useMemo(() => {
    const checkboxes = [
      preferences.altoContraste,
      preferences.inversionColores,
      preferences.lupaCursor,
      preferences.quitarEstilosCSS,
      preferences.areaClicAumentada,
      preferences.notificacionesVisuales,
      preferences.modoMonocromatico,
      preferences.resaltadoEnlaces,
      preferences.guiaPasoAPaso,
      preferences.tecladoPantalla,
      preferences.pulsacionLenta,
      preferences.punteroGrande,
      preferences.controlVoz,
      preferences.lecturaVozAlta,
      preferences.simplificacionInterfaz,
      preferences.enfoqueLineaHorizontal,
      preferences.lenguajeSenas,
      preferences.alfabetoSenas
    ];
    return checkboxes.some(value => value === true);
  }, [
    preferences.altoContraste,
    preferences.inversionColores,
    preferences.lupaCursor,
    preferences.quitarEstilosCSS,
    preferences.areaClicAumentada,
    preferences.notificacionesVisuales,
    preferences.modoMonocromatico,
    preferences.resaltadoEnlaces,
    preferences.guiaPasoAPaso,
    preferences.tecladoPantalla,
    preferences.pulsacionLenta,
    preferences.punteroGrande,
    preferences.controlVoz,
    preferences.lecturaVozAlta,
    preferences.simplificacionInterfaz,
    preferences.enfoqueLineaHorizontal,
    preferences.lenguajeSenas,
    preferences.alfabetoSenas
  ]);

  const savePreferencesToDB = async () => {
  if (!usuario?.id) {
    toast.error("Inicia sesión para guardar tus preferencias.", {
      className: "bg-red-50 border-red-200 text-red-800",
      style: { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }
    });
    return;
  }

  // Validar que al menos una preferencia esté seleccionada
  if (!hasAnyPreferenceActive) {
    toast.error("Selecciona por lo menos 1 preferencia.", {
      className: "bg-red-50 border-red-200 text-red-800",
      style: { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }
    });
    return;
  }

  try {
    const payload = {
      usuario_id: usuario.id,
      preferencias: preferences,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("accesibilidad_usuarios")
      .upsert(payload, { onConflict: "usuario_id" });

    if (error) {
      console.error("Error guardando preferencias:", error);
      toast.error("No se pudieron guardar las preferencias. Intenta de nuevo.", {
        className: "bg-red-50 border-red-200 text-red-800",
        style: { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }
      });
      return;
    }

    toast.success("Preferencias guardadas correctamente.", {
      className: "bg-green-50 border-green-200 text-green-800",
      style: { backgroundColor: '#d1fae5', color: '#065f46', borderColor: '#6ee7b7' }
    });
    setAyudasOpen(false);
  } catch (err) {
    console.error(err);
    toast.error("Error inesperado al guardar preferencias.", {
      className: "bg-red-50 border-red-200 text-red-800",
      style: { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }
    });
  }
};


  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center gap-3">
            <GraduationCap className="h-7 w-7 text-sidebar-foreground" />
            <span className="text-lg font-semibold text-sidebar-foreground">
              Sistema Escolar
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {!isMobile && (
            <>
              {!isCollapsed && (
                <div className="text-sidebar-foreground">
                  <ThemeToggle />
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-75"
                aria-label={
                  isCollapsed
                    ? "Expandir menú lateral"
                    : "Contraer menú lateral"
                }
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <X className="h-6 w-6" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {isCollapsed ? "Expandir" : "Contraer"} menú lateral
                </span>
              </Button>
            </>
          )}
          {isMobile && (
            <div
              className="text-sidebar-foreground"
              tabIndex={focusedIndex === modulosUsuario.length + 1 ? 0 : -1}
              onFocus={() => setFocusedIndex(modulosUsuario.length + 1)}
            >
              <ThemeToggle />
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav
        ref={navRef}
        className="flex-1 space-y-2 p-3 overflow-y-auto"
        role="navigation"
        aria-label="Navegación principal"
        tabIndex={0}
        onFocus={(e) => {
          // Enfocar el primer elemento cuando el nav recibe foco
          if (focusedIndex === -1 && modulosUsuario.length > 0) {
            setFocusedIndex(0);
            const firstLink = e.currentTarget.querySelector(
              "a[href]"
            ) as HTMLElement;
            if (firstLink) {
              firstLink.setAttribute("tabindex", "0");
              firstLink.focus();
            }
          }
        }}
        onKeyDown={(e) => {
          // Permitir que las flechas funcionen cuando el nav está enfocado
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
          }
        }}
      >
        {modulosUsuario.map((modulo, index) => {
          const Icon = iconMap[modulo.nombre] || LayoutDashboard;
          const isActive = pathname === modulo.ruta;
          // No offset needed anymore as static links are removed
          const actualIndex = index;

          return (
            <Link
              key={modulo.ruta}
              href={modulo.ruta}
              onClick={() => isMobile && setMobileOpen(false)}
              aria-label={`Navegar a ${modulo.nombre}`}
              tabIndex={focusedIndex === actualIndex ? 0 : -1}
              onFocus={() => setFocusedIndex(actualIndex)}
              className={cn(
                "block outline-none",
                focusedIndex === actualIndex && "bg-sidebar-accent"
              )}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-4 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-75",
                  "h-12 px-4 rounded-xl",
                  isActive &&
                    "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
                  isCollapsed && !isMobile && "justify-center px-2"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                {(!isCollapsed || isMobile) && (
                  <span className="text-sm font-medium truncate">
                    {modulo.nombre}
                  </span>
                )}
                {isCollapsed && !isMobile && (
                  <span className="sr-only">{modulo.nombre}</span>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Ayudas */}
      <div className="border-t border-sidebar-border px-3 py-2">
        <Button
          variant="ghost"
          onClick={() => setAyudasOpen(true)}
          className={cn(
            "w-full justify-start gap-4 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-75",
            "h-12 px-4 rounded-xl",
            isCollapsed && !isMobile && "justify-center px-2"
          )}
          aria-label="Abrir herramientas de ayuda"
        >
          <HelpCircle className="h-6 w-6 shrink-0" aria-hidden="true" />
          {(!isCollapsed || isMobile) && (
            <span className="text-sm font-medium truncate">Ayudas</span>
          )}
          {isCollapsed && !isMobile && <span className="sr-only">Ayudas</span>}
        </Button>
      </div>

      {/* User Info & Logout */}
      <div className="border-t border-sidebar-border p-4">
        {(!isCollapsed || isMobile) && usuario && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {usuario.nombre} {usuario.apellidos}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {usuario.numero_empleado}
                </p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {
                      resetToDefault()
                      logout()
                    }}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-10 outline-none",
                      focusedIndex === modulosUsuario.length &&
                        "ring-2 ring-primary ring-offset-2"
                    )}
                    aria-label="Cerrar sesión"
                    tabIndex={focusedIndex === modulosUsuario.length ? 0 : -1}
                    onFocus={() => setFocusedIndex(modulosUsuario.length)}
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span className="text-sm">Cerrar Sesión</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cerrar Sesión</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        {isCollapsed && !isMobile && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-sidebar-foreground">
              <ThemeToggle />
            </div>
            {usuario && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label="Cerrar sesión"
                      onClick={logout}
                      variant="ghost"
                      size="icon"
                      className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-10 h-10"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      <span className="sr-only">Cerrar Sesión</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cerrar Sesión</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
        {(!isCollapsed || isMobile) && (
          <p className="text-xs text-sidebar-foreground/60">TADDS</p>
        )}
      </div>
    </div>
  );

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 md:hidden bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 p-0 bg-sidebar border-sidebar-border"
            data-nav-zone="sidebar"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menú de navegación</SheetTitle>
              <SheetDescription>
                Menú principal del sistema escolar
              </SheetDescription>
            </SheetHeader>
            {sidebarContent}
          </SheetContent>
        </Sheet>
        {/* Mobile menu button spacer */}
        <div className="h-16 md:hidden" />

        {/* Modal de Ayudas */}
        <Dialog
          open={ayudasOpen}
          onOpenChange={(open) => {
            setAyudasOpen(open);
            // Forzar actualización de la lupa cuando se cierra el modal
            if (!open && typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("modal-closed"));
            }
          }}
        >
          <DialogContent className="max-w-2xl" style={{ animation: "none" }}>
            <DialogHeader className="pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    Herramientas de Accesibilidad
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    Activa las herramientas de accesibilidad que necesites
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto ayudas-modal">
              {/* Visuales */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Visuales
                </h3>
                <div className="space-y-2 pl-7">
                  <div
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() =>
                      updatePreference(
                        "altoContraste",
                        !preferences.altoContraste
                      )
                    }
                  >
                    <Checkbox
                      id="alto-contraste"
                      checked={preferences.altoContraste}
                      onCheckedChange={(checked) =>
                        updatePreference("altoContraste", checked as boolean)
                      }
                      className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <Label
                      htmlFor="alto-contraste"
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      Modo de alto contraste
                    </Label>
                  </div>
                  <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3 mb-3">
                      <Type className="h-5 w-5 text-blue-500" />
                      <Label
                        htmlFor="ajuste-tamaño-letra"
                        className="text-sm font-medium flex-1"
                      >
                        Ajuste de tamaño y tipo de letra
                      </Label>
                    </div>
                    <div className="flex gap-2 ml-8">
                      <Button
                        variant={
                          preferences.ajusteTamanoLetra === "normal"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          updatePreference("ajusteTamanoLetra", "normal")
                        }
                        className="flex-1"
                      >
                        Normal
                      </Button>
                      <Button
                        variant={
                          preferences.ajusteTamanoLetra === "grande"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          updatePreference("ajusteTamanoLetra", "grande")
                        }
                        className="flex-1"
                      >
                        Grande
                      </Button>
                      <Button
                        variant={
                          preferences.ajusteTamanoLetra === "extra-grande"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          updatePreference("ajusteTamanoLetra", "extra-grande")
                        }
                        className="flex-1"
                      >
                        Extra Grande
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3 mb-3">
                      <ZoomIn className="h-5 w-5 text-green-500" />
                      <Label
                        htmlFor="lupa-zoom"
                        className="text-sm font-medium flex-1"
                      >
                        Lupa o zoom de pantalla: {preferences.lupaZoom}%
                      </Label>
                    </div>
                    <div className="ml-8 space-y-2">
                      <Slider
                        value={[preferences.lupaZoom]}
                        onValueChange={(value) =>
                          updatePreference("lupaZoom", value[0])
                        }
                        min={100}
                        max={200}
                        step={10}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>100%</span>
                        <span>120%</span>
                        <span>150%</span>
                        <span>200%</span>
                      </div>
                    </div>
                  </div>
                  <div
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() =>
                      updatePreference(
                        "inversionColores",
                        !preferences.inversionColores
                      )
                    }
                  >
                    <Checkbox
                      id="inversion-colores"
                      checked={preferences.inversionColores}
                      onCheckedChange={(checked) =>
                        updatePreference("inversionColores", checked as boolean)
                      }
                      className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <Palette className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                    <Label
                      htmlFor="inversion-colores"
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      Inversión de colores
                    </Label>
                  </div>
                  <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3 mb-3">
                      <Type className="h-5 w-5 text-indigo-500" />
                      <Label
                        htmlFor="tipo-letra"
                        className="text-sm font-medium flex-1"
                      >
                        Elegir el tipo de letra
                      </Label>
                    </div>
                    <div className="ml-8">
                      <Select
                        value={preferences.tipoLetra}
                        onValueChange={(value) =>
                          updatePreference("tipoLetra", value as any)
                        }
                      >
                        <SelectTrigger id="tipo-letra" className="w-full">
                          <SelectValue placeholder="Selecciona un tipo de letra" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Por defecto</SelectItem>
                          {/* Fuentes para dislexia */}
                          <SelectItem value="opendyslexic">OpenDyslexic</SelectItem>
                          <SelectItem value="dyslexie-font">Dyslexie Font</SelectItem>
                          <SelectItem value="sylexiad">Sylexiad</SelectItem>
                          <SelectItem value="read-regular">Read Regular</SelectItem>
                          <SelectItem value="easyreading">EasyReading</SelectItem>
                          <SelectItem value="dislexie">Dislexie</SelectItem>
                          <SelectItem value="fs-me">FS Me</SelectItem>
                          <SelectItem value="luciole-dyslexia">Luciole Dyslexia</SelectItem>
                          <SelectItem value="tiresias-pcfont">Tiresias PCfont</SelectItem>
                          <SelectItem value="aphont">APHont</SelectItem>
                          <SelectItem value="atkinson-hyperlegible">Atkinson Hyperlegible</SelectItem>
                          {/* Fuentes estándar */}
                          <SelectItem value="clearview">Clearview</SelectItem>
                          <SelectItem value="frutiger">Frutiger</SelectItem>
                          <SelectItem value="luciole">Luciole</SelectItem>
                          <SelectItem value="verdana">Verdana</SelectItem>
                          <SelectItem value="tahoma">Tahoma</SelectItem>
                          <SelectItem value="arial">Arial</SelectItem>
                          <SelectItem value="helvetica">Helvetica</SelectItem>
                          <SelectItem value="helvetica-neue">Helvetica Neue</SelectItem>
                          <SelectItem value="source-sans">Source Sans Pro</SelectItem>
                          {/* Fuentes Lexend */}
                          <SelectItem value="lexend">Lexend</SelectItem>
                          <SelectItem value="lexend-deca">Lexend Deca</SelectItem>
                          <SelectItem value="lexend-exa">Lexend Exa</SelectItem>
                          <SelectItem value="lexend-giga">Lexend Giga</SelectItem>
                          <SelectItem value="lexend-mega">Lexend Mega</SelectItem>
                          {/* Fuentes adicionales */}
                          <SelectItem value="comic-sans">Comic Sans</SelectItem>
                          <SelectItem value="gothic">Century Gothic</SelectItem>
                          <SelectItem value="trebuchet">Trebuchet MS</SelectItem>
                          <SelectItem value="calibri">Calibri</SelectItem>
                          <SelectItem value="nunito">Nunito</SelectItem>
                          <SelectItem value="ubuntu">Ubuntu</SelectItem>
                          <SelectItem value="roboto">Roboto</SelectItem>
                          <SelectItem value="inter">Inter</SelectItem>
                          <SelectItem value="open-sans">Open Sans</SelectItem>
                          <SelectItem value="noto-sans">Noto Sans</SelectItem>
                          <SelectItem value="pt-sans">PT Sans</SelectItem>
                          <SelectItem value="ibm-plex-sans">IBM Plex Sans</SelectItem>
                          <SelectItem value="work-sans">Work Sans</SelectItem>
                          <SelectItem value="lato">Lato</SelectItem>
                          <SelectItem value="mulish">Mulish</SelectItem>
                          <SelectItem value="karla">Karla</SelectItem>
                          <SelectItem value="assistant">Assistant</SelectItem>
                          {/* Fuentes adicionales del sistema original */}
                          <SelectItem value="georgia">Georgia</SelectItem>
                          <SelectItem value="times">Times New Roman</SelectItem>
                          <SelectItem value="courier">Courier New</SelectItem>
                          <SelectItem value="impact">Impact</SelectItem>
                          <SelectItem value="lucida">Lucida Console</SelectItem>
                          <SelectItem value="palatino">Palatino Linotype</SelectItem>
                          <SelectItem value="franklin">Franklin Gothic</SelectItem>
                          <SelectItem value="bookman">Bookman Old Style</SelectItem>
                          <SelectItem value="garamond">Garamond</SelectItem>
                          <SelectItem value="baskerville">Baskerville</SelectItem>
                          <SelectItem value="cambria">Cambria</SelectItem>
                          <SelectItem value="consolas">Consolas</SelectItem>
                          <SelectItem value="montserrat">Montserrat</SelectItem>
                          <SelectItem value="raleway">Raleway</SelectItem>
                          <SelectItem value="playfair">Playfair Display</SelectItem>
                          <SelectItem value="merriweather">Merriweather</SelectItem>
                          <SelectItem value="oswald">Oswald</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3 mb-3">
                      <ZoomIn className="h-5 w-5 text-cyan-500" />
                      <Label
                        htmlFor="lupa-cursor"
                        className="text-sm font-medium flex-1"
                      >
                        Lupa Cursor: {preferences.lupaCursorZoom}%
                      </Label>
                    </div>
                    <div className="ml-8 space-y-2">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="lupa-cursor"
                          checked={preferences.lupaCursor}
                          onCheckedChange={(checked) =>
                            updatePreference("lupaCursor", checked as boolean)
                          }
                          className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                        />
                        <Label
                          htmlFor="lupa-cursor"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Activar lupa cursor
                        </Label>
                      </div>
                      {preferences.lupaCursor &&
                        preferences.lupaCursorZoom > 0 && (
                          <div className="mt-2">
                            <Slider
                              value={[preferences.lupaCursorZoom]}
                              onValueChange={(value) =>
                                updatePreference("lupaCursorZoom", value[0])
                              }
                              min={150}
                              max={300}
                              step={50}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>150%</span>
                              <span>200%</span>
                              <span>250%</span>
                              <span>300%</span>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                  <div
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() =>
                      updatePreference(
                        "quitarEstilosCSS",
                        !preferences.quitarEstilosCSS
                      )
                    }
                  >
                    <Checkbox
                      id="quitar-estilos-css"
                      checked={preferences.quitarEstilosCSS}
                      onCheckedChange={(checked) =>
                        updatePreference("quitarEstilosCSS", checked as boolean)
                      }
                      className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <Code2 className="h-5 w-5 text-orange-500 group-hover:scale-110 transition-transform" />
                    <Label
                      htmlFor="quitar-estilos-css"
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      Quitar estilos CSS
                    </Label>
                  </div>
                  
                  {/* Espaciado de texto */}
                  <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3 mb-3">
                      <AlignLeft className="h-5 w-5 text-teal-500" />
                      <Label
                        htmlFor="espaciado-texto"
                        className="text-sm font-medium flex-1"
                      >
                        Espaciado de texto
                      </Label>
                    </div>
                    <div className="flex gap-2 ml-8">
                      <Button
                        variant={
                          preferences.espaciadoTexto === "normal"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          updatePreference("espaciadoTexto", "normal")
                        }
                        className="flex-1"
                      >
                        Normal
                      </Button>
                      <Button
                        variant={
                          preferences.espaciadoTexto === "aumentado"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          updatePreference("espaciadoTexto", "aumentado")
                        }
                        className="flex-1"
                      >
                        Aumentado
                      </Button>
                      <Button
                        variant={
                          preferences.espaciadoTexto === "extra-aumentado"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          updatePreference("espaciadoTexto", "extra-aumentado")
                        }
                        className="flex-1"
                      >
                        Extra Aumentado
                      </Button>
                    </div>
                  </div>
                  
                  {/* Área de clic aumentada */}
                  <div
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() =>
                      updatePreference(
                        "areaClicAumentada",
                        !preferences.areaClicAumentada
                      )
                    }
                  >
                    <Checkbox
                      id="area-clic-aumentada"
                      checked={preferences.areaClicAumentada}
                      onCheckedChange={(checked) =>
                        updatePreference("areaClicAumentada", checked as boolean)
                      }
                      className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <MousePointer2 className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                    <Label
                      htmlFor="area-clic-aumentada"
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      Área de clic aumentada
                    </Label>
                  </div>
                  
                  {/* Modo monocromático */}
                  <div
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() =>
                      updatePreference(
                        "modoMonocromatico",
                        !preferences.modoMonocromatico
                      )
                    }
                  >
                    <Checkbox
                      id="modo-monocromatico"
                      checked={preferences.modoMonocromatico}
                      onCheckedChange={(checked) =>
                        updatePreference("modoMonocromatico", checked as boolean)
                      }
                      className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <PaletteIcon className="h-5 w-5 text-gray-600 group-hover:scale-110 transition-transform" />
                    <Label
                      htmlFor="modo-monocromatico"
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      Modo monocromático (escala de grises)
                    </Label>
                  </div>
                  
                  {/* Resaltado de enlaces */}
                  <div
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() =>
                      updatePreference(
                        "resaltadoEnlaces",
                        !preferences.resaltadoEnlaces
                      )
                    }
                  >
                    <Checkbox
                      id="resaltado-enlaces"
                      checked={preferences.resaltadoEnlaces}
                      onCheckedChange={(checked) =>
                        updatePreference("resaltadoEnlaces", checked as boolean)
                      }
                      className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <Link2 className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                    <Label
                      htmlFor="resaltado-enlaces"
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      Resaltar enlaces
                    </Label>
                  </div>
                  
                </div>
              </div>

              {/* Motoras y físicas */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Hand className="h-5 w-5 text-primary" />
                  Motoras y físicas
                </h3>
                <div className="space-y-2 pl-7">
                  {/* Teclado en pantalla */}
                  <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3 mb-3">
                      <KeyboardIcon className="h-5 w-5 text-indigo-500" />
                      <Label
                        htmlFor="teclado-pantalla"
                        className="text-sm font-medium flex-1"
                      >
                        Teclado en pantalla
                      </Label>
                    </div>
                    <div className="ml-8 space-y-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="teclado-pantalla"
                          checked={preferences.tecladoPantalla}
                          onCheckedChange={(checked) =>
                            updatePreference(
                              "tecladoPantalla",
                              checked as boolean
                            )
                          }
                          className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                        />
                        <Label
                          htmlFor="teclado-pantalla"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Activar teclado virtual
                        </Label>
                      </div>
                      {preferences.tecladoPantalla && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            Tamaño de teclas:
                          </Label>
                          <div className="flex gap-2">
                            <Button
                              variant={
                                preferences.tamanoTeclas === "normal"
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                updatePreference("tamanoTeclas", "normal")
                              }
                              className="flex-1"
                            >
                              Normal
                            </Button>
                            <Button
                              variant={
                                preferences.tamanoTeclas === "grande"
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                updatePreference("tamanoTeclas", "grande")
                              }
                              className="flex-1"
                            >
                              Grande
                            </Button>
                            <Button
                              variant={
                                preferences.tamanoTeclas === "extra-grande"
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                updatePreference("tamanoTeclas", "extra-grande")
                              }
                              className="flex-1"
                            >
                              Extra Grande
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Puntero grande */}
                  <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3 mb-3">
                      <MousePointerClick className="h-5 w-5 text-cyan-500" />
                      <Label
                        htmlFor="puntero-grande"
                        className="text-sm font-medium flex-1"
                      >
                        Puntero grande
                      </Label>
                    </div>
                    <div className="ml-8 space-y-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="puntero-grande"
                          checked={preferences.punteroGrande}
                          onCheckedChange={(checked) =>
                            updatePreference(
                              "punteroGrande",
                              checked as boolean
                            )
                          }
                          className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                        />
                        <Label
                          htmlFor="puntero-grande"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Activar puntero grande
                        </Label>
                      </div>
                      {preferences.punteroGrande && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            Tamaño: {preferences.tamanoPuntero}x
                          </Label>
                          <Slider
                            value={[preferences.tamanoPuntero]}
                            onValueChange={(value) =>
                              updatePreference("tamanoPuntero", value[0])
                            }
                            min={1}
                            max={5}
                            step={0.5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>1x</span>
                            <span>2x</span>
                            <span>3x</span>
                            <span>4x</span>
                            <span>5x</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                onClick={() =>
                  updatePreference("controlVoz", !preferences.controlVoz)
                }
              >
                <Checkbox
                  id="control-voz-mobile"
                  checked={preferences.controlVoz}
                  onCheckedChange={(checked) =>
                    updatePreference("controlVoz", checked as boolean)
                  }
                  className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                />
                <Mic className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
                <Label
                  htmlFor="control-voz-mobile"
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  Control por mando de voz
                </Label>
              </div>

              {preferences.controlVoz && (
                <div className="ml-8 space-y-3 p-3 bg-accent/20 rounded-lg border border-border/50">
                  {voiceError && (
                    <div className="text-xs text-red-500 font-medium flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      {voiceError}
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Nivel de voz</span>
                      <span>{audioLevel}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-100 ease-out"
                        style={{ width: `${audioLevel}%` }}
                      />
                    </div>
                  </div>
                  {lastCommand && (
                    <div className="p-2 bg-background rounded border text-xs">
                      <span className="text-muted-foreground block mb-1">
                        Último comando:
                      </span>
                      <span className="font-mono font-medium text-primary">
                        "{lastCommand}"
                      </span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Micrófonos:
                    </Label>
                    {microphones.length > 0 ? (
                      <ul className="text-xs space-y-1 max-h-20 overflow-y-auto">
                        {microphones.map((mic, idx) => (
                          <li
                            key={mic.deviceId || idx}
                            className="flex items-center gap-2 text-foreground/80"
                          >
                            <Mic className="h-3 w-3" />
                            <span className="truncate">
                              {mic.label || `Micrófono ${idx + 1}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Detectando...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Cognitivas */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Cognitivas
                </h3>
                <div className="space-y-2 pl-7">
                  <div
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() =>
                      updatePreference(
                        "lecturaVozAlta",
                        !preferences.lecturaVozAlta
                      )
                    }
                  >
                    <Checkbox
                      id="lectura-voz-alta"
                      checked={preferences.lecturaVozAlta}
                      onCheckedChange={(checked) =>
                        updatePreference("lecturaVozAlta", checked as boolean)
                      }
                      className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <Volume2 className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    <Label
                      htmlFor="lectura-voz-alta"
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      Lectura en voz alta del contenido
                    </Label>
                  </div>
                  {preferences.lecturaVozAlta && (
                    <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center space-x-3 mb-3">
                        <Volume2 className="h-5 w-5 text-green-500" />
                        <Label
                          htmlFor="volumen-amplificacion"
                          className="text-sm font-medium flex-1"
                        >
                          Amplificación del sonido:{" "}
                          {preferences.volumenAmplificacion}%
                        </Label>
                      </div>
                      <div className="ml-8 space-y-2">
                        <Slider
                          value={[preferences.volumenAmplificacion]}
                          onValueChange={(value) =>
                            updatePreference("volumenAmplificacion", value[0])
                          }
                          min={0}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() =>
                      updatePreference(
                        "simplificacionInterfaz",
                        !preferences.simplificacionInterfaz
                      )
                    }
                  >
                    <Checkbox
                      id="simplificacion-interfaz"
                      checked={preferences.simplificacionInterfaz}
                      onCheckedChange={(checked) =>
                        updatePreference(
                          "simplificacionInterfaz",
                          checked as boolean
                        )
                      }
                      className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <Focus className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                    <Label
                      htmlFor="simplificacion-interfaz"
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      Simplificación de interfaz
                    </Label>
                  </div>
                  <div
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() =>
                      updatePreference(
                        "enfoqueLineaHorizontal",
                        !preferences.enfoqueLineaHorizontal
                      )
                    }
                  >
                    <Checkbox
                      id="enfoque-linea-horizontal"
                      checked={preferences.enfoqueLineaHorizontal}
                      onCheckedChange={(checked) =>
                        updatePreference(
                          "enfoqueLineaHorizontal",
                          checked as boolean
                        )
                      }
                      className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <Focus className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    <Label
                      htmlFor="enfoque-linea-horizontal"
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      Enfoque en línea horizontal
                    </Label>
                  </div>

                  {/* Guía paso a paso */}
                  <div
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() =>
                      updatePreference(
                        "guiaPasoAPaso",
                        !preferences.guiaPasoAPaso
                      )
                    }
                  >
                    <Checkbox
                      id="guia-paso-a-paso"
                      checked={preferences.guiaPasoAPaso}
                      onCheckedChange={(checked) =>
                        updatePreference("guiaPasoAPaso", checked as boolean)
                      }
                      className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <ListChecks className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                    <Label
                      htmlFor="guia-paso-a-paso"
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      Guía paso a paso (resaltar qué hacer primero, segundo, etc.)
                    </Label>
                  </div>

                  {/* Alfabeto de señas */}
                  <div
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() =>
                      updatePreference(
                        "alfabetoSenas",
                        !preferences.alfabetoSenas
                      )
                    }
                  >
                    <Checkbox
                      id="alfabeto-senas"
                      checked={preferences.alfabetoSenas}
                      onCheckedChange={(checked) =>
                        updatePreference("alfabetoSenas", checked as boolean)
                      }
                      className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <Hand className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                    <Label
                      htmlFor="alfabeto-senas"
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      Alfabeto de señas
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop sidebar
  return (
    <>
      <aside
        data-nav-zone="sidebar"
        className={cn(
          "fixed left-0 top-0 z-40 h-screen transition-all duration-75 ease-out shadow-lg hidden md:block",
          "bg-sidebar backdrop-blur-md",
          "border-r border-sidebar-border",
          "bg-gradient-to-b from-slate-800 to-slate-900", // Para tema sistema
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>
      <div
        className={cn(
          "transition-all duration-75 ease-out hidden md:block",
          isCollapsed ? "w-16" : "w-64"
        )}
      />

      {/* Modal de Ayudas */}
      <Dialog
        open={ayudasOpen}
        onOpenChange={(open) => {
          setAyudasOpen(open);
          // Forzar actualización de la lupa cuando se cierra el modal
          if (!open && typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("modal-closed"));
          }
        }}
      >
        <DialogContent className="max-w-2xl" style={{ animation: "none" }}>
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Herramientas de Accesibilidad
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Activa las herramientas de accesibilidad que necesites
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto ayudas-modal">
            {/* Visuales */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Visuales
              </h3>
              <div className="space-y-2 pl-7">
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "altoContraste",
                      !preferences.altoContraste
                    )
                  }
                >
                  <Checkbox
                    id="alto-contraste-desktop"
                    checked={preferences.altoContraste}
                    onCheckedChange={(checked) =>
                      updatePreference("altoContraste", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="alto-contraste-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Modo de alto contraste
                  </Label>
                </div>
                <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <Type className="h-5 w-5 text-blue-500" />
                    <Label
                      htmlFor="ajuste-tamaño-letra-desktop"
                      className="text-sm font-medium flex-1"
                    >
                      Ajuste de tamaño y tipo de letra
                    </Label>
                  </div>
                  <div className="flex gap-2 ml-8">
                    <Button
                      variant={
                        preferences.ajusteTamanoLetra === "normal"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        updatePreference("ajusteTamanoLetra", "normal")
                      }
                      className="flex-1"
                    >
                      Normal
                    </Button>
                    <Button
                      variant={
                        preferences.ajusteTamanoLetra === "grande"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        updatePreference("ajusteTamanoLetra", "grande")
                      }
                      className="flex-1"
                    >
                      Grande
                    </Button>
                    <Button
                      variant={
                        preferences.ajusteTamanoLetra === "extra-grande"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        updatePreference("ajusteTamanoLetra", "extra-grande")
                      }
                      className="flex-1"
                    >
                      Extra Grande
                    </Button>
                  </div>
                </div>
                <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <ZoomIn className="h-5 w-5 text-green-500" />
                    <Label
                      htmlFor="lupa-zoom-desktop"
                      className="text-sm font-medium flex-1"
                    >
                      Lupa o zoom de pantalla: {preferences.lupaZoom}%
                    </Label>
                  </div>
                  <div className="ml-8 space-y-2">
                    <Slider
                      value={[preferences.lupaZoom]}
                      onValueChange={(value) =>
                        updatePreference("lupaZoom", value[0])
                      }
                      min={100}
                      max={200}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>100%</span>
                      <span>120%</span>
                      <span>150%</span>
                      <span>200%</span>
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "inversionColores",
                      !preferences.inversionColores
                    )
                  }
                >
                  <Checkbox
                    id="inversion-colores-desktop"
                    checked={preferences.inversionColores}
                    onCheckedChange={(checked) =>
                      updatePreference("inversionColores", checked as boolean)
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <Palette className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="inversion-colores-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Inversión de colores
                  </Label>
                </div>
                <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <Type className="h-5 w-5 text-indigo-500" />
                    <Label
                      htmlFor="tipo-letra-desktop"
                      className="text-sm font-medium flex-1"
                    >
                      Elegir el tipo de letra
                    </Label>
                  </div>
                  <div className="ml-8">
                    <Select
                      value={preferences.tipoLetra}
                      onValueChange={(value) =>
                        updatePreference("tipoLetra", value as any)
                      }
                    >
                      <SelectTrigger id="tipo-letra-desktop" className="w-full">
                        <SelectValue placeholder="Selecciona un tipo de letra" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Por defecto</SelectItem>
                        {/* Fuentes para dislexia */}
                        <SelectItem value="opendyslexic">OpenDyslexic</SelectItem>
                        <SelectItem value="dyslexie-font">Dyslexie Font</SelectItem>
                        <SelectItem value="sylexiad">Sylexiad</SelectItem>
                        <SelectItem value="read-regular">Read Regular</SelectItem>
                        <SelectItem value="easyreading">EasyReading</SelectItem>
                        <SelectItem value="dislexie">Dislexie</SelectItem>
                        <SelectItem value="fs-me">FS Me</SelectItem>
                        <SelectItem value="luciole-dyslexia">Luciole Dyslexia</SelectItem>
                        <SelectItem value="tiresias-pcfont">Tiresias PCfont</SelectItem>
                        <SelectItem value="aphont">APHont</SelectItem>
                        <SelectItem value="atkinson-hyperlegible">Atkinson Hyperlegible</SelectItem>
                        {/* Fuentes estándar */}
                        <SelectItem value="clearview">Clearview</SelectItem>
                        <SelectItem value="frutiger">Frutiger</SelectItem>
                        <SelectItem value="luciole">Luciole</SelectItem>
                        <SelectItem value="verdana">Verdana</SelectItem>
                        <SelectItem value="tahoma">Tahoma</SelectItem>
                        <SelectItem value="arial">Arial</SelectItem>
                        <SelectItem value="helvetica">Helvetica</SelectItem>
                        <SelectItem value="helvetica-neue">Helvetica Neue</SelectItem>
                        <SelectItem value="source-sans">Source Sans Pro</SelectItem>
                        {/* Fuentes Lexend */}
                        <SelectItem value="lexend">Lexend</SelectItem>
                        <SelectItem value="lexend-deca">Lexend Deca</SelectItem>
                        <SelectItem value="lexend-exa">Lexend Exa</SelectItem>
                        <SelectItem value="lexend-giga">Lexend Giga</SelectItem>
                        <SelectItem value="lexend-mega">Lexend Mega</SelectItem>
                        {/* Fuentes adicionales */}
                        <SelectItem value="comic-sans">Comic Sans</SelectItem>
                        <SelectItem value="gothic">Century Gothic</SelectItem>
                        <SelectItem value="trebuchet">Trebuchet MS</SelectItem>
                        <SelectItem value="calibri">Calibri</SelectItem>
                        <SelectItem value="nunito">Nunito</SelectItem>
                        <SelectItem value="ubuntu">Ubuntu</SelectItem>
                        <SelectItem value="roboto">Roboto</SelectItem>
                        <SelectItem value="inter">Inter</SelectItem>
                        <SelectItem value="open-sans">Open Sans</SelectItem>
                        <SelectItem value="noto-sans">Noto Sans</SelectItem>
                        <SelectItem value="pt-sans">PT Sans</SelectItem>
                        <SelectItem value="ibm-plex-sans">IBM Plex Sans</SelectItem>
                        <SelectItem value="work-sans">Work Sans</SelectItem>
                        <SelectItem value="lato">Lato</SelectItem>
                        <SelectItem value="mulish">Mulish</SelectItem>
                        <SelectItem value="karla">Karla</SelectItem>
                        <SelectItem value="assistant">Assistant</SelectItem>
                        {/* Fuentes adicionales del sistema original */}
                        <SelectItem value="georgia">Georgia</SelectItem>
                        <SelectItem value="times">Times New Roman</SelectItem>
                        <SelectItem value="courier">Courier New</SelectItem>
                        <SelectItem value="impact">Impact</SelectItem>
                        <SelectItem value="lucida">Lucida Console</SelectItem>
                        <SelectItem value="palatino">Palatino Linotype</SelectItem>
                        <SelectItem value="franklin">Franklin Gothic</SelectItem>
                        <SelectItem value="bookman">Bookman Old Style</SelectItem>
                        <SelectItem value="garamond">Garamond</SelectItem>
                        <SelectItem value="baskerville">Baskerville</SelectItem>
                        <SelectItem value="cambria">Cambria</SelectItem>
                        <SelectItem value="consolas">Consolas</SelectItem>
                        <SelectItem value="montserrat">Montserrat</SelectItem>
                        <SelectItem value="raleway">Raleway</SelectItem>
                        <SelectItem value="playfair">Playfair Display</SelectItem>
                        <SelectItem value="merriweather">Merriweather</SelectItem>
                        <SelectItem value="oswald">Oswald</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <ZoomIn className="h-5 w-5 text-cyan-500" />
                    <Label
                      htmlFor="lupa-cursor-desktop"
                      className="text-sm font-medium flex-1"
                    >
                      Lupa Cursor: {preferences.lupaCursorZoom}%
                    </Label>
                  </div>
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="lupa-cursor-desktop"
                        checked={preferences.lupaCursor}
                        onCheckedChange={(checked) =>
                          updatePreference("lupaCursor", checked as boolean)
                        }
                        className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                      <Label
                        htmlFor="lupa-cursor-desktop"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Activar lupa cursor
                      </Label>
                    </div>
                    {preferences.lupaCursor && (
                      <div className="mt-2">
                        <Slider
                          value={[preferences.lupaCursorZoom]}
                          onValueChange={(value) =>
                            updatePreference("lupaCursorZoom", value[0])
                          }
                          min={150}
                          max={300}
                          step={50}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>150%</span>
                          <span>200%</span>
                          <span>250%</span>
                          <span>300%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "quitarEstilosCSS",
                      !preferences.quitarEstilosCSS
                    )
                  }
                >
                  <Checkbox
                    id="quitar-estilos-css-desktop"
                    checked={preferences.quitarEstilosCSS}
                    onCheckedChange={(checked) =>
                      updatePreference("quitarEstilosCSS", checked as boolean)
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <Code2 className="h-5 w-5 text-orange-500 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="quitar-estilos-css-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Quitar estilos CSS
                  </Label>
                </div>
                
                {/* Espaciado de texto */}
                <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <AlignLeft className="h-5 w-5 text-teal-500" />
                    <Label
                      htmlFor="espaciado-texto-desktop"
                      className="text-sm font-medium flex-1"
                    >
                      Espaciado de texto
                    </Label>
                  </div>
                  <div className="flex gap-2 ml-8">
                    <Button
                      variant={
                        preferences.espaciadoTexto === "normal"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        updatePreference("espaciadoTexto", "normal")
                      }
                      className="flex-1"
                    >
                      Normal
                    </Button>
                    <Button
                      variant={
                        preferences.espaciadoTexto === "aumentado"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        updatePreference("espaciadoTexto", "aumentado")
                      }
                      className="flex-1"
                    >
                      Aumentado
                    </Button>
                    <Button
                      variant={
                        preferences.espaciadoTexto === "extra-aumentado"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        updatePreference("espaciadoTexto", "extra-aumentado")
                      }
                      className="flex-1"
                    >
                      Extra Aumentado
                    </Button>
                  </div>
                </div>
                
                {/* Área de clic aumentada */}
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "areaClicAumentada",
                      !preferences.areaClicAumentada
                    )
                  }
                >
                  <Checkbox
                    id="area-clic-aumentada-desktop"
                    checked={preferences.areaClicAumentada}
                    onCheckedChange={(checked) =>
                      updatePreference("areaClicAumentada", checked as boolean)
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <MousePointer2 className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="area-clic-aumentada-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Área de clic aumentada
                  </Label>
                </div>
                
                {/* Modo monocromático */}
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "modoMonocromatico",
                      !preferences.modoMonocromatico
                    )
                  }
                >
                  <Checkbox
                    id="modo-monocromatico-desktop"
                    checked={preferences.modoMonocromatico}
                    onCheckedChange={(checked) =>
                      updatePreference("modoMonocromatico", checked as boolean)
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <PaletteIcon className="h-5 w-5 text-gray-600 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="modo-monocromatico-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Modo monocromático (escala de grises)
                  </Label>
                </div>
                
                {/* Resaltado de enlaces */}
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "resaltadoEnlaces",
                      !preferences.resaltadoEnlaces
                    )
                  }
                >
                  <Checkbox
                    id="resaltado-enlaces-desktop"
                    checked={preferences.resaltadoEnlaces}
                    onCheckedChange={(checked) =>
                      updatePreference("resaltadoEnlaces", checked as boolean)
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <Link2 className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="resaltado-enlaces-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Resaltar enlaces
                  </Label>
                </div>
                
              </div>
            </div>

            {/* Motoras y físicas */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Hand className="h-5 w-5 text-primary" />
                Motoras y físicas
              </h3>
              <div className="space-y-2 pl-7">
                {/* Teclado en pantalla */}
                <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <KeyboardIcon className="h-5 w-5 text-indigo-500" />
                    <Label
                      htmlFor="teclado-pantalla-desktop"
                      className="text-sm font-medium flex-1"
                    >
                      Teclado en pantalla
                    </Label>
                  </div>
                  <div className="ml-8 space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="teclado-pantalla-desktop"
                        checked={preferences.tecladoPantalla}
                        onCheckedChange={(checked) =>
                          updatePreference(
                            "tecladoPantalla",
                            checked as boolean
                          )
                        }
                        className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                      <Label
                        htmlFor="teclado-pantalla-desktop"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Activar teclado virtual
                      </Label>
                    </div>
                    {preferences.tecladoPantalla && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Tamaño de teclas:
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            variant={
                              preferences.tamanoTeclas === "normal"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              updatePreference("tamanoTeclas", "normal")
                            }
                            className="flex-1"
                          >
                            Normal
                          </Button>
                          <Button
                            variant={
                              preferences.tamanoTeclas === "grande"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              updatePreference("tamanoTeclas", "grande")
                            }
                            className="flex-1"
                          >
                            Grande
                          </Button>
                          <Button
                            variant={
                              preferences.tamanoTeclas === "extra-grande"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              updatePreference("tamanoTeclas", "extra-grande")
                            }
                            className="flex-1"
                          >
                            Extra Grande
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Puntero grande */}
                <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <MousePointerClick className="h-5 w-5 text-cyan-500" />
                    <Label
                      htmlFor="puntero-grande-desktop"
                      className="text-sm font-medium flex-1"
                    >
                      Puntero grande
                    </Label>
                  </div>
                  <div className="ml-8 space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="puntero-grande-desktop"
                        checked={preferences.punteroGrande}
                        onCheckedChange={(checked) =>
                          updatePreference("punteroGrande", checked as boolean)
                        }
                        className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                      <Label
                        htmlFor="puntero-grande-desktop"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Activar puntero grande
                      </Label>
                    </div>
                    {preferences.punteroGrande && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Tamaño: {preferences.tamanoPuntero}x
                        </Label>
                        <Slider
                          value={[preferences.tamanoPuntero]}
                          onValueChange={(value) =>
                            updatePreference("tamanoPuntero", value[0])
                          }
                          min={1}
                          max={5}
                          step={0.5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1x</span>
                          <span>2x</span>
                          <span>3x</span>
                          <span>4x</span>
                          <span>5x</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cognitivas */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Cognitivas
              </h3>
              <div className="space-y-2 pl-7">
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "lecturaVozAlta",
                      !preferences.lecturaVozAlta
                    )
                  }
                >
                  <Checkbox
                    id="lectura-voz-alta-desktop"
                    checked={preferences.lecturaVozAlta}
                    onCheckedChange={(checked) =>
                      updatePreference("lecturaVozAlta", checked as boolean)
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <Volume2 className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="lectura-voz-alta-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Lectura en voz alta del contenido
                  </Label>
                </div>
                {preferences.lecturaVozAlta && (
                  <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3 mb-3">
                      <Volume2 className="h-5 w-5 text-green-500" />
                      <Label
                        htmlFor="volumen-amplificacion-desktop"
                        className="text-sm font-medium flex-1"
                      >
                        Amplificación del sonido:{" "}
                        {preferences.volumenAmplificacion}%
                      </Label>
                    </div>
                    <div className="ml-8 space-y-2">
                      <Slider
                        value={[preferences.volumenAmplificacion]}
                        onValueChange={(value) =>
                          updatePreference("volumenAmplificacion", value[0])
                        }
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                )}
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "simplificacionInterfaz",
                      !preferences.simplificacionInterfaz
                    )
                  }
                >
                  <Checkbox
                    id="simplificacion-interfaz-desktop"
                    checked={preferences.simplificacionInterfaz}
                    onCheckedChange={(checked) =>
                      updatePreference(
                        "simplificacionInterfaz",
                        checked as boolean
                      )
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <Focus className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="simplificacion-interfaz-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Simplificación de interfaz
                  </Label>
                </div>
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "enfoqueLineaHorizontal",
                      !preferences.enfoqueLineaHorizontal
                    )
                  }
                >
                  <Checkbox
                    id="enfoque-linea-horizontal-desktop"
                    checked={preferences.enfoqueLineaHorizontal}
                    onCheckedChange={(checked) =>
                      updatePreference(
                        "enfoqueLineaHorizontal",
                        checked as boolean
                      )
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <Focus className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="enfoque-linea-horizontal-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Enfoque en línea horizontal
                  </Label>
                </div>

                {/* Guía paso a paso */}
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "guiaPasoAPaso",
                      !preferences.guiaPasoAPaso
                    )
                  }
                >
                  <Checkbox
                    id="guia-paso-a-paso-desktop"
                    checked={preferences.guiaPasoAPaso}
                    onCheckedChange={(checked) =>
                      updatePreference("guiaPasoAPaso", checked as boolean)
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <ListChecks className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="guia-paso-a-paso-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Guía paso a paso (resaltar qué hacer primero, segundo, etc.)
                  </Label>
                </div>

                {/* Alfabeto de señas */}
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference(
                      "alfabetoSenas",
                      !preferences.alfabetoSenas
                    )
                  }
                >
                  <Checkbox
                    id="alfabeto-senas-desktop"
                    checked={preferences.alfabetoSenas}
                    onCheckedChange={(checked) =>
                      updatePreference("alfabetoSenas", checked as boolean)
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <Hand className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="alfabeto-senas-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Alfabeto de señas
                  </Label>
                </div>

                <div
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    updatePreference("controlVoz", !preferences.controlVoz)
                  }
                >
                  <Checkbox
                    id="control-voz-desktop"
                    checked={preferences.controlVoz}
                    onCheckedChange={(checked) =>
                      updatePreference("controlVoz", checked as boolean)
                    }
                    className="h-5 w-5 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <Mic className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
                  <Label
                    htmlFor="control-voz-desktop"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Control por mando de voz
                  </Label>
                </div>

                {preferences.controlVoz && (
                  <div className="ml-8 space-y-3 p-3 bg-accent/20 rounded-lg border border-border/50">
                    {voiceError && (
                      <div className="text-xs text-red-500 font-medium flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        {voiceError}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Nivel de voz</span>
                        <span>{audioLevel}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-100 ease-out"
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                    </div>
                    {lastCommand && (
                      <div className="p-2 bg-background rounded border text-xs">
                        <span className="text-muted-foreground block mb-1">
                          Último comando:
                        </span>
                        <span className="font-mono font-medium text-primary">
                          "{lastCommand}"
                        </span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Micrófonos:
                      </Label>
                      {microphones.length > 0 ? (
                        <ul className="text-xs space-y-1 max-h-20 overflow-y-auto">
                          {microphones.map((mic, idx) => (
                            <li
                              key={mic.deviceId || idx}
                              className="flex items-center gap-2 text-foreground/80"
                            >
                              <Mic className="h-3 w-3" />
                              <span className="truncate">
                                {mic.label || `Micrófono ${idx + 1}`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Detectando...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {usuario && (
          <div className="pt-4 border-t flex justify-end">
            <Button
              onClick={savePreferencesToDB}
              variant="default"
              className="w-full"
              disabled={!hasAnyPreferenceActive}
              title={!hasAnyPreferenceActive ? "Selecciona por lo menos 1 preferencia para guardar" : ""}
              aria-disabled={!hasAnyPreferenceActive}
            >
            
              Guardar Cambios
            </Button>
          </div>
        )}
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
}
