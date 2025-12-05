import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface AuditTrailEntry {
  id: string
  usuario_id: string
  usuario_nombre?: string
  usuario_apellidos?: string
  numero_empleado?: string
  modulo: string
  accion: string
  entidad: string
  entidad_id?: string
  detalles?: any
  ip_address?: string
  user_agent?: string
  created_at: string
  updated_at: string
}

interface CreateAuditEntryParams {
  modulo: string
  accion: string
  entidad: string
  entidad_id?: string
  detalles?: any
  ip_address?: string
  user_agent?: string
}

interface UseAuditTrailReturn {
  auditTrail: AuditTrailEntry[]
  loading: boolean
  error: string | null
  createAuditEntry: (entry: CreateAuditEntryParams) => Promise<void>
}

export function useAuditTrail(): UseAuditTrailReturn {
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { usuario } = useAuth()

  const fetchAuditTrail = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('audit_trail')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error
      setAuditTrail(data || [])
    } catch (err: any) {
      console.error('Error fetching audit trail:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createAuditEntry = async (entry: CreateAuditEntryParams) => {
    // No intentar crear si no hay usuario logueado
    if (!usuario) {
      console.warn('No hay usuario logueado, no se puede crear audit entry')
      return
    }
    
    try {
      const insertData: any = {
        modulo: entry.modulo,
        accion: entry.accion,
        entidad: entry.entidad,
        usuario_id: usuario.id,
        usuario_nombre: usuario.nombre || '',
        usuario_apellidos: usuario.apellidos || '',
        numero_empleado: usuario.numero_empleado?.toString() || '',
      }
      
      // Agregar campos opcionales solo si existen
      if (entry.entidad_id) {
        insertData.entidad_id = entry.entidad_id
      }
      
      if (entry.detalles) {
        insertData.detalles = entry.detalles
      }
      
      if (entry.ip_address) {
        insertData.ip_address = entry.ip_address
      }
      
      if (entry.user_agent) {
        insertData.user_agent = entry.user_agent
      }
      
      const { error } = await supabase
        .from('audit_trail')
        .insert([insertData])

      if (error) {
        console.error('Error from Supabase:', error)
        console.error('Insert data:', insertData)
        throw error
      }
      
      // Actualizar la lista local
      await fetchAuditTrail()
    } catch (err: any) {
      console.error('Error creating audit entry:', err)
      // No lanzamos el error para que no afecte la experiencia del usuario
    }
  }

  useEffect(() => {
    fetchAuditTrail()
  }, [])

  return {
    auditTrail,
    loading,
    error,
    createAuditEntry
  }
}

