"use client";

import { useState } from "react";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useEstudiantes } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { exportTablePDF } from "@/lib/pdf-utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function EventosAcademicosSection() {
  const { estudiantes } = useEstudiantes();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    estudiante_id: "",
    tipo_evento: "",
    materia: "",
    semestre: 1,
    descripcion: "",
    severidad: 1,
    fecha_evento: new Date().toISOString().slice(0, 10),
  });

  const [searchEstudianteForm, setSearchEstudianteForm] = useState("");
  const [recentEventos, setRecentEventos] = useState<any[]>([]);

  const [editingEvento, setEditingEvento] = useState<any | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    tipo_evento: "",
    materia: "",
    semestre: 1,
    descripcion: "",
    severidad: 1,
    fecha_evento: new Date().toISOString().slice(0, 10),
  });
  const { usuario } = useAuth();

  // Estado para materias disponibles del docente
  const [materiasDisponibles, setMateriasDisponibles] = useState<string[]>([]);
  const [loadingMaterias, setLoadingMaterias] = useState(true);

  // Fetch materias asignadas al docente
  useEffect(() => {
    const fetchMaterias = async () => {
      if (!usuario?.id) {
        setLoadingMaterias(false);
        return;
      }

      try {
        setLoadingMaterias(true);

        const { data, error } = await supabase
          .from("docente_materias")
          .select(
            `
            materia:materias(nombre)
          `
          )
          .eq("docente_id", usuario.id);

        if (error) {
          console.error("Error fetching docente materias:", error);
          setMateriasDisponibles([]);
          return;
        }

        const uniqueMaterias = new Set<string>();
        data?.forEach((item: any) => {
          if (item.materia?.nombre) {
            uniqueMaterias.add(item.materia.nombre.toUpperCase());
          }
        });

        setMateriasDisponibles(Array.from(uniqueMaterias));
      } catch (err) {
        console.error("Error in fetchMaterias:", err);
        setMateriasDisponibles([]);
      } finally {
        setLoadingMaterias(false);
      }
    };

    fetchMaterias();
  }, [usuario?.id]);

  const fetchRecentEventos = async () => {
    try {
      // Intentar ordenar por fecha_evento si existe, sino por created_at
      const { data } = await supabase
        .from("eventos_academicos")
        .select("*")
        .order("fecha_evento", { ascending: false })
        .limit(5);

      setRecentEventos(data || []);
    } catch (err) {
      console.error("Error fetching recent eventos", err);
      setRecentEventos([]);
    }
  };

  useEffect(() => {
    fetchRecentEventos();
  }, []);

  const exportEventosCSV = async () => {
    try {
      const { data } = await supabase
        .from("eventos_academicos")
        .select("*")
        .order("fecha_evento", { ascending: false });
      if (!data || data.length === 0) {
        toast.error("No hay eventos para exportar");
        return;
      }
      const rows = data.map((ev: any) => ({
        id: ev.id,
        estudiante_id: ev.estudiante_id,
        tipo_evento: ev.tipo_evento,
        materia: ev.materia,
        semestre: ev.semestre,
        descripcion: ev.descripcion,
        severidad: ev.severidad,
        fecha_evento: ev.fecha_evento,
        created_at: ev.created_at,
      }));
      const headers = Object.keys(rows[0]);
      const csvContent = [
        headers.join(","),
        ...rows.map((r: any) =>
          headers
            .map((h: any) => {
              const v = r[h];
              if (v === null || v === undefined) return "";
              const s = String(v);
              return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s;
            })
            .join(",")
        ),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `eventos_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("CSV generado");
    } catch (err) {
      console.error("Error exportando eventos CSV", err);
      toast.error("Error al exportar CSV");
    }
  };

  const exportEventosPDF = async () => {
    try {
      const { data } = await supabase
        .from("eventos_academicos")
        .select("*")
        .order("fecha_evento", { ascending: false });
      if (!data || data.length === 0) {
        toast.error("No hay eventos para exportar");
        return;
      }
      const headers = [
        "Fecha",
        "Estudiante",
        "Matrícula",
        "Tipo",
        "Materia",
        "Semestre",
        "Descripción",
        "Severidad",
      ];
      const rows = data.map((ev: any) => {
        const est = estudiantes.find((e: any) => e.id === ev.estudiante_id);
        return [
          ev.fecha_evento || ev.created_at || "",
          est ? `${est.nombre} ${est.apellido}` : "",
          est ? est.matricula : "",
          ev.tipo_evento || "",
          ev.materia || "",
          String(ev.semestre || ""),
          ev.descripcion || "",
          String(ev.severidad ?? ""),
        ];
      });
      await exportTablePDF(
        "Eventos Académicos",
        headers,
        rows,
        `eventos_${new Date().toISOString().split("T")[0]}.pdf`
      );
      toast.success("PDF generado");
    } catch (err) {
      console.error("Error exportando eventos PDF", err);
      toast.error("Error al exportar PDF");
    }
  };

  const openEdit = (ev: any) => {
    setEditingEvento(ev);
    setEditForm({
      tipo_evento: ev.tipo_evento || "",
      materia: ev.materia || "",
      semestre: ev.semestre || 1,
      descripcion: ev.descripcion || "",
      severidad: ev.severidad || 1,
      fecha_evento: ev.fecha_evento
        ? ev.fecha_evento.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvento) return;
    try {
      setLoading(true);
      const payload: any = {
        tipo_evento: editForm.tipo_evento,
        materia: editForm.materia,
        semestre: editForm.semestre,
        descripcion: editForm.descripcion,
        severidad: editForm.severidad,
        fecha_evento: editForm.fecha_evento,
      };
      const { error } = await supabase
        .from("eventos_academicos")
        .update(payload)
        .eq("id", editingEvento.id);
      if (error) throw error;
      toast.success("Evento actualizado");
      setEditModalOpen(false);
      setEditingEvento(null);
      fetchRecentEventos();
    } catch (err) {
      console.error("Error updating evento", err);
      toast.error("Error al actualizar evento");
    } finally {
      setLoading(false);
    }
  };

  // Obtiene el semestre del estudiante seleccionado
  const getSemestreEstudiante = (id: string) => {
    const estudiante = estudiantes.find((e) => e.id === id);
    return estudiante ? estudiante.semestre || 1 : 1;
  };

  const tipos = ["Falta", "Sanción", "Actividad", "Otro"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.estudiante_id ||
      !formData.tipo_evento ||
      !formData.materia ||
      !formData.fecha_evento
    ) {
      toast.error("Completa los campos requeridos");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.from("eventos_academicos").insert([
        {
          estudiante_id: formData.estudiante_id,
          tipo_evento: formData.tipo_evento,
          materia: formData.materia,
          semestre: formData.semestre,
          descripcion: formData.descripcion,
          severidad: formData.severidad,
          fecha_evento: formData.fecha_evento,
        },
      ]);
      if (error) throw error;
      toast.success("Evento académico registrado");
      setFormData({
        estudiante_id: "",
        tipo_evento: "",
        materia: "",
        semestre: 1,
        descripcion: "",
        severidad: 1,
        fecha_evento: new Date().toISOString().slice(0, 10),
      });
      // refrescar historial
      fetchRecentEventos();
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar evento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Eventos Académicos</CardTitle>
            <CardDescription>
              Registra eventos relevantes por estudiante
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportEventosCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button size="sm" variant="outline" onClick={exportEventosPDF}>
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Estudiante</Label>
              <div className="relative">
                <Input
                  id="busqueda-estudiante-evento"
                  value={searchEstudianteForm}
                  onChange={(e) => setSearchEstudianteForm(e.target.value)}
                  placeholder="Buscar estudiante por nombre o matrícula"
                  className="mb-2"
                />
                {searchEstudianteForm.trim() && (
                  <ul className="border rounded bg-white shadow max-h-40 overflow-y-auto absolute z-10 w-full">
                    {estudiantes
                      .filter(
                        (est) =>
                          est.nombre
                            .toLowerCase()
                            .includes(searchEstudianteForm.toLowerCase()) ||
                          est.apellido
                            .toLowerCase()
                            .includes(searchEstudianteForm.toLowerCase()) ||
                          est.matricula
                            .toLowerCase()
                            .includes(searchEstudianteForm.toLowerCase())
                      )
                      .map((est) => (
                        <li
                          key={est.id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              estudiante_id: est.id,
                              semestre: getSemestreEstudiante(est.id),
                            });
                            setSearchEstudianteForm(
                              `${est.nombre} ${est.apellido} - ${est.matricula}`
                            );
                          }}
                        >
                          {est.nombre} {est.apellido} - {est.matricula}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
              <Select
                value={formData.estudiante_id}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    estudiante_id: v,
                    semestre: getSemestreEstudiante(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estudiante" />
                </SelectTrigger>
                <SelectContent>
                  {estudiantes.map((est) => (
                    <SelectItem key={est.id} value={est.id}>
                      {est.nombre} {est.apellido} - {est.matricula}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de evento</Label>
              <Select
                value={formData.tipo_evento}
                onValueChange={(v) =>
                  setFormData({ ...formData, tipo_evento: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Materia</Label>
              <Select
                value={formData.materia}
                onValueChange={(v) => setFormData({ ...formData, materia: v })}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingMaterias ? "Cargando..." : "Selecciona una materia"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {materiasDisponibles.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      No hay materias asignadas
                    </div>
                  ) : (
                    materiasDisponibles.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Semestre</Label>
              <Select
                value={formData.semestre.toString()}
                onValueChange={(v) =>
                  setFormData({ ...formData, semestre: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona semestre" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <SelectItem key={s} value={s.toString()}>
                      {s}° Sem
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Descripción</Label>
              <Input
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Severidad</Label>
              <Select
                value={String(formData.severidad)}
                onValueChange={(v) =>
                  setFormData({ ...formData, severidad: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona severidad" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <SelectItem key={s} value={s.toString()}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha del evento</Label>
              <Input
                type="date"
                value={formData.fecha_evento}
                onChange={(e) =>
                  setFormData({ ...formData, fecha_evento: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Guardando..." : "Registrar Evento"}
            </Button>
          </div>
        </form>
        {/* Historial reciente de eventos (zona inferior) */}
        <div className="mt-6">
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-lg font-semibold">Últimos Eventos</div>
                <div className="text-sm text-gray-500">
                  Últimos 5 eventos registrados
                </div>
              </div>
            </div>
            {recentEventos.length === 0 ? (
              <div className="text-sm text-gray-500">
                No hay eventos recientes
              </div>
            ) : (
              <div className="space-y-2">
                {recentEventos.map((ev) => {
                  const est = estudiantes.find(
                    (e) => e.id === ev.estudiante_id
                  );
                  return (
                    <div key={ev.id} className="border rounded p-2 bg-gray-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-medium">
                            {ev.tipo_evento} — {ev.materia}
                          </div>
                          <div className="text-xs text-gray-600">
                            {ev.descripcion}
                          </div>
                          <div className="text-xs text-gray-500">
                            {est
                              ? `${est.nombre} ${est.apellido} (${est.matricula})`
                              : "Estudiante desconocido"}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xs text-gray-400">
                            {ev.fecha_evento || ev.created_at}
                          </div>
                          <div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(ev)}
                            >
                              Editar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Edit modal for eventos */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
            <DialogDescription>Modifica los datos del evento</DialogDescription>
          </DialogHeader>
          {editingEvento ? (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label>Tipo de evento</Label>
                <Select
                  value={editForm.tipo_evento}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, tipo_evento: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Materia</Label>
                <Select
                  value={editForm.materia}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, materia: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {materiasDisponibles.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descripción</Label>
                <Input
                  value={editForm.descripcion}
                  onChange={(e) =>
                    setEditForm({ ...editForm, descripcion: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Severidad</Label>
                  <Select
                    value={String(editForm.severidad)}
                    onValueChange={(v) =>
                      setEditForm({ ...editForm, severidad: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona severidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <SelectItem key={s} value={s.toString()}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha del evento</Label>
                  <Input
                    type="date"
                    value={editForm.fecha_evento}
                    onChange={(e) =>
                      setEditForm({ ...editForm, fecha_evento: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Guardar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingEvento(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <div>Cargando...</div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
