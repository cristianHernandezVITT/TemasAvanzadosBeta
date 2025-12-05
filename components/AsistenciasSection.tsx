import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAsistencias } from '@/hooks/useAsistencias'
import { useEstudiantes } from '@/hooks/useSupabase'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { exportTablePDF } from '@/lib/pdf-utils'

export default function AsistenciasSection() {
  const [modalOpen, setModalOpen] = useState(false)
  const [searchModalAlumno, setSearchModalAlumno] = useState('')
  const getEstudianteNombre = (id: string) => {
    const estudiante = estudiantes.find(e => e.id === id)
    return estudiante ? `${estudiante.nombre.toUpperCase()} ${estudiante.apellido.toUpperCase()}` : 'DESCONOCIDO'
  }
  const { estudiantes } = useEstudiantes()
  const { usuario } = useAuth()
  const { asistencias, loading, createAsistencia, updateAsistencia } = useAsistencias()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingAsistencia, setEditingAsistencia] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({ materia: '', presente: false, semestre: 1 })
  const today = new Date().toISOString().slice(0, 10)
  const [formData, setFormData] = useState({
    estudiante_id: '',
    materia: '',
    fecha: today,
    presente: false,
    semestre: 1,
  })
  // La fecha debe ser siempre la fecha actual y no seleccionable por el usuario
  const [searchAlumno, setSearchAlumno] = useState('')
  const [asistenciasPage, setAsistenciasPage] = useState(0)
  
  // Estado para materias disponibles del docente
  const [materiasDisponibles, setMateriasDisponibles] = useState<string[]>([])
  const [loadingMaterias, setLoadingMaterias] = useState(true)

  // Fetch materias asignadas al docente
  useEffect(() => {
    const fetchMaterias = async () => {
      if (!usuario?.id) {
        setLoadingMaterias(false)
        return
      }

      try {
        setLoadingMaterias(true)
        
        const { data, error } = await supabase
          .from('docente_materias')
          .select(`
            materia:materias(nombre)
          `)
          .eq('docente_id', usuario.id)

        if (error) {
          console.error('Error fetching docente materias:', error)
          setMateriasDisponibles([])
          return
        }

        const uniqueMaterias = new Set<string>()
        data?.forEach((item: any) => {
          if (item.materia?.nombre) {
            uniqueMaterias.add(item.materia.nombre.toUpperCase())
          }
        })

        setMateriasDisponibles(Array.from(uniqueMaterias))
      } catch (err) {
        console.error('Error in fetchMaterias:', err)
        setMateriasDisponibles([])
      } finally {
        setLoadingMaterias(false)
      }
    }

    fetchMaterias()
  }, [usuario?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.estudiante_id || !formData.materia || !formData.fecha) {
      toast.error('Completa todos los campos requeridos')
      return
    }
    try {
      await createAsistencia({
        estudiante_id: formData.estudiante_id,
        materia: formData.materia,
        fecha: formData.fecha,
        presente: formData.presente,
        semestre: formData.semestre,
      })
      toast.success('Asistencia registrada')
      // Restaurar formulario con fecha actual
      const today = new Date().toISOString().slice(0, 10)
      setFormData({ estudiante_id: '', materia: '', fecha: today, presente: false, semestre: 1 })
    } catch (error) {
      toast.error('Error al registrar asistencia')
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAsistencia) return
    try {
      await updateAsistencia(editingAsistencia.identificacion, {
        materia: editForm.materia,
        presente: editForm.presente,
        semestre: editForm.semestre,
      })
      toast.success('Asistencia actualizada')
      setEditModalOpen(false)
      setEditingAsistencia(null)
    } catch (error) {
      console.error(error)
      toast.error('Error al actualizar asistencia')
    }
  }

  const exportAsistenciasCSV = async () => {
    try {
      if (!asistencias || asistencias.length === 0) { toast.error('No hay asistencias para exportar'); return }
      const rows = asistencias.map((a: any) => ({
        identificacion: a.identificacion || '',
        estudiante_id: a.estudiante_id,
        estudiante: (estudiantes.find(e => e.id === a.estudiante_id) ? `${estudiantes.find(e => e.id === a.estudiante_id)!.nombre.toUpperCase()} ${estudiantes.find(e => e.id === a.estudiante_id)!.apellido.toUpperCase()}` : ''),
        matricula: (estudiantes.find(e => e.id === a.estudiante_id) ? estudiantes.find(e => e.id === a.estudiante_id)!.matricula : ''),
        materia: String(a.materia || '').toUpperCase(),
        fecha: a.fecha,
        presente: a.presente ? 'PRESENTE' : 'AUSENTE',
        semestre: a.semestre,
      }))
      const headers = Object.keys(rows[0])
      const csvContent = [headers.join(','), ...rows.map((r: any) => headers.map((h: any) => {
        const v = r[h]
        if (v === null || v === undefined) return ''
        const s = String(v)
        return s.includes(',') ? `"${s.replace(/"/g, '""')}"` : s
      }).join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `asistencias_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('CSV generado')
    } catch (err) {
      console.error('Error exportando asistencias CSV', err)
      toast.error('Error al exportar CSV')
    }
  }

  const exportAsistenciasPDF = async () => {
    try {
      if (!asistencias || asistencias.length === 0) { toast.error('No hay asistencias para exportar'); return }
      const headers = ['Fecha','Estudiante','Matrícula','Materia','Presente','Semestre']
          const rows = asistencias.map((a: any) => {
        const est = estudiantes.find((e:any) => e.id === a.estudiante_id)
        return [
          a.fecha || '',
          est ? `${est.nombre.toUpperCase()} ${est.apellido.toUpperCase()}` : '',
          est ? est.matricula : '',
          String(a.materia || '').toUpperCase(),
          a.presente ? 'PRESENTE' : 'AUSENTE',
          String(a.semestre || ''),
        ]
      })
      await exportTablePDF('Registro de Asistencias', headers, rows, `asistencias_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF generado')
    } catch (err) {
      console.error('Error exportando asistencias PDF', err)
      toast.error('Error al exportar PDF')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Registro de Asistencias</CardTitle>
            <CardDescription>Marca la asistencia de los estudiantes</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportAsistenciasCSV}><FileSpreadsheet className="w-4 h-4 mr-2" />CSV</Button>
            <Button size="sm" variant="outline" onClick={exportAsistenciasPDF}><FileText className="w-4 h-4 mr-2" />PDF</Button>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>Ver asistencias</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Consultar asistencias</DialogTitle>
              <DialogDescription>Filtra las asistencias por estudiante.</DialogDescription>
            </DialogHeader>
            <Input
              value={searchModalAlumno}
              onChange={e => setSearchModalAlumno(e.target.value)}
              placeholder="Buscar por nombre, apellido o matrícula"
              className="mb-4"
            />
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {asistencias
                .filter(a => {
                  if (!searchModalAlumno.trim()) return true
                  const est = estudiantes.find(e => e.id === a.estudiante_id)
                  if (!est) return false
                  return (
                    est.nombre.toLowerCase().includes(searchModalAlumno.toLowerCase()) ||
                    est.apellido.toLowerCase().includes(searchModalAlumno.toLowerCase()) ||
                    est.matricula.toLowerCase().includes(searchModalAlumno.toLowerCase())
                  )
                })
                  .map((asistencia, idx) => (
                  <div key={asistencia.identificacion || `${asistencia.estudiante_id}-${asistencia.fecha}-${idx}`} className="border rounded p-2 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <div>
                      <span className="font-medium">{getEstudianteNombre(asistencia.estudiante_id)}</span> - <span>{String(asistencia.materia || '').toUpperCase()}</span> - <span>{asistencia.fecha}</span>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{asistencia.presente ? 'PRESENTE' : 'AUSENTE'}</span>
                    </div>
                    <span className="text-xs text-gray-500">Semestre: {asistencia.semestre}</span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        // Abrir modal de edición
                        setEditingAsistencia(asistencia)
                        setEditForm({ materia: asistencia.materia, presente: asistencia.presente, semestre: asistencia.semestre || 1 })
                        setEditModalOpen(true)
                      }}>Editar</Button>
                    </div>
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de edición de asistencia */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Asistencia</DialogTitle>
              <DialogDescription>Modifica la asistencia seleccionada</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input value={editingAsistencia?.fecha || ''} disabled readOnly />
              </div>
              <div className="space-y-2">
                <Label>Materia</Label>
                <Select value={editForm.materia} onValueChange={value => setEditForm({ ...editForm, materia: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {materiasDisponibles.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">No hay materias asignadas</div>
                    ) : (
                      materiasDisponibles.map(materia => (
                        <SelectItem key={materia} value={materia}>{materia}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Semestre</Label>
                <Select value={String(editForm.semestre)} onValueChange={value => setEditForm({ ...editForm, semestre: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona semestre" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <SelectItem key={sem} value={sem.toString()}>{sem}° Semestre</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-center">
                <Label>Presente</Label>
                <input type="checkbox" checked={editForm.presente} onChange={e => setEditForm({ ...editForm, presente: e.target.checked })} className="ml-2" />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Guardar cambios</Button>
                <Button type="button" variant="outline" onClick={() => { setEditModalOpen(false); setEditingAsistencia(null) }}>Cancelar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 relative">
              <Label htmlFor="estudiante">Estudiante</Label>
              <Input
                id="busqueda-estudiante"
                value={searchAlumno}
                onChange={e => setSearchAlumno(e.target.value)}
                placeholder="Buscar estudiante por nombre o matrícula"
                className="mb-2"
              />
              {searchAlumno.trim() && (
                <ul className="border rounded bg-white shadow max-h-40 overflow-y-auto absolute z-10 w-full">
                  {estudiantes
                    .filter(est =>
                      est.nombre.toLowerCase().includes(searchAlumno.toLowerCase()) ||
                      est.apellido.toLowerCase().includes(searchAlumno.toLowerCase()) ||
                      est.matricula.toLowerCase().includes(searchAlumno.toLowerCase())
                    )
                    .map((est) => (
                      <li
                        key={est.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            estudiante_id: est.id,
                            semestre: est.semestre || 1
                          })
                          setSearchAlumno(`${est.nombre} ${est.apellido} - ${est.matricula}`)
                        }}
                      >
                        {est.nombre.toUpperCase()} {est.apellido.toUpperCase()} - {est.matricula}
                      </li>
                    ))}
                </ul>
              )}
              <Select value={formData.estudiante_id} onValueChange={value => {
                const est = estudiantes.find(e => e.id === value)
                setFormData({
                  ...formData,
                  estudiante_id: value,
                  semestre: est?.semestre || 1
                })
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estudiante" />
                </SelectTrigger>
                <SelectContent>
                  {estudiantes.map(est => (
                    <SelectItem key={est.id} value={est.id}>
                      {est.nombre.toUpperCase()} {est.apellido.toUpperCase()} - {est.matricula}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="materia">Materia</Label>
              <Select
                value={formData.materia}
                onValueChange={value => setFormData({ ...formData, materia: value })}
                disabled={loadingMaterias}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingMaterias ? "Cargando materias..." : "Selecciona una materia"} />
                </SelectTrigger>
                <SelectContent>
                  {materiasDisponibles.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No hay materias asignadas</div>
                  ) : (
                    materiasDisponibles.map(materia => (
                      <SelectItem key={materia} value={materia}>
                        {String(materia).toUpperCase()}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  required
                  disabled
                  readOnly
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="semestre">Semestre</Label>
              <Select value={formData.semestre.toString()} onValueChange={value => setFormData({ ...formData, semestre: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el semestre" />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8].map(sem => (
                    <SelectItem key={sem} value={sem.toString()}>{sem}° Semestre</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-center">
              <Label htmlFor="presente">Presente</Label>
              <input id="presente" type="checkbox" checked={formData.presente} onChange={e => setFormData({ ...formData, presente: e.target.checked })} className="ml-2" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Registrando...' : 'Registrar Asistencia'}</Button>
        </form>
        <div className="mt-8">
          <h3 className="font-semibold mb-2">Últimas asistencias</h3>
          <div className="space-y-2">
            {asistencias
              .slice(asistenciasPage * 5, (asistenciasPage + 1) * 5)
                    .map((asistencia, idx) => (
                <div key={asistencia.identificacion || `${asistencia.estudiante_id}-${asistencia.fecha}-${idx}`} className="border rounded p-2 flex justify-between items-center">
                  <div className="text-xs">
                    <span className="font-medium">{getEstudianteNombre(asistencia.estudiante_id)}</span> - <span>{asistencia.materia}</span> - <span>{asistencia.fecha}</span>
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700">{asistencia.presente ? 'Presente' : 'Ausente'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">Semestre: {asistencia.semestre}</span>
                    <Button size="sm" variant="outline" onClick={() => {
                      setEditingAsistencia(asistencia)
                      setEditForm({ materia: asistencia.materia, presente: asistencia.presente, semestre: asistencia.semestre || 1 })
                      setEditModalOpen(true)
                    }}>Editar</Button>
                  </div>
                </div>
              ))}
          </div>
          <div className="flex justify-center gap-2 mt-4">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={asistenciasPage === 0}
              onClick={() => setAsistenciasPage(asistenciasPage - 1)}
            >Anterior</button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={(asistenciasPage + 1) * 4 >= asistencias.length}
              onClick={() => setAsistenciasPage(asistenciasPage + 1)}
            >Siguiente</button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
