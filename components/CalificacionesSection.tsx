"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Plus,
  Edit2,
  X,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useCalificaciones } from "@/hooks/useCalificaciones";
import { useEstudiantes } from "@/hooks/useSupabase";
import { toast } from "sonner";
import { exportTablePDF } from "@/lib/pdf-utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export default function CalificacionesSection() {
  const [calificacionesPage, setCalificacionesPage] = useState(0);
  const { estudiantes } = useEstudiantes();
  const {
    calificaciones,
    loading,
    createCalificacion,
    updateCalificacion,
    deleteCalificacion,
    fetchCalificacionesByEstudiante,
  } = useCalificaciones();
  const { usuario } = useAuth();

  const [formData, setFormData] = useState({
    estudiante_id: "",
    materia: "",
    unidad: "",
    calificacion: "",
    semestre: 1,
  });

  // Obtiene el semestre del estudiante seleccionado
  const getSemestreEstudiante = (id: string) => {
    const estudiante = estudiantes.find((e) => e.id === id);
    return estudiante ? estudiante.semestre || 1 : 1;
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentForModal, setStudentForModal] = useState<any | null>(null);
  const [studentCalifs, setStudentCalifs] = useState<any[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [califForEditModal, setCalifForEditModal] = useState<any | null>(null);
  const [califEditForm, setCalifEditForm] = useState({
    unidad: "",
    calificacion: "",
    semestre: 1,
    materia: "",
  });
  const [searchAlumno, setSearchAlumno] = useState(""); // For filtering calificaciones list
  const [searchEstudianteForm, setSearchEstudianteForm] = useState(""); // For searching in the form

  // Estado para materias disponibles del docente
  const [materiasDisponibles, setMateriasDisponibles] = useState<string[]>([]);
  const [loadingMaterias, setLoadingMaterias] = useState(true);

  // Escuchar eventos de voz para abrir modal de nueva calificación
  useEffect(() => {
    const handleNuevaCalificacion = () => {
      console.log("Evento voz: Abrir modal nueva calificación");
      setShowForm(true);
    };

    window.addEventListener("voice-nueva-calificacion", handleNuevaCalificacion);

    return () => {
      window.removeEventListener("voice-nueva-calificacion", handleNuevaCalificacion);
    };
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.estudiante_id ||
      !formData.materia ||
      !formData.unidad ||
      !formData.calificacion
    ) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    const calif = parseFloat(formData.calificacion);
    if (isNaN(calif) || calif < 0 || calif > 100) {
      toast.error("La calificación debe estar entre 0 y 100");
      return;
    }

    try {
      // Validación cliente: evitar duplicado de unidad+materia para el mismo estudiante
      const duplicate = calificaciones.some(
        (c) =>
          c.estudiante_id === formData.estudiante_id &&
          c.materia === formData.materia &&
          String((c as any).unidad) === String(formData.unidad) &&
          c.id !== editingId
      );
      if (duplicate) {
        toast.error(
          "Ya existe una calificación para esta materia y unidad para el estudiante"
        );
        return;
      }

      if (editingId) {
        const payload: any = {
          materia: formData.materia,
          calificacion: calif,
          semestre: formData.semestre,
        };
        if (formData.unidad) payload.unidad = Number(formData.unidad);

        await updateCalificacion(editingId, payload);
        toast.success("Calificación actualizada exitosamente");
        setEditingId(null);
      } else {
        const payload: any = {
          estudiante_id: formData.estudiante_id,
          materia: formData.materia,
          calificacion: calif,
          semestre: formData.semestre,
        };
        if (formData.unidad) payload.unidad = Number(formData.unidad);

        await createCalificacion(payload);
        toast.success("Calificación registrada exitosamente");
      }

      setFormData({
        estudiante_id: "",
        materia: "",
        unidad: "",
        calificacion: "",
        semestre: 1,
      });
      setSearchEstudianteForm("");
      setShowForm(false);
    } catch (error) {
      toast.error("Error al guardar la calificación");
      console.error(error);
    }
  };

  const handleEdit = (calif: any) => {
    setFormData({
      estudiante_id: calif.estudiante_id,
      materia: calif.materia,
      unidad: String(calif.unidad || ""),
      calificacion: calif.calificacion.toString(),
      semestre: calif.semestre,
    });
    // Mostrar nombre en el buscador del formulario al entrar en edición
    const estForEdit = estudiantes.find((e) => e.id === calif.estudiante_id);
    if (estForEdit)
      setSearchEstudianteForm(
        `${estForEdit.nombre} ${estForEdit.apellido} - ${estForEdit.matricula}`.toUpperCase()
      );
    setEditingId(calif.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta calificación?")) {
      try {
        await deleteCalificacion(id);
        toast.success("Calificación eliminada exitosamente");
      } catch (error) {
        toast.error("Error al eliminar la calificación");
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      estudiante_id: "",
      materia: "",
      unidad: "",
      calificacion: "",
      semestre: 1,
    });
    setSearchEstudianteForm("");
    setEditingId(null);
    setShowForm(false);
  };

  const getEstudianteNombre = (id: string) => {
    const estudiante = estudiantes.find((e) => e.id === id);
    return estudiante
      ? `${(estudiante.nombre || "").toUpperCase()} ${(
          estudiante.apellido || ""
        ).toUpperCase()}`
      : "DESCONOCIDO";
  };

  const getPromedioEstudiante = (estudianteId: string, materia?: string) => {
    let califs = calificaciones.filter((c) => c.estudiante_id === estudianteId);
    if (materia) {
      califs = califs.filter((c) => c.materia === materia);
    }
    if (califs.length === 0) return "0.00";
    const suma = califs.reduce(
      (acc, c) => acc + Number(c.calificacion || 0),
      0
    );
    return (suma / califs.length).toFixed(2);
  };

  const exportCalificacionesCSV = async () => {
    try {
      // use current calificaciones state
      if (!calificaciones || calificaciones.length === 0) {
        toast.error("No hay calificaciones para exportar");
        return;
      }
      const rows = calificaciones.map((c: any) => {
        const est = estudiantes.find((e) => e.id === c.estudiante_id);
        return {
          id: c.id,
          estudiante_id: c.estudiante_id,
          estudiante: est
            ? `${(est.nombre || "").toUpperCase()} ${(
                est.apellido || ""
              ).toUpperCase()}`
            : "",
          matricula: est ? String(est.matricula || "").toUpperCase() : "",
          materia: String(c.materia || "").toUpperCase(),
          unidad: (c as any).unidad ?? "",
          calificacion: c.calificacion,
          semestre: c.semestre,
          created_at: c.created_at,
        };
      });
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
        `calificaciones_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("CSV generado");
    } catch (err) {
      console.error("Error exportando calificaciones CSV", err);
      toast.error("Error al exportar CSV");
    }
  };

  const exportCalificacionesPDF = async () => {
    try {
      if (!calificaciones || calificaciones.length === 0) {
        toast.error("No hay calificaciones para exportar");
        return;
      }
      const headers = [
        "Estudiante",
        "Matrícula",
        "Materia",
        "Unidad",
        "Calificación",
        "Promedio materia",
        "Semestre",
        "Fecha",
      ];
      const rows = calificaciones.map((c: any) => {
        const est = estudiantes.find((e: any) => e.id === c.estudiante_id);
        return [
          est
            ? `${(est.nombre || "").toUpperCase()} ${(
                est.apellido || ""
              ).toUpperCase()}`
            : String(c.estudiante_id || "").toUpperCase(),
          est ? String(est.matricula || "").toUpperCase() : "",
          String(c.materia || "").toUpperCase(),
          (c as any).unidad ? String((c as any).unidad) : "",
          typeof c.calificacion === "number"
            ? c.calificacion.toFixed(2)
            : String(Number(c.calificacion).toFixed(2)),
          getPromedioEstudiante(c.estudiante_id, c.materia),
          String(c.semestre || ""),
          c.created_at || "",
        ];
      });
      await exportTablePDF(
        "Calificaciones",
        headers,
        rows,
        `calificaciones_${new Date().toISOString().split("T")[0]}.pdf`
      );
      toast.success("PDF generado");
    } catch (err) {
      console.error("Error exportando calificaciones PDF", err);
      toast.error("Error al exportar PDF");
    }
  };

  const groupBy = (arr: any[], key: string) =>
    arr.reduce((acc: Record<string, any[]>, item) => {
      const k = item[key] || "Sin materia";
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    }, {});

  const openStudentModal = async (estudianteId: string) => {
    const estudiante = estudiantes.find((e) => e.id === estudianteId) || null;
    setStudentForModal(estudiante);
    try {
      const data = await fetchCalificacionesByEstudiante(estudianteId);
      setStudentCalifs(data || []);
    } catch (err) {
      console.error("Error cargando calificaciones del estudiante", err);
      setStudentCalifs([]);
    }
    setStudentModalOpen(true);
  };

  const openEditModalForCalif = (calif: any) => {
    setCalifForEditModal(calif);
    setCalifEditForm({
      unidad: String(calif.unidad || ""),
      calificacion: String(calif.calificacion),
      semestre: calif.semestre || 1,
      materia: calif.materia || "",
    });
    setEditModalOpen(true);
  };

  const handleEditModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!califForEditModal) return;
    try {
      const payload: any = {
        unidad: califEditForm.unidad ? Number(califEditForm.unidad) : undefined,
        calificacion: parseFloat(califEditForm.calificacion as string),
        semestre: califEditForm.semestre,
      };
      await updateCalificacion(califForEditModal.id, payload);
      // refrescar lista del modal
      if (studentForModal) {
        const data = await fetchCalificacionesByEstudiante(studentForModal.id);
        setStudentCalifs(data || []);
      }
      setEditModalOpen(false);
      setCalifForEditModal(null);
      toast.success("Calificación actualizada");
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar calificación");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Calificaciones</CardTitle>
            <CardDescription>
              Gestiona las calificaciones de los estudiantes
            </CardDescription>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Calificación
            </Button>
          )}
          <div className="flex gap-2 ml-2">
            <Button
              size="sm"
              variant="outline"
              onClick={exportCalificacionesCSV}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={exportCalificacionesPDF}
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent showCloseButton={false} className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>
                  {editingId ? "Editar Calificación" : "Nueva Calificación"}
                </DialogTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unidad">Unidad</Label>
                <Select
                  value={formData.unidad}
                  onValueChange={(value) =>
                    setFormData({ ...formData, unidad: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona unidad (1-5)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estudiante">Estudiante</Label>
                <div className="relative">
                  <Input
                    id="busqueda-estudiante"
                    value={searchEstudianteForm}
                    onChange={(e) => setSearchEstudianteForm(e.target.value)}
                    placeholder="Buscar estudiante por nombre o matrícula"
                    className="mb-2"
                    disabled={!!editingId}
                  />
                  {!editingId && searchEstudianteForm.trim() && (
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
                                `${est.nombre} ${est.apellido} - ${est.matricula}`.toUpperCase()
                              );
                            }}
                          >
                            {(
                              est.nombre +
                              " " +
                              est.apellido +
                              " - " +
                              est.matricula
                            ).toUpperCase()}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
                <Select
                  value={formData.estudiante_id}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      estudiante_id: value,
                      semestre: getSemestreEstudiante(value),
                    })
                  }
                  disabled={!!editingId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estudiante" />
                  </SelectTrigger>
                  <SelectContent>
                    {estudiantes.map((est) => (
                      <SelectItem key={est.id} value={est.id}>
                        {(
                          (est.nombre || "") +
                          " " +
                          (est.apellido || "") +
                          " - " +
                          (est.matricula || "")
                        ).toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="materia">Materia</Label>
                <Select
                  value={formData.materia}
                  onValueChange={(value) =>
                    setFormData({ ...formData, materia: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingMaterias
                          ? "Cargando..."
                          : "Selecciona una materia"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {materiasDisponibles.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        No hay materias asignadas
                      </div>
                    ) : (
                      materiasDisponibles.map((materia) => (
                        <SelectItem key={materia} value={materia}>
                          {String(materia).toUpperCase()}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="calificacion">Calificación (0-100)</Label>
                <Input
                  id="calificacion"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.calificacion}
                  onChange={(e) =>
                    setFormData({ ...formData, calificacion: e.target.value })
                  }
                  placeholder="0-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="semestre-calif">Semestre</Label>
                <div className="px-3 py-2 border rounded bg-gray-100 text-gray-700">
                  {formData.semestre}° Semestre
                </div>
              </div>

              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading
                    ? "Guardando..."
                    : editingId
                    ? "Actualizar"
                    : "Registrar"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div className="space-y-3">
          <Input
            id="busqueda-alumno"
            value={searchAlumno}
            onChange={(e) => setSearchAlumno(e.target.value)}
            placeholder="Buscar calificaciones por nombre o matrícula"
            className="mb-4"
          />
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Cargando calificaciones...
            </div>
          ) : calificaciones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay calificaciones registradas
            </div>
          ) : (
            <div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {calificaciones
                  .filter((calif) => {
                    const est = estudiantes.find(
                      (e) => e.id === calif.estudiante_id
                    );
                    if (!est) return false;
                    return (
                      est.nombre
                        .toLowerCase()
                        .includes(searchAlumno.toLowerCase()) ||
                      est.apellido
                        .toLowerCase()
                        .includes(searchAlumno.toLowerCase()) ||
                      est.matricula
                        .toLowerCase()
                        .includes(searchAlumno.toLowerCase())
                    );
                  })
                  .slice(calificacionesPage * 9, (calificacionesPage + 1) * 9)
                  .map((calif) => (
                    <div
                      key={calif.id}
                      className="flex flex-col p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() =>
                                openStudentModal(calif.estudiante_id)
                              }
                              className="font-medium text-sm text-left hover:underline"
                            >
                              {getEstudianteNombre(calif.estudiante_id)}
                            </button>
                            <Badge variant="secondary" className="text-xs">
                              {calif.semestre}° Sem
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {String(calif.materia || "").toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500">
                            <div>Calificación:</div>
                            <div className="font-semibold">
                              {(calif as any).unidad
                                ? `Unidad ${(calif as any).unidad} — `
                                : ""}
                              {typeof calif.calificacion === "number"
                                ? calif.calificacion.toFixed(2)
                                : Number(calif.calificacion).toFixed(2)}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 ml-4">
                            <div>Promedio:</div>
                            <div className="font-semibold">
                              {getPromedioEstudiante(
                                calif.estudiante_id,
                                calif.materia
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(calif)}
                                  aria-label="Editar calificación"
                                >
                                  <Edit2
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                  />
                                  <span className="sr-only">Editar</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(calif.id)}
                                  aria-label="Eliminar calificación"
                                >
                                  <Trash2
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                  />
                                  <span className="sr-only">Eliminar</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Eliminar</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              {/* Modal: calificaciones por estudiante */}
              <Dialog
                open={studentModalOpen}
                onOpenChange={setStudentModalOpen}
              >
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      Calificaciones de{" "}
                      {studentForModal
                        ? `${(studentForModal.nombre || "").toUpperCase()} ${(
                            studentForModal.apellido || ""
                          ).toUpperCase()}`
                        : ""}
                    </DialogTitle>
                    <DialogDescription>
                      Listado de calificaciones agrupadas por materia
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {studentCalifs.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        No hay calificaciones para este estudiante
                      </div>
                    ) : (
                      Object.entries(groupBy(studentCalifs, "materia")).map(
                        ([materia, items]) => {
                          const materiaItems = items as any[];
                          const suma = materiaItems.reduce(
                            (acc, it) => acc + Number(it.calificacion || 0),
                            0
                          );
                          const promedio =
                            materiaItems.length > 0
                              ? (suma / materiaItems.length).toFixed(2)
                              : "0.00";
                          return (
                            <div key={materia} className="border rounded p-3">
                              <div className="flex items-center justify-between">
                                <div className="font-medium mb-2">
                                  {String(materia).toUpperCase()}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Promedio materia:{" "}
                                  <span className="font-semibold">
                                    {promedio}
                                  </span>{" "}
                                  ({materiaItems.length})
                                </div>
                              </div>
                              <div className="space-y-2">
                                {materiaItems.map((c) => (
                                  <div
                                    key={c.id}
                                    className="flex items-center justify-between"
                                  >
                                    <div>
                                      <div className="text-sm">
                                        {c.unidad
                                          ? `Unidad ${c.unidad} — `
                                          : ""}
                                        {typeof c.calificacion === "number"
                                          ? c.calificacion.toFixed(2)
                                          : Number(c.calificacion).toFixed(2)}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Semestre: {c.semestre}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openEditModalForCalif(c)}
                                      >
                                        Editar
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      )
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit calificación modal */}
              <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Editar Calificación</DialogTitle>
                    <DialogDescription>
                      Modifica la calificación seleccionada
                    </DialogDescription>
                  </DialogHeader>
                  {califForEditModal ? (
                    <form
                      onSubmit={handleEditModalSubmit}
                      className="space-y-4"
                    >
                      <div>
                        <Label>Materia</Label>
                        <div className="px-3 py-2 border rounded bg-gray-100">
                          {String(
                            califForEditModal.materia || ""
                          ).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <Label>Unidad</Label>
                        <Select
                          value={califEditForm.unidad}
                          onValueChange={(v) =>
                            setCalifEditForm({ ...califEditForm, unidad: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona unidad (1-5)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Calificación</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={califEditForm.calificacion}
                          onChange={(e) =>
                            setCalifEditForm({
                              ...califEditForm,
                              calificacion: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Semestre</Label>
                        <Input
                          type="number"
                          value={String(califEditForm.semestre)}
                          onChange={(e) =>
                            setCalifEditForm({
                              ...califEditForm,
                              semestre: parseInt(e.target.value || "1"),
                            })
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Guardar</Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditModalOpen(false);
                            setCalifForEditModal(null);
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
              <div className="flex justify-center gap-2 mt-4">
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  disabled={calificacionesPage === 0}
                  onClick={() => setCalificacionesPage(calificacionesPage - 1)}
                >
                  Anterior
                </button>
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  disabled={
                    (calificacionesPage + 1) * 9 >=
                    calificaciones.filter((calif) => {
                      const est = estudiantes.find(
                        (e) => e.id === calif.estudiante_id
                      );
                      if (!est) return false;
                      return (
                        est.nombre
                          .toLowerCase()
                          .includes(searchAlumno.toLowerCase()) ||
                        est.apellido
                          .toLowerCase()
                          .includes(searchAlumno.toLowerCase()) ||
                        est.matricula
                          .toLowerCase()
                          .includes(searchAlumno.toLowerCase())
                      );
                    }).length
                  }
                  onClick={() => setCalificacionesPage(calificacionesPage + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
