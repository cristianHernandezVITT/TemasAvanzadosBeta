"use client"

import { useEffect, useMemo, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useArrowNavigation } from '@/hooks/useArrowNavigation'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { useAuditTrail } from '@/hooks/useAuditTrail'

const FACTOR_KEYS = [
  { key: 'factor_economico', label: 'Económico' },
  { key: 'factor_academico', label: 'Académico' },
  { key: 'factor_psicosocial', label: 'Psicosocial' },
  { key: 'factor_institucional', label: 'Institucional' },
  { key: 'factor_contextual', label: 'Contextual' },
]

export default function ParetoPage() {
  const [carreras, setCarreras] = useState<string[]>([])
  const [carrera, setCarrera] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{ factor: string; count: number }[]>([])
  const chartRef = useRef<HTMLDivElement>(null)
  const { createAuditEntry } = useAuditTrail()

  // Cargar carreras disponibles (distinct)
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('estudiantes')
        .select('carrera', { count: 'exact' })
        .order('carrera', { ascending: true })

      if (error) return console.error(error)
      const distinct = Array.from(new Set((data || []).map((r: any) => r.carrera))).filter(Boolean)
      setCarreras(distinct as string[])
      if (distinct.length) setCarrera(distinct[0])
    }

    load()
  }, [])

  // Cargar datos cuando cambia la carrera
  useEffect(() => {
    if (!carrera) return

    const load = async () => {
      try {
        setLoading(true)

        // Traer estudiantes de la carrera y sus ids
        const { data: estudiantes, error: e1 } = await supabase
          .from('estudiantes')
          .select('id')
          .eq('carrera', carrera)

        if (e1) throw e1

        const ids = (estudiantes || []).map((r: any) => r.id)

        if (!ids.length) {
          setData(FACTOR_KEYS.map(f => ({ factor: f.label, count: 0 })))
          return
        }

        // Obtener factores de riesgo para esos estudiantes
        const { data: factores, error: e2 } = await supabase
          .from('factores_riesgo')
          .select('*')
          .in('estudiante_id', ids)

        if (e2) throw e2

        // Contar estudiantes afectados por factor (asegurando unicidad por estudiante)
        const byStudent: Record<string, any> = {}
        ;(factores || []).forEach((f: any) => {
          byStudent[f.estudiante_id] = f
        })

        const counts = FACTOR_KEYS.map(fk => {
          let cnt = 0
          Object.values(byStudent).forEach((r: any) => {
            if (r && r[fk.key]) cnt += 1
          })
          return { factor: fk.label, count: cnt }
        })

        // ordenar descendente para Pareto
        counts.sort((a, b) => b.count - a.count)
        
        // Calcular porcentaje acumulativo para la curva de Pareto
        const total = counts.reduce((sum, item) => sum + item.count, 0)
        let cumulative = 0
        const dataWithCumulative = counts.map(item => {
          cumulative += item.count
          const cumulativePercent = total > 0 ? (cumulative / total) * 100 : 0
          return {
            ...item,
            cumulative_percent: Math.round(cumulativePercent * 100) / 100
          }
        })
        
        setData(dataWithCumulative)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [carrera])

  const csvContent = useMemo(() => {
    if (!data?.length) return ''
    const title = ['Diagrama de Pareto - Factores de Riesgo']
    const filter = [`Carrera: ${carrera}`]
    const blank = ['']
    const header = ['factor', 'count', 'cumulative_percent']
    const rows = data.map(d => [d.factor, String(d.count), String((d as any).cumulative_percent ?? '')])
    return [title, filter, blank, header, ...rows]
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')
  }, [data, carrera])

  const downloadCsv = async () => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pareto_${carrera || 'all'}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    // Registrar en audit trail
    await createAuditEntry({
      modulo: 'Pareto',
      accion: 'exportar',
      entidad: 'CSV',
      detalles: { carrera: carrera, registros: data.length }
    })
  }

  const downloadPDF = async () => {
    if (!chartRef.current) {
      alert("Error: No se pudo encontrar el gráfico para exportar.")
      return
    }

    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Capturar imagen del gráfico
      const imgData = await toPng(chartRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: '#ffffff'
      })

      // Agregar título
      pdf.setFontSize(18)
      pdf.setTextColor(37, 99, 235)
      pdf.text('Diagrama de Pareto - Factores de Riesgo', pageWidth / 2, 20, { align: 'center' })
      
      pdf.setFontSize(12)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Carrera: ${carrera}`, pageWidth / 2, 28, { align: 'center' })

      // Agregar gráfico
      const imgWidth = pageWidth - 40
      const imgHeight = (pageWidth - 40) * 0.6
      pdf.addImage(imgData, 'PNG', 20, 35, imgWidth, imgHeight)

      // Tabla de datos debajo del gráfico
      let tableY = 35 + imgHeight + 10
      pdf.setFontSize(10)
      pdf.setTextColor(37, 99, 235)
      pdf.text('Datos del Análisis', 20, tableY)

      // Encabezado de la tabla
      pdf.setFontSize(8)
      pdf.setFillColor(37, 99, 235)
      pdf.rect(20, tableY + 2, pageWidth - 40, 5, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.text('Factor', 22, tableY + 5)
      pdf.text('Frecuencia', 80, tableY + 5)
      pdf.text('Porcentaje Acumulado (%)', 140, tableY + 5)

      pdf.setTextColor(0, 0, 0)
      tableY += 10
      data.forEach((item, index) => {
        if (tableY > pageHeight - 20) {
          pdf.addPage()
          tableY = 20
        }
        
        pdf.text(item.factor, 22, tableY + 3)
        pdf.text(item.count.toString(), 80, tableY + 3)
        pdf.text(((item as any).cumulative_percent ?? 0).toFixed(2) + '%', 140, tableY + 3)
        
        // Alternar color de fondo
        if (index % 2 === 0) {
          pdf.setFillColor(243, 244, 246)
          pdf.rect(20, tableY, pageWidth - 40, 4, 'F')
        }
        
        tableY += 4
      })

      // Pie de página
      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Generado el ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 5, { align: 'center' })

      // Guardar PDF
      pdf.save(`pareto_${carrera || 'all'}.pdf`)
      
      // Registrar en audit trail
      await createAuditEntry({
        modulo: 'Pareto',
        accion: 'exportar',
        entidad: 'PDF',
        detalles: { carrera: carrera, formato: 'PDF', registros: data.length }
      })
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      alert('Error al exportar el PDF')
    }
  }

  const mainContentRef = useRef<HTMLDivElement>(null)
  useArrowNavigation(mainContentRef)

  // Escuchar eventos de voz para exportar
  useEffect(() => {
    const handleExportExcel = () => {
      console.log("Evento voz: Exportar CSV en Pareto");
      if (data && data.length) {
        downloadCsv();
      }
    };
    const handleExportPDF = () => {
      console.log("Evento voz: Exportar PDF en Pareto");
      if (data && data.length) {
        downloadPDF();
      }
    };

    window.addEventListener("voice-export-excel", handleExportExcel);
    window.addEventListener("voice-export-pdf", handleExportPDF);

    return () => {
      window.removeEventListener("voice-export-excel", handleExportExcel);
      window.removeEventListener("voice-export-pdf", handleExportPDF);
    };
  }, [data, carrera]);

  return (
    <div ref={mainContentRef} className="min-h-screen bg-background p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Título */}
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Diagrama de Pareto</h1>
          <p className="text-muted-foreground mt-2">Análisis de factores de riesgo por carrera</p>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Carrera:</label>
            <select
              value={carrera}
              onChange={e => setCarrera(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {carreras.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={downloadCsv}
              variant="outline"
              className="flex items-center gap-2 export-excel-btn"
              disabled={!data || !data.length}
              aria-label="Exportar diagrama de Pareto a CSV"
            >
              <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
              Exportar CSV
            </Button>
            <Button 
              onClick={downloadPDF}
              variant="outline"
              className="flex items-center gap-2 export-pdf-btn"
              disabled={!data || !data.length}
              aria-label="Exportar diagrama de Pareto a PDF"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="bg-card rounded shadow p-6 border border-border">
          {loading ? (
            <div>Cargando...</div>
          ) : (
            <div ref={chartRef} style={{ width: '100%', height: 420 }}>
              <ResponsiveContainer>
                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis 
                    dataKey="factor" 
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    label={{ value: 'Frecuencia', angle: -90, position: 'insideLeft', fill: 'var(--color-muted-foreground)' }}
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    domain={[0, 100]} 
                    label={{ value: 'Porcentaje Acumulado (%)', angle: 90, position: 'insideRight', fill: 'var(--color-muted-foreground)' }}
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--color-popover)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-popover-foreground)',
                    }}
                    labelStyle={{ color: 'var(--color-popover-foreground)' }}
                  />
                  <Legend 
                    wrapperStyle={{ color: 'var(--color-foreground)' }}
                  />
                  <Bar yAxisId="left" dataKey="count" fill="var(--color-chart-1)" name="Frecuencia">
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-chart-1)' : 'var(--color-chart-2)'} />
                    ))}
                  </Bar>
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="cumulative_percent" 
                    stroke="var(--color-chart-3)" 
                    strokeWidth={2}
                    name="% Acumulado"
                    dot={{ fill: 'var(--color-chart-3)', r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}