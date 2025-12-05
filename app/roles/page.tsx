"use client"

import { useState, useEffect, useRef } from "react"
import { useArrowNavigation } from "@/hooks/useArrowNavigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Edit, Trash2, FileSpreadsheet, FileText, Plus } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"
import { PermissionGuard } from "@/components/PermissionGuard"
import { RoleModal } from "@/components/RoleModal"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useRolesModules } from "@/hooks/useRolesModules"
import { useAuditTrail } from "@/hooks/useAuditTrail"
import { toast } from "sonner"

export default function RolesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete'>('create')
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const { roles, modulos, loadRoles } = useRolesModules()
  const { createAuditEntry } = useAuditTrail()
  const tableRef = useRef<HTMLTableElement>(null)
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1)

  const handleSuccess = () => {
    // La tabla se recarga automáticamente por el useEffect
    // Mostrar notificación de éxito
    if (modalMode === 'create') {
      toast.success("Rol creado exitosamente")
    } else if (modalMode === 'edit') {
      toast.success("Rol actualizado exitosamente")
    } else if (modalMode === 'delete') {
      toast.success("Rol eliminado exitosamente")
    }
  }

  const exportToExcel = async () => {
    try {
      // Crear datos para Excel
      const excelData = roles.map(role => ({
        'Nombre': role.nombre,
        'Descripción': role.descripcion || 'Sin descripción',
        'Estado': role.activo ? 'Activo' : 'Inactivo',
        'Creado por': role.creado_por_nombre ? `${role.creado_por_numero_empleado || ''} - ${role.creado_por_nombre}` : 'Sistema',
        'Modificado por': role.modificado_por_nombre ? `${role.modificado_por_numero_empleado || ''} - ${role.modificado_por_nombre}` : 'Nunca',
        'Fecha Creación': new Date(role.created_at).toLocaleDateString(),
        'Fecha Modificación': new Date(role.updated_at).toLocaleDateString()
      }))

      // Convertir a CSV (formato compatible con Excel)
      const headers = Object.keys(excelData[0] || {})
      const csvContent = [
        headers.join(','),
        ...excelData.map(row => headers.map(header => `"${(row as any)[header] || ''}"`).join(','))
      ].join('\n')

      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `roles_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("Archivo Excel exportado exitosamente")
      
      // Registrar en audit trail
      await createAuditEntry({
        modulo: 'Roles',
        accion: 'exportar',
        entidad: 'CSV',
        detalles: { registros: roles.length }
      })
    } catch (error) {
      toast.error("Error al exportar a Excel")
      console.error('Error exporting to Excel:', error)
    }
  }

  const exportToPDF = () => {
    try {
      // Crear contenido HTML para PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Roles</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 18px;
              color: #64748b;
              margin-bottom: 5px;
            }
            .date {
              font-size: 14px;
              color: #6b7280;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background-color: #f3f4f6;
              font-weight: bold;
              color: #374151;
            }
            .badge-active {
              background-color: #10b981;
              color: white;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 10px;
            }
            .badge-inactive {
              background-color: #ef4444;
              color: white;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 10px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Temas Avanzados de Desarrollo de Software</div>
            <div class="subtitle">Calidad de Datos</div>
            <div class="date">Generado el: ${new Date().toLocaleDateString('es-ES')}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Creado por</th>
                <th>Modificado por</th>
                <th>Fecha Creación</th>
                <th>Fecha Modificación</th>
              </tr>
            </thead>
            <tbody>
              ${roles.map(role => `
                <tr>
                  <td>${role.nombre}</td>
                  <td>${role.descripcion || 'Sin descripción'}</td>
                  <td><span class="badge-${role.activo ? 'active' : 'inactive'}">${role.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td>${role.creado_por_nombre ? `${role.creado_por_numero_empleado || ''} - ${role.creado_por_nombre}` : 'Sistema'}</td>
                  <td>${role.modificado_por_nombre ? `${role.modificado_por_numero_empleado || ''} - ${role.modificado_por_nombre}` : 'Nunca'}</td>
                  <td>${new Date(role.created_at).toLocaleDateString()}</td>
                  <td>${new Date(role.updated_at).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Total de roles: ${roles.length}</p>
            <p>Sistema Escolar - Reporte generado automáticamente</p>
          </div>
        </body>
        </html>
      `

      // Crear ventana nueva para imprimir
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        printWindow.focus()
        
        // Esperar a que se cargue el contenido y luego imprimir
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      }

      toast.success("PDF generado exitosamente")
    } catch (error) {
      toast.error("Error al generar PDF")
      console.error('Error generating PDF:', error)
    }
  }

  const handleCreateRole = () => {
    setModalMode('create')
    setSelectedRole(null)
    setModalOpen(true)
  }

  const handleEditRole = (role: any) => {
    setModalMode('edit')
    setSelectedRole(role)
    setModalOpen(true)
  }

  const handleDeleteRole = (role: any) => {
    setModalMode('delete')
    setSelectedRole(role)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedRole(null)
  }

  // Navegación por teclado en la tabla
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tableRef.current) return

      // El componente Table envuelve el table en un div, necesitamos obtener el table real
      const tableElement = tableRef.current.querySelector('table[data-slot="table"]') as HTMLTableElement
      if (!tableElement) return

      const rows = Array.from(tableElement.querySelectorAll('tbody tr')) as HTMLElement[]
      if (rows.length === 0) return

      let newIndex = focusedRowIndex

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          newIndex = focusedRowIndex < rows.length - 1 ? focusedRowIndex + 1 : focusedRowIndex
          setFocusedRowIndex(newIndex)
          rows[newIndex]?.focus()
          break
        case 'ArrowUp':
          e.preventDefault()
          newIndex = focusedRowIndex > 0 ? focusedRowIndex - 1 : 0
          setFocusedRowIndex(newIndex)
          rows[newIndex]?.focus()
          break
        case 'Home':
          e.preventDefault()
          newIndex = 0
          setFocusedRowIndex(newIndex)
          rows[newIndex]?.focus()
          break
        case 'End':
          e.preventDefault()
          newIndex = rows.length - 1
          setFocusedRowIndex(newIndex)
          rows[newIndex]?.focus()
          break
        case 'Enter':
        case ' ':
          if (focusedRowIndex >= 0 && focusedRowIndex < rows.length) {
            e.preventDefault()
            const editButton = rows[focusedRowIndex].querySelector('button[aria-label*="Editar"]') as HTMLButtonElement
            if (editButton) {
              editButton.click()
            }
          }
          break
      }
    }

    if (tableRef.current) {
      tableRef.current.addEventListener('keydown', handleKeyDown)
      return () => {
        tableRef.current?.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [focusedRowIndex, roles])

  const mainContentRef = useRef<HTMLDivElement>(null)
  useArrowNavigation(mainContentRef)

  // Refs para funciones de voz
  const rolesRef = useRef(roles)
  useEffect(() => {
    rolesRef.current = roles
  }, [roles])

  // Escuchar eventos de voz del sidebar
  useEffect(() => {
    const handleExportExcel = () => {
      console.log("Evento voz: Exportar Excel Roles")
      exportToExcel()
      toast.success("Exportando Excel...")
    }
    const handleExportPDF = () => {
      console.log("Evento voz: Exportar PDF Roles")
      exportToPDF()
      toast.success("Exportando PDF...")
    }
    const handleCreateRol = () => {
      console.log("Evento voz: Crear rol")
      handleCreateRole()
    }
    const handleEditRolVoice = (e: CustomEvent) => {
      console.log("Evento voz: Editar rol", e.detail)
      const comando = e.detail?.comando?.toLowerCase() || ""
      
      // Buscar nombre del rol en el comando
      const rol = rolesRef.current.find(r => 
        comando.includes(r.nombre.toLowerCase())
      )
      
      if (rol) {
        handleEditRole(rol)
        toast.success(`Editando rol ${rol.nombre}`)
      } else {
        toast.info("Di 'editar rol' + nombre (ej: 'editar rol administrador')")
      }
    }
    const handleDeleteRolVoice = (e: CustomEvent) => {
      console.log("Evento voz: Eliminar rol", e.detail)
      const comando = e.detail?.comando?.toLowerCase() || ""
      
      // Buscar nombre del rol en el comando
      const rol = rolesRef.current.find(r => 
        comando.includes(r.nombre.toLowerCase())
      )
      
      if (rol) {
        handleDeleteRole(rol)
        toast.success(`Eliminando rol ${rol.nombre}`)
      } else {
        toast.info("Di 'eliminar rol' + nombre (ej: 'eliminar rol docente')")
      }
    }

    window.addEventListener("voice-export-excel", handleExportExcel)
    window.addEventListener("voice-export-pdf", handleExportPDF)
    window.addEventListener("voice-crear-rol", handleCreateRol)
    window.addEventListener("voice-editar-rol", handleEditRolVoice as EventListener)
    window.addEventListener("voice-eliminar-rol", handleDeleteRolVoice as EventListener)

    return () => {
      window.removeEventListener("voice-export-excel", handleExportExcel)
      window.removeEventListener("voice-export-pdf", handleExportPDF)
      window.removeEventListener("voice-crear-rol", handleCreateRol)
      window.removeEventListener("voice-editar-rol", handleEditRolVoice as EventListener)
      window.removeEventListener("voice-eliminar-rol", handleDeleteRolVoice as EventListener)
    }
  }, [])

  return (
    <AuthGuard>
      <PermissionGuard requiredRoute="/roles">
        <div ref={mainContentRef} className="min-h-screen bg-background p-3 md:p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestión de Roles</h1>
                <p className="text-muted-foreground">Administra los roles y permisos del sistema escolar</p>
              </div>
            </div>

            {/* Tabla de Roles */}
            <div className="bg-card rounded-lg shadow-lg border border-border">
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">Lista de Roles</h2>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={exportToExcel}
                      variant="outline"
                      className="flex items-center gap-2 export-excel-btn"
                      aria-label="Exportar lista de roles a Excel"
                    >
                      <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
                      Exportar Excel
                    </Button>
                    <Button 
                      onClick={exportToPDF}
                      variant="outline"
                      className="flex items-center gap-2 export-pdf-btn"
                      aria-label="Exportar lista de roles a PDF"
                    >
                      <FileText className="w-4 h-4" aria-hidden="true" />
                      Exportar PDF
                    </Button>
                    <Button onClick={handleCreateRole} aria-label="Crear nuevo rol">
                      <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                      Crear Rol
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <Table ref={tableRef}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rol</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Creado por</TableHead>
                        <TableHead>Modificado por</TableHead>
                        <TableHead>Fecha Creación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No hay roles registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        roles.map((role, index) => (
                          <TableRow 
                            key={role.id}
                            tabIndex={0}
                            className={focusedRowIndex === index ? "ring-2 ring-primary ring-offset-2" : ""}
                            onFocus={() => setFocusedRowIndex(index)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-full flex items-center justify-center">
                                  <Shield className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{role.nombre}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-muted-foreground text-sm">
                                {role.descripcion || 'Sin descripción'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={role.activo ? 'default' : 'secondary'}>
                                {role.activo ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="text-foreground font-medium">
                                  {role.creado_por_nombre ? `${role.creado_por_numero_empleado || ''} - ${role.creado_por_nombre}` : 'Sistema'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="text-foreground font-medium">
                                  {role.modificado_por_nombre ? `${role.modificado_por_numero_empleado || ''} - ${role.modificado_por_nombre}` : 'Nunca'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-muted-foreground text-sm">
                                {new Date(role.created_at).toLocaleDateString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditRole(role)}
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        aria-label={`Editar rol ${role.nombre}`}
                                      >
                                        <Edit className="w-4 h-4" aria-hidden="true" />
                                        <span className="sr-only">Editar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteRole(role)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        aria-label={`Eliminar rol ${role.nombre}`}
                                      >
                                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                                        <span className="sr-only">Eliminar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Eliminar</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Modal */}
            <RoleModal
              isOpen={modalOpen}
              onClose={handleModalClose}
              mode={modalMode}
              role={selectedRole}
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      </PermissionGuard>
    </AuthGuard>
  )
}
