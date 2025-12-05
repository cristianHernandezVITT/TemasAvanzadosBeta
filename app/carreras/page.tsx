"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function CarrerasPage() {
  const [loading, setLoading] = useState(false)
  const [carreras, setCarreras] = useState<any[]>([])
  const [form, setForm] = useState({ nombre: '', descripcion: '', activo: true })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nombre: '', descripcion: '', activo: true })
  const [editModalOpen, setEditModalOpen] = useState(false)

  useEffect(() => {
    fetchCarreras()
  }, [])

  const fetchCarreras = async () => {
    try {
      const { data } = await supabase.from('carreras').select('*').order('nombre')
      setCarreras(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const startEdit = (c: any) => {
    setEditingId(c.id)
    setEditForm({ nombre: c.nombre || '', descripcion: c.descripcion || '', activo: !!c.activo })
    setEditModalOpen(true)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ nombre: '', descripcion: '', activo: true })
    setEditModalOpen(false)
  }

  const saveEdit = async (id: string) => {
    if (!editForm.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    try {
      setLoading(true)
      const { error } = await supabase.from('carreras').update({ nombre: editForm.nombre.trim(), descripcion: editForm.descripcion.trim() || null, activo: editForm.activo }).eq('id', id)
      if (error) throw error
      toast.success('Carrera actualizada')
      cancelEdit()
      await fetchCarreras()
    } catch (err) {
      console.error(err)
      toast.error('Error al actualizar la carrera')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    try {
      setLoading(true)
      const { error } = await supabase.from('carreras').insert([{ nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null, activo: form.activo }])
      if (error) throw error
      toast.success('Carrera creada')
      setForm({ nombre: '', descripcion: '', activo: true })
      await fetchCarreras()
    } catch (err) {
      console.error(err)
      toast.error('Error al crear la carrera')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Carreras</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Crear Carrera</CardTitle>
              <CardDescription>Agrega una nueva carrera</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre de la carrera" />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción (opcional)" />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={form.activo} onCheckedChange={v => setForm({ ...form, activo: v as boolean })} />
                  <Label>Activa</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Guardando...' : 'Crear Carrera'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Carreras Existentes</CardTitle>
              <CardDescription>Lista de carreras registradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {carreras.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No hay carreras registradas</div>
                ) : (
                  carreras.map(c => (
                    <div key={c.id} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{c.nombre}</div>
                        {c.descripcion && <div className="text-sm text-gray-500 dark:text-gray-400">{c.descripcion}</div>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-600 dark:text-gray-300">{c.activo ? 'Activa' : 'Inactiva'}</div>
                        <Button size="sm" variant="ghost" onClick={() => startEdit(c)}>Editar</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          {/* Modal para editar carrera */}
          <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Carrera</DialogTitle>
                <DialogDescription>Modifica los datos de la carrera</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input value={editForm.descripcion} onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={editForm.activo} onCheckedChange={v => setEditForm({ ...editForm, activo: v as boolean })} />
                  <Label>Activa</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => editingId && saveEdit(editingId)} disabled={loading} className="flex-1">{loading ? 'Guardando...' : 'Guardar'}</Button>
                  <Button variant="outline" onClick={cancelEdit}>Cancelar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
