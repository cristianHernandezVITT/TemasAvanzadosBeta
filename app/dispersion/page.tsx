"use client"

import { useState, useRef, useEffect } from "react"
import { useArrowNavigation } from "@/hooks/useArrowNavigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDispersionData } from "@/hooks/useDispersionData"
import { useAuditTrail } from "@/hooks/useAuditTrail"
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { FileSpreadsheet, FileText } from 'lucide-react'

const VARIABLES = {
  promedio: { label: "Promedio General", key: "promedio" },
  porcentaje_asistencia: { label: "Porcentaje de Asistencia", key: "porcentaje_asistencia" },
  total_calificaciones: { label: "Total de Calificaciones", key: "total_calificaciones" },
  factores_riesgo: { label: "Factores de Riesgo", key: "factores_riesgo" }
} as const

type VariableKey = keyof typeof VARIABLES

export default function DispersionPage() {
  const [formData, setFormData] = useState({
    varX: "porcentaje_asistencia" as VariableKey,
    varY: "promedio" as VariableKey,
    semestre: "todos"
  })
  
  const { data, loading, error } = useDispersionData(formData.semestre === "todos" ? undefined : formData.semestre)
  const chartRef = useRef<HTMLDivElement>(null)
  const { createAuditEntry } = useAuditTrail()
  
  // Refs para las funciones de exportar (para usar valores actuales en event listeners)
  const exportFunctionsRef = useRef({
    exportPDF: () => {},
    exportCSV: () => {}
  })

  const handleGenerarGrafico = () => {
    if (data.length === 0) {
      alert("No hay datos para generar el gráfico")
      return
    }
    alert("Gráfico generado exitosamente")
  }

  const exportToCSV = async () => {
    if (data.length === 0) {
      alert("No hay datos para exportar")
      return
    }

    const csvData = data.map(item => ({
      Matricula: item.matricula,
      Nombre: item.nombre,
      Carrera: item.carrera,
      Semestre: item.semestre,
      [VARIABLES[formData.varX].label]: Number(item[VARIABLES[formData.varX].key as keyof typeof item]).toFixed(2),
      [VARIABLES[formData.varY].label]: Number(item[VARIABLES[formData.varY].key as keyof typeof item]).toFixed(2),
      'Promedio General': item.promedio.toFixed(2),
      'Porcentaje Asistencia': item.porcentaje_asistencia.toFixed(1) + '%',
      'Factores de Riesgo': item.factores_riesgo,
      'Total Calificaciones': item.total_calificaciones
    }))

    const headers = Object.keys(csvData[0])
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row]
          
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `datos_dispersion_${formData.varX}_vs_${formData.varY}_semestre_${formData.semestre}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    
    await createAuditEntry({
      modulo: 'Dispersión',
      accion: 'exportar',
      entidad: 'CSV',
      detalles: {
        variable_x: formData.varX,
        variable_y: formData.varY,
        semestre: formData.semestre,
        registros: data.length
      }
    })
  }

  const exportToPDF = async () => {
    if (!chartRef.current || data.length === 0) {
      alert("No hay datos para exportar")
      return
    }

    try {
      
      const pdf = new jsPDF('landscape', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      
      pdf.setFontSize(16)
      pdf.setTextColor(40, 40, 40)
      pdf.text(`Diagrama de Dispersión - ${VARIABLES[formData.varX].label} vs ${VARIABLES[formData.varY].label}`, 20, 20)
      
      pdf.setFontSize(12)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Semestre: ${formData.semestre === 'todos' ? 'Todos' : formData.semestre} | Total estudiantes: ${data.length}`, 20, 30)

      
      const chartImage = await toPng(chartRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      })

      
      pdf.addImage(chartImage, 'PNG', 20, 45, pageWidth - 40, 100)

      
      let yPosition = 160

      
      pdf.setFillColor(59, 130, 246) 
      pdf.rect(20, yPosition, pageWidth - 40, 10, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(10)
      pdf.text('Resumen Estadístico', 22, yPosition + 7)

      yPosition += 15

    
      const varXValues = data.map(item => Number(item[VARIABLES[formData.varX].key as keyof typeof item]))
      const varYValues = data.map(item => Number(item[VARIABLES[formData.varY].key as keyof typeof item]))
      
      const stats = {
        'Total Estudiantes': data.length.toString(),
        'Promedio General': `${(data.reduce((acc, item) => acc + item.promedio, 0) / data.length).toFixed(2)}`,
        'Asistencia Promedio': `${(data.reduce((acc, item) => acc + item.porcentaje_asistencia, 0) / data.length).toFixed(1)}%`,
        'Factores Riesgo Promedio': `${(data.reduce((acc, item) => acc + item.factores_riesgo, 0) / data.length).toFixed(1)}`,
        [`${VARIABLES[formData.varX].label} Promedio`]: `${(varXValues.reduce((acc, val) => acc + val, 0) / varXValues.length).toFixed(2)}`,
        [`${VARIABLES[formData.varY].label} Promedio`]: `${(varYValues.reduce((acc, val) => acc + val, 0) / varYValues.length).toFixed(2)}`
      }

      pdf.setTextColor(0, 0, 0)
      Object.entries(stats).forEach(([key, value], index) => {
        const x = 20 + (index % 2) * ((pageWidth - 40) / 2)
        const y = yPosition + Math.floor(index / 2) * 8
        
        pdf.setFontSize(9)
        pdf.text(`${key}:`, x + 2, y + 6)
        pdf.setFont("helvetica", 'bold')
        pdf.text(value, x + 40, y + 6)
        pdf.setFont("helvetica", 'normal')
      })

      yPosition += 25

    
      pdf.setFillColor(243, 244, 246) 
      pdf.rect(20, yPosition, pageWidth - 40, 8, 'F')
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(8)
      pdf.text('Matrícula', 22, yPosition + 5)
      pdf.text('Nombre', 50, yPosition + 5)
      pdf.text(VARIABLES[formData.varX].label, 100, yPosition + 5)
      pdf.text(VARIABLES[formData.varY].label, 130, yPosition + 5)
      pdf.text('Promedio', 160, yPosition + 5)
      pdf.text('Asistencia', 185, yPosition + 5)
      pdf.text('Fact. Riesgo', 215, yPosition + 5)

      yPosition += 10

      data.forEach((item, index) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage()
          yPosition = 20
          
          pdf.setFillColor(243, 244, 246)
          pdf.rect(20, yPosition, pageWidth - 40, 8, 'F')
          pdf.setTextColor(0, 0, 0)
          pdf.setFontSize(8)
          pdf.text('Matrícula', 22, yPosition + 5)
          pdf.text('Nombre', 50, yPosition + 5)
          pdf.text(VARIABLES[formData.varX].label, 100, yPosition + 5)
          pdf.text(VARIABLES[formData.varY].label, 130, yPosition + 5)
          pdf.text('Promedio', 160, yPosition + 5)
          pdf.text('Asistencia', 185, yPosition + 5)
          pdf.text('Fact. Riesgo', 215, yPosition + 5)
          yPosition += 10
        }

        if (index % 2 === 0) {
          pdf.setFillColor(249, 250, 251)
          pdf.rect(20, yPosition, pageWidth - 40, 6, 'F')
        }

        const varXValue = Number(item[VARIABLES[formData.varX].key as keyof typeof item])
        const varYValue = Number(item[VARIABLES[formData.varY].key as keyof typeof item])

        pdf.setTextColor(0, 0, 0)
        pdf.text(item.matricula, 22, yPosition + 4)
        pdf.text(item.nombre.length > 15 ? item.nombre.substring(0, 15) + '...' : item.nombre, 50, yPosition + 4)
        pdf.text(varXValue.toFixed(2), 100, yPosition + 4)
        pdf.text(varYValue.toFixed(2), 130, yPosition + 4)
        pdf.text(item.promedio.toFixed(2), 160, yPosition + 4)
        pdf.text(item.porcentaje_asistencia.toFixed(1) + '%', 185, yPosition + 4)
        pdf.text(item.factores_riesgo.toString(), 215, yPosition + 4)

        yPosition += 6
      })

      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Generado el ${new Date().toLocaleDateString()} - Sistema de Análisis Académico`, 20, pageHeight - 10)

      
      pdf.save(`reporte_dispersion_${formData.varX}_vs_${formData.varY}_semestre_${formData.semestre}.pdf`)
      
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      alert("Error al exportar el PDF")
    }
  }


  const handleExportPDF = async () => {
    await exportToPDF()
    
    await createAuditEntry({
      modulo: 'Dispersión',
      accion: 'exportar',
      entidad: 'PDF',
      detalles: {
        variable_x: formData.varX,
        variable_y: formData.varY,
        semestre: formData.semestre,
        registros: data.length,
        formato: 'PDF'
      }
    })
  }

  
  const chartData = data.map(item => ({
    ...item,
    name: `Est. ${item.matricula}`,
    [VARIABLES[formData.varX].key]: Number(item[VARIABLES[formData.varX].key as keyof typeof item]),
    [VARIABLES[formData.varY].key]: Number(item[VARIABLES[formData.varY].key as keyof typeof item])
  }))

  
  console.log('Total de estudiantes en chartData:', chartData.length)
  console.log('Primeros 3 estudiantes:', chartData.slice(0, 3))

  const mainContentRef = useRef<HTMLDivElement>(null)
  useArrowNavigation(mainContentRef)

  // Actualizar refs de funciones de exportar
  useEffect(() => {
    exportFunctionsRef.current = {
      exportPDF: handleExportPDF,
      exportCSV: exportToCSV
    }
  })

  // Escuchar eventos de voz
  useEffect(() => {
    // Abrir select de Variable X
    const handleOpenVarX = () => {
      const trigger = document.getElementById('varX')
      if (trigger) trigger.click()
    }
    // Seleccionar Variable X
    const handleVarX = (e: CustomEvent) => {
      const value = e.detail?.value
      if (value) {
        // Primero abrir el select
        const trigger = document.getElementById('varX')
        if (trigger) trigger.click()
        // Luego seleccionar el valor
        setTimeout(() => {
          setFormData(prev => ({ ...prev, varX: value }))
        }, 100)
      }
    }
    // Abrir select de Variable Y
    const handleOpenVarY = () => {
      const trigger = document.getElementById('varY')
      if (trigger) trigger.click()
    }
    // Seleccionar Variable Y
    const handleVarY = (e: CustomEvent) => {
      const value = e.detail?.value
      if (value) {
        const trigger = document.getElementById('varY')
        if (trigger) trigger.click()
        setTimeout(() => {
          setFormData(prev => ({ ...prev, varY: value }))
        }, 100)
      }
    }
    // Abrir select de Semestre
    const handleOpenSemestre = () => {
      const trigger = document.getElementById('semestre')
      if (trigger) trigger.click()
    }
    // Seleccionar Semestre
    const handleSemestre = (e: CustomEvent) => {
      const value = e.detail?.value
      if (value) {
        const trigger = document.getElementById('semestre')
        if (trigger) trigger.click()
        setTimeout(() => {
          setFormData(prev => ({ ...prev, semestre: value }))
        }, 100)
      }
    }
    const handleGenerar = () => {
      // Buscar y hacer click en el botón de generar
      const btns = document.querySelectorAll('button')
      for (const btn of btns) {
        if (btn.textContent?.includes('Generar')) {
          btn.click()
          break
        }
      }
    }
    const handleExportPdf = () => {
      console.log("Exportando PDF dispersión por voz...")
      exportFunctionsRef.current.exportPDF()
    }
    const handleExportExcel = () => {
      console.log("Exportando Excel dispersión por voz...")
      exportFunctionsRef.current.exportCSV()
    }

    window.addEventListener("voice-dispersion-open-var-x", handleOpenVarX)
    window.addEventListener("voice-dispersion-open-var-y", handleOpenVarY)
    window.addEventListener("voice-dispersion-open-semestre", handleOpenSemestre)
    window.addEventListener("voice-dispersion-var-x", handleVarX as EventListener)
    window.addEventListener("voice-dispersion-var-y", handleVarY as EventListener)
    window.addEventListener("voice-dispersion-semestre", handleSemestre as EventListener)
    window.addEventListener("voice-dispersion-generar", handleGenerar)
    window.addEventListener("voice-dispersion-export-pdf", handleExportPdf)
    window.addEventListener("voice-dispersion-export-excel", handleExportExcel)

    return () => {
      window.removeEventListener("voice-dispersion-open-var-x", handleOpenVarX)
      window.removeEventListener("voice-dispersion-open-var-y", handleOpenVarY)
      window.removeEventListener("voice-dispersion-open-semestre", handleOpenSemestre)
      window.removeEventListener("voice-dispersion-var-x", handleVarX as EventListener)
      window.removeEventListener("voice-dispersion-var-y", handleVarY as EventListener)
      window.removeEventListener("voice-dispersion-semestre", handleSemestre as EventListener)
      window.removeEventListener("voice-dispersion-generar", handleGenerar)
      window.removeEventListener("voice-dispersion-export-pdf", handleExportPdf)
      window.removeEventListener("voice-dispersion-export-excel", handleExportExcel)
    }
  }, [])

  return (
    <div ref={mainContentRef} className="min-h-screen bg-background p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Diagrama de Dispersión</h1>
          <p className="text-muted-foreground mt-2">Analiza la relación entre diferentes variables académicas</p>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Formulario de Configuración */}
          <Card>
            <CardHeader>
              <CardTitle>Configurar Diagrama</CardTitle>
              <CardDescription>Selecciona las variables para analizar su relación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="varX">Variable X</Label>
                    <Select
                      value={formData.varX}
                      onValueChange={(value: VariableKey) => setFormData({ ...formData, varX: value })}
                    >
                      <SelectTrigger id="varX">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(VARIABLES).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="varY">Variable Y</Label>
                    <Select
                      value={formData.varY}
                      onValueChange={(value: VariableKey) => setFormData({ ...formData, varY: value })}
                    >
                      <SelectTrigger id="varY">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(VARIABLES).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semestre">Semestre</Label>
                  <Select
                    value={formData.semestre}
                    onValueChange={(value) => setFormData({ ...formData, semestre: value })}
                  >
                    <SelectTrigger id="semestre">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los semestres</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <SelectItem key={sem} value={sem.toString()}>
                          Semestre {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4">
                  <Button type="button" onClick={handleGenerarGrafico} disabled={loading}>
                    {loading ? "Cargando..." : "Generar Gráfico"}
                  </Button>
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleExportPDF} 
                    disabled={data.length === 0}
                    className="flex-1 items-center gap-2 export-pdf-btn"
                  >
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    Exportar PDF
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={exportToCSV} 
                    disabled={data.length === 0}
                    className="flex-1 items-center gap-2 export-excel-btn"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Exportar CSV
                  </Button>
                </div>

                {error && (
                  <div className="text-destructive bg-destructive/10 p-3 rounded-md">
                    Error: {error}
                  </div>
                )}

                {data.length > 0 && (
                  <div className="space-y-2">
       
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Dispersión */}
          <Card>
            <CardHeader>
              <CardTitle>Visualización</CardTitle>
              <CardDescription>
                Relación entre {VARIABLES[formData.varX].label} y {VARIABLES[formData.varY].label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.length > 0 ? (
                <div ref={chartRef} className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      data={chartData}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid stroke="var(--color-border)" />
                      <XAxis 
                        type="number"
                        dataKey={VARIABLES[formData.varX].key}
                        name={VARIABLES[formData.varX].label}
                        label={{ value: VARIABLES[formData.varX].label, position: 'insideBottom', offset: -5, fill: 'var(--color-muted-foreground)' }}
                        tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--color-border)' }}
                      />
                      <YAxis 
                        type="number"
                        dataKey={VARIABLES[formData.varY].key}
                        name={VARIABLES[formData.varY].label}
                        label={{ value: VARIABLES[formData.varY].label, angle: -90, position: 'insideLeft', fill: 'var(--color-muted-foreground)' }}
                        tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--color-border)' }}
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-card p-4 border border-border rounded-lg shadow-lg">
                                <p className="font-semibold text-foreground">{data.nombre}</p>
                                <p className="text-sm text-muted-foreground">Matrícula: {data.matricula}</p>
                                <p className="text-sm text-muted-foreground">Carrera: {data.carrera}</p>
                                <p className="text-sm text-muted-foreground">Semestre: {data.semestre}</p>
                                <div className="mt-2 pt-2 border-t border-border">
                                  <p className="text-sm">
                                    <span className="font-medium">{VARIABLES[formData.varX].label}:</span>{" "}
                                    {typeof data[VARIABLES[formData.varX].key] === 'number' 
                                      ? data[VARIABLES[formData.varX].key].toFixed(2)
                                      : data[VARIABLES[formData.varX].key]
                                    }
                                  </p>
                                  <p className="text-sm">
                                    <span className="font-medium">{VARIABLES[formData.varY].label}:</span>{" "}
                                    {typeof data[VARIABLES[formData.varY].key] === 'number' 
                                      ? data[VARIABLES[formData.varY].key].toFixed(2)
                                      : data[VARIABLES[formData.varY].key]
                                    }
                                  </p>
                                  <p className="text-sm">
                                    <span className="font-medium">Promedio:</span> {data.promedio.toFixed(2)}
                                  </p>
                                  <p className="text-sm">
                                    <span className="font-medium">Asistencia:</span> {data.porcentaje_asistencia.toFixed(1)}%
                                  </p>
                                  <p className="text-sm">
                                    <span className="font-medium">Factores de Riesgo:</span> {data.factores_riesgo}
                                  </p>
                                  <p className="text-sm">
                                    <span className="font-medium">Total Calificaciones:</span> {data.total_calificaciones}
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Scatter 
                        name="Estudiantes" 
                        data={chartData} 
                        fill="var(--color-chart-1)"
                      >
                        {chartData.map((entry, index) => {
                          // Usar diferentes colores según el tema
                          const getFillColor = () => {
                            const root = document.documentElement;
                            const isGrayscale = root.classList.contains('grayscale');
                            const isColorblind = root.classList.contains('colorblind');
                            const isDaltonismoGeneral = root.classList.contains('daltonismo-general');
                            
                            if (isGrayscale) {
                              // En grayscale, usar diferentes tonos de gris según el promedio
                              return entry.promedio >= 70 ? 'oklch(0.3 0 0)' : entry.promedio >= 60 ? 'oklch(0.5 0 0)' : 'oklch(0.7 0 0)';
                            }
                            
                            if (isDaltonismoGeneral) {
                              // Paleta Daltonismo General: azul profundo, verde oliva, naranja cálido
                              return entry.promedio >= 70 ? '#005B96' : entry.promedio >= 60 ? '#6B8E23' : '#F39C12';
                            }
                            
                            if (isColorblind) {
                              // En colorblind, usar paleta Okabe-Ito: azul fuerte, naranja, verde azulado
                              return entry.promedio >= 70 ? '#0072B2' : entry.promedio >= 60 ? '#D55E00' : '#009E73';
                            }
                            
                            // Colores originales para otros temas
                            return entry.promedio >= 70 ? '#10b981' : entry.promedio >= 60 ? '#f59e0b' : '#ef4444';
                          };
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getFillColor()} 
                            />
                          );
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground text-center">
                    {loading ? "Cargando datos..." : "Selecciona variables y genera el gráfico"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}