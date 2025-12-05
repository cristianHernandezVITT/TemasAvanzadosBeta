import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

type Estudiante = Database['public']['Tables']['estudiantes']['Row']
type Calificacion = Database['public']['Tables']['calificaciones']['Row']
type FactorRiesgo = Database['public']['Tables']['factores_riesgo']['Row']

// Hook para estudiantes
export function useEstudiantes() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEstudiantes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('estudiantes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEstudiantes(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estudiantes')
    } finally {
      setLoading(false)
    }
  }

  // ahora acepta un segundo parámetro opcional `operadorId` que se usa para
  // rellenar los campos de auditoría `creado_por` y `modificado_por` en la tabla
  const createEstudiante = async (
    estudiante: Omit<Estudiante, 'id' | 'created_at' | 'updated_at'>,
    operadorId?: string | null
  ) => {
    try {
      // Ensure telefono is sent as string to avoid integer overflow on DB side
      const payload = {
        ...estudiante,
        telefono: estudiante.telefono !== undefined && estudiante.telefono !== null ? String(estudiante.telefono) : estudiante.telefono,
        creado_por: operadorId ?? null,
        modificado_por: operadorId ?? null,
      }

      const { data, error } = await supabase
        .from('estudiantes')
        .insert([payload])
        .select()

      if (error) throw error
      if (data) {
        setEstudiantes(prev => [data[0], ...prev])
      }
      return data?.[0]
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear estudiante')
      throw err
    }
  }

  // Ahora acepta un segundo parámetro opcional `operadorId` para actualizar el campo
  // `modificado_por` automáticamente cuando esté disponible.
  const updateEstudiante = async (
    id: string,
    updates: Partial<Estudiante>,
    operadorId?: string | null
  ) => {
    try {
      const payload: any = {
        ...updates,
        // Defensive: ensure telefono is string if provided
        telefono: updates.telefono !== undefined && updates.telefono !== null ? String(updates.telefono) : updates.telefono,
        updated_at: new Date().toISOString(),
      }
      if (operadorId !== undefined) payload.modificado_por = operadorId

      const { data, error } = await supabase
        .from('estudiantes')
        .update(payload)
        .eq('id', id)
        .select()

      if (error) throw error
      if (data) {
        setEstudiantes(prev => prev.map(est => est.id === id ? data[0] : est))
      }
      return data?.[0]
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estudiante')
      throw err
    }
  }

  const deleteEstudiante = async (id: string) => {
    try {
      const { error } = await supabase
        .from('estudiantes')
        .delete()
        .eq('id', id)

      if (error) throw error
      setEstudiantes(prev => prev.filter(est => est.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar estudiante')
      throw err
    }
  }

  useEffect(() => {
    fetchEstudiantes()
  }, [])

  return {
    estudiantes,
    loading,
    error,
    createEstudiante,
    updateEstudiante,
    deleteEstudiante,
    refetch: fetchEstudiantes
  }
}

// Hook para calificaciones
export function useCalificaciones(estudianteId?: string) {
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCalificaciones = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('calificaciones')
        .select('*')
        .order('created_at', { ascending: false })

      if (estudianteId) {
        query = query.eq('estudiante_id', estudianteId)
      }

      const { data, error } = await query

      if (error) throw error
      setCalificaciones(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar calificaciones')
    } finally {
      setLoading(false)
    }
  }

  const createCalificacion = async (calificacion: Omit<Calificacion, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('calificaciones')
        .insert([calificacion])
        .select()

      if (error) throw error
      if (data) {
        setCalificaciones(prev => [data[0], ...prev])
      }
      return data?.[0]
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear calificación')
      throw err
    }
  }

  useEffect(() => {
    fetchCalificaciones()
  }, [estudianteId])

  return {
    calificaciones,
    loading,
    error,
    createCalificacion,
    refetch: fetchCalificaciones
  }
}

// Hook para factores de riesgo
export function useFactoresRiesgo(estudianteId?: string) {
  const [factores, setFactores] = useState<FactorRiesgo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFactores = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('factores_riesgo')
        .select('*')
        .order('created_at', { ascending: false })

      if (estudianteId) {
        query = query.eq('estudiante_id', estudianteId)
      }

      const { data, error } = await query

      if (error) throw error
      setFactores(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar factores de riesgo')
    } finally {
      setLoading(false)
    }
  }

  const createFactorRiesgo = async (factor: Omit<FactorRiesgo, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('factores_riesgo')
        .insert([factor])
        .select()

      if (error) throw error
      if (data) {
        setFactores(prev => [data[0], ...prev])
      }
      return data?.[0]
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear factor de riesgo')
      throw err
    }
  }

  useEffect(() => {
    fetchFactores()
  }, [estudianteId])

  return {
    factores,
    loading,
    error,
    createFactorRiesgo,
    refetch: fetchFactores
  }
}
