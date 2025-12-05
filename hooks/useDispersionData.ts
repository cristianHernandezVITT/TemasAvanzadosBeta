import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface DispersionData {
  id: string
  estudiante_id: string
  promedio: number
  porcentaje_asistencia: number
  total_calificaciones: number
  factores_riesgo: number
  semestre: number
  carrera: string
  nombre: string
  matricula: string
}

export function useDispersionData(semestre?: string) {
  const [data, setData] = useState<DispersionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDispersionData() {
      try {
        setLoading(true)
        
        // Consulta separada para calificaciones
        let calificacionesQuery = supabase
          .from('calificaciones')
          .select(`
            id,
            estudiante_id,
            calificacion,
            semestre,
            materia,
            estudiantes!inner (
              id,
              nombre,
              apellido,
              carrera,
              matricula
            )
          `)

        if (semestre && semestre !== 'todos') {
          calificacionesQuery = calificacionesQuery.eq('semestre', parseInt(semestre))
        }

        const { data: calificacionesData, error: calError } = await calificacionesQuery

        if (calError) throw calError

        // Consulta separada para asistencias
        let asistenciasQuery = supabase
          .from('asistencias')
          .select('estudiante_id, presente, fecha, semestre')

        if (semestre && semestre !== 'todos') {
          asistenciasQuery = asistenciasQuery.eq('semestre', parseInt(semestre))
        }

        const { data: asistenciasData, error: asisError } = await asistenciasQuery
        if (asisError) throw asisError

        // Consulta para factores de riesgo
        const { data: factoresData, error: factoresError } = await supabase
          .from('factores_riesgo')
          .select('estudiante_id, factor_academico, factor_economico, factor_psicosocial, factor_institucional, factor_contextual')

        if (factoresError) throw factoresError

        // Procesar los datos combinados
        const processedData = processDispersionData(
          calificacionesData || [], 
          asistenciasData || [], 
          factoresData || []
        )
        setData(processedData)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        console.error('Error fetching dispersion data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDispersionData()
  }, [semestre])

  return { data, loading, error }
}

function processDispersionData(
  calificacionesData: any[], 
  asistenciasData: any[], 
  factoresData: any[]
): DispersionData[] {
  const estudiantesMap = new Map()

  // Procesar calificaciones
  calificacionesData?.forEach(item => {
    const estudianteId = item.estudiante_id
    
    if (!estudiantesMap.has(estudianteId)) {
      estudiantesMap.set(estudianteId, {
        id: item.estudiante_id,
        estudiante_id: item.estudiante_id,
        promedios: [],
        asistencias: [],
        semestre: item.semestre,
        carrera: item.estudiantes?.carrera || 'Desconocida',
        nombre: `${item.estudiantes?.nombre} ${item.estudiantes?.apellido}`,
        matricula: item.estudiantes?.matricula
      })
    }

    const estudiante = estudiantesMap.get(estudianteId)
    if (item.calificacion) {
      estudiante.promedios.push(item.calificacion)
    }
  })

  // Procesar asistencias
  asistenciasData?.forEach(item => {
    const estudianteId = item.estudiante_id
    if (estudiantesMap.has(estudianteId)) {
      const estudiante = estudiantesMap.get(estudianteId)
      estudiante.asistencias.push(item)
    }
  })

  // Procesar factores de riesgo
  factoresData?.forEach(item => {
    const estudianteId = item.estudiante_id
    if (estudiantesMap.has(estudianteId)) {
      const estudiante = estudiantesMap.get(estudianteId)
      estudiante.factores_riesgo = (
        (item.factor_academico ? 1 : 0) +
        (item.factor_economico ? 1 : 0) +
        (item.factor_psicosocial ? 1 : 0) +
        (item.factor_institucional ? 1 : 0) +
        (item.factor_contextual ? 1 : 0)
      )
    }
  })

  // Calcular métricas finales
  return Array.from(estudiantesMap.values()).map(estudiante => ({
    id: estudiante.id,
    estudiante_id: estudiante.estudiante_id,
    promedio: estudiante.promedios.length > 0 
      ? estudiante.promedios.reduce((a: number, b: number) => a + b, 0) / estudiante.promedios.length 
      : 0,
    porcentaje_asistencia: estudiante.asistencias.length > 0
      ? (estudiante.asistencias.filter((a: any) => a.presente).length / estudiante.asistencias.length) * 100
      : 0,
    total_calificaciones: estudiante.promedios.length,
    factores_riesgo: estudiante.factores_riesgo || 0,
    semestre: estudiante.semestre,
    carrera: estudiante.carrera,
    nombre: estudiante.nombre,
    matricula: estudiante.matricula
  }))
}