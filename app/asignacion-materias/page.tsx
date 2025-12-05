"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'

export default function AsignacionMateriasPage() {
  const [loading, setLoading] = useState(false)
  const [docentes, setDocentes] = useState<any[]>([])
  const [materias, setMaterias] = useState<any[]>([])
  const [asignaciones, setAsignaciones] = useState<any[]>([])
  
  const [form, setForm] = useState({
    docente_id: '',
    materia_id: '',
    grupo: '',
    periodo: ''
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    docente_id: '',
    materia_id: '',
    grupo: '',
    periodo: ''
  })
  const [editModalOpen, setEditModalOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch Docentes
      const { data: docentesData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rol', 'Docente')
        .order('nombre')
      
      setDocentes(docentesData || [])

      // Fetch Materias
      const { data: materiasData } = await supabase
        .from('materias')
        .select('*')
        .order('nombre')
      
      setMaterias(materiasData || [])

      // Fetch Asignaciones
      fetchAsignaciones()
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const fetchAsignaciones = async () => {
    const { data, error } = await supabase
      .from('docente_materias')
      .select(`
        id,
        grupo,
        periodo,
        docente_id,
        materia_id,
        docente:usuarios(nombre, apellidos),
        materia:materias(nombre, clave)
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error(error)
    } else {
      setAsignaciones(data || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.docente_id || !form.materia_id || !form.grupo || !form.periodo) {
      toast.error('Todos los campos son obligatorios')
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('docente_materias')
        .insert([{
          docente_id: form.docente_id,
          materia_id: form.materia_id,
          grupo: form.grupo,
          periodo: form.periodo
        }])

      if (error) throw error

      toast.success('Materia asignada correctamente')
      setForm({ docente_id: '', materia_id: '', grupo: '', periodo: '' })
      
      await fetchAsignaciones()
    } catch (err) {
      console.error(err)
      toast.error('Error al asignar materia')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (asignacion: any) => {
    setEditingId(asignacion.id)
    setEditForm({
      docente_id: asignacion.docente_id,
      materia_id: asignacion.materia_id,
      grupo: asignacion.grupo,
      periodo: asignacion.periodo
    })
    setEditModalOpen(true)
  }

  const saveEdit = async () => {
    if (!editingId) return
    if (!editForm.docente_id || !editForm.materia_id || !editForm.grupo || !editForm.periodo) {
      toast.error('Todos los campos son obligatorios')
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('docente_materias')
        .update({
          docente_id: editForm.docente_id,
          materia_id: editForm.materia_id,
          grupo: editForm.grupo,
          periodo: editForm.periodo
        })
        .eq('id', editingId)

      if (error) throw error

      toast.success('Asignación actualizada')
      setEditModalOpen(false)
      setEditingId(null)
      await fetchAsignaciones()
    } catch (err) {
      console.error(err)
      toast.error('Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Asignación de Materias</h1>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Formulario */}
          <Card className="md:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>Nueva Asignación</CardTitle>
              <CardDescription>Asigna una materia a un docente</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Docente</Label>
                  <Select 
                    value={form.docente_id} 
                    onValueChange={v => setForm({ ...form, docente_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar docente" />
                    </SelectTrigger>
                    <SelectContent>
                      {docentes.map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.nombre} {d.apellidos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Materia</Label>
                  <Select 
                    value={form.materia_id} 
                    onValueChange={v => setForm({ ...form, materia_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {materias.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.clave} - {m.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Grupo</Label>
                  <Input 
                    value={form.grupo} 
                    onChange={e => setForm({ ...form, grupo: e.target.value })} 
                    placeholder="Ej. A, B, 101" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Periodo</Label>
                  <Input 
                    value={form.periodo} 
                    onChange={e => setForm({ ...form, periodo: e.target.value })} 
                    placeholder="Ej. 2024-1" 
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Guardando...' : 'Asignar Materia'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de Asignaciones */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Asignaciones Actuales</CardTitle>
              <CardDescription>Lista de materias asignadas a docentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {asignaciones.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay asignaciones registradas
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-muted-foreground font-medium">
                        <tr>
                          <th className="p-3">Docente</th>
                          <th className="p-3">Materia</th>
                          <th className="p-3">Grupo</th>
                          <th className="p-3">Periodo</th>
                          <th className="p-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {asignaciones.map((a) => (
                          <tr key={a.id} className="hover:bg-muted/50 transition-colors">
                            <td className="p-3 font-medium">
                              {a.docente?.nombre} {a.docente?.apellidos}
                            </td>
                            <td className="p-3">
                              <div className="font-medium">{a.materia?.nombre}</div>
                              <div className="text-xs text-muted-foreground">{a.materia?.clave}</div>
                            </td>
                            <td className="p-3">{a.grupo}</td>
                            <td className="p-3">{a.periodo}</td>
                            <td className="p-3 text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => startEdit(a)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Asignación</DialogTitle>
            <DialogDescription>Modifica los datos de la asignación</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Docente</Label>
              <Select 
                value={editForm.docente_id} 
                onValueChange={v => setEditForm({ ...editForm, docente_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar docente" />
                </SelectTrigger>
                <SelectContent>
                  {docentes.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nombre} {d.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Materia</Label>
              <Select 
                value={editForm.materia_id} 
                onValueChange={v => setEditForm({ ...editForm, materia_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar materia" />
                </SelectTrigger>
                <SelectContent>
                  {materias.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.clave} - {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Grupo</Label>
              <Input 
                value={editForm.grupo} 
                onChange={e => setEditForm({ ...editForm, grupo: e.target.value })} 
              />
            </div>

            <div className="space-y-2">
              <Label>Periodo</Label>
              <Input 
                value={editForm.periodo} 
                onChange={e => setEditForm({ ...editForm, periodo: e.target.value })} 
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
              <Button onClick={saveEdit} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
