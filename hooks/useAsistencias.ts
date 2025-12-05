import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export interface Asistencia {
  identificacion: string
  estudiante_id: string
  materia: string
  fecha: string
  presente: boolean
  semestre: number
  created_at?: string
  updated_at?: string
}

export function useAsistencias() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAsistencias = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('asistencias')
        .select('*')
        .order('fecha', { ascending: false })
      if (error) throw error
      setAsistencias(data || [])
    } catch (error) {
      console.error('Error al cargar asistencias:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAsistencias()
  }, [])

  const createAsistencia = async (asistencia: Omit<Asistencia, 'identificacion' | 'created_at' | 'updated_at'>) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('asistencias')
        .insert([asistencia])
        .select()
        .single()
      if (error) throw error
      await fetchAsistencias()
      return data
    } catch (error) {
      console.error('Error al crear asistencia:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateAsistencia = async (identificacion: string, updates: Partial<Asistencia>) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('asistencias')
        .update(updates)
        .eq('identificacion', identificacion)
        .select()
        .single()
      if (error) throw error
      await fetchAsistencias()
      return data
    } catch (error) {
      console.error('Error al actualizar asistencia:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { asistencias, loading, createAsistencia, updateAsistencia }
}
