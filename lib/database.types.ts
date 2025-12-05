export interface Database {
  public: {
    Tables: {
      estudiantes: {
        Row: {
          id: string
          nombre: string
          apellido: string
          matricula: string
          carrera: string
          semestre: number
          email: string
          telefono: string
          creado_por?: string | null
          modificado_por?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          apellido: string
          matricula: string
          carrera: string
          semestre: number
          email: string
          telefono: string
          creado_por?: string | null
          modificado_por?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          apellido?: string
          matricula?: string
          carrera?: string
          semestre?: number
          email?: string
          telefono?: string
          creado_por?: string | null
          modificado_por?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      calificaciones: {
        Row: {
          id: string
          estudiante_id: string
          materia: string
          calificacion: number
          semestre: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          estudiante_id: string
          materia: string
          calificacion: number
          semestre: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          estudiante_id?: string
          materia?: string
          calificacion?: number
          semestre?: number
          created_at?: string
          updated_at?: string
        }
      }
      factores_riesgo: {
        Row: {
          id: string
          estudiante_id: string
          factor_academico: boolean
          factor_economico: boolean
          factor_psicosocial: boolean
          factor_institucional: boolean
          factor_contextual: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          estudiante_id: string
          factor_academico?: boolean
          factor_economico?: boolean
          factor_psicosocial?: boolean
          factor_institucional?: boolean
          factor_contextual?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          estudiante_id?: string
          factor_academico?: boolean
          factor_economico?: boolean
          factor_psicosocial?: boolean
          factor_institucional?: boolean
          factor_contextual?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
