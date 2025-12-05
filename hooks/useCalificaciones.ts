"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Calificacion {
  id: string
  estudiante_id: string
  materia: string
  calificacion: number
  unidad: number
  semestre: number
  created_at: string
  updated_at: string
}

export function useCalificaciones() {
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCalificaciones = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('calificaciones')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCalificaciones(data || [])
    } catch (error) {
      console.error('Error al cargar calificaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCalificacionesByEstudiante = async (estudianteId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('calificaciones')
        .select('*')
        .eq('estudiante_id', estudianteId)
        .order('semestre', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error al cargar calificaciones del estudiante:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  const fetchCalificacionesByMateria = async (materia: string): Promise<Calificacion[]> => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('calificaciones')
                .select('*')
                // Usa la columna 'materia' para filtrar
                .eq('materia', materia) 
                .order('semestre', { ascending: true })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error(`Error al cargar calificaciones de ${materia}:`, error)
            return []
        } finally {
            setLoading(false)
        }
    }

  const createCalificacion = async (calificacion: Omit<Calificacion, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true)
    try {
      // Evitar duplicados: misma estudiante + materia + unidad
      try {
        const { data: exists, error: existsError } = await supabase
          .from('calificaciones')
          .select('id')
          .eq('estudiante_id', calificacion.estudiante_id)
          .eq('materia', calificacion.materia)
          .eq('unidad', calificacion.unidad)
          .limit(1)

        if (existsError) throw existsError
        if (exists && (exists as any[]).length > 0) {
          throw new Error('Ya existe una calificación para esta materia y unidad para el estudiante')
        }
      } catch (err) {
        // Si hubo un error en la comprobación, propagarlo
        if (err instanceof Error && err.message.includes('Ya existe una calificación')) throw err
        // si la comprobación falló por otro motivo, seguimos para dejar que la inserción principal capture errores
      }
      const { data, error } = await supabase
        .from('calificaciones')
        .insert([calificacion])
        .select()
        .single()

      if (error) throw error
      // Actualizar estado local inmediatamente para reflejar la nueva calificación en la UI
      if (data) setCalificaciones(prev => [data, ...prev])
      return data
    } catch (error) {
      console.error('Error al crear calificación:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateCalificacion = async (id: string, calificacion: Partial<Calificacion>) => {
    setLoading(true)
    try {
      // Evitar duplicados al actualizar: comprobar si existe otra calificación con la misma materia/unidad para el mismo estudiante
      try {
        if (calificacion.materia !== undefined || calificacion.unidad !== undefined) {
          // Necesitamos el estudiante_id del registro actual
          const { data: current, error: currErr } = await supabase
            .from('calificaciones')
            .select('estudiante_id')
            .eq('id', id)
            .limit(1)
            .single()
          if (currErr) throw currErr
          const estudiante_id = current?.estudiante_id
          if (estudiante_id) {
            const materiaToCheck = calificacion.materia ?? undefined
            const unidadToCheck = calificacion.unidad ?? undefined
            const query = supabase.from('calificaciones').select('id').eq('estudiante_id', estudiante_id)
            if (materiaToCheck !== undefined) query.eq('materia', materiaToCheck)
            if (unidadToCheck !== undefined) query.eq('unidad', unidadToCheck)
            // excluir el mismo id
            query.neq('id', id).limit(1)
            const { data: exists, error: existsError } = await query
            if (existsError) throw existsError
            if (exists && (exists as any[]).length > 0) {
              throw new Error('Ya existe otra calificación para esta materia y unidad para el estudiante')
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('Ya existe otra calificación')) throw err
      }
      const { data, error } = await supabase
        .from('calificaciones')
        .update(calificacion)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      // Reemplazar la calificación actual en el estado local
      if (data) setCalificaciones(prev => prev.map(c => c.id === id ? data : c))
      return data
    } catch (error) {
      console.error('Error al actualizar calificación:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteCalificacion = async (id: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('calificaciones')
        .delete()
        .eq('id', id)

      if (error) throw error
      // Eliminar localmente para reflejar cambio inmediato
      setCalificaciones(prev => prev.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error al eliminar calificación:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalificaciones()
  }, [])

  return {
    calificaciones,
    loading,
    fetchCalificaciones,
    fetchCalificacionesByEstudiante,
    createCalificacion,
    fetchCalificacionesByMateria,
    updateCalificacion,
    deleteCalificacion,
  }
}