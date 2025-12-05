"use client"

import { useState, useEffect, useRef } from "react"
import { useArrowNavigation } from "@/hooks/useArrowNavigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Edit, Trash2, FileSpreadsheet, FileText } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"
import { UserModal } from "@/components/UserModal"
import { useAuth } from "@/hooks/useAuth"
import { useAuditTrail } from "@/hooks/useAuditTrail"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

export default function UsuariosPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete'>('create')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const { usuarios } = useAuth()
  const { createAuditEntry } = useAuditTrail()
  const tableRef = useRef<HTMLTableElement>(null)
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1)

  const handleSuccess = () => {
    // La tabla se recarga automáticamente por el useEffect
    // Mostrar notificación de éxito
    if (modalMode === 'create') {
      toast.success("Usuario creado exitosamente")
    } else if (modalMode === 'edit') {
      toast.success("Usuario actualizado exitosamente")
    } else if (modalMode === 'delete') {
      toast.success("Usuario eliminado exitosamente")
    }
  }

  const exportToExcel = async () => {
    try {
      // Crear datos para Excel
      const excelData = usuarios.map(user => ({
        'Número Empleado': user.numero_empleado,
        'Nombre': user.nombre,
        'Apellidos': user.apellidos,
        'Rol': user.rol_nombre || 'Sin rol',
        'CURP': user.curp,
        'Horario': user.horario,
        'Teléfono': user.telefono,
        'Creado por': user.creado_por_nombre ? `${user.creado_por_numero_empleado} - ${user.creado_por_nombre}` : 'Sistema',
        'Modificado por': user.modificado_por_nombre ? `${user.modificado_por_numero_empleado} - ${user.modificado_por_nombre}` : 'Nunca',
        'Fecha Creación': new Date(user.created_at).toLocaleDateString(),
        'Fecha Modificación': new Date(user.updated_at).toLocaleDateString(),
        'Estado': user.activo ? 'Activo' : 'Inactivo'
      }))

      // Convertir a CSV (formato compatible con Excel)
      const headers = Object.keys(excelData[0] || {})
      const csvContent = [
        headers.join(','),
        ...excelData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
      ].join('\n')

      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("Archivo Excel exportado exitosamente")
      
      // Registrar en audit trail
      await createAuditEntry({
        modulo: 'Usuarios',
        accion: 'exportar',
        entidad: 'CSV',
        detalles: { registros: usuarios.length }
      })
    } catch (error) {
      toast.error("Error al exportar a Excel")
      console.error('Error exporting to Excel:', error)
    }
  }

  const exportToPDF = async () => {
    try {
      // Crear contenido HTML para PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Usuarios</title>
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
            .badge-admin {
              background-color: #3b82f6;
              color: white;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 10px;
            }
            .badge-docente {
              background-color: #6b7280;
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
                <th>Número Empleado</th>
                <th>Nombre</th>
                <th>Apellidos</th>
                <th>Rol</th>
                <th>CURP</th>
                <th>Horario</th>
                <th>Teléfono</th>
                <th>Creado por</th>
                <th>Modificado por</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${usuarios.map(user => `
                <tr>
                  <td>${user.numero_empleado}</td>
                  <td>${user.nombre}</td>
                  <td>${user.apellidos}</td>
                  <td><span class="badge-${user.rol_nombre === 'Administrador' ? 'admin' : user.rol_nombre === 'SuperAdmin' ? 'superadmin' : 'docente'}">${user.rol_nombre || 'Sin rol'}</span></td>
                  <td>${user.curp || 'No registrada'}</td>
                  <td>${user.horario || 'No registrado'}</td>
                  <td>${user.telefono || 'No registrado'}</td>
                  <td>${user.creado_por_nombre ? `${user.creado_por_numero_empleado} - ${user.creado_por_nombre}` : 'Sistema'}</td>
                  <td>${user.modificado_por_nombre ? `${user.modificado_por_numero_empleado} - ${user.modificado_por_nombre}` : 'Nunca'}</td>
                  <td>${user.activo ? 'Activo' : 'Inactivo'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Total de usuarios: ${usuarios.length}</p>
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
      
      // Registrar en audit trail
      await createAuditEntry({
        modulo: 'Usuarios',
        accion: 'exportar',
        entidad: 'PDF',
        detalles: { registros: usuarios.length }
      })
    } catch (error) {
      toast.error("Error al generar PDF")
      console.error('Error generating PDF:', error)
    }
  }

  const handleCreateUser = () => {
    setModalMode('create')
    setSelectedUser(null)
    setModalOpen(true)
  }

  const handleEditUser = (user: any) => {
    setModalMode('edit')
    setSelectedUser(user)
    setModalOpen(true)
  }

  const handleDeleteUser = (user: any) => {
    setModalMode('delete')
    setSelectedUser(user)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedUser(null)
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
  }, [focusedRowIndex, usuarios])

  const mainContentRef = useRef<HTMLDivElement>(null)
  useArrowNavigation(mainContentRef)

  // Refs para funciones de voz
  const usuariosRef = useRef(usuarios)
  useEffect(() => {
    usuariosRef.current = usuarios
  }, [usuarios])

  // Escuchar eventos de voz del sidebar
  useEffect(() => {
    const handleExportExcel = () => {
      console.log("Evento voz: Exportar Excel")
      exportToExcel()
    }
    const handleExportPDF = () => {
      console.log("Evento voz: Exportar PDF")
      exportToPDF()
    }
    const handleCreateUserVoice = () => {
      console.log("Evento voz: Crear usuario - ejecutando handleCreateUser")
      setModalMode('create')
      setSelectedUser(null)
      setModalOpen(true)
    }
    const handleEditUserVoice = (e: CustomEvent) => {
      console.log("Evento voz: Editar usuario", e.detail)
      const numEmpleado = e.detail?.numero
      if (numEmpleado) {
        const user = usuariosRef.current.find(u => u.numero_empleado === numEmpleado)
        if (user) {
          console.log("Usuario encontrado:", user)
          setModalMode('edit')
          setSelectedUser(user)
          setModalOpen(true)
          toast.success(`Editando usuario ${user.nombre}`)
        } else {
          toast.error(`No se encontró empleado con número ${numEmpleado}`)
        }
      }
    }
    const handleDeleteUserVoice = (e: CustomEvent) => {
      console.log("Evento voz: Eliminar usuario", e.detail)
      const numEmpleado = e.detail?.numero
      if (numEmpleado) {
        const user = usuariosRef.current.find(u => u.numero_empleado === numEmpleado)
        if (user) {
          console.log("Usuario encontrado para eliminar:", user)
          setModalMode('delete')
          setSelectedUser(user)
          setModalOpen(true)
          toast.success(`Eliminando usuario ${user.nombre}`)
        } else {
          toast.error(`No se encontró empleado con número ${numEmpleado}`)
        }
      }
    }

    window.addEventListener("voice-export-excel", handleExportExcel)
    window.addEventListener("voice-export-pdf", handleExportPDF)
    window.addEventListener("voice-crear-usuario", handleCreateUserVoice)
    window.addEventListener("voice-editar-usuario", handleEditUserVoice as EventListener)
    window.addEventListener("voice-eliminar-usuario", handleDeleteUserVoice as EventListener)

    return () => {
      window.removeEventListener("voice-export-excel", handleExportExcel)
      window.removeEventListener("voice-export-pdf", handleExportPDF)
      window.removeEventListener("voice-crear-usuario", handleCreateUserVoice)
      window.removeEventListener("voice-editar-usuario", handleEditUserVoice as EventListener)
      window.removeEventListener("voice-eliminar-usuario", handleDeleteUserVoice as EventListener)
    }
  }, [])

  return (
    <AuthGuard>
      <div ref={mainContentRef} className="min-h-screen bg-background p-3 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
              <p className="text-sm md:text-base text-muted-foreground">Administra los usuarios del sistema escolar</p>
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="bg-card rounded-lg shadow-lg border border-border">
            <div className="px-4 md:px-6 py-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg md:text-xl font-semibold text-foreground">Lista de Usuarios</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <Button 
                    onClick={exportToExcel}
                    variant="outline"
                    className="flex items-center justify-center gap-2 w-full sm:w-auto export-excel-btn"
                    aria-label="Exportar lista de usuarios a Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
                    <span className="text-sm md:text-base">Exportar Excel</span>
                  </Button>
                  <Button 
                    onClick={exportToPDF}
                    variant="outline"
                    className="flex items-center justify-center gap-2 w-full sm:w-auto export-pdf-btn"
                    aria-label="Exportar lista de usuarios a PDF"
                  >
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    <span className="text-sm md:text-base">Exportar PDF</span>
                  </Button>
                  <Button onClick={handleCreateUser} className="w-full sm:w-auto" aria-label="Crear nuevo usuario">
                    <UserPlus className="w-4 h-4 mr-2" aria-hidden="true" />
                    <span className="text-sm md:text-base">Crear Usuario</span>
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-3 md:p-6">
              <div className="overflow-x-auto -mx-3 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden">
                    <Table ref={tableRef}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número Empleado</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>CURP</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Creado por</TableHead>
                      <TableHead>Modificado por</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No hay usuarios registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      usuarios.map((user, index) => (
                        <TableRow 
                          key={user.id}
                          tabIndex={0}
                          className={focusedRowIndex === index ? "ring-2 ring-primary ring-offset-2" : ""}
                          onFocus={() => setFocusedRowIndex(index)}
                          onBlur={() => {
                            // No resetear el índice al hacer blur para mantener la navegación
                          }}
                        >
                          <TableCell>
                            <span className="font-medium text-foreground">{user.numero_empleado}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-xs">
                                  {(user.nombre + ' ' + user.apellidos).split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{user.nombre} {user.apellidos}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.rol_nombre === 'Administrador' ? 'default' : user.rol_nombre === 'SuperAdmin' ? 'destructive' : 'secondary'}>
                              {user.rol_nombre || 'Sin rol'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground font-mono text-sm">
                              {user.curp || 'No registrada'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground text-sm">
                              {user.horario || 'No registrado'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="text-foreground font-medium">
                                {user.creado_por_nombre ? `${user.creado_por_numero_empleado || ''} - ${user.creado_por_nombre}` : 'Sistema'}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="text-foreground font-medium">
                                {user.modificado_por_nombre ? `${user.modificado_por_numero_empleado || ''} - ${user.modificado_por_nombre}` : 'Nunca'}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditUser(user)}
                                      className="h-8 w-8 p-0"
                                      aria-label={`Editar usuario ${user.nombre} ${user.apellidos}`}
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
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteUser(user)}
                                      className="h-8 w-8 p-0"
                                      aria-label={`Eliminar usuario ${user.nombre} ${user.apellidos}`}
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
            </div>
          </div>
        </div>

        {/* Modal */}
        <UserModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          mode={modalMode}
          user={selectedUser}
          onSuccess={handleSuccess}
        />
      </div>
    </AuthGuard>
  )
}