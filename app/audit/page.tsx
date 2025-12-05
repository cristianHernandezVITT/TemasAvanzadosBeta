"use client"

import React, { useState, useMemo, useRef } from "react"
import { useArrowNavigation } from "@/hooks/useArrowNavigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAuditTrail, AuditTrailEntry } from "@/hooks/useAuditTrail"
import { FileSpreadsheet, FileText, Search, Filter } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import jsPDF from 'jspdf'

export default function AuditPage() {
  const { auditTrail, loading } = useAuditTrail()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterModulo, setFilterModulo] = useState("todos")
  const [filterAccion, setFilterAccion] = useState("todos")
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 20

  const modulos = useMemo(() => 
    Array.from(new Set(auditTrail.map(entry => entry.modulo))),
    [auditTrail]
  )

  const acciones = useMemo(() => 
    Array.from(new Set(auditTrail.map(entry => entry.accion))),
    [auditTrail]
  )

  const filteredData = useMemo(() => {
    let data = auditTrail

    if (filterModulo !== "todos") {
      data = data.filter(entry => entry.modulo === filterModulo)
    }

  
    if (filterAccion !== "todos") {
      data = data.filter(entry => entry.accion === filterAccion)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      data = data.filter(entry =>
        entry.modulo.toLowerCase().includes(term) ||
        entry.accion.toLowerCase().includes(term) ||
        entry.entidad.toLowerCase().includes(term) ||
        entry.usuario_nombre?.toLowerCase().includes(term) ||
        entry.usuario_apellidos?.toLowerCase().includes(term) ||
        entry.numero_empleado?.toLowerCase().includes(term)
      )
    }

    return data
  }, [auditTrail, filterModulo, filterAccion, searchTerm])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  )

  const getActionColor = (accion: string) => {
    switch (accion.toLowerCase()) {
      case 'crear':
      case 'creado':
        return 'default'
      case 'actualizar':
      case 'modificar':
        return 'secondary'
      case 'eliminar':
        return 'destructive'
      case 'exportar':
        return 'outline'
      case 'login':
      case 'logout':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const formatDetails = (detalles: any): React.ReactElement => {
    if (!detalles) return <span className="text-muted-foreground">-</span>
    
    if (typeof detalles === 'object') {
      const entries = Object.entries(detalles)
      
      const modulosEntry = entries.find(([key]) => key.toLowerCase() === 'modulos')
      const otrosEntries = entries.filter(([key]) => {
        const lowerKey = key.toLowerCase()
        return !lowerKey.includes('_id') && 
               !lowerKey.includes('id') && 
               lowerKey !== 'modulos' &&
               lowerKey !== 'formato' &&
               lowerKey !== 'cantidad_modulos'
      })
      
      const partes: string[] = []
      
      otrosEntries.forEach(([key, value]) => {
        const readableKey = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
        let formattedValue: any = value
        
        if (Array.isArray(value)) {
          formattedValue = value.length > 0 ? `${value.length} items` : ''
        } else if (typeof value === 'boolean') {
          formattedValue = value ? 'Sí' : 'No'
        } else if (typeof value === 'string' && value.length > 25) {
          formattedValue = value.substring(0, 25) + '...'
        }
        
        if (formattedValue !== '' && formattedValue !== undefined) {
          partes.push(`${readableKey}: ${String(formattedValue)}`)
        }
      })
      
    
      if (modulosEntry && Array.isArray(modulosEntry[1]) && modulosEntry[1].length > 0) {
        const modulos = modulosEntry[1] as string[]
        const cantidadModulos = modulos.length
        partes.push(`Módulos (${cantidadModulos}): ${modulos.slice(0, 3).join(', ')}${cantidadModulos > 3 ? ` +${cantidadModulos - 3} más` : ''}`)
      }
      
      const textoCompleto = partes.join(' • ')
      const textoTruncado = textoCompleto.length > 120 ? textoCompleto.substring(0, 120) + '...' : textoCompleto
      
      return (
        <div 
          className="text-xs text-foreground break-words"
          style={{ 
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
          title={textoCompleto}
        >
          {textoTruncado}
        </div>
      )
    }
    
    const textoStr = String(detalles)
    const textoTruncado = textoStr.length > 120 ? textoStr.substring(0, 120) + '...' : textoStr
    
    return (
      <span 
        className="text-muted-foreground text-xs max-w-[300px] inline-block"
        title={textoStr}
      >
        {textoTruncado}
      </span>
    )
  }

  
  const formatDetailsForExport = (detalles: any): string => {
    if (!detalles) return '-'
    
    if (typeof detalles === 'object') {
      const entries = Object.entries(detalles)
      return entries.map(([key, value]) => {
        let formattedValue: any = value
        
      
        if (Array.isArray(value)) {
          formattedValue = value.join(', ')
        } else if (typeof value === 'boolean') {
          formattedValue = value ? 'Sí' : 'No'
        } else if (typeof value === 'object') {
          formattedValue = JSON.stringify(value)
        }
        
        return `${key}: ${String(formattedValue)}`
      }).join(' | ')
    }
    
    return String(detalles)
  }

  const exportToCSV = () => {
    const csvData = filteredData.map(entry => ({
      'Fecha': new Date(entry.created_at).toLocaleString('es-ES'),
      'Usuario': `${entry.usuario_nombre || ''} ${entry.usuario_apellidos || ''}`.trim() || entry.numero_empleado || 'N/A',
      'Número Empleado': entry.numero_empleado || 'N/A',
      'Módulo': entry.modulo,
      'Acción': entry.accion,
      'Entidad': entry.entidad,
      'ID Entidad': entry.entidad_id || 'N/A',
      'Detalles': formatDetailsForExport(entry.detalles),
      'IP': entry.ip_address || 'N/A',
    }))

    const headers = Object.keys(csvData[0])
    const csvContent = [
      headers.join(','),
      ...csvData.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row]
          
          const stringValue = String(value || '')
          
          const escapedValue = stringValue.replace(/"/g, '""')
          return `"${escapedValue}"`
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  
  const formatDetailsString = (detalles: any): string => {
    if (!detalles) return '-'
    
    if (typeof detalles === 'object') {
      const entries = Object.entries(detalles)
      
      const filteredEntries = entries.filter(([key]) => {
        const lowerKey = key.toLowerCase()
        
        return !lowerKey.endsWith('_id') && lowerKey !== 'id'
      })
      
  
      const entriesToUse = filteredEntries.length > 0 ? filteredEntries : entries.filter(([key]) => key.toLowerCase() !== 'id')
      
      return entriesToUse.map(([key, value]) => {
        let formattedValue: any = value
        
        if (Array.isArray(value)) {
          formattedValue = value.join(', ')
        } else if (typeof value === 'boolean') {
          formattedValue = value ? 'Sí' : 'No'
        } else if (typeof value === 'number') {
          formattedValue = String(value)
        } else if (typeof value === 'object') {
          formattedValue = JSON.stringify(value)
        }
    
        const fullValue = String(formattedValue)
        
        return `${key}: ${fullValue}`
      }).join(' | ')
    }
    
    return String(detalles)
  }

  const exportToPDF = () => {
    if (filteredData.length === 0) return

    const pdf = new jsPDF('landscape', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const startY = 30
    let yPosition = startY

    pdf.setFontSize(18)
    pdf.setTextColor(40, 40, 40)
    pdf.text('Audit Trail - Registro de Acciones', margin, yPosition)
    
    yPosition += 10
    pdf.setFontSize(12)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Generado el ${new Date().toLocaleDateString()} | Total registros: ${filteredData.length}`, margin, yPosition)
    
    yPosition += 10

    pdf.setFontSize(9)
    pdf.setTextColor(255, 255, 255)
    pdf.setFillColor(59, 130, 246)
    pdf.rect(margin, yPosition, pageWidth - (2 * margin), 8, 'F')
    pdf.text('Fecha/Hora', margin + 2, yPosition + 5)
    pdf.text('Usuario', margin + 30, yPosition + 5)
    pdf.text('Módulo', margin + 60, yPosition + 5)
    pdf.text('Acción', margin + 85, yPosition + 5)
    pdf.text('Entidad', margin + 105, yPosition + 5)
    pdf.text('Detalles', margin + 130, yPosition + 5)
    
    yPosition += 10

  
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(7)
    
    filteredData.forEach((entry, index) => {
    
      if (yPosition > pageHeight - 30) {
        pdf.addPage()
        yPosition = 20
        
  
        pdf.setFillColor(59, 130, 246)
        pdf.rect(margin, yPosition, pageWidth - (2 * margin), 8, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(9)
        pdf.text('Fecha/Hora', margin + 2, yPosition + 5)
        pdf.text('Usuario', margin + 30, yPosition + 5)
        pdf.text('Módulo', margin + 60, yPosition + 5)
        pdf.text('Acción', margin + 85, yPosition + 5)
        pdf.text('Entidad', margin + 105, yPosition + 5)
        pdf.text('Detalles', margin + 130, yPosition + 5)
        
        yPosition += 10
        pdf.setFontSize(7)
        pdf.setTextColor(0, 0, 0)
      }

      if (index % 2 === 0) {
        pdf.setFillColor(249, 250, 251)
        pdf.rect(margin, yPosition - 3, pageWidth - (2 * margin), 4, 'F')
      }

      pdf.text(new Date(entry.created_at).toLocaleString('es-ES'), margin + 2, yPosition)
      
      const usuarioStr = `${entry.usuario_nombre || ''} ${entry.usuario_apellidos || ''}`.trim() || entry.numero_empleado || 'N/A'
      pdf.text(usuarioStr.length > 12 ? usuarioStr.substring(0, 12) : usuarioStr, margin + 30, yPosition)

      pdf.text(entry.modulo, margin + 60, yPosition)
      
      pdf.text(entry.accion, margin + 85, yPosition)
      
      pdf.text(entry.entidad, margin + 105, yPosition)
      
      const detallesStr = formatDetailsString(entry.detalles)
      const maxWidth = pageWidth - margin - 130 - 10 
      const lineHeight = 3.5 
      
    
      const lines = pdf.splitTextToSize(detallesStr, maxWidth)
      
      
      lines.forEach((line: string, lineIndex: number) => {
        if (yPosition > pageHeight - 20) {
          
          pdf.addPage()
          yPosition = 20
          
          pdf.setFillColor(59, 130, 246)
          pdf.rect(margin, yPosition, pageWidth - (2 * margin), 8, 'F')
          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(9)
          pdf.text('Fecha/Hora', margin + 2, yPosition + 5)
          pdf.text('Usuario', margin + 30, yPosition + 5)
          pdf.text('Módulo', margin + 60, yPosition + 5)
          pdf.text('Acción', margin + 85, yPosition + 5)
          pdf.text('Entidad', margin + 105, yPosition + 5)
          pdf.text('Detalles', margin + 130, yPosition + 5)
          
          yPosition += 10
          pdf.setFontSize(7)
          pdf.setTextColor(0, 0, 0)
        }
        
        if (lineIndex === 0) {
          pdf.text(line, margin + 130, yPosition)
        } else {

          yPosition += lineHeight
          pdf.text(line, margin + 130, yPosition)
        }
      })
      
      yPosition += 7 
    })

    pdf.setFontSize(8)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Página 1 de ${Math.ceil(filteredData.length / 40)} | Total registros: ${filteredData.length}`, pageWidth / 2, pageHeight - 10, { align: 'center' })

    pdf.save(`audit_trail_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const mainContentRef = useRef<HTMLDivElement>(null)
  useArrowNavigation(mainContentRef)

  return (
    <div ref={mainContentRef} className="min-h-screen bg-background p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Audit Trail</h1>
            <p className="text-muted-foreground mt-2">Registro de todas las acciones realizadas en el sistema</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={exportToCSV}
              variant="outline"
              className="flex items-center gap-2 export-excel-btn"
              disabled={filteredData.length === 0}
              aria-label="Exportar registro de auditoría a Excel"
            >
              <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
              Exportar Excel
            </Button>
            <Button 
              onClick={exportToPDF}
              variant="outline"
              className="flex items-center gap-2 export-pdf-btn"
              disabled={filteredData.length === 0}
              aria-label="Exportar registro de auditoría a PDF"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" aria-hidden="true" />
              Filtros
            </CardTitle>
            <CardDescription>Filtra el registro de auditoría por módulo, acción o búsqueda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="search"
                    placeholder="Buscar en audit trail..."
                    aria-label="Buscar en registro de auditoría"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(0)
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modulo">Módulo</Label>
                <Select value={filterModulo} onValueChange={(value) => {
                  setFilterModulo(value)
                  setCurrentPage(0)
                }}>
                  <SelectTrigger id="modulo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los módulos</SelectItem>
                    {modulos.map(modulo => (
                      <SelectItem key={modulo} value={modulo}>{modulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accion">Acción</Label>
                <Select value={filterAccion} onValueChange={(value) => {
                  setFilterAccion(value)
                  setCurrentPage(0)
                }}>
                  <SelectTrigger id="accion">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las acciones</SelectItem>
                    {acciones.map(accion => (
                      <SelectItem key={accion} value={accion}>{accion}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resultados */}
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {paginatedData.length} de {filteredData.length} registros
            </div>
          </CardContent>
        </Card>

        {/* Tabla de resultados */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : paginatedData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No se encontraron registros</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto max-w-full">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px] font-semibold text-foreground">Fecha y Hora</TableHead>
                        <TableHead className="w-[160px] font-semibold text-foreground">Usuario</TableHead>
                        <TableHead className="w-[120px] font-semibold text-foreground">Módulo</TableHead>
                        <TableHead className="w-[100px] font-semibold text-foreground">Acción</TableHead>
                        <TableHead className="w-[120px] font-semibold text-foreground">Entidad</TableHead>
                        <TableHead className="w-[300px] max-w-[300px] font-semibold text-foreground">Detalles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((entry, index) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium text-foreground">
                            {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-semibold text-foreground">
                                {entry.usuario_nombre && entry.usuario_apellidos
                                  ? `${entry.usuario_nombre} ${entry.usuario_apellidos}`
                                  : 'Usuario Desconocido'}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {entry.numero_empleado || 'N/A'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.modulo}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionColor(entry.accion) as any} className="font-medium">
                              {entry.accion}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-foreground">{entry.entidad}</TableCell>
                          <TableCell className="max-w-[300px] bg-muted/30 p-2 rounded-md">
                            {formatDetails(entry.detalles)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      Página {currentPage + 1} de {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage === totalPages - 1}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

