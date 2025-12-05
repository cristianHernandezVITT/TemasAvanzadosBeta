"use client";

import { useState, useRef, useEffect } from "react";
import { useArrowNavigation } from "@/hooks/useArrowNavigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useEstudiantes, useFactoresRiesgo } from "@/hooks/useSupabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useAuditTrail } from "@/hooks/useAuditTrail";
import { toast } from "sonner";
import { FileSpreadsheet, FileText } from "lucide-react";
import CalificacionesSection from "@/components/CalificacionesSection";
import AsistenciasSection from "@/components/AsistenciasSection";
import EventosAcademicosSection from "@/components/EventosAcademicosSection";
import IndicadoresDesempenoSection from "@/components/IndicadoresDesempenoSection";

export default function RegistroPage() {
  const [estudiantesPage, setEstudiantesPage] = useState(0);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    matricula: "",
    carrera: "",
    semestre: 1,
    email: "",
    telefono: "",
  });
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [errores, setErrores] = useState<{
    nombre?: string;
    apellido?: string;
    email?: string;
    matricula?: string;
    telefono?: string;
  }>({});

  const [factores, setFactores] = useState({
    factor_academico: false,
    factor_economico: false,
    factor_psicosocial: false,
    factor_institucional: false,
    factor_contextual: false,
  });
  const [carrerasList, setCarrerasList] = useState<any[]>([]);

  const { estudiantes, loading, createEstudiante, updateEstudiante } =
    useEstudiantes();
  const { usuario } = useAuth();
  const { createFactorRiesgo } = useFactoresRiesgo();
  const { createAuditEntry } = useAuditTrail();
  const [searchRegistered, setSearchRegistered] = useState("");
  const [activeTab, setActiveTab] = useState<
    "nuevo" | "asistencias" | "calificaciones" | "eventos" | "indicadores"
  >("nuevo");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [creatorInfo, setCreatorInfo] = useState<any | null>(null);
  const [modifierInfo, setModifierInfo] = useState<any | null>(null);
  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editStudentForm, setEditStudentForm] = useState({
    nombre: "",
    apellido: "",
    matricula: "",
    carrera: "",
    semestre: 1,
    email: "",
    telefono: "",
  });
  const [editApellidoPaterno, setEditApellidoPaterno] = useState("");
  const [editApellidoMaterno, setEditApellidoMaterno] = useState("");
  const [editErrores, setEditErrores] = useState<{
    nombre?: string;
    apellido?: string;
    email?: string;
    matricula?: string;
    telefono?: string;
  }>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [importFailures, setImportFailures] = useState<
    { row: number; matricula?: string; reason?: string }[]
  >([]);
  const [showImportFailures, setShowImportFailures] = useState(false);
  const detailsModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  const importFailuresModalRef = useRef<HTMLDivElement>(null);
  useArrowNavigation(detailsModalRef);
  useArrowNavigation(editModalRef);
  useArrowNavigation(importFailuresModalRef);

  // Load carreras for select options
  useEffect(() => {
    let mounted = true;
    const fetchCarreras = async () => {
      try {
        const { data } = await supabase
          .from("carreras")
          .select("id,nombre")
          .order("nombre");
        if (mounted) setCarrerasList(data || []);
      } catch (err) {
        console.error("Error cargando carreras:", err);
      }
    };
    fetchCarreras();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const erroresVal = validarErrores();
    setErrores(erroresVal);
    if (Object.keys(erroresVal).length > 0) return;
    // Verificar si la matrícula ya existe en la lista de estudiantes cargada
    const matriculaTrim = String(formData.matricula || "").trim();
    if (
      matriculaTrim &&
      estudiantes.some(
        (est) => String(est.matricula || "").trim() === matriculaTrim
      )
    ) {
      setErrores((prev) => ({
        ...prev,
        matricula: "La matrícula ya está registrada.",
      }));
      return;
    }
    try {
      const estudiante = await createEstudiante(
        {
          ...formData,
          matricula: String(formData.matricula),
          telefono: String(formData.telefono),
        },
        usuario?.id
      );
      if (estudiante) {
        // Crear factores de riesgo
        await createFactorRiesgo({
          estudiante_id: estudiante.id,
          ...factores,
        });
        toast.success("Estudiante registrado exitosamente");

        // Registrar en audit trail
        await createAuditEntry({
          modulo: "Registro de Estudiantes",
          accion: "crear",
          entidad: "Estudiante",
          entidad_id: estudiante.id,
          detalles: {
            nombre: formData.nombre,
            apellido: formData.apellido,
            matricula: formData.matricula,
            carrera: formData.carrera,
            semestre: formData.semestre,
          },
        });

        // Limpiar formulario
        setFormData({
          nombre: "",
          apellido: "",
          matricula: "",
          carrera: "",
          semestre: 1,
          email: "",
          telefono: "",
        });
        setApellidoPaterno("");
        setApellidoMaterno("");
        setFactores({
          factor_academico: false,
          factor_economico: false,
          factor_psicosocial: false,
          factor_institucional: false,
          factor_contextual: false,
        });
        setErrores({});
      }
    } catch (error) {
      toast.error("Error al registrar estudiante");
      console.error(error);
    }
  };

  const validarErrores = () => {
    const errores: {
      nombre?: string;
      apellido?: string;
      email?: string;
      matricula?: string;
      telefono?: string;
    } = {};
    // Validación nombre
    if (!formData.nombre.trim()) {
      errores.nombre = "El nombre es obligatorio.";
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(formData.nombre.trim())) {
      errores.nombre = "El nombre solo debe contener letras y espacios.";
    }
    // Validación apellido
    if (!formData.apellido.trim()) {
      errores.apellido = "El apellido es obligatorio.";
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(formData.apellido.trim())) {
      errores.apellido = "El apellido solo debe contener letras y espacios.";
    }
    // Validación email
    if (!formData.email.trim()) {
      errores.email = "El correo es obligatorio.";
    } else if (
      !/^([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,})$/.test(
        formData.email.trim()
      )
    ) {
      errores.email = "El correo no es válido.";
    }
    // Validación matrícula
    if (!formData.matricula.trim()) {
      errores.matricula = "La matrícula es obligatoria.";
    } else if (!/^\d{8}$/.test(formData.matricula.trim())) {
      errores.matricula = "La matrícula debe tener exactamente 8 dígitos.";
    }
    // Validación teléfono
    if (!formData.telefono.trim()) {
      errores.telefono = "El teléfono es obligatorio.";
    } else if (!/^\d{10}$/.test(formData.telefono.trim())) {
      errores.telefono = "El teléfono debe tener exactamente 10 dígitos.";
    }
    return errores;
  };

  // Función para exportar a Excel (CSV)
  const exportToExcel = async () => {
    if (estudiantes.length === 0) {
      toast.error("No hay estudiantes para exportar");
      return;
    }

    const csvData = estudiantes.map((est) => ({
      Matrícula: String(est.matricula || "").toUpperCase(),
      Nombre: String(est.nombre || "").toUpperCase(),
      Apellido: String(est.apellido || "").toUpperCase(),
      Carrera: String(est.carrera || "").toUpperCase(),
      Semestre: est.semestre,
      Email: String(est.email || "").toUpperCase(),
      Teléfono: String(est.telefono || "").toUpperCase(),
      "Fecha Registro": new Date(est.created_at).toLocaleDateString(),
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
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
      `estudiantes_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Archivo CSV exportado exitosamente");

    // Registrar en audit trail
    await createAuditEntry({
      modulo: "Registro de Estudiantes",
      accion: "exportar",
      entidad: "CSV",
      detalles: { registros: estudiantes.length },
    });
  };

  // Función para exportar a PDF
  const exportToPDF = async () => {
    if (estudiantes.length === 0) {
      toast.error("No hay estudiantes para exportar");
      return;
    }

    try {
      const { default: jsPDF } = await import("jspdf");
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Título
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235);
      pdf.text("Registro de Estudiantes", pageWidth / 2, 20, {
        align: "center",
      });

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Total de estudiantes: ${estudiantes.length}`,
        pageWidth / 2,
        28,
        { align: "center" }
      );

      // Tabla de datos
      let tableY = 40;
      pdf.setFontSize(10);
      pdf.setFillColor(37, 99, 235);
      pdf.rect(20, tableY, pageWidth - 40, 8, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.text("Matrícula", 22, tableY + 5);
      pdf.text("Nombre", 50, tableY + 5);
      pdf.text("Apellido", 80, tableY + 5);
      pdf.text("Carrera", 110, tableY + 5);
      pdf.text("Semestre", 160, tableY + 5);
      pdf.text("Email", 180, tableY + 5);
      pdf.text("Teléfono", 240, tableY + 5);

      pdf.setTextColor(0, 0, 0);
      tableY += 10;

      estudiantes.forEach((est, index) => {
        if (tableY > pageHeight - 20) {
          pdf.addPage();
          tableY = 20;
          // Reimprimir encabezados
          pdf.setFillColor(37, 99, 235);
          pdf.rect(20, tableY, pageWidth - 40, 8, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.text("Matrícula", 22, tableY + 5);
          pdf.text("Nombre", 50, tableY + 5);
          pdf.text("Apellido", 80, tableY + 5);
          pdf.text("Carrera", 110, tableY + 5);
          pdf.text("Semestre", 160, tableY + 5);
          pdf.text("Email", 180, tableY + 5);
          pdf.text("Teléfono", 240, tableY + 5);
          pdf.setTextColor(0, 0, 0);
          tableY += 10;
        }

        if (index % 2 === 0) {
          pdf.setFillColor(243, 244, 246);
          pdf.rect(20, tableY, pageWidth - 40, 6, "F");
        }

        pdf.text(String(est.matricula || "").toUpperCase(), 22, tableY + 4);
        pdf.text(
          String(est.nombre || "")
            .toUpperCase()
            .substring(0, 20),
          50,
          tableY + 4
        );
        pdf.text(
          String(est.apellido || "")
            .toUpperCase()
            .substring(0, 20),
          80,
          tableY + 4
        );
        pdf.text(
          String(est.carrera || "")
            .toUpperCase()
            .substring(0, 15),
          110,
          tableY + 4
        );
        pdf.text(String(est.semestre || ""), 160, tableY + 4);
        pdf.text(
          String(est.email || "")
            .toUpperCase()
            .substring(0, 25),
          180,
          tableY + 4
        );
        pdf.text(String(est.telefono || "").toUpperCase(), 240, tableY + 4);

        tableY += 6;
      });

      // Pie de página
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Generado el ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: "center" }
      );

      pdf.save(`estudiantes_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Archivo PDF exportado exitosamente");

      // Registrar en audit trail
      await createAuditEntry({
        modulo: "Registro de Estudiantes",
        accion: "exportar",
        entidad: "PDF",
        detalles: { registros: estudiantes.length, formato: "PDF" },
      });
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      toast.error("Error al exportar el PDF");
    }
  };

  // Edit student helpers
  const validarErroresEdit = () => {
    const errores: {
      nombre?: string;
      apellido?: string;
      email?: string;
      matricula?: string;
      telefono?: string;
    } = {};
    if (!editStudentForm.nombre.trim()) {
      errores.nombre = "El nombre es obligatorio.";
    } else if (
      !/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(editStudentForm.nombre.trim())
    ) {
      errores.nombre = "El nombre solo debe contener letras y espacios.";
    }
    if (!editStudentForm.apellido.trim()) {
      errores.apellido = "El apellido es obligatorio.";
    } else if (
      !/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(editStudentForm.apellido.trim())
    ) {
      errores.apellido = "El apellido solo debe contener letras y espacios.";
    }
    if (!editStudentForm.email.trim()) {
      errores.email = "El correo es obligatorio.";
    } else if (
      !/^([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,})$/.test(
        editStudentForm.email.trim()
      )
    ) {
      errores.email = "El correo no es válido.";
    }
    if (!String(editStudentForm.matricula).trim()) {
      errores.matricula = "La matrícula es obligatoria.";
    } else if (!/^\d{8}$/.test(String(editStudentForm.matricula).trim())) {
      errores.matricula = "La matrícula debe tener exactamente 8 dígitos.";
    }
    if (!String(editStudentForm.telefono).trim()) {
      errores.telefono = "El teléfono es obligatorio.";
    } else if (!/^\d{10}$/.test(String(editStudentForm.telefono).trim())) {
      errores.telefono = "El teléfono debe tener exactamente 10 dígitos.";
    }
    return errores;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const erroresVal = validarErroresEdit();
    setEditErrores(erroresVal);
    if (Object.keys(erroresVal).length > 0) return;
    if (!editingStudent) return;

    try {
      const updates = {
        nombre: editStudentForm.nombre,
        apellido: editStudentForm.apellido,
        matricula: String(editStudentForm.matricula),
        carrera: editStudentForm.carrera,
        semestre: Number(editStudentForm.semestre),
        email: editStudentForm.email,
        telefono: String(editStudentForm.telefono),
      };

      const updated = await updateEstudiante(
        editingStudent.id,
        updates,
        usuario?.id
      );
      if (updated) {
        toast.success("Estudiante actualizado correctamente");
        await createAuditEntry({
          modulo: "Registro de Estudiantes",
          accion: "editar",
          entidad: "Estudiante",
          entidad_id: editingStudent.id,
          detalles: updates,
        });
        setEditStudentOpen(false);
        setEditingStudent(null);
        setEditApellidoPaterno("");
        setEditApellidoMaterno("");
      } else {
        toast.error("Error al actualizar estudiante");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar estudiante");
    }
  };

  // CSV import helpers
  const parseCSV = (text: string) => {
    // Basic CSV parser that handles quoted fields
    const rows: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        // lookahead for escaped quote
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (ch === "\n" && !inQuotes) {
        rows.push(cur);
        cur = "";
        continue;
      }
      cur += ch;
    }
    if (cur.length) rows.push(cur);

    const parsed = rows.map((r) => {
      // split by commas not inside quotes
      const cols: string[] = [];
      let cell = "";
      let q = false;
      for (let i = 0; i < r.length; i++) {
        const c = r[i];
        if (c === '"') {
          q = !q;
          continue;
        }
        if (c === "," && !q) {
          cols.push(cell);
          cell = "";
          continue;
        }
        cell += c;
      }
      cols.push(cell);
      return cols.map((c) => c.trim());
    });
    return parsed;
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error("CSV vacío o formato inválido");
        setImporting(false);
        return;
      }

      // Assume first row is header if it contains non-numeric values like 'nombre'
      const header = parsed[0].map((h) => h.toLowerCase());
      const expected = [
        "matricula",
        "nombre",
        "apellido",
        "carrera",
        "semestre",
        "email",
        "telefono",
      ];
      let startIdx = 0;
      const hasHeader = expected.every((col) => header.includes(col));
      if (hasHeader) startIdx = 1;

      const results: {
        row: number;
        matricula?: string;
        success: boolean;
        reason?: string;
      }[] = [];
      const seen = new Set<string>();
      for (let i = startIdx; i < parsed.length; i++) {
        const cols = parsed[i];
        if (cols.length < 3) {
          results.push({
            row: i + 1,
            success: false,
            reason: "Fila incompleta",
          });
          continue;
        }
        // Map columns by position using expected order
        const mapVal: any = {};
        for (let j = 0; j < expected.length; j++) {
          mapVal[expected[j]] = cols[j] ?? "";
        }

        const matricula = String(mapVal.matricula || "")
          .trim()
          .toUpperCase();
        const nombre = String(mapVal.nombre || "")
          .trim()
          .toUpperCase();
        const apellido = String(mapVal.apellido || "")
          .trim()
          .toUpperCase();
        const carrera = String(mapVal.carrera || "").trim();
        const semestre = Number(mapVal.semestre) || 1;
        // Convertir email: parte local en mayúsculas, dominio en minúsculas
        const emailRaw = String(mapVal.email || "").trim();
        const [localPart, domain] = emailRaw.split("@");
        const email = domain
          ? `${localPart.toUpperCase()}@${domain.toLowerCase()}`
          : emailRaw.toUpperCase();
        const telefono = String(mapVal.telefono || "")
          .trim()
          .toUpperCase();

        if (!matricula || !nombre || !apellido) {
          results.push({
            row: i + 1,
            matricula,
            success: false,
            reason: "Faltan campos requeridos",
          });
          continue;
        }

        // Skip duplicates: existing estudiantes or already processed in this batch
        const duplicateExisting = estudiantes.some(
          (est) => String(est.matricula || "").trim() === matricula
        );
        if (duplicateExisting || seen.has(matricula)) {
          results.push({
            row: i + 1,
            matricula,
            success: false,
            reason: "Matrícula duplicada",
          });
          continue;
        }

        try {
          const created = await createEstudiante(
            {
              nombre,
              apellido,
              matricula,
              carrera,
              semestre,
              email,
              telefono,
            },
            usuario?.id
          );
          if (created) {
            // create default factores (all false)
            await createFactorRiesgo({
              estudiante_id: created.id,
              factor_academico: false,
              factor_economico: false,
              factor_psicosocial: false,
              factor_institucional: false,
              factor_contextual: false,
            });
            results.push({ row: i + 1, matricula, success: true });
            seen.add(matricula);
          } else {
            results.push({
              row: i + 1,
              matricula,
              success: false,
              reason: "Error al crear",
            });
          }
        } catch (err: any) {
          console.error("Error createEstudiante:", err);
          const reason = err?.message || "Error desconocido";
          results.push({ row: i + 1, matricula, success: false, reason });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failItems = results.filter((r) => !r.success);
      if (successCount > 0) {
        toast.success(`${successCount} estudiantes importados correctamente`);
        await createAuditEntry({
          modulo: "Registro de Estudiantes",
          accion: "importar_csv",
          entidad: "Estudiantes",
          detalles: {
            archivo: file.name,
            importados: successCount,
            totales: results.length,
          },
        });
      }
      if (failItems.length > 0) {
        toast.error(
          `${failItems.length} filas no importadas. Abre el registro para ver detalles.`
        );
        // keep a copy of failures to show in a modal and allow download
        setImportFailures(failItems);
        setShowImportFailures(true);
        console.table(failItems.slice(0, 50));
      }
    } catch (err) {
      console.error("Error al procesar CSV", err);
      toast.error("Error al procesar el archivo CSV");
    } finally {
      setImporting(false);
      // reset the file input so same file can be reselected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadFailuresCsv = (
    items: { row: number; matricula?: string; reason?: string }[]
  ) => {
    if (!items || items.length === 0) return;
    const headers = ["row", "matricula", "reason"];
    const csv = [headers.join(",")]
      .concat(
        items.map(
          (it) =>
            `${it.row},"${(it.matricula || "").replace(/"/g, '""')}","${(
              it.reason || ""
            ).replace(/"/g, '""')}"`
        )
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import_failures_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const mainContentRef = useRef<HTMLDivElement>(null);
  useArrowNavigation(mainContentRef);

  // Escuchar eventos de voz para exportar
  useEffect(() => {
    const handleExportExcel = () => {
      console.log("Evento voz: Exportar Excel en Registro");
      exportToExcel();
    };
    const handleExportPDF = () => {
      console.log("Evento voz: Exportar PDF en Registro");
      exportToPDF();
    };

    window.addEventListener("voice-export-excel", handleExportExcel);
    window.addEventListener("voice-export-pdf", handleExportPDF);

    return () => {
      window.removeEventListener("voice-export-excel", handleExportExcel);
      window.removeEventListener("voice-export-pdf", handleExportPDF);
    };
  }, [estudiantes]);

  // Escuchar eventos de voz para cambiar entre pestañas
  useEffect(() => {
    const handleTabChange = (e: CustomEvent) => {
      const tab = e.detail?.tab;
      if (tab && ["nuevo", "asistencias", "calificaciones", "eventos", "indicadores"].includes(tab)) {
        console.log("Evento voz: Cambiar a pestaña", tab);
        setActiveTab(tab);
        toast.success(`Vista: ${tab === "nuevo" ? "Nuevo Estudiante" : tab.charAt(0).toUpperCase() + tab.slice(1)}`);
      }
    };

    window.addEventListener("voice-registro-tab", handleTabChange as EventListener);

    return () => {
      window.removeEventListener("voice-registro-tab", handleTabChange as EventListener);
    };
  }, []);

  return (
    <div ref={mainContentRef} className="min-h-screen bg-background p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
              Registro de Estudiantes
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2">
              Registra nuevos estudiantes en el sistema
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={exportToExcel}
              variant="outline"
              className="flex items-center justify-center gap-2 w-full sm:w-auto export-excel-btn"
              disabled={estudiantes.length === 0}
              aria-label="Exportar lista de estudiantes a Excel"
            >
              <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm md:text-base">Exportar Excel</span>
            </Button>
            <Button
              onClick={exportToPDF}
              variant="outline"
              className="flex items-center justify-center gap-2 w-full sm:w-auto export-pdf-btn"
              disabled={estudiantes.length === 0}
              aria-label="Exportar lista de estudiantes a PDF"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm md:text-base">Exportar PDF</span>
            </Button>
          </div>
        </div>

        {/* Menu de secciones */}
        <nav
          className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2"
          role="tablist"
          aria-label="Secciones del registro de estudiantes"
        >
          <button
            role="tab"
            aria-selected={activeTab === "nuevo"}
            aria-controls="nuevo-panel"
            id="nuevo-tab"
            className={`px-3 py-2 rounded text-sm md:text-base whitespace-nowrap ${
              activeTab === "nuevo"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border"
            }`}
            onClick={() => setActiveTab("nuevo")}
          >
            Nuevo Estudiante
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "asistencias"}
            aria-controls="asistencias-panel"
            id="asistencias-tab"
            className={`px-3 py-2 rounded text-sm md:text-base whitespace-nowrap ${
              activeTab === "asistencias"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border"
            }`}
            onClick={() => setActiveTab("asistencias")}
          >
            Asistencias
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "calificaciones"}
            aria-controls="calificaciones-panel"
            id="calificaciones-tab"
            className={`px-3 py-2 rounded text-sm md:text-base whitespace-nowrap ${
              activeTab === "calificaciones"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border"
            }`}
            onClick={() => setActiveTab("calificaciones")}
          >
            Calificaciones
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "eventos"}
            aria-controls="eventos-panel"
            id="eventos-tab"
            className={`px-3 py-2 rounded text-sm md:text-base whitespace-nowrap ${
              activeTab === "eventos"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border"
            }`}
            onClick={() => setActiveTab("eventos")}
          >
            Eventos
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "indicadores"}
            aria-controls="indicadores-panel"
            id="indicadores-tab"
            className={`px-3 py-2 rounded text-sm md:text-base whitespace-nowrap ${
              activeTab === "indicadores"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border"
            }`}
            onClick={() => setActiveTab("indicadores")}
          >
            Indicadores
          </button>
        </nav>

        {/* Contenido por sección */}
        <div>
          {activeTab === "nuevo" && (
            <div
              role="tabpanel"
              id="nuevo-panel"
              aria-labelledby="nuevo-tab"
              className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-2"
            >
              {/* Formulario de Registro */}
              <Card>
                <CardHeader>
                  <CardTitle>Nuevo Estudiante</CardTitle>
                  <CardDescription>
                    Completa el formulario para registrar un nuevo estudiante
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nombre" className="block mb-1">
                          Nombre{" "}
                          <span
                            className="text-red-500"
                            aria-label="campo obligatorio"
                          >
                            *
                          </span>
                        </Label>
                        <Input
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nombre: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="Nombre del estudiante"
                          required
                          aria-required="true"
                          aria-invalid={!!errores.nombre}
                          aria-describedby={
                            errores.nombre
                              ? "nombre-error"
                              : "nombre-description"
                          }
                        />
                        <span id="nombre-description" className="sr-only">
                          Campo obligatorio. Ingrese el nombre del estudiante.
                        </span>
                        {errores.nombre && (
                          <p
                            id="nombre-error"
                            className="text-sm text-red-500 mt-1"
                            role="alert"
                          >
                            {errores.nombre}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="grid gap-2 md:grid-cols-2">
                          <div>
                            <Label
                              htmlFor="apellido_paterno"
                              className="block mb-1"
                            >
                              Apellido Paterno{" "}
                              <span
                                className="text-red-500"
                                aria-label="campo obligatorio"
                              >
                                *
                              </span>
                            </Label>
                            <Input
                              id="apellido_paterno"
                              value={apellidoPaterno}
                              onChange={(e) => {
                                const val = String(
                                  e.target.value
                                ).toUpperCase();
                                setApellidoPaterno(val);
                                setFormData({
                                  ...formData,
                                  apellido: `${val} ${apellidoMaterno}`.trim(),
                                });
                              }}
                              placeholder="Apellido paterno del estudiante"
                              required
                              aria-required="true"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="apellido_materno"
                              className="block mb-1"
                            >
                              Apellido Materno
                            </Label>
                            <Input
                              id="apellido_materno"
                              value={apellidoMaterno}
                              onChange={(e) => {
                                const val = String(
                                  e.target.value
                                ).toUpperCase();
                                setApellidoMaterno(val);
                                setFormData({
                                  ...formData,
                                  apellido: `${apellidoPaterno} ${val}`.trim(),
                                });
                              }}
                              placeholder="Apellido materno del estudiante"
                            />
                          </div>
                        </div>
                        <span id="apellido-description" className="sr-only">
                          Campo obligatorio. Ingrese el apellido paterno y,
                          opcionalmente, el apellido materno del estudiante.
                        </span>
                        {errores.apellido && (
                          <p
                            id="apellido-error"
                            className="text-sm text-red-500 mt-1"
                            role="alert"
                          >
                            {errores.apellido}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="matricula" className="block mb-1">
                          Matrícula{" "}
                          <span
                            className="text-red-500"
                            aria-label="campo obligatorio"
                          >
                            *
                          </span>
                        </Label>
                        <Input
                          id="matricula"
                          value={formData.matricula}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              matricula: String(e.target.value).toUpperCase(),
                            })
                          }
                          placeholder="Matrícula del estudiante"
                          required
                          maxLength={8}
                          aria-required="true"
                          aria-invalid={!!errores.matricula}
                          aria-describedby={
                            errores.matricula
                              ? "matricula-error"
                              : "matricula-description"
                          }
                        />
                        <span id="matricula-description" className="sr-only">
                          Campo obligatorio. Ingrese el número de matrícula del
                          estudiante (máximo 8 caracteres).
                        </span>
                        {errores.matricula && (
                          <p
                            id="matricula-error"
                            className="text-sm text-red-500 mt-1"
                            role="alert"
                          >
                            {errores.matricula}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="carrera" className="block mb-1">
                          Carrera{" "}
                          <span
                            className="text-red-500"
                            aria-label="campo obligatorio"
                          >
                            *
                          </span>
                        </Label>
                        <Select
                          value={formData.carrera}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              carrera: String(value).toUpperCase(),
                            })
                          }
                        >
                          <SelectTrigger id="carrera" aria-required="true">
                            <SelectValue placeholder="Selecciona una carrera" />
                          </SelectTrigger>
                          <SelectContent>
                            {carrerasList.length === 0 ? (
                              <div className="p-2 text-sm text-gray-500">
                                No hay carreras disponibles
                              </div>
                            ) : (
                              carrerasList.map((c) => (
                                <SelectItem
                                  key={c.id}
                                  value={String(c.nombre || "").toUpperCase()}
                                >
                                  {String(c.nombre || "").toUpperCase()}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="semestre" className="block mb-1">
                          Semestre{" "}
                          <span
                            className="text-red-500"
                            aria-label="campo obligatorio"
                          >
                            *
                          </span>
                        </Label>
                        <Select
                          value={formData.semestre.toString()}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              semestre: parseInt(value),
                            })
                          }
                        >
                          <SelectTrigger id="semestre" aria-required="true">
                            <SelectValue placeholder="Selecciona el semestre" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                              <SelectItem key={sem} value={sem.toString()}>
                                {sem}° Semestre
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="block mb-1">
                          Correo Electrónico{" "}
                          <span
                            className="text-red-500"
                            aria-label="campo obligatorio"
                          >
                            *
                          </span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              email: String(e.target.value).toUpperCase(),
                            });
                          }}
                          placeholder="Correo electrónico del estudiante"
                          required
                          aria-required="true"
                          aria-invalid={!!errores.email}
                          aria-describedby={
                            errores.email ? "email-error" : "email-description"
                          }
                        />
                        <span id="email-description" className="sr-only">
                          Campo obligatorio. Ingrese el correo electrónico del
                          estudiante.
                        </span>
                        {errores.email && (
                          <p
                            id="email-error"
                            className="text-sm text-red-500 mt-1"
                            role="alert"
                          >
                            {errores.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono" className="block mb-1">
                        Teléfono{" "}
                        <span
                          className="text-red-500"
                          aria-label="campo obligatorio"
                        >
                          *
                        </span>
                      </Label>
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            telefono: String(e.target.value).toUpperCase(),
                          })
                        }
                        placeholder="Número de teléfono"
                        required
                        maxLength={10}
                        aria-required="true"
                        aria-invalid={!!errores.telefono}
                        aria-describedby={
                          errores.telefono
                            ? "telefono-error"
                            : "telefono-description"
                        }
                      />
                      <span id="telefono-description" className="sr-only">
                        Campo obligatorio. Ingrese el número de teléfono del
                        estudiante (máximo 10 dígitos).
                      </span>
                      {errores.telefono && (
                        <p
                          id="telefono-error"
                          className="text-sm text-red-500 mt-1"
                          role="alert"
                        >
                          {errores.telefono}
                        </p>
                      )}
                    </div>

                    {/* Factores de Riesgo */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">
                        Factores de Riesgo
                      </Label>
                      <div className="grid gap-3">
                        {[
                          { key: "factor_academico", label: "Académico" },
                          { key: "factor_economico", label: "Económico" },
                          { key: "factor_psicosocial", label: "Psicosocial" },
                          {
                            key: "factor_institucional",
                            label: "Institucional",
                          },
                          { key: "factor_contextual", label: "Contextual" },
                        ].map((factor) => (
                          <div
                            key={factor.key}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={factor.key}
                              checked={
                                factores[factor.key as keyof typeof factores]
                              }
                              onCheckedChange={(checked) =>
                                setFactores({
                                  ...factores,
                                  [factor.key]: checked as boolean,
                                })
                              }
                            />
                            <Label
                              htmlFor={factor.key}
                              className="text-sm font-medium"
                            >
                              {factor.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={loading}
                      >
                        {loading ? "Registrando..." : "Registrar Estudiante"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Lista de Estudiantes dentro de Nuevo Estudiante */}
              <Card>
                <CardHeader>
                  <CardTitle>Estudiantes Registrados</CardTitle>
                  <CardDescription>
                    Lista de estudiantes en el sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Input
                        placeholder="Buscar estudiantes..."
                        value={searchRegistered}
                        onChange={(e) => setSearchRegistered(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleImportClick}
                        disabled={importing}
                        className="w-full sm:w-auto"
                      >
                        {importing ? "Importando..." : "Importar CSV"}
                      </Button>
                      <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>

                    {loading ? (
                      <div className="text-center py-4">
                        Cargando estudiantes...
                      </div>
                    ) : estudiantes.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No hay estudiantes registrados
                      </div>
                    ) : (
                      <>
                        {estudiantes
                          .filter((est) => {
                            if (!searchRegistered.trim()) return true;
                            const q = searchRegistered.trim().toLowerCase();

                            // Coincidencias por nombre, apellido, matrícula, email, teléfono o carrera
                            if (
                              est.nombre.toLowerCase().includes(q) ||
                              est.apellido.toLowerCase().includes(q) ||
                              (est.matricula &&
                                est.matricula.toLowerCase().includes(q)) ||
                              (est.email &&
                                est.email.toLowerCase().includes(q)) ||
                              (est.telefono &&
                                est.telefono.toLowerCase().includes(q)) ||
                              (est.carrera &&
                                est.carrera.toLowerCase().includes(q))
                            )
                              return true;

                            // Si la consulta es numérica, permitir buscar por semestre exacto o por matrícula numérica
                            const num = Number(q);
                            if (!isNaN(num)) {
                              if (String(est.semestre) === String(num))
                                return true;
                              if (
                                est.matricula &&
                                est.matricula.includes(String(num))
                              )
                                return true;
                            }

                            return false;
                          })
                          .slice(
                            estudiantesPage * 10,
                            (estudiantesPage + 1) * 10
                          )
                          .map((estudiante) => (
                            <div
                              key={estudiante.id}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {(
                                    (estudiante.nombre || "") +
                                    " " +
                                    (estudiante.apellido || "")
                                  ).toUpperCase()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {String(
                                    estudiante.carrera || ""
                                  ).toUpperCase()}{" "}
                                  - {estudiante.semestre}° Semestre
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Matrícula:{" "}
                                  {String(
                                    estudiante.matricula || ""
                                  ).toUpperCase()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    setSelectedStudent(estudiante);
                                    // fetch creator and modifier info
                                    setCreatorInfo(null);
                                    setModifierInfo(null);
                                    if (estudiante.creado_por) {
                                      const { data: creador } = await supabase
                                        .from("usuarios")
                                        .select(
                                          "id,nombre,apellidos,numero_empleado"
                                        )
                                        .eq("id", estudiante.creado_por)
                                        .single();
                                      setCreatorInfo(creador || null);
                                    }
                                    if (estudiante.modificado_por) {
                                      const { data: modificador } =
                                        await supabase
                                          .from("usuarios")
                                          .select(
                                            "id,nombre,apellidos,numero_empleado"
                                          )
                                          .eq("id", estudiante.modificado_por)
                                          .single();
                                      setModifierInfo(modificador || null);
                                    }
                                    setDetailsOpen(true);
                                  }}
                                >
                                  Detalles
                                </Button>

                                <Button
                                  size="sm"
                                  onClick={() => {
                                    // Open edit modal and prefill
                                    setEditingStudent(estudiante);
                                    // split apellido into paterno/materno for the edit form (front-only)
                                    const split = String(
                                      estudiante.apellido || ""
                                    )
                                      .trim()
                                      .split(/\s+/);
                                    const paterno = (
                                      split[0] || ""
                                    ).toUpperCase();
                                    const materno =
                                      split.length > 1
                                        ? split.slice(1).join(" ").toUpperCase()
                                        : "";
                                    setEditStudentForm({
                                      nombre: String(
                                        estudiante.nombre || ""
                                      ).toUpperCase(),
                                      apellido: (
                                        paterno + (materno ? " " + materno : "")
                                      ).trim(),
                                      matricula: String(
                                        estudiante.matricula || ""
                                      ).toUpperCase(),
                                      carrera: String(
                                        estudiante.carrera || ""
                                      ).toUpperCase(),
                                      semestre: estudiante.semestre || 1,
                                      email: String(
                                        estudiante.email || ""
                                      ).toUpperCase(),
                                      telefono: String(
                                        estudiante.telefono || ""
                                      ).toUpperCase(),
                                    });
                                    setEditApellidoPaterno(paterno);
                                    setEditApellidoMaterno(materno);
                                    setEditErrores({});
                                    setEditStudentOpen(true);
                                  }}
                                >
                                  Editar
                                </Button>
                              </div>
                            </div>
                          ))}
                        <div className="flex justify-center gap-2 mt-4">
                          <button
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            disabled={estudiantesPage === 0}
                            onClick={() =>
                              setEstudiantesPage(estudiantesPage - 1)
                            }
                          >
                            Anterior
                          </button>
                          <button
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            disabled={
                              (estudiantesPage + 1) * 10 >= estudiantes.length
                            }
                            onClick={() =>
                              setEstudiantesPage(estudiantesPage + 1)
                            }
                          >
                            Siguiente
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "asistencias" && (
            <div
              role="tabpanel"
              id="asistencias-panel"
              aria-labelledby="asistencias-tab"
            >
              <AsistenciasSection />
            </div>
          )}

          {activeTab === "calificaciones" && (
            <div
              role="tabpanel"
              id="calificaciones-panel"
              aria-labelledby="calificaciones-tab"
            >
              <CalificacionesSection />
            </div>
          )}

          {activeTab === "eventos" && (
            <div
              role="tabpanel"
              id="eventos-panel"
              aria-labelledby="eventos-tab"
            >
              <EventosAcademicosSection />
            </div>
          )}

          {activeTab === "indicadores" && (
            <div
              role="tabpanel"
              id="indicadores-panel"
              aria-labelledby="indicadores-tab"
            >
              <IndicadoresDesempenoSection />
            </div>
          )}
        </div>
        {/* Detalles de estudiante en modal */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent ref={detailsModalRef}>
            <DialogHeader>
              <DialogTitle>Detalles del Estudiante</DialogTitle>
              <DialogDescription>Información y auditoría</DialogDescription>
            </DialogHeader>
            {selectedStudent ? (
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-lg">
                    {(
                      (selectedStudent.nombre || "") +
                      " " +
                      (selectedStudent.apellido || "")
                    ).toUpperCase()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Matrícula:{" "}
                    {String(selectedStudent.matricula || "").toUpperCase()}
                  </p>
                  <p className="text-sm">
                    {String(selectedStudent.carrera || "").toUpperCase()} -{" "}
                    {selectedStudent.semestre}° Semestre
                  </p>
                  <p className="text-sm">
                    Email: {String(selectedStudent.email || "").toUpperCase()}
                  </p>
                  <p className="text-sm">
                    Teléfono:{" "}
                    {String(selectedStudent.telefono || "").toUpperCase()}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Auditoría</h4>
                  <p className="text-sm text-muted-foreground">
                    Creado por:{" "}
                    {creatorInfo
                      ? `${creatorInfo.nombre} ${creatorInfo.apellidos} ( #${creatorInfo.numero_empleado} )`
                      : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Modificado por:{" "}
                    {modifierInfo
                      ? `${modifierInfo.nombre} ${modifierInfo.apellidos} ( #${modifierInfo.numero_empleado} )`
                      : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <div>Cargando...</div>
            )}
          </DialogContent>
        </Dialog>
        {/* Editar estudiante en modal */}
        <Dialog open={editStudentOpen} onOpenChange={setEditStudentOpen}>
          <DialogContent ref={editModalRef}>
            <DialogHeader>
              <DialogTitle>Editar Estudiante</DialogTitle>
              <DialogDescription>
                Modifica la información del estudiante
              </DialogDescription>
            </DialogHeader>
            {editingStudent ? (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit_nombre" className="block mb-1">
                      Nombre
                    </Label>
                    <Input
                      id="edit_nombre"
                      value={editStudentForm.nombre}
                      onChange={(e) =>
                        setEditStudentForm({
                          ...editStudentForm,
                          nombre: e.target.value.toUpperCase(),
                        })
                      }
                    />
                    {editErrores.nombre && (
                      <p className="text-sm text-red-500">
                        {editErrores.nombre}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <Label
                          htmlFor="edit_apellido_paterno"
                          className="block mb-1"
                        >
                          Apellido Paterno
                        </Label>
                        <Input
                          id="edit_apellido_paterno"
                          value={editApellidoPaterno}
                          onChange={(e) => {
                            const val = String(e.target.value).toUpperCase();
                            setEditApellidoPaterno(val);
                            setEditStudentForm({
                              ...editStudentForm,
                              apellido: `${val} ${editApellidoMaterno}`.trim(),
                            });
                          }}
                        />
                        {editErrores.apellido && (
                          <p className="text-sm text-red-500">
                            {editErrores.apellido}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label
                          htmlFor="edit_apellido_materno"
                          className="block mb-1"
                        >
                          Apellido Materno
                        </Label>
                        <Input
                          id="edit_apellido_materno"
                          value={editApellidoMaterno}
                          onChange={(e) => {
                            const val = String(e.target.value).toUpperCase();
                            setEditApellidoMaterno(val);
                            setEditStudentForm({
                              ...editStudentForm,
                              apellido: `${editApellidoPaterno} ${val}`.trim(),
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit_matricula" className="block mb-1">
                      Matrícula
                    </Label>
                    <Input
                      id="edit_matricula"
                      value={editStudentForm.matricula}
                      onChange={(e) =>
                        setEditStudentForm({
                          ...editStudentForm,
                          matricula: String(e.target.value).toUpperCase(),
                        })
                      }
                      maxLength={8}
                    />
                    {editErrores.matricula && (
                      <p className="text-sm text-red-500">
                        {editErrores.matricula}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_carrera" className="block mb-1">
                      Carrera
                    </Label>
                    <Select
                      value={editStudentForm.carrera}
                      onValueChange={(value) =>
                        setEditStudentForm({
                          ...editStudentForm,
                          carrera: String(value).toUpperCase(),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una carrera" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INGENIERÍA EN SISTEMAS">
                          INGENIERÍA EN SISTEMAS
                        </SelectItem>
                        <SelectItem value="MEDICINA">MEDICINA</SelectItem>
                        <SelectItem value="DERECHO">DERECHO</SelectItem>
                        <SelectItem value="PSICOLOGÍA">PSICOLOGÍA</SelectItem>
                        <SelectItem value="ADMINISTRACIÓN">
                          ADMINISTRACIÓN
                        </SelectItem>
                        <SelectItem value="ARQUITECTURA">
                          ARQUITECTURA
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit_semestre" className="block mb-1">
                      Semestre
                    </Label>
                    <Select
                      value={String(editStudentForm.semestre)}
                      onValueChange={(value) =>
                        setEditStudentForm({
                          ...editStudentForm,
                          semestre: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el semestre" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <SelectItem key={s} value={s.toString()}>
                            {s}° Semestre
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_email" className="block mb-1">
                      Correo
                    </Label>
                    <Input
                      id="edit_email"
                      type="email"
                      value={editStudentForm.email}
                      onChange={(e) => {
                        setEditStudentForm({
                          ...editStudentForm,
                          email: String(e.target.value).toUpperCase(),
                        });
                      }}
                    />
                    {editErrores.email && (
                      <p className="text-sm text-red-500">
                        {editErrores.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_telefono" className="block mb-1">
                    Teléfono
                  </Label>
                  <Input
                    id="edit_telefono"
                    value={editStudentForm.telefono}
                    onChange={(e) =>
                      setEditStudentForm({
                        ...editStudentForm,
                        telefono: String(e.target.value).toUpperCase(),
                      })
                    }
                    maxLength={10}
                  />
                  {editErrores.telefono && (
                    <p className="text-sm text-red-500">
                      {editErrores.telefono}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditStudentOpen(false);
                      setEditingStudent(null);
                      setEditApellidoPaterno("");
                      setEditApellidoMaterno("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar cambios</Button>
                </div>
              </form>
            ) : (
              <div>Cargando...</div>
            )}
          </DialogContent>
        </Dialog>
        {/* Import failures modal */}
        <Dialog open={showImportFailures} onOpenChange={setShowImportFailures}>
          <DialogContent ref={importFailuresModalRef}>
            <DialogHeader>
              <DialogTitle>Filas no importadas</DialogTitle>
              <DialogDescription>
                Listado de filas que no fueron importadas y la razón.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {importFailures.length === 0 ? (
                <div>No hay errores.</div>
              ) : (
                <table className="w-full text-sm table-auto">
                  <thead>
                    <tr className="text-left">
                      <th className="p-2">Fila</th>
                      <th className="p-2">Matrícula</th>
                      <th className="p-2">Razón</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importFailures.map((it) => (
                      <tr
                        key={`${it.row}-${it.matricula}`}
                        className="border-t"
                      >
                        <td className="p-2 align-top">{it.row}</td>
                        <td className="p-2 align-top">{it.matricula}</td>
                        <td className="p-2 align-top">{it.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportFailures(false);
                  setImportFailures([]);
                }}
              >
                Cerrar
              </Button>
              <Button onClick={() => downloadFailuresCsv(importFailures)}>
                Descargar CSV de errores
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
