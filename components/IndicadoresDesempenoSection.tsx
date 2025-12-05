"use client";

import { useEffect, useState } from "react";
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
import { useCalificaciones } from "@/hooks/useCalificaciones";
import { supabase } from "@/lib/supabase";
import { exportTablePDF } from "@/lib/pdf-utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function IndicadoresDesempenoSection() {
  const { estudiantes } = useEstudiantes();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    estudiante_id: "",
    semestre: 1,
    materia: "",
    riesgo_reprobacion: 0,
    probabilidad_desercion: 0,
    nivel_compromiso: 0,
    tendencia_rendimiento: "",
    historial_reprobaciones: 0,
    materias_reprobadas: 0,
    materias_aprobadas: 0,
  });

  const [searchEstudianteForm, setSearchEstudianteForm] = useState("");
  const [recentIndicadores, setRecentIndicadores] = useState<any[]>([]);
  const [recentSearch, setRecentSearch] = useState("");
  const { fetchCalificacionesByEstudiante } = useCalificaciones();
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

  // Threshold and simple mappings (assumptions):
  // - Passing grade threshold: 60 (>=60 = aprobado)
  // - Riesgo (%) approximated as (100 - promedioMateria)
  // - Probabilidad de deserción derived from riesgo with buckets
  // - Nivel de compromiso inverso al riesgo (1..5), editable by user
  const PASS_THRESHOLD = 60;

  const computeIndicadores = async (
    estudianteId?: string,
    materia?: string
  ) => {
    if (!estudianteId) return;
    try {
      const califs = await fetchCalificacionesByEstudiante(estudianteId);
      // historial: unidades reprobadas (calificacion < PASS_THRESHOLD)
      const unidadesReprobadas = califs.filter(
        (c: any) => Number(c.calificacion) < PASS_THRESHOLD
      ).length;

      // materias aprobadas/reprobadas (por materia, se considera promedio por materia)
      const materiasMap: Record<string, number[]> = {};
      califs.forEach((c: any) => {
        const m = c.materia || "Sin materia";
        materiasMap[m] = materiasMap[m] || [];
        materiasMap[m].push(Number(c.calificacion));
      });
      let materiasReprobadas = 0;
      let materiasAprobadas = 0;
      Object.keys(materiasMap).forEach((m) => {
        const arr = materiasMap[m];
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        if (avg < PASS_THRESHOLD) materiasReprobadas++;
        else materiasAprobadas++;
      });

      // riesgo para la materia seleccionada (o promedio general si no hay materia)
      let riesgo = 0;
      if (materia) {
        const matCalifs = califs.filter((c: any) => c.materia === materia);
        if (matCalifs.length > 0) {
          const avgMat =
            matCalifs.reduce(
              (a: any, b: any) => a + Number(b.calificacion),
              0
            ) / matCalifs.length;
          riesgo = Math.round(Math.max(0, Math.min(100, 100 - avgMat)));
        } else {
          riesgo = 0;
        }
      } else {
        const allAvg = califs.length
          ? califs.reduce((a: any, b: any) => a + Number(b.calificacion), 0) /
            califs.length
          : 0;
        riesgo = Math.round(Math.max(0, Math.min(100, 100 - allAvg)));
      }

      // probabilidad de deserción (buckets)
      let probDesercion = 0;
      if (riesgo >= 80) probDesercion = 90;
      else if (riesgo >= 60) probDesercion = 70;
      else if (riesgo >= 40) probDesercion = 40;
      else if (riesgo >= 20) probDesercion = 15;
      else probDesercion = 5;

      // nivel de compromiso derivado (1..5), alto riesgo -> bajo compromiso
      let nivelCompromiso = 5;
      if (riesgo >= 80) nivelCompromiso = 1;
      else if (riesgo >= 60) nivelCompromiso = 2;
      else if (riesgo >= 40) nivelCompromiso = 3;
      else if (riesgo >= 20) nivelCompromiso = 4;
      else nivelCompromiso = 5;

      // Update form values but keep them editable afterwards
      setFormData((prev) => ({
        ...prev,
        riesgo_reprobacion: riesgo,
        probabilidad_desercion: probDesercion,
        nivel_compromiso: nivelCompromiso,
        historial_reprobaciones: unidadesReprobadas,
        materias_reprobadas: materiasReprobadas,
        materias_aprobadas: materiasAprobadas,
      }));
    } catch (err) {
      console.error("Error calculando indicadores automáticos", err);
    }
  };

  const fetchRecentIndicadores = async () => {
    try {
      const { data } = await supabase
        .from("indicadores_desempeno")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentIndicadores(data || []);
    } catch (err) {
      console.error("Error fetching recent indicadores", err);
      setRecentIndicadores([]);
    }
  };

  useEffect(() => {
    fetchRecentIndicadores();
  }, []);

  const exportIndicadoresCSV = async () => {
    try {
      const { data } = await supabase
        .from("indicadores_desempeno")
        .select("*")
        .order("created_at", { ascending: false });
      if (!data || data.length === 0) {
        toast.error("No hay indicadores para exportar");
        return;
      }
      const rows = data.map((it: any) => ({
        id: it.id,
        estudiante_id: it.estudiante_id,
        semestre: it.semestre,
        materia: it.materia,
        riesgo_reprobacion: it.riesgo_reprobacion,
        probabilidad_desercion: it.probabilidad_desercion,
        nivel_compromiso: it.nivel_compromiso,
        tendencia_rendimiento: it.tendencia_rendimiento,
        historial_reprobaciones: it.historial_reprobaciones,
        materias_reprobadas: it.materias_reprobadas,
        materias_aprobadas: it.materias_aprobadas,
        created_at: it.created_at,
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
        `indicadores_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("CSV generado");
    } catch (err) {
      console.error("Error exportando indicadores CSV", err);
      toast.error("Error al exportar CSV");
    }
  };

  const exportIndicadoresPDF = async () => {
    try {
      const { data } = await supabase
        .from("indicadores_desempeno")
        .select("*")
        .order("created_at", { ascending: false });
      if (!data || data.length === 0) {
        toast.error("No hay indicadores para exportar");
        return;
      }
      const headers = [
        "Fecha",
        "Estudiante",
        "Matrícula",
        "Semestre",
        "Materia",
        "Riesgo (%)",
        "Prob. Deserción (%)",
        "Compromiso",
        "Tendencia",
        "Historial Reprob.",
        "Mat. Reprob.",
        "Mat. Aprob.",
      ];
      const rows = data.map((it: any) => {
        return [
          it.created_at || "",
          it.estudiante_id
            ? (estudiantes.find((e: any) => e.id === it.estudiante_id)
                ?.nombre || "") +
              " " +
              (estudiantes.find((e: any) => e.id === it.estudiante_id)
                ?.apellido || "")
            : "",
          it.estudiante_id
            ? estudiantes.find((e: any) => e.id === it.estudiante_id)
                ?.matricula || ""
            : "",
          String(it.semestre || ""),
          it.materia || "",
          String(it.riesgo_reprobacion ?? ""),
          String(it.probabilidad_desercion ?? ""),
          String(it.nivel_compromiso ?? ""),
          it.tendencia_rendimiento || "",
          String(it.historial_reprobaciones ?? ""),
          String(it.materias_reprobadas ?? ""),
          String(it.materias_aprobadas ?? ""),
        ];
      });
      await exportTablePDF(
        "Indicadores de Desempeño",
        headers,
        rows,
        `indicadores_${new Date().toISOString().split("T")[0]}.pdf`
      );
      toast.success("PDF generado");
    } catch (err) {
      console.error("Error exportando indicadores PDF", err);
      toast.error("Error al exportar PDF");
    }
  };

  const [editingIndicador, setEditingIndicador] = useState<any | null>(null);
  const [editIndModalOpen, setEditIndModalOpen] = useState(false);
  const [editIndForm, setEditIndForm] = useState({
    estudiante_id: "",
    semestre: 1,
    materia: "",
    riesgo_reprobacion: 0,
    probabilidad_desercion: 0,
    nivel_compromiso: 0,
    tendencia_rendimiento: "",
    historial_reprobaciones: 0,
    materias_reprobadas: 0,
    materias_aprobadas: 0,
  });

  const openEditIndicador = (ind: any) => {
    setEditingIndicador(ind);
    setEditIndForm({
      estudiante_id: ind.estudiante_id || "",
      semestre: ind.semestre || 1,
      materia: ind.materia || "",
      riesgo_reprobacion: ind.riesgo_reprobacion || 0,
      probabilidad_desercion: ind.probabilidad_desercion || 0,
      nivel_compromiso: ind.nivel_compromiso || 0,
      tendencia_rendimiento: ind.tendencia_rendimiento || "",
      historial_reprobaciones: ind.historial_reprobaciones || 0,
      materias_reprobadas: ind.materias_reprobadas || 0,
      materias_aprobadas: ind.materias_aprobadas || 0,
    });
    setEditIndModalOpen(true);
  };

  const handleEditIndicadorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIndicador) return;
    try {
      setLoading(true);
      const payload: any = {
        estudiante_id: editIndForm.estudiante_id,
        semestre: editIndForm.semestre,
        materia: editIndForm.materia,
        riesgo_reprobacion: editIndForm.riesgo_reprobacion,
        probabilidad_desercion: editIndForm.probabilidad_desercion,
        nivel_compromiso: editIndForm.nivel_compromiso,
        tendencia_rendimiento: editIndForm.tendencia_rendimiento,
        historial_reprobaciones: editIndForm.historial_reprobaciones,
        materias_reprobadas: editIndForm.materias_reprobadas,
        materias_aprobadas: editIndForm.materias_aprobadas,
      };
      const { error } = await supabase
        .from("indicadores_desempeno")
        .update(payload)
        .eq("id", editingIndicador.id);
      if (error) throw error;
      toast.success("Indicador actualizado");
      setEditIndModalOpen(false);
      setEditingIndicador(null);
      fetchRecentIndicadores();
    } catch (err) {
      console.error("Error updating indicador", err);
      toast.error("Error al actualizar indicador");
    } finally {
      setLoading(false);
    }
  };

  // Obtiene el semestre del estudiante seleccionado
  const getSemestreEstudiante = (id: string) => {
    const estudiante = estudiantes.find((e) => e.id === id);
    return estudiante ? estudiante.semestre || 1 : 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.estudiante_id || !formData.materia) {
      toast.error("Completa los campos requeridos");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.from("indicadores_desempeno").insert([
        {
          estudiante_id: formData.estudiante_id,
          semestre: formData.semestre,
          materia: formData.materia,
          riesgo_reprobacion: formData.riesgo_reprobacion,
          probabilidad_desercion: formData.probabilidad_desercion,
          nivel_compromiso: formData.nivel_compromiso,
          tendencia_rendimiento: formData.tendencia_rendimiento,
          historial_reprobaciones: formData.historial_reprobaciones,
          materias_reprobadas: formData.materias_reprobadas,
          materias_aprobadas: formData.materias_aprobadas,
        },
      ]);
      if (error) throw error;
      toast.success("Indicador registrado");
      setFormData({
        estudiante_id: "",
        semestre: 1,
        materia: "",
        riesgo_reprobacion: 0,
        probabilidad_desercion: 0,
        nivel_compromiso: 0,
        tendencia_rendimiento: "",
        historial_reprobaciones: 0,
        materias_reprobadas: 0,
        materias_aprobadas: 0,
      });
      // refrescar historial
      fetchRecentIndicadores();
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar indicador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Indicadores de Desempeño</CardTitle>
            <CardDescription>
              Registra indicadores por estudiante y materia
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportIndicadoresCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button size="sm" variant="outline" onClick={exportIndicadoresPDF}>
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
                  id="busqueda-estudiante-ind"
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
                          onClick={async () => {
                            const semestre = getSemestreEstudiante(est.id);
                            setFormData((prev) => ({
                              ...prev,
                              estudiante_id: est.id,
                              semestre,
                            }));
                            setSearchEstudianteForm(
                              `${est.nombre} ${est.apellido} - ${est.matricula}`
                            );
                            // compute automatic indicadores based on selected student (and materia if already selected)
                            await computeIndicadores(est.id, formData.materia);
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
                onValueChange={async (v) => {
                  const semestre = getSemestreEstudiante(v);
                  setFormData((prev) => ({
                    ...prev,
                    estudiante_id: v,
                    semestre,
                  }));
                  await computeIndicadores(v, formData.materia);
                }}
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

            <div className="space-y-2">
              <Label>Materia</Label>
              <Select
                value={formData.materia}
                onValueChange={async (v) => {
                  // If a student is selected, automatically update semestre to the student's semester
                  if (formData.estudiante_id) {
                    const semestre = getSemestreEstudiante(
                      formData.estudiante_id
                    );
                    setFormData((prev) => ({ ...prev, materia: v, semestre }));
                  } else {
                    setFormData((prev) => ({ ...prev, materia: v }));
                  }
                  await computeIndicadores(formData.estudiante_id, v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una materia" />
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
              <Label>Riesgo de reprobación (%)</Label>
              <Select
                value={String(formData.riesgo_reprobacion)}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    riesgo_reprobacion: parseFloat(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona riesgo" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Probabilidad de deserción (%)</Label>
              <Select
                value={String(formData.probabilidad_desercion)}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    probabilidad_desercion: parseFloat(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona probabilidad" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nivel de compromiso</Label>
              <Select
                value={String(formData.nivel_compromiso)}
                onValueChange={(v) =>
                  setFormData({ ...formData, nivel_compromiso: parseFloat(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona nivel" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Tendencia de rendimiento</Label>
              <Input
                value={formData.tendencia_rendimiento}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tendencia_rendimiento: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Historial de reprobaciones</Label>
              <Select
                value={String(formData.historial_reprobaciones)}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    historial_reprobaciones: parseInt(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona historial" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Materias reprobadas</Label>
              <Select
                value={String(formData.materias_reprobadas)}
                onValueChange={(v) =>
                  setFormData({ ...formData, materias_reprobadas: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona cantidad" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Materias aprobadas</Label>
              <Select
                value={String(formData.materias_aprobadas)}
                onValueChange={(v) =>
                  setFormData({ ...formData, materias_aprobadas: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona cantidad" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Guardando..." : "Registrar Indicador"}
            </Button>
          </div>
        </form>

        {/* Historial reciente de indicadores */}
        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Últimos Indicadores</CardTitle>
              <CardDescription>
                Últimos 5 indicadores registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <Input
                  placeholder="Buscar en historial (estudiante, matrícula, materia, riesgo...)"
                  value={recentSearch}
                  onChange={(e) => setRecentSearch(e.target.value)}
                />
              </div>
              {recentIndicadores.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No hay indicadores recientes
                </div>
              ) : (
                <div className="space-y-2">
                  {recentIndicadores
                    .filter((ind) => {
                      const q = recentSearch.trim().toLowerCase();
                      if (!q) return true;
                      const est = estudiantes.find(
                        (e) => e.id === ind.estudiante_id
                      );
                      const estText = est
                        ? `${est.nombre} ${est.apellido} ${est.matricula}`.toLowerCase()
                        : "";
                      const materia = (ind.materia || "")
                        .toString()
                        .toLowerCase();
                      const riesgo = String(
                        ind.riesgo_reprobacion || ""
                      ).toLowerCase();
                      const desercion = String(
                        ind.probabilidad_desercion || ""
                      ).toLowerCase();
                      return (
                        estText.includes(q) ||
                        materia.includes(q) ||
                        riesgo.includes(q) ||
                        desercion.includes(q)
                      );
                    })
                    .map((ind) => {
                      const est = estudiantes.find(
                        (e) => e.id === ind.estudiante_id
                      );
                      return (
                        <div key={ind.id} className="border rounded p-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="font-medium">
                                {ind.materia} —{" "}
                                {est
                                  ? `${est.nombre} ${est.apellido}`
                                  : "Estudiante desconocido"}
                              </div>
                              <div className="text-xs text-gray-600">
                                Riesgo: {ind.riesgo_reprobacion}% · Deserción:{" "}
                                {ind.probabilidad_desercion}% · Compromiso:{" "}
                                {ind.nivel_compromiso}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-xs text-gray-400">
                                {ind.created_at}
                              </div>
                              <div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditIndicador(ind)}
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
            </CardContent>
          </Card>
        </div>
        {/* Edit modal for indicadores */}
        <Dialog open={editIndModalOpen} onOpenChange={setEditIndModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Indicador</DialogTitle>
              <DialogDescription>
                Modifica los datos del indicador
              </DialogDescription>
            </DialogHeader>
            {editingIndicador ? (
              <form onSubmit={handleEditIndicadorSubmit} className="space-y-4">
                <div>
                  <Label>Estudiante</Label>
                  <Select
                    value={editIndForm.estudiante_id}
                    onValueChange={(v) =>
                      setEditIndForm({ ...editIndForm, estudiante_id: v })
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
                <div>
                  <Label>Materia</Label>
                  <Select
                    value={editIndForm.materia}
                    onValueChange={(v) =>
                      setEditIndForm({ ...editIndForm, materia: v })
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Riesgo reprobación (%)</Label>
                    <Select
                      value={String(editIndForm.riesgo_reprobacion)}
                      onValueChange={(v) =>
                        setEditIndForm({
                          ...editIndForm,
                          riesgo_reprobacion: parseFloat(v),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona riesgo" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(
                          (n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n}%
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prob. deserción (%)</Label>
                    <Select
                      value={String(editIndForm.probabilidad_desercion)}
                      onValueChange={(v) =>
                        setEditIndForm({
                          ...editIndForm,
                          probabilidad_desercion: parseFloat(v),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona probabilidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(
                          (n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n}%
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
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
                      setEditIndModalOpen(false);
                      setEditingIndicador(null);
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
      </CardContent>
    </Card>
  );
}
