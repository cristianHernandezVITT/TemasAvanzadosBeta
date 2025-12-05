"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function MateriasPage() {
  const [loading, setLoading] = useState(false)
  const [carreras, setCarreras] = useState<any[]>([])
  const [materias, setMaterias] = useState<any[]>([])

  // Formulario para crear materia y asignarla opcionalmente a una carrera
  const [form, setForm] = useState({
    clave: '',
    nombre: '',
    descripcion: '',
    creditos: 3,
    semestre_sugerido: 1,
    // asignación opcional
    carrera_id: '',
    carrera_semestre: 1,
    carrera_obligatoria: true,
  })
  // Edit states
  const [editOpen, setEditOpen] = useState(false)
  const [editingMateria, setEditingMateria] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({
    clave: '',
    nombre: '',
    descripcion: '',
    creditos: 3,
    semestre_sugerido: 1,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: carrerasData } = await supabase.from('carreras').select('*').order('nombre')
      setCarreras(carrerasData || [])
      const { data: materiasData } = await supabase.from('materias').select('*').order('nombre')
      setMaterias(materiasData || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clave.trim() || !form.nombre.trim() || form.creditos <= 0) {
      toast.error('Completa los campos requeridos para la materia')
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase.from('materias').insert([{ 
        clave: form.clave.trim(),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        creditos: form.creditos,
        semestre_sugerido: form.semestre_sugerido || null,
      }]).select().single()

      if (error) throw error

      // Si seleccionó carrera, crear relación en carrera_materias
      if (form.carrera_id) {
        const { error: err2 } = await supabase.from('carrera_materias').insert([{
          carrera_id: form.carrera_id,
          materia_id: data.id,
          semestre: form.carrera_semestre,
          obligatorio: form.carrera_obligatoria,
        }])
        if (err2) {
          console.error('Error al asignar materia a carrera:', err2)
          toast.error('Materia creada, pero falló la asignación a la carrera')
        } else {
          toast.success('Materia creada y asignada a la carrera')
        }
      } else {
        toast.success('Materia creada')
      }

      // Limpiar formulario y recargar listados
      setForm({ clave: '', nombre: '', descripcion: '', creditos: 3, semestre_sugerido: 1, carrera_id: '', carrera_semestre: 1, carrera_obligatoria: true })
      await fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Error al crear materia')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (m: any) => {
    setEditingMateria(m)
    setEditForm({
      clave: m.clave || '',
      nombre: m.nombre || '',
      descripcion: m.descripcion || '',
      creditos: m.creditos || 3,
      semestre_sugerido: m.semestre_sugerido || 1,
    })
    setEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMateria) return
    if (!editForm.clave.trim() || !editForm.nombre.trim() || editForm.creditos <= 0) {
      toast.error('Completa los campos requeridos para la materia')
      return
    }
    try {
      setLoading(true)
      const { data, error } = await supabase.from('materias').update({
        clave: editForm.clave.trim(),
        nombre: editForm.nombre.trim(),
        descripcion: editForm.descripcion.trim() || null,
        creditos: editForm.creditos,
        semestre_sugerido: editForm.semestre_sugerido || null,
      }).eq('id', editingMateria.id).select().single()
      if (error) throw error
      toast.success('Materia actualizada')
      setEditOpen(false)
      setEditingMateria(null)
      await fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Error al actualizar materia')
    } finally {
      setLoading(false)
    }
  }

  // Deletion via UI is disabled by design.

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Materias</h1>

        <Card>
          <CardHeader>
            <CardTitle>Crear Materia</CardTitle>
            <CardDescription>Agregar una materia y asignarla opcionalmente a una carrera</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Clave</Label>
                  <Input value={form.clave} onChange={e => setForm({ ...form, clave: e.target.value })} placeholder="Clave (ej. MAT101)" />
                </div>
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre de la materia" />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción (opcional)" />
                </div>
                <div className="space-y-2">
                  <Label>Créditos</Label>
                  <Select value={String(form.creditos)} onValueChange={v => setForm({ ...form, creditos: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona créditos" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <SelectItem key={i+1} value={(i+1).toString()}>{i+1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Semestre sugerido</Label>
                  <Select value={String(form.semestre_sugerido)} onValueChange={v => setForm({ ...form, semestre_sugerido: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona semestre" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={s.toString()}>{s}° Sem</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Asignación a carrera dentro del mismo formulario */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Asignar a Carrera (opcional)</Label>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Select value={form.carrera_id} onValueChange={v => setForm({ ...form, carrera_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona carrera (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {carreras.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    <Select value={String(form.carrera_semestre)} onValueChange={v => setForm({ ...form, carrera_semestre: parseInt(v) })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Semestre en la carrera" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={s.toString()}>{s}° Sem</SelectItem>)}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <Checkbox checked={form.carrera_obligatoria} onCheckedChange={v => setForm({ ...form, carrera_obligatoria: v as boolean })} />
                      <Label>Obligatoria</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Guardando...' : 'Crear Materia'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Edit Materia Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Materia</DialogTitle>
              <DialogDescription>Modifica los datos de la materia</DialogDescription>
            </DialogHeader>
            {editingMateria ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Clave</Label>
                    <Input value={editForm.clave} onChange={e => setEditForm({ ...editForm, clave: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Descripción</Label>
                    <Input value={editForm.descripcion} onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Créditos</Label>
                    <Select value={String(editForm.creditos)} onValueChange={v => setEditForm({ ...editForm, creditos: parseInt(v) })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona créditos" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <SelectItem key={i+1} value={(i+1).toString()}>{i+1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semestre sugerido</Label>
                    <Select value={String(editForm.semestre_sugerido)} onValueChange={v => setEditForm({ ...editForm, semestre_sugerido: parseInt(v) })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona semestre" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={s.toString()}>{s}° Sem</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => { setEditOpen(false); setEditingMateria(null) }}>Cancelar</Button>
                  <Button type="submit">Guardar</Button>
                </div>
              </form>
            ) : (
              <div>Cargando...</div>
            )}
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Materias Existentes</CardTitle>
            <CardDescription>Listado de materias en el catálogo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
                {materias.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">No hay materias registradas</div>
              ) : (
                materias.map(m => (
                  <div key={m.id} className="p-3 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-medium">{m.nombre} ({m.clave})</div>
                      {m.descripcion && <div className="text-sm text-gray-500 dark:text-gray-400">{m.descripcion}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-600 dark:text-gray-300 mr-4">{m.creditos} créditos</div>
                      <Button size="sm" variant="outline" onClick={() => handleEditClick(m)}>Editar</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
