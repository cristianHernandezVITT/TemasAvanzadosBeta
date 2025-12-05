"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, Shield, Edit, Trash2 } from "lucide-react"
import { useRolesModules } from "@/hooks/useRolesModules"
import { useAuditTrail } from "@/hooks/useAuditTrail"
import { toast } from "sonner"
import { useArrowNavigation } from "@/hooks/useArrowNavigation"

interface RoleFormData {
  nombre: string
  descripcion: string
  activo: boolean
  modulosSeleccionados: string[] // Array de IDs de módulos
}

interface RoleModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit' | 'delete'
  role?: any
  onSuccess?: () => void
}

export function RoleModal({ isOpen, onClose, mode, role, onSuccess }: RoleModalProps) {
  const [formData, setFormData] = useState<RoleFormData>({
    nombre: "",
    descripcion: "",
    activo: true,
    modulosSeleccionados: []
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeField, setActiveField] = useState<string | null>(null)
  const { createRole, updateRole, deleteRole, modulos, rolesModulos, loadRolesModulos, getModulosByRol, roles } = useRolesModules()
  const { createAuditEntry } = useAuditTrail()
  const modalRef = useRef<HTMLDivElement>(null)
  const activeFieldRef = useRef<string | null>(null)
  useArrowNavigation(modalRef)

  // Mantener ref actualizada
  useEffect(() => {
    activeFieldRef.current = activeField
  }, [activeField])

  // Convertir voz a texto (mayúsculas, números, espacios)
  const convertVoiceToText = (text: string): string => {
    const lowerText = text.toLowerCase().trim()
    
    // Comando especial para espacio
    if (lowerText === "espacio" || lowerText === "space") return " "
    if (lowerText === "guion" || lowerText === "guión") return "-"
    if (lowerText === "punto") return "."
    
    // Mapeo de números hablados
    const numberMap: { [key: string]: string } = {
      "cero": "0", "uno": "1", "dos": "2", "tres": "3", "cuatro": "4",
      "cinco": "5", "seis": "6", "siete": "7", "ocho": "8", "nueve": "9",
    }
    if (numberMap[lowerText]) return numberMap[lowerText]
    
    // Convertir a mayúsculas y limpiar puntuación
    return text.toUpperCase().replace(/[.,;!?]/g, "")
  }

  // Escuchar eventos de voz
  useEffect(() => {
    if (!isOpen) return

    const handleInput = (e: CustomEvent) => {
      const field = e.detail?.field
      if (field) {
        setActiveField(field)
        setTimeout(() => {
          const input = document.getElementById(field)
          if (input) input.focus()
        }, 100)
        toast.info(`Campo ${field} activo - habla para escribir`)
      }
    }

    const handleEstado = (e: CustomEvent) => {
      const activo = e.detail?.activo
      setFormData(prev => ({ ...prev, activo }))
      toast.info(activo ? "Rol activado" : "Rol desactivado")
    }

    const handleModulo = (e: CustomEvent) => {
      const moduloNombre = e.detail?.modulo
      if (moduloNombre) {
        // Buscar el módulo por nombre
        const moduloEncontrado = modulos.find(m => 
          m.nombre.toLowerCase().includes(moduloNombre.toLowerCase())
        )
        
        if (moduloEncontrado) {
          // Toggle: si está seleccionado lo quita, si no lo agrega
          const yaSeleccionado = formData.modulosSeleccionados.includes(moduloEncontrado.id)
          if (yaSeleccionado) {
            setFormData(prev => ({
              ...prev,
              modulosSeleccionados: prev.modulosSeleccionados.filter(id => id !== moduloEncontrado.id)
            }))
            toast.info(`Módulo ${moduloEncontrado.nombre} deseleccionado`)
          } else {
            setFormData(prev => ({
              ...prev,
              modulosSeleccionados: [...prev.modulosSeleccionados, moduloEncontrado.id]
            }))
            toast.success(`Módulo ${moduloEncontrado.nombre} seleccionado`)
          }
        }
      }
    }

    const handleGuardar = () => {
      console.log("Evento voz: Guardar rol")
      toast.info("Guardando rol...")
      const form = modalRef.current?.querySelector('form')
      if (form) {
        form.requestSubmit()
      }
    }

    const handleCerrar = () => {
      console.log("Evento voz: Cerrar modal rol")
      onClose()
    }

    const handleBorrar = () => {
      const field = activeFieldRef.current
      if (field) {
        setFormData(prev => ({ ...prev, [field]: "" }))
        toast.info("Campo limpiado")
      }
    }

    const handleOkey = () => {
      setActiveField(null)
      toast.info("Campo desactivado")
    }

    const handleEscribir = (e: CustomEvent) => {
      const texto = e.detail?.texto
      const field = activeFieldRef.current
      if (texto && field && (field === "nombre" || field === "descripcion")) {
        const processedText = convertVoiceToText(texto)
        if (processedText) {
          setFormData(prev => ({
            ...prev,
            [field]: (prev[field as keyof RoleFormData] as string) + processedText
          }))
        }
      }
    }

    // Si el modal está abierto y se dice "crear rol", hacer submit
    const handleCrearRolEnModal = () => {
      console.log("Evento voz: crear rol (modal abierto)")
      handleGuardar()
    }

    window.addEventListener("voice-rol-modal-input", handleInput as EventListener)
    window.addEventListener("voice-rol-modal-estado", handleEstado as EventListener)
    window.addEventListener("voice-rol-modal-modulo", handleModulo as EventListener)
    window.addEventListener("voice-modal-cerrar", handleCerrar)
    window.addEventListener("voice-modal-borrar", handleBorrar)
    window.addEventListener("voice-modal-okey", handleOkey)
    window.addEventListener("voice-modal-escribir", handleEscribir as EventListener)
    window.addEventListener("voice-crear-rol", handleCrearRolEnModal)
    window.addEventListener("voice-modal-guardar", handleGuardar)

    return () => {
      window.removeEventListener("voice-rol-modal-input", handleInput as EventListener)
      window.removeEventListener("voice-rol-modal-estado", handleEstado as EventListener)
      window.removeEventListener("voice-rol-modal-modulo", handleModulo as EventListener)
      window.removeEventListener("voice-modal-cerrar", handleCerrar)
      window.removeEventListener("voice-modal-borrar", handleBorrar)
      window.removeEventListener("voice-modal-okey", handleOkey)
      window.removeEventListener("voice-modal-escribir", handleEscribir as EventListener)
      window.removeEventListener("voice-crear-rol", handleCrearRolEnModal)
      window.removeEventListener("voice-modal-guardar", handleGuardar)
    }
  }, [isOpen, modulos, onClose, formData.modulosSeleccionados])

  useEffect(() => {
    if (mode === 'edit' && role) {
      // Obtener módulos asignados al rol
      const modulosDelRol = rolesModulos
        .filter(rm => rm.rol_id === role.id)
        .map(rm => rm.modulo_id)
      
      setFormData({
        nombre: role.nombre || "",
        descripcion: role.descripcion || "",
        activo: role.activo !== undefined ? role.activo : true,
        modulosSeleccionados: modulosDelRol
      })
    } else if (mode === 'create') {
      setFormData({
        nombre: "",
        descripcion: "",
        activo: true,
        modulosSeleccionados: []
      })
    }
    setError("")
    setSuccess("")
  }, [mode, role, isOpen, rolesModulos])

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    // Convertir a mayúsculas automáticamente para campos de texto
    const fieldsToUppercase = ['nombre', 'descripcion']
    const convertedValue = typeof value === 'string' && fieldsToUppercase.includes(field) 
      ? value.toUpperCase() 
      : value
    
    setFormData(prev => ({
      ...prev,
      [field]: convertedValue
    }))
    if (error) setError("")
    if (success) setSuccess("")
  }

  const handleModuloToggle = (moduloId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      modulosSeleccionados: checked 
        ? [...prev.modulosSeleccionados, moduloId]
        : prev.modulosSeleccionados.filter(id => id !== moduloId)
    }))
    if (error) setError("")
    if (success) setSuccess("")
  }

  const validateForm = () => {
    const { nombre, descripcion } = formData
    
    if (!nombre.trim()) {
      const errorMsg = "El nombre del rol es requerido"
      setError(errorMsg)
      toast.error(errorMsg)
      return false
    }
    if (nombre.length < 2) {
      const errorMsg = "El nombre del rol debe tener al menos 2 caracteres"
      setError(errorMsg)
      toast.error(errorMsg)
      return false
    }
    if (nombre.length > 50) {
      const errorMsg = "El nombre del rol no puede exceder 50 caracteres"
      setError(errorMsg)
      toast.error(errorMsg)
      return false
    }
    if (descripcion.length > 500) {
      const errorMsg = "La descripción no puede exceder 500 caracteres"
      setError(errorMsg)
      toast.error(errorMsg)
      return false
    }
    
    // Validar que el nombre del rol no exista ya (solo en modo create o si cambió en edit)
    if (mode === 'create') {
      const existeRol = roles?.some(r => r.nombre.toUpperCase() === nombre.toUpperCase())
      if (existeRol) {
        const errorMsg = `El rol "${nombre}" ya está registrado`
        setError(errorMsg)
        toast.error(errorMsg)
        return false
      }
    } else if (mode === 'edit' && role) {
      // En modo edición, solo validar si el nombre cambió
      if (role.nombre.toUpperCase() !== nombre.toUpperCase()) {
        const existeRol = roles?.some(r => r.nombre.toUpperCase() === nombre.toUpperCase() && r.id !== role.id)
        if (existeRol) {
          const errorMsg = `El rol "${nombre}" ya está registrado`
          setError(errorMsg)
          toast.error(errorMsg)
          return false
        }
      }
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'delete') {
      await handleDelete()
      return
    }
    
    if (!validateForm()) return
    
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      let success = false
      
      if (mode === 'create') {
        success = await createRole({
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          activo: formData.activo,
          modulosSeleccionados: formData.modulosSeleccionados
        })
      } else if (mode === 'edit' && role) {
        success = await updateRole(role.id, {
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          activo: formData.activo,
          modulosSeleccionados: formData.modulosSeleccionados
        })
      }
      
      if (success) {
        const successMsg = mode === 'create' ? "Rol creado exitosamente" : "Rol actualizado exitosamente"
        setSuccess(successMsg)
        toast.success(successMsg)
        
        // Registrar en audit trail (sin esperar para no bloquear)
        const accion = mode === 'create' ? 'crear' : 'modificar'
        
        // Obtener nombres de los módulos seleccionados
        const modulosNombres = formData.modulosSeleccionados
          .map(moduloId => modulos.find(m => m.id === moduloId)?.nombre)
          .filter(Boolean) as string[]
        
        createAuditEntry({
          modulo: 'Roles',
          accion: accion,
          entidad: 'Rol',
          entidad_id: mode === 'edit' ? role?.id : undefined,
          detalles: {
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            modulos: modulosNombres,
            cantidad_modulos: modulosNombres.length
          }
        }).catch(err => {
          console.error('Error en audit trail:', err)
        })
        
        onSuccess?.()
        onClose()
      } else {
        const errorMsg = mode === 'create' ? "Error al crear el rol. Verifica que el nombre no esté registrado." : "Error al actualizar el rol"
        setError(errorMsg)
        toast.error(errorMsg)
      }
      
    } catch (err) {
      const errorMsg = "Error al procesar la solicitud. Por favor, inténtalo de nuevo."
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!role) return
    
    setIsLoading(true)
    setError("")
    setSuccess("")
    
    try {
      const result = await deleteRole(role.id)
      if (result.success) {
        // Obtener módulos del rol antes de eliminarlo
        const modulosDelRol = getModulosByRol(role.id)
        const modulosNombres = modulosDelRol.map(m => m.nombre)
        
        // Registrar en audit trail (sin esperar para no bloquear)
        createAuditEntry({
          modulo: 'Roles',
          accion: 'eliminar',
          entidad: 'Rol',
          entidad_id: role.id,
          detalles: {
            nombre: role.nombre,
            descripcion: role.descripcion,
            teniaUsuariosInactivos: result.hasInactiveUsers || false,
            modulos: modulosNombres,
            cantidad_modulos: modulosNombres.length
          }
        }).catch(err => {
          console.error('Error en audit trail:', err)
        })
        
        // Limpiar loading antes de cerrar
        setIsLoading(false)
        
        // Cerrar el modal inmediatamente para evitar el efecto de "quedarse un momento"
        onClose()
        
        // Llamar onSuccess después de que el modal se haya cerrado
        setTimeout(() => {
          onSuccess?.()
        }, 100)
        return // Salir temprano para evitar que el finally ejecute setIsLoading(false)
      } else {
        setIsLoading(false)
        if (result.hasActiveUsers) {
          const errorMsg = "No se puede eliminar el rol porque tiene usuarios activos relacionados"
          setError(errorMsg)
          toast.error(errorMsg)
        } else if (result.hasInactiveUsers) {
          const errorMsg = "No se puede eliminar el rol porque tiene usuarios inactivos relacionados que no se pueden actualizar"
          setError(errorMsg)
          toast.error(errorMsg)
        } else {
          const errorMsg = "Error al eliminar el rol. Por favor, intenta nuevamente."
          setError(errorMsg)
          toast.error(errorMsg)
        }
      }
    } catch (err) {
      setIsLoading(false)
      const errorMsg = "Error al eliminar el rol"
      setError(errorMsg)
      toast.error(errorMsg)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent ref={modalRef} className="sm:max-w-[600px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Crear Nuevo Rol' : mode === 'edit' ? 'Editar Rol' : 'Eliminar Rol'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {mode === 'create' ? 'Ingresa los datos para crear un nuevo rol.' : mode === 'edit' ? 'Modifica los datos del rol seleccionado.' : '¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer.'}
          </DialogDescription>
        </DialogHeader>
        
        {mode !== 'delete' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Rol *</Label>
              <Input
                id="nombre"
                type="text"
                placeholder="Ej: Admin"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                required
                maxLength={50}
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                placeholder="Ej: Rol para profesores que pueden gestionar estudiantes y calificaciones"
                value={formData.descripcion}
                onChange={(e) => handleInputChange("descripcion", e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>

            {/* Estado */}
            <div className="flex items-center space-x-2">
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => handleInputChange("activo", checked)}
              />
              <Label htmlFor="activo">Rol activo</Label>
            </div>

            {/* Módulos */}
            <div className="space-y-3">
              <Label>Módulos con Acceso</Label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="grid gap-3">
                  {modulos.map((modulo) => (
                    <div key={modulo.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`modulo-${modulo.id}`}
                        checked={formData.modulosSeleccionados.includes(modulo.id)}
                        onCheckedChange={(checked) => handleModuloToggle(modulo.id, checked as boolean)}
                      />
                      <Label 
                        htmlFor={`modulo-${modulo.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {modulo.nombre}
                      </Label>
                      <span className="text-xs text-gray-500 ml-auto">
                        {modulo.ruta}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Selecciona los módulos a los que este rol tendrá acceso
              </p>
            </div>

            {/* Mensajes */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Save className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    {mode === 'create' ? <Shield className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                    {mode === 'create' ? 'Crear Rol' : 'Guardar Cambios'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-yellow-700">
                Esta acción eliminará permanentemente el rol {role?.nombre}.
                <br />
                <strong>Nota:</strong> Solo se pueden eliminar roles que no tengan usuarios activos. Si el rol tiene usuarios inactivos, se permitirá la eliminación.
              </AlertDescription>
            </Alert>
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}
            <DialogFooter className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Trash2 className="w-4 h-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
