"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useArrowNavigation } from "@/hooks/useArrowNavigation" 
import CalificacionesHistograma from '@/components/CalificacionesHistograma'; 
import { Separator } from '@/components/ui/separator'; 
import { useCalificaciones } from '@/hooks/useCalificaciones';
import { useAuditTrail } from '@/hooks/useAuditTrail';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText } from 'lucide-react'; 

interface Calificacion {
 id: string
 estudiante_id: string
 materia: string
 calificacion: number
 semestre: number
 created_at: string
 updated_at: string
}

interface HistogramaData {
    name: string;
    frecuencia: number;
}


const exportToCSV = (data: HistogramaData[], filename: string, title?: string) => {
    if (!data || data.length === 0) {
        console.warn("No hay datos para exportar a CSV.");
        return;
    }
    const headers = ["Rango_Calificacion", "Frecuencia"];
    
    const csvRows = data.map(item => [
        `"${item.name.replace(/"/g, '""')}"`, 
        item.frecuencia
    ].join(','));

    let finalContent = "";
    if (title) {
        finalContent += `"${title}"\n\n`; 
    }
    
    finalContent += [
        headers.join(','),
        ...csvRows
    ].join('\n');
    
    const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename + ".csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

const exportToPDF = async (chartRef: React.RefObject<HTMLDivElement | null>, filename: string, title: string) => {
    if (!chartRef.current) {
        alert("Error: No se pudo encontrar el elemento del gráfico para exportar.");
        return;
    }

    try {
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

    
        const imgData = await toPng(chartRef.current, {
            quality: 1.0,
            pixelRatio: 3,
            backgroundColor: '#ffffff'
        });


        pdf.setFontSize(18);
        pdf.setTextColor(37, 99, 235);
        pdf.text(title, pageWidth / 2, 20, { align: 'center' });

        
        const imgWidth = pageWidth - 40;
        const imgHeight = (pageWidth - 40) * 0.6;
        pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);

    
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Generado el ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

        
        pdf.save(filename + ".pdf");
    } catch (error) {
        console.error('Error al exportar PDF:', error);
        alert('Error al exportar el PDF');
    }
};


export default function HistogramaPage() {
    const [materiaSeleccionada, setMateriaSeleccionada] = useState<string>('');
    const [calificacionesFiltradas, setCalificacionesFiltradas] = useState<Calificacion[]>([]);
    const [loadingFiltrado, setLoadingFiltrado] = useState(false);
    
    const [generalExportData, setGeneralExportData] = useState<HistogramaData[]>([]); 
    const [filteredExportData, setFilteredExportData] = useState<HistogramaData[]>([]); 

    const generalChartRef = useRef<HTMLDivElement>(null);
    const filteredChartRef = useRef<HTMLDivElement>(null);
    
    const MATERIAS_DISPONIBLES = ['calculo', 'desarrollo sustentable', 'estadistica', 'ingles', 'taller de investigacion'];

    const { 
        calificaciones: calificacionesGenerales, 
        loading: loadingGeneral,
        fetchCalificacionesByMateria, 
    } = useCalificaciones();
    const { createAuditEntry } = useAuditTrail();

    const cargarCalificacionesFiltradas = useCallback(async (materia: string) => {
        if (!materia) {
            setCalificacionesFiltradas([]);
            return;
        }

        setLoadingFiltrado(true);
        try {
            const datos = await fetchCalificacionesByMateria(materia);
            setCalificacionesFiltradas(datos);
        } catch (error) {
            console.error("Error al cargar calificaciones filtradas:", error);
            setCalificacionesFiltradas([]);
        } finally {
            setLoadingFiltrado(false);
        }
    }, []); 

    useEffect(() => {
        cargarCalificacionesFiltradas(materiaSeleccionada);
    }, [materiaSeleccionada, cargarCalificacionesFiltradas]);
    
    
    const handleExportGeneral = async () => {
        const filename = 'histograma_general';
        const title = "Distribución General de Calificaciones";
        exportToCSV(generalExportData, filename, title);
        
    
        await createAuditEntry({
            modulo: 'Histograma',
            accion: 'exportar',
            entidad: 'CSV',
            detalles: { tipo: 'histograma general', registros: generalExportData.length }
        });
    };

    const handleExportFiltrada = async () => {
        if (!materiaSeleccionada || filteredExportData.length === 0) return;

        const filename = `histograma_${materiaSeleccionada.toLowerCase().replace(/\s/g, '_')}_filtrado`;
        const title = `Distribución para la materia de ${materiaSeleccionada}`; 
        exportToCSV(filteredExportData, filename, title);
        
        
        await createAuditEntry({
            modulo: 'Histograma',
            accion: 'exportar',
            entidad: 'CSV',
            detalles: { tipo: 'histograma filtrado', materia: materiaSeleccionada, registros: filteredExportData.length }
        });
    };
    
    const handleExportGeneralPDF = async () => {
        const filename = 'histograma_general';
        const title = 'Histograma General (Todas las Calificaciones)';
        await exportToPDF(generalChartRef, filename, title);
        
        
        await createAuditEntry({
            modulo: 'Histograma',
            accion: 'exportar',
            entidad: 'PDF',
            detalles: { tipo: 'histograma general', formato: 'PDF' }
        });
    };

    const handleExportFiltradaPDF = async () => {
        if (!materiaSeleccionada) return;
        const filename = `histograma_${materiaSeleccionada.toLowerCase().replace(/\s/g, '_')}_filtrado`;
        const title = `Histograma de Calificaciones: ${materiaSeleccionada}`;
        await exportToPDF(filteredChartRef, filename, title);
        

        await createAuditEntry({
            modulo: 'Histograma',
            accion: 'exportar',
            entidad: 'PDF',
            detalles: { tipo: 'histograma filtrado', materia: materiaSeleccionada, formato: 'PDF' }
        });
    };


    const tituloFiltrado = materiaSeleccionada 
        ? `Histograma de Calificaciones: ${materiaSeleccionada}`
        : "Selecciona una materia para filtrar";
    
    const descripcionFiltrada = materiaSeleccionada
        ? `Distribución para la materia ${materiaSeleccionada}.`
        : "Utiliza el selector para ver la distribución de una materia específica.";

    const mainContentRef = useRef<HTMLDivElement>(null)
    useArrowNavigation(mainContentRef)

    // Escuchar eventos de voz
    useEffect(() => {
        const handleExcelGeneral = () => {
            console.log("Evento voz: Exportar Excel General")
            // Buscar y hacer click en el botón de exportar Excel general
            const btn = document.querySelector('.export-excel-btn') as HTMLButtonElement
            if (btn) btn.click()
        }
        const handleExcelFiltrado = () => {
            console.log("Evento voz: Exportar Excel Filtrado")
            // Buscar todos los botones de exportar Excel y hacer click en el segundo (filtrado)
            const btns = document.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
            for (const btn of btns) {
                if (btn.textContent?.includes('Exportar CSV') && btn.classList.contains('text-green-600')) {
                    btn.click()
                    break
                }
            }
        }
        const handlePdfGeneral = () => {
            console.log("Evento voz: Exportar PDF General")
            // Buscar y hacer click en el botón de exportar PDF general
            const btn = document.querySelector('.export-pdf-btn') as HTMLButtonElement
            if (btn) btn.click()
        }
        const handlePdfFiltrado = () => {
            console.log("Evento voz: Exportar PDF Filtrado")
            // Buscar todos los botones de exportar PDF y hacer click en el de filtrado (rojo)
            const btns = document.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
            for (const btn of btns) {
                if (btn.textContent?.includes('Exportar PDF') && btn.classList.contains('text-red-600')) {
                    btn.click()
                    break
                }
            }
        }
        const handleFiltrar = (e: CustomEvent) => {
            const materia = e.detail?.materia
            console.log("Evento voz: Filtrar por", materia)
            if (materia) {
                setMateriaSeleccionada(materia)
            }
        }

        window.addEventListener("voice-histograma-excel-general", handleExcelGeneral)
        window.addEventListener("voice-histograma-excel-filtrado", handleExcelFiltrado)
        window.addEventListener("voice-histograma-pdf-general", handlePdfGeneral)
        window.addEventListener("voice-histograma-pdf-filtrado", handlePdfFiltrado)
        window.addEventListener("voice-histograma-filtrar", handleFiltrar as EventListener)

        return () => {
            window.removeEventListener("voice-histograma-excel-general", handleExcelGeneral)
            window.removeEventListener("voice-histograma-excel-filtrado", handleExcelFiltrado)
            window.removeEventListener("voice-histograma-pdf-general", handlePdfGeneral)
            window.removeEventListener("voice-histograma-pdf-filtrado", handlePdfFiltrado)
            window.removeEventListener("voice-histograma-filtrar", handleFiltrar as EventListener)
        }
    }, [])

    return (
        <div ref={mainContentRef} className="flex-1 p-3 md:p-6 lg:p-8 pt-6 space-y-6 md:space-y-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Análisis de Calificaciones</h1>
            <p className="text-muted-foreground">Visualización general y filtrada de la distribución de las calificaciones.</p>
            
            <Separator />

            <div className="mt-8">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold">1. Histograma General</h2>
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={handleExportGeneral}
                            variant="outline"
                            className="flex items-center gap-2 export-excel-btn"
                            disabled={generalExportData.length === 0}
                            aria-label="Exportar histograma general a CSV"
                        >
                            <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
                            Exportar CSV
                        </Button>
                        <Button 
                            onClick={handleExportGeneralPDF}
                            variant="outline"
                            className="flex items-center gap-2 export-pdf-btn"
                            aria-label="Exportar histograma general a PDF"
                        >
                            <FileText className="w-4 h-4" aria-hidden="true" />
                            Exportar PDF
                        </Button>
                    </div>
                </div>
                <div ref={generalChartRef}>
                    <CalificacionesHistograma 
                        data={calificacionesGenerales} 
                        loading={loadingGeneral} 
                        titulo="Histograma General (Todas las Calificaciones)"
                        descripcion="Frecuencia absoluta de todas las calificaciones registradas en el sistema."
                        onDataProcessed={setGeneralExportData}
                    />
                </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                <label htmlFor="materia-select" className="text-lg font-semibold text-gray-700">
                    2. Filtrar Distribución por Materia:
                </label>
                <select
                    id="materia-select"
                    className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                    onChange={(e) => setMateriaSeleccionada(e.target.value)}
                    value={materiaSeleccionada}
                >
                    <option value="">-- Selecciona una Materia --</option>
                    {MATERIAS_DISPONIBLES.map(materia => (
                        <option key={materia} value={materia}>{materia}</option>
                    ))}
                </select>
            </div>

            <div className="mt-8">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold">Histograma Filtrado</h2>
                    
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={handleExportFiltrada}
                            variant="outline"
                            className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50"
                            disabled={!materiaSeleccionada || filteredExportData.length === 0}
                            aria-label="Exportar histograma filtrado a CSV"
                        >
                            <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
                            Exportar CSV
                        </Button>
                        <Button 
                            onClick={handleExportFiltradaPDF}
                            aria-label="Exportar histograma filtrado a PDF"
                            variant="outline"
                            className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
                            disabled={!materiaSeleccionada}
                        >
                            <FileText className="w-4 h-4" />
                            Exportar PDF
                        </Button>
                    </div>
                </div>
                
                <div ref={filteredChartRef}>
                    <CalificacionesHistograma 
                        data={calificacionesFiltradas} 
                        loading={loadingFiltrado} 
                        titulo={tituloFiltrado}
                        descripcion={descripcionFiltrada}
                        onDataProcessed={setFilteredExportData} 
                    />
                </div>
            </div>
        </div>
    );
}
