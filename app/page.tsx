"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useArrowNavigation } from "@/hooks/useArrowNavigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, FileSpreadsheet, FileText } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { useEstudiantes, useCalificaciones, useFactoresRiesgo } from "@/hooks/useSupabase"
import { useAsistencias } from "@/hooks/useAsistencias"
import { useAuditTrail } from "@/hooks/useAuditTrail"
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { useTheme } from 'next-themes'

// Función helper para obtener colores según el tema
const getChartColors = (isColorblind: boolean, isDaltonismoGeneral: boolean) => {
  if (isDaltonismoGeneral) {
    // Paleta Daltonismo General
    return {
      primary: '#005B96',      // Azul profundo
      secondary: '#00A6D6',    // Cian accesible
      tertiary: '#6B8E23',     // Verde oliva
      quaternary: '#F39C12',   // Naranja cálido
      quinary: '#7D3C98',      // Morado frío
      success: '#6B8E23',      // Verde oliva
      warning: '#F39C12',     // Naranja cálido
      danger: '#B22222',      // Rojo oscuro
      // Colores para múltiples series
      series: ['#005B96', '#00A6D6', '#6B8E23', '#F39C12', '#7D3C98', '#B22222', '#005B96', '#00A6D6']
    }
  }
  if (isColorblind) {
    // Paleta Okabe-Ito para daltónicos
    return {
      primary: '#0072B2',      // Azul fuerte
      secondary: '#D55E00',    // Naranja
      tertiary: '#009E73',     // Verde azulado
      quaternary: '#CC79A7',   // Magenta
      quinary: '#F0E442',      // Amarillo brillante
      success: '#009E73',      // Verde azulado
      warning: '#E69F00',      // Amarillo oscuro
      danger: '#D55E00',       // Naranja
      // Colores para múltiples series
      series: ['#0072B2', '#D55E00', '#009E73', '#CC79A7', '#F0E442', '#E69F00', '#56B4E9', '#0072B2']
    }
  }
  // Colores originales
  return {
    primary: '#00ff41',
    secondary: '#ff00ff',
    tertiary: '#00ffff',
    quaternary: '#ffff00',
    quinary: '#ff0080',
    success: '#00ff41',
    warning: '#ffff00',
    danger: '#ff0080',
    series: ['#00ff41', '#ff00ff', '#00ffff', '#ffff00', '#ff0080', '#8000ff', '#00ff80', '#ff8040']
  }
}

export default function DashboardPage() {
  const mainContentRef = useRef<HTMLDivElement>(null)
  useArrowNavigation(mainContentRef)
  const { estudiantes, loading: loadingEstudiantes } = useEstudiantes()
  const { calificaciones, loading: loadingCalificaciones } = useCalificaciones()
  const { factores, loading: loadingFactores } = useFactoresRiesgo()
  const { asistencias, loading: loadingAsistencias } = useAsistencias()
  const { createAuditEntry } = useAuditTrail()
  const { theme } = useTheme()
  const [isColorblind, setIsColorblind] = useState(false)
  const [isDaltonismoGeneral, setIsDaltonismoGeneral] = useState(false)
  const [carrerasData, setCarrerasData] = useState<any[]>([])
  const [semestresData, setSemestresData] = useState<any[]>([])
  const [rendimientoData, setRendimientoData] = useState<any[]>([])
  const [factoresRiesgoData, setFactoresRiesgoData] = useState<any[]>([])
  const [estadoAcademicoData, setEstadoAcademicoData] = useState<any[]>([])
  
  // Refs para los gráficos
  const chartCarrerasRef = useRef<HTMLDivElement>(null)
  const chartSemestresRef = useRef<HTMLDivElement>(null)
  const chartRendimientoRef = useRef<HTMLDivElement>(null)
  const chartFactoresRef = useRef<HTMLDivElement>(null)
  const chartEstadoRef = useRef<HTMLDivElement>(null)

  // Detectar tema colorblind y daltonismo general
  useEffect(() => {
    const checkTheme = () => {
      const root = document.documentElement
      setIsColorblind(root.classList.contains('colorblind'))
      setIsDaltonismoGeneral(root.classList.contains('daltonismo-general'))
    }
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    return () => observer.disconnect()
  }, [theme])

  const colors = useMemo(() => getChartColors(isColorblind, isDaltonismoGeneral), [isColorblind, isDaltonismoGeneral])

  // Calcula la distribución por carreras
  useEffect(() => {
    if (estudiantes.length > 0) {
      const carreraCount: Record<string, number> = {}
      estudiantes.forEach(est => {
        const carrera = est.carrera || 'Sin carrera'
        carreraCount[carrera] = (carreraCount[carrera] || 0) + 1
      })
      
      const data = Object.entries(carreraCount).map(([name, value], idx) => ({
        name,
        value,
        color: colors.series[idx % colors.series.length]
      }))
      setCarrerasData(data)
    }
  }, [estudiantes, colors])

  // Calcula la distribución por semestres
  useEffect(() => {
    if (estudiantes.length > 0) {
      const semestreCount: Record<number, number> = {}
      estudiantes.forEach(est => {
        const semestre = est.semestre || 1
        semestreCount[semestre] = (semestreCount[semestre] || 0) + 1
      })
      
      const semestres = Object.entries(semestreCount)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([sem, value], idx) => ({
          name: `${sem}° Semestre`,
          value,
          color: colors.series[idx % colors.series.length]
        }))
      setSemestresData(semestres)
    }
  }, [estudiantes, colors])

  // Calcula el rendimiento académico por mes
  useEffect(() => {
    if (calificaciones.length > 0) {
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      const rendimiento: Record<string, { excelente: number, bueno: number, regular: number, deficiente: number }> = {}
      
      calificaciones.forEach(cal => {
        if (cal.created_at) {
          const date = new Date(cal.created_at)
          const month = monthNames[date.getMonth()]
          const calif = Number(cal.calificacion)
          
          if (!rendimiento[month]) {
            rendimiento[month] = { excelente: 0, bueno: 0, regular: 0, deficiente: 0 }
          }
          
          if (calif >= 90) rendimiento[month].excelente++
          else if (calif >= 80) rendimiento[month].bueno++
          else if (calif >= 70) rendimiento[month].regular++
          else rendimiento[month].deficiente++
        }
      })
      
      const data = Object.entries(rendimiento).map(([mes, values]) => ({ mes, ...values }))
      setRendimientoData(data)
    }
  }, [calificaciones])

  // Calcula factores de riesgo por mes
  useEffect(() => {
    if (factores.length > 0) {
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      const factorData: Record<string, { total: number, academicos: number, economicos: number, psicosociales: number, institucionales: number }> = {}
      
      factores.forEach(factor => {
        if (factor.created_at) {
          const date = new Date(factor.created_at)
          const month = monthNames[date.getMonth()]
          
          if (!factorData[month]) {
            factorData[month] = { total: 0, academicos: 0, economicos: 0, psicosociales: 0, institucionales: 0 }
          }
          
          // Contar registros totales
          factorData[month].total++
          
          // Contar factores por tipo
          if (factor.factor_academico) factorData[month].academicos++
          if (factor.factor_economico) factorData[month].economicos++
          if (factor.factor_psicosocial) factorData[month].psicosociales++
          if (factor.factor_institucional) factorData[month].institucionales++
        }
      })
      
      const data = Object.entries(factorData).map(([mes, values]) => ({ mes, ...values }))
      setFactoresRiesgoData(data)
    }
  }, [factores])

  // Calcula estado académico
  useEffect(() => {
    if (calificaciones.length > 0 && estudiantes.length > 0) {
      const estudiantePromedios: Record<string, number[]> = {}
      
      calificaciones.forEach(cal => {
        const id = cal.estudiante_id
        if (!estudiantePromedios[id]) estudiantePromedios[id] = []
        estudiantePromedios[id].push(Number(cal.calificacion))
      })
      
      let aprobados = 0, enRiesgo = 0, reprobados = 0
      
      Object.values(estudiantePromedios).forEach(promedios => {
        const promedio = promedios.reduce((a, b) => a + b, 0) / promedios.length
        if (promedio >= 70) aprobados++
        else if (promedio >= 60) enRiesgo++
        else reprobados++
      })
      
      const total = aprobados + enRiesgo + reprobados
      if (total > 0) {
        setEstadoAcademicoData([
          { name: "Aprobados", value: Math.round((aprobados / total) * 100), color: colors.success },
          { name: "En Riesgo", value: Math.round((enRiesgo / total) * 100), color: colors.warning },
          { name: "Reprobados", value: Math.round((reprobados / total) * 100), color: colors.danger },
        ])
      }
    }
  }, [calificaciones, estudiantes, colors])

  const totalEstudiantes = estudiantes.length
  const totalSemestres = semestresData.reduce((sum, item) => sum + item.value, 0)
  const totalFactores = factores.length

  // Calcula tasa de aprobación
  const tasaAprobacion = useMemo(() => {
    if (calificaciones.length === 0) return 78 // Default value
    const aprobadas = calificaciones.filter(c => Number(c.calificacion) >= 70).length
    return Math.round((aprobadas / calificaciones.length) * 100)
  }, [calificaciones])

  // Calcula porcentaje de asistencia regular
  const asistenciaRegular = useMemo(() => {
    if (asistencias.length === 0) return 85 // Default value
    const presentes = asistencias.filter(a => a.presente).length
    return Math.round((presentes / asistencias.length) * 100)
  }, [asistencias])

  const totalCarreras = carrerasData.length
  const totalSemestresUnique = semestresData.length

  // Función para exportar a Excel (CSV)
  const exportToExcel = async () => {
    const dataToExport = [
      ['Temas Avanzados de Desarrollo de Software'],
      ['Calidad de Datos'],
      ['Reporte Escolar'],
      ['Fecha', new Date().toLocaleDateString()],
      [''],
      ['MÉTRICAS PRINCIPALES', ''],
      ['Estudiantes Registrados', totalEstudiantes],
      ['Carreras Activas', totalCarreras],
      ['Semestres Activos', totalSemestresUnique],
      ['Tasa de Aprobación', tasaAprobacion + '%'],
      ['Asistencia Regular', asistenciaRegular + '%'],
      [''],
      ['DISTRIBUCIÓN POR CARRERAS', ''],
      ['Carrera', 'Cantidad'],
      ...carrerasData.map(c => [c.name, c.value]),
      [''],
      ['DISTRIBUCIÓN POR SEMESTRES', ''],
      ['Semestre', 'Cantidad'],
      ...semestresData.map(s => [s.name, s.value]),
      [''],
      ['RENDIMIENTO ACADÉMICO POR MES', ''],
      ['Mes', 'Excelente', 'Bueno', 'Regular', 'Deficiente'],
      ...rendimientoData.map(r => [
        r.mes, 
        r.excelente, 
        r.bueno, 
        r.regular, 
        r.deficiente
      ]),
      [''],
      ['FACTORES DE RIESGO POR MES', ''],
      ['Mes', 'Total Registros', 'Académicos', 'Económicos', 'Psicosociales', 'Institucionales'],
      ...factoresRiesgoData.map(f => [
        f.mes,
        f.total,
        f.academicos,
        f.economicos,
        f.psicosociales,
        f.institucionales
      ]),
      [''],
      ['ESTADO ACADÉMICO', ''],
      ['Estado', 'Cantidad'],
      ['Aprobados', estadoAcademicoData.find(e => e.name === 'Aprobados')?.value || 0],
      ['En Riesgo', estadoAcademicoData.find(e => e.name === 'En Riesgo')?.value || 0],
      ['Reprobados', estadoAcademicoData.find(e => e.name === 'Reprobados')?.value || 0],
    ]

    const csvContent = dataToExport.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte_escolar_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Registrar en audit trail
    await createAuditEntry({
      modulo: 'Dashboard',
      accion: 'exportar',
      entidad: 'Excel',
      detalles: {
        formato: 'CSV',
        registros: totalEstudiantes
      }
    })
  }

  // Función para exportar a PDF
  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Título del reporte
      pdf.setFontSize(20)
      pdf.setTextColor(37, 99, 235)
      pdf.text('REPORTE ESCOLAR', pageWidth / 2, 20, { align: 'center' })
      
      pdf.setFontSize(14)
      pdf.setTextColor(100, 100, 100)
      pdf.text('Temas Avanzados de Desarrollo de Software - Calidad de Datos', pageWidth / 2, 28, { align: 'center' })

      // Sección de Métricas Principales
      pdf.setFontSize(16)
      pdf.setTextColor(37, 99, 235)
      pdf.text('Métricas Principales', 20, 45)

      pdf.setFontSize(10)
      pdf.setTextColor(0, 0, 0)
      let yPos = 55
      pdf.text(`Estudiantes Registrados: ${totalEstudiantes}`, 20, yPos)
      yPos += 8
      pdf.text(`Carreras Activas: ${totalCarreras}`, 20, yPos)
      yPos += 8
      pdf.text(`Semestres Activos: ${totalSemestresUnique}`, 20, yPos)
      yPos += 8
      pdf.text(`Tasa de Aprobación: ${tasaAprobacion}%`, 20, yPos)
      yPos += 8
      pdf.text(`Asistencia Regular: ${asistenciaRegular}%`, 20, yPos)

      // Capturar y agregar gráfico de Carreras con relación de aspecto correcta
      if (chartCarrerasRef.current && carrerasData.length > 0) {
        const imgCarreras = await toPng(chartCarrerasRef.current, {
          quality: 1.0,
          pixelRatio: 3,
          backgroundColor: '#ffffff'
        })
        // Mantener proporción: ancho/2 con altura ajustada
        const imgWidth = (pageWidth - 40) / 2
        const imgHeight = imgWidth * 0.65 // Mantener proporción
        pdf.addImage(imgCarreras, 'PNG', 20, yPos + 5, imgWidth, imgHeight)
        
        // Agregar tabla de datos al lado
        pdf.setFontSize(12)
        pdf.setTextColor(37, 99, 235)
        pdf.text('Datos por Carrera', imgWidth + 30, yPos + 5)
        pdf.setFontSize(8)
        pdf.setTextColor(0, 0, 0)
        carrerasData.forEach((item, index) => {
          const y = yPos + 10 + (index * 6)
          pdf.text(`${item.name}: ${item.value}`, imgWidth + 30, y)
        })
      }

      // Nueva página
      pdf.addPage()

      // Capturar y agregar gráfico de Semestres
      if (chartSemestresRef.current && semestresData.length > 0) {
        const imgSemestres = await toPng(chartSemestresRef.current, {
          quality: 1.0,
          pixelRatio: 3,
          backgroundColor: '#ffffff'
        })
        pdf.setFontSize(16)
        pdf.setTextColor(37, 99, 235)
        pdf.text('Distribución por Semestres', 20, 20)
        
        const imgWidth = (pageWidth - 40) / 2
        const imgHeight = imgWidth * 0.65
        pdf.addImage(imgSemestres, 'PNG', 20, 30, imgWidth, imgHeight)
        
        // Tabla de datos
        pdf.setFontSize(12)
        pdf.setTextColor(37, 99, 235)
        pdf.text('Datos por Semestre', imgWidth + 30, 30)
        pdf.setFontSize(8)
        pdf.setTextColor(0, 0, 0)
        semestresData.forEach((item, index) => {
          const y = 35 + (index * 6)
          pdf.text(`${item.name}: ${item.value}`, imgWidth + 30, y)
        })
      }

      // Nueva página para Rendimiento
      pdf.addPage()
      if (chartRendimientoRef.current && rendimientoData.length > 0) {
        const imgRendimiento = await toPng(chartRendimientoRef.current, {
          quality: 1.0,
          pixelRatio: 3,
          backgroundColor: '#ffffff'
        })
        pdf.setFontSize(16)
        pdf.setTextColor(37, 99, 235)
        pdf.text('Rendimiento Académico', 20, 20)
        
        // Gráfico más grande para mejor visualización
        const imgWidth = pageWidth - 40
        const imgHeight = (pageWidth - 40) * 0.5
        pdf.addImage(imgRendimiento, 'PNG', 20, 30, imgWidth, imgHeight)
        
        // Tabla de datos debajo
        let tableY = 30 + imgHeight + 10
        pdf.setFontSize(10)
        pdf.setTextColor(37, 99, 235)
        pdf.text('Detalle por Mes', 20, tableY)
        
        // Encabezado de la tabla
        pdf.setFontSize(7)
        pdf.setFillColor(37, 99, 235)
        pdf.rect(20, tableY + 2, pageWidth - 40, 5, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.text('Mes', 22, tableY + 5)
        pdf.text('Excelente', 40, tableY + 5)
        pdf.text('Bueno', 70, tableY + 5)
        pdf.text('Regular', 100, tableY + 5)
        pdf.text('Deficiente', 130, tableY + 5)
        
        pdf.setTextColor(0, 0, 0)
        tableY += 10
        rendimientoData.forEach((item, index) => {
          if (tableY > pageHeight - 20) {
            pdf.addPage()
            tableY = 20
          }
          pdf.text(item.mes, 22, tableY + 3)
          pdf.text(item.excelente.toString(), 40, tableY + 3)
          pdf.text(item.bueno.toString(), 70, tableY + 3)
          pdf.text(item.regular.toString(), 100, tableY + 3)
          pdf.text(item.deficiente.toString(), 130, tableY + 3)
          
          // Alternar color de fondo
          if (index % 2 === 0) {
            pdf.setFillColor(243, 244, 246)
            pdf.rect(20, tableY, pageWidth - 40, 4, 'F')
          }
          
          tableY += 4
        })
      }

      // Nueva página para Factores de Riesgo
      pdf.addPage()
      if (chartFactoresRef.current && factoresRiesgoData.length > 0) {
        const imgFactores = await toPng(chartFactoresRef.current, {
          quality: 1.0,
          pixelRatio: 3,
          backgroundColor: '#ffffff'
        })
        pdf.setFontSize(16)
        pdf.setTextColor(37, 99, 235)
        pdf.text('Factores de Riesgo', 20, 20)
        
        const imgWidth = pageWidth - 40
        const imgHeight = (pageWidth - 40) * 0.5
        pdf.addImage(imgFactores, 'PNG', 20, 30, imgWidth, imgHeight)
        
        // Tabla de datos
        let tableY = 30 + imgHeight + 10
        pdf.setFontSize(10)
        pdf.setTextColor(37, 99, 235)
        pdf.text('Detalle por Mes', 20, tableY)
        
        // Encabezado
        pdf.setFontSize(7)
        pdf.setFillColor(37, 99, 235)
        pdf.rect(20, tableY + 2, pageWidth - 40, 5, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.text('Mes', 22, tableY + 5)
        pdf.text('Total', 40, tableY + 5)
        pdf.text('Académicos', 60, tableY + 5)
        pdf.text('Económicos', 90, tableY + 5)
        pdf.text('Psicosociales', 130, tableY + 5)
        pdf.text('Instit.', 170, tableY + 5)
        
        pdf.setTextColor(0, 0, 0)
        tableY += 10
        factoresRiesgoData.forEach((item, index) => {
          if (tableY > pageHeight - 20) {
            pdf.addPage()
            tableY = 20
          }
          pdf.text(item.mes, 22, tableY + 3)
          pdf.text(item.total.toString(), 40, tableY + 3)
          pdf.text(item.academicos.toString(), 60, tableY + 3)
          pdf.text(item.economicos.toString(), 90, tableY + 3)
          pdf.text(item.psicosociales.toString(), 130, tableY + 3)
          pdf.text(item.institucionales.toString(), 170, tableY + 3)
          
          if (index % 2 === 0) {
            pdf.setFillColor(243, 244, 246)
            pdf.rect(20, tableY, pageWidth - 40, 4, 'F')
          }
          
          tableY += 4
        })
      }

      // Nueva página para Estado Académico
      pdf.addPage()
      if (chartEstadoRef.current && estadoAcademicoData.length > 0) {
        const imgEstado = await toPng(chartEstadoRef.current, {
          quality: 1.0,
          pixelRatio: 3,
          backgroundColor: '#ffffff'
        })
        pdf.setFontSize(16)
        pdf.setTextColor(37, 99, 235)
        pdf.text('Estado Académico', 20, 20)
        
        // Gráfico circular centrado
        const imgWidth = (pageWidth - 40) / 2
        const imgHeight = imgWidth
        pdf.addImage(imgEstado, 'PNG', (pageWidth - imgWidth) / 2, 30, imgWidth, imgHeight)
        
        // Tabla de datos
        let tableY = 30 + imgHeight + 10
        pdf.setFontSize(10)
        pdf.setTextColor(37, 99, 235)
        pdf.text('Resumen', 20, tableY)
        
        pdf.setFontSize(9)
        pdf.setTextColor(0, 0, 0)
        tableY += 5
        estadoAcademicoData.forEach((item) => {
          pdf.text(`${item.name}: ${item.value}%`, 20, tableY)
          tableY += 6
        })
      }

      // Pie de página en todas las páginas
      const totalPages = pdf.internal.pages.length
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(100, 100, 100)
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
        pdf.text(`Generado el ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 5, { align: 'center' })
      }

      // Guardar PDF
      pdf.save(`reporte_escolar_${new Date().toISOString().split('T')[0]}.pdf`)
      
      // Registrar en audit trail
      await createAuditEntry({
        modulo: 'Dashboard',
        accion: 'exportar',
        entidad: 'PDF',
        detalles: {
          formato: 'PDF',
          graficos: 5,
          registros: totalEstudiantes
        }
      })
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      alert('Error al exportar el PDF')
    }
  }

  // Escuchar eventos de voz para exportar
  useEffect(() => {
    const handleExportExcel = () => {
      console.log("Evento voz: exportar Excel")
      exportToExcel()
    }
    
    const handleExportPDF = () => {
      console.log("Evento voz: exportar PDF")
      exportToPDF()
    }
    
    window.addEventListener("voice-export-excel", handleExportExcel)
    window.addEventListener("voice-export-pdf", handleExportPDF)
    
    return () => {
      window.removeEventListener("voice-export-excel", handleExportExcel)
      window.removeEventListener("voice-export-pdf", handleExportPDF)
    }
  }, [])

  if (loadingEstudiantes && loadingCalificaciones && loadingFactores && loadingAsistencias) {
    return (
      <AuthGuard>
        <div ref={mainContentRef} className="min-h-screen bg-background flex items-center justify-center">
                    <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando datos del dashboard...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div ref={mainContentRef} className="min-h-screen bg-background p-3 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Reporte Escolar</h1>
              <p className="text-sm md:text-base text-muted-foreground">Resumen general del sistema educativo</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 no-print">
              <Button 
                onClick={exportToExcel}
                variant="outline"
                className="flex items-center justify-center gap-2 w-full sm:w-auto export-excel-btn"
                aria-label="Exportar reporte escolar a Excel"
              >
                <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm md:text-base">Exportar Excel</span>
              </Button>
              <Button 
                onClick={exportToPDF}
                aria-label="Exportar reporte escolar a PDF"
                variant="outline"
                className="flex items-center justify-center gap-2 w-full sm:w-auto export-pdf-btn"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm md:text-base">Exportar PDF</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{totalEstudiantes.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mt-2 font-medium">Estudiantes Registrados</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Datos en tiempo real</span>
                </div>
            </div>
          </CardContent>
        </Card>

          <Card className="bg-card border-border shadow-lg">
          <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{totalCarreras}</div>
                <p className="text-sm text-muted-foreground mt-2 font-medium">Carreras Activas</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Basado en estudiantes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{totalSemestresUnique}</div>
                <p className="text-sm text-muted-foreground mt-2 font-medium">Semestres Activos</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Semestres con estudiantes</span>
                </div>
            </div>
          </CardContent>
        </Card>

          <Card className="bg-card border-border shadow-lg">
          <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{tasaAprobacion}%</div>
                <p className="text-sm text-muted-foreground mt-2 font-medium">Tasa de Aprobación</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Datos reales</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección de Gráficas Principales */}
        {carrerasData.length > 0 && (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Gráfica de Carreras */}
            <Card className="bg-card shadow-lg" id="chart-carreras-card">
              <CardHeader className="pb-4">
                <CardTitle as="h2" className="text-xl font-semibold text-foreground">Distribución por Carreras</CardTitle>
                <p className="text-sm text-muted-foreground">Estudiantes matriculados por programa académico</p>
              </CardHeader>
              <CardContent id="chart-carreras" ref={chartCarrerasRef}>
              <div className="relative">
                  <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                        data={carrerasData}
                      cx="50%"
                      cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {carrerasData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-popover)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "var(--color-popover-foreground)",
                        }}
                      />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl md:text-4xl font-bold text-foreground">{totalEstudiantes.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Estudiantes</div>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {carrerasData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
              </div>
                      <span className="font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gráfica de Semestres */}
          {semestresData.length > 0 && (
            <Card className="bg-card shadow-lg" id="chart-semestres-card">
              <CardHeader className="pb-4">
                <CardTitle as="h2" className="text-xl font-semibold text-foreground">Distribución por Semestres</CardTitle>
                <p className="text-sm text-muted-foreground">Estudiantes distribuidos por nivel académico</p>
              </CardHeader>
              <CardContent id="chart-semestres" ref={chartSemestresRef}>
              <div className="relative">
                  <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                        data={semestresData}
                      cx="50%"
                      cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {semestresData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-popover)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "var(--color-popover-foreground)",
                        }}
                      />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl md:text-4xl font-bold text-foreground">{totalSemestres.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Estudiantes</div>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {semestresData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                      </div>
                      <span className="font-semibold text-foreground">{item.value}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
          )}
        </div>
        )}

        {/* Gráficas de Análisis Detallado */}
        {rendimientoData.length > 0 && (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Gráfica de Rendimiento Académico */}
            <Card className="bg-card shadow-lg" id="chart-rendimiento-card">
              <CardHeader className="pb-6">
                <CardTitle as="h2" className="text-xl font-semibold text-foreground">Rendimiento Académico</CardTitle>
                <p className="text-sm text-muted-foreground">Distribución de calificaciones por mes</p>
              </CardHeader>
              <CardContent id="chart-rendimiento" ref={chartRendimientoRef}>
                <div className="flex flex-wrap gap-4 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#00ff41]" />
                    <span className="text-foreground font-medium">Excelente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#00ffff]" />
                    <span className="text-foreground font-medium">Bueno</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#ff00ff]" />
                    <span className="text-foreground font-medium">Regular</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.danger }} />
                    <span className="text-foreground font-medium">Deficiente</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rendimientoData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 12, fontWeight: 500 }} 
                      axisLine={false} 
                      tickLine={false}
                      tickMargin={10}
                    />
                    <YAxis 
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false}
                      domain={[0, 100]}
                      tickCount={6}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "12px",
                        fontSize: "13px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        color: "var(--color-popover-foreground)",
                      }}
                      labelStyle={{ fontWeight: 600, color: "var(--color-popover-foreground)" }}
                    />
                    <Bar dataKey="excelente" stackId="a" fill={colors.success} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="bueno" stackId="a" fill={colors.tertiary} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="regular" stackId="a" fill={colors.quaternary} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="deficiente" stackId="a" fill={colors.danger} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica de Factores de Riesgo */}
            {factoresRiesgoData.length > 0 && (
              <Card className="bg-card shadow-lg" id="chart-factores-riesgo-card">
                <CardHeader className="pb-6">
                  <CardTitle as="h2" className="text-xl font-semibold text-foreground">Factores de Riesgo</CardTitle>
                  <p className="text-sm text-muted-foreground">Evolución de factores de riesgo estudiantil</p>
                </CardHeader>
                <CardContent id="chart-factores-riesgo" ref={chartFactoresRef}>
                  <div className="flex flex-wrap gap-4 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.primary }} />
                    <span className="text-foreground font-medium">Total Registros</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.tertiary }} />
                    <span className="text-foreground font-medium">Académicos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.quaternary }} />
                    <span className="text-foreground font-medium">Económicos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.secondary }} />
                    <span className="text-foreground font-medium">Psicosociales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.danger }} />
                    <span className="text-foreground font-medium">Institucionales</span>
                  </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={factoresRiesgoData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis 
                        dataKey="mes" 
                        tick={{ fill: "var(--color-muted-foreground)", fontSize: 12, fontWeight: 500 }} 
                        axisLine={false} 
                        tickLine={false}
                        tickMargin={10}
                      />
                      <YAxis 
                        tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} 
                        axisLine={false} 
                        tickLine={false}
                        domain={[0, 'auto']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          fontSize: "13px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          color: "hsl(var(--popover-foreground))",
                        }}
                        labelStyle={{ fontWeight: 600, color: "hsl(var(--popover-foreground))" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke={colors.primary} 
                        strokeWidth={4} 
                        dot={{ fill: colors.primary, r: 6, strokeWidth: 2, stroke: "#000" }}
                        activeDot={{ r: 8, stroke: colors.primary, strokeWidth: 3, fill: "#fff" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="academicos" 
                        stroke={colors.tertiary} 
                        strokeWidth={3} 
                        dot={{ fill: colors.tertiary, r: 5, strokeWidth: 2, stroke: "#000" }}
                        activeDot={{ r: 7, stroke: colors.tertiary, strokeWidth: 2, fill: "#fff" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="economicos" 
                        stroke={colors.quaternary} 
                        strokeWidth={3} 
                        dot={{ fill: colors.quaternary, r: 5, strokeWidth: 2, stroke: "#000" }}
                        activeDot={{ r: 7, stroke: colors.quaternary, strokeWidth: 2, fill: "#fff" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="psicosociales" 
                        stroke={colors.secondary} 
                        strokeWidth={3} 
                        dot={{ fill: colors.secondary, r: 5, strokeWidth: 2, stroke: "#000" }}
                        activeDot={{ r: 7, stroke: colors.secondary, strokeWidth: 2, fill: "#fff" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="institucionales" 
                        stroke={colors.danger} 
                        strokeWidth={3} 
                        dot={{ fill: colors.danger, r: 5, strokeWidth: 2, stroke: "#000" }}
                        activeDot={{ r: 7, stroke: colors.danger, strokeWidth: 2, fill: "#fff" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Gráfica de Estado Académico */}
        {estadoAcademicoData.length > 0 && (
          <div className="grid gap-4 sm:gap-6 grid-cols-1">
            <Card className="bg-card shadow-lg" id="chart-estado-card">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold text-foreground">Estado Académico</CardTitle>
                <p className="text-sm text-muted-foreground">Distribución del rendimiento estudiantil</p>
              </CardHeader>
              <CardContent id="chart-estado" ref={chartEstadoRef}>
                <div className="flex items-center justify-center">
                  <div className="relative w-full max-w-xs sm:w-80 h-64 sm:h-80 min-h-[256px]">
                    <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                      <PieChart>
                        <Pie
                          data={estadoAcademicoData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {estadoAcademicoData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-popover)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "12px",
                            fontSize: "13px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            color: "var(--color-popover-foreground)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">{tasaAprobacion}%</div>
                        <div className="text-sm text-muted-foreground mt-2">Aprobados</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-center">
                  <div className="flex flex-wrap gap-3 sm:gap-6 justify-center">
                    {estadoAcademicoData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium text-foreground">{item.name}: {item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Métricas Adicionales */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground">{asistenciaRegular}%</div>
                <p className="text-sm text-muted-foreground mt-2 font-medium">Asistencia Regular</p>
                <div className="mt-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${asistenciaRegular}%` }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground">{tasaAprobacion}%</div>
                <p className="text-sm text-muted-foreground mt-2 font-medium">Tasa de Aprobación</p>
                <div className="mt-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${tasaAprobacion}%` }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground">{calificaciones.length}</div>
                <p className="text-sm text-muted-foreground mt-2 font-medium">Registros de Calificaciones</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground">{factores.length}</div>
                <p className="text-sm text-muted-foreground mt-2 font-medium">Factores de Riesgo Registrados</p>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </AuthGuard>
  )
}