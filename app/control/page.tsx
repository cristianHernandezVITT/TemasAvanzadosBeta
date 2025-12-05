'use client'
import { useEffect, useState, useRef, useMemo } from 'react'
import { useArrowNavigation } from "@/hooks/useArrowNavigation"
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { useAuditTrail } from '@/hooks/useAuditTrail'
import { useTheme } from 'next-themes'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

interface DatosCalificacion {
  semestre: number;
  count: string;
}

interface DataSet {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor?: string;
  tension: number;
  borderWidth?: number;
  borderDash?: number[];
  fill?: boolean;
  pointStyle?: false;
  pointRadius?: number;
}

interface DatosGrafica {
  labels: string[];
  datasets: DataSet[];
}

interface Filtros {
  periodo: string;
  materia: string;
  carrera: string;
  mes?: string;
}

interface Periodo {
  anio: number;
  semestre: number; 
  inicio: Date;
  fin: Date;
}

export default function ControlPage() {
  const [datosControl, setDatosControl] = useState<DatosGrafica>({
    labels: [],
    datasets: []
  });
  const [datosDesertores, setDatosDesertores] = useState<DatosGrafica>({
    labels: [],
    datasets: []
  });
  const [materias, setMaterias] = useState<string[]>([]);
  const [carreras, setCarreras] = useState<string[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [filtros, setFiltros] = useState<Filtros>({
    periodo: '2025',
    materia: '',
    carrera: ''
  });

  const chartReprobadosRef = useRef<HTMLDivElement>(null);
  const chartDesertoresRef = useRef<HTMLDivElement>(null);
  const { createAuditEntry } = useAuditTrail();

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Estados para detectar temas - DEBEN estar antes de cualquier useEffect que los use
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [isColorblind, setIsColorblind] = useState(false);
  const [isDaltonismoGeneral, setIsDaltonismoGeneral] = useState(false);
  const { theme } = useTheme();

  // Detectar cambios de tema
  useEffect(() => {
    const checkTheme = () => {
      const root = document.documentElement;
      setIsDarkMode(root.classList.contains('dark'));
      setIsGrayscale(root.classList.contains('grayscale'));
      setIsColorblind(root.classList.contains('colorblind'));
      setIsDaltonismoGeneral(root.classList.contains('daltonismo-general'));
    };
    
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, [theme]);

  useEffect(() => {
    const obtenerDatos = async () => {
      let queryReprobados = supabase
        .from('calificaciones')
        .select(`
          *,
          estudiantes!inner(carrera)
        `)
        .lt('calificacion', 70)
        .gt('calificacion', 0)
        .gte('created_at', '2025-01-01')
        .lte('created_at', '2025-12-31');

      let queryDesertores = supabase
        .from('calificaciones')
        .select(`
          *,
          estudiantes!inner(carrera)
        `)
        .eq('calificacion', 0)
        .gte('created_at', '2025-01-01')
        .lte('created_at', '2025-12-31');

      if (filtros.materia) {
        queryReprobados = queryReprobados.eq('materia', filtros.materia);
        queryDesertores = queryDesertores.eq('materia', filtros.materia);
      }
      if (filtros.carrera) {
        queryReprobados = queryReprobados.eq('estudiantes.carrera', filtros.carrera);
        queryDesertores = queryDesertores.eq('estudiantes.carrera', filtros.carrera);
      }

      try {
        const { data: reprobadosData, error: reprobadosError } = await queryReprobados;
        const { data: desertoresData, error: desertoresError } = await queryDesertores;

        if (reprobadosError) {
          console.error('Error al obtener reprobados:', reprobadosError);
          return;
        }

        if (desertoresError) {
          console.warn('Error al obtener desertores:', desertoresError);
        }

        const esPorSemana = !!filtros.mes;

        const procesarPeriodo = (datos: any[]) => {
          if (!datos) return esPorSemana ? new Array(5).fill(0) : new Array(12).fill(0);

          if (esPorSemana) {
            const porSemana = new Array(5).fill(0);
            datos.forEach(row => {
              const fecha = new Date(row.created_at);
              if (fecha.getMonth() === parseInt(filtros.mes || '0', 10)) {
                const semana = Math.floor((fecha.getDate() - 1) / 7);
                if (semana >= 0 && semana < 5) porSemana[semana]++;
              }
            });
            return porSemana;
          } else {
            const porMes = new Array(12).fill(0);
            datos.forEach(row => {
              const fecha = new Date(row.created_at);
              porMes[fecha.getMonth()]++;
            });
            return porMes;
          }
        };

        const reprobadosPorPeriodo = procesarPeriodo(reprobadosData || []);
        
        const desertoresPorPeriodo = new Array(esPorSemana ? 5 : 12).fill(0);
        
        for (const row of desertoresData || []) {
          if (!row.estudiante_id) continue;

          const fecha = new Date(row.created_at);
          if (esPorSemana && fecha.getMonth() !== parseInt(filtros.mes || '0', 10)) continue;

          const { data: asistencias } = await supabase
            .from('asistencias')
            .select('presente')
            .eq('estudiante_id', row.estudiante_id);

          if (asistencias?.length && asistencias.every(a => !a.presente)) {
            if (esPorSemana) {
              const semana = Math.floor((fecha.getDate() - 1) / 7);
              if (semana >= 0 && semana < 5) desertoresPorPeriodo[semana]++;
            } else {
              const mes = fecha.getMonth();
              if (mes >= 0 && mes < 12) desertoresPorPeriodo[mes]++;
            }
          }
        }

        const calcularLimites = (datos: number[]) => {
          if (datos.length === 0) {
            return {
              centralLine: 0,
              upperLimit: 0,
              lowerLimit: 0
            };
          }

          const centralLine = datos.reduce((a, b) => a + b, 0) / datos.length;

          const sumaDiferencias = datos.reduce((acc, val) => acc + Math.pow(val - centralLine, 2), 0);
          const desviacionEstandar = Math.sqrt(sumaDiferencias / datos.length);

          const upperLimit = centralLine + (3 * desviacionEstandar);
          const lowerLimit = Math.max(0, centralLine - (3 * desviacionEstandar));

          return {
            centralLine,
            upperLimit,
            lowerLimit
          };
        };

        const limites = calcularLimites(reprobadosPorPeriodo);
        const limitesDesertores = calcularLimites(desertoresPorPeriodo);

        const labels = esPorSemana
          ? ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5']
          : meses;
        
        // Obtener colores según el tema
        let controlColors
        if (isDaltonismoGeneral) {
          // Paleta Daltonismo General
          controlColors = {
            data: '#F39C12',        // Naranja cálido - datos
            lsc: '#B22222',         // Rojo oscuro - límite superior
            lc: '#6B8E23',          // Verde oliva - línea central
            lic: '#B22222',         // Rojo oscuro - límite inferior
            dataBg: 'rgba(243, 156, 18, 0.5)'
          }
        } else if (isColorblind) {
          // Paleta Okabe-Ito
          controlColors = {
            data: '#D55E00',        // Naranja - datos
            lsc: '#D55E00',         // Naranja - límite superior
            lc: '#009E73',          // Verde azulado - línea central
            lic: '#D55E00',         // Naranja - límite inferior
            dataBg: 'rgba(213, 94, 0, 0.5)'
          }
        } else {
          // Colores originales
          controlColors = {
            data: 'rgb(255, 99, 132)',
            lsc: 'rgba(255, 0, 0, 0.7)',
            lc: 'rgba(0, 128, 0, 0.7)',
            lic: 'rgba(255, 0, 0, 0.7)',
            dataBg: 'rgba(255, 99, 132, 0.5)'
          }
        }
        
        setDatosControl({
          labels,
          datasets: [
            {
              label: 'Reprobados',
              data: reprobadosPorPeriodo,
              borderColor: controlColors.data,
              backgroundColor: controlColors.dataBg,
              tension: 0.1,
              borderWidth: 2
            },
            
            {
              label: 'LSC',
              data: Array(labels.length).fill(limites.upperLimit),
              borderColor: controlColors.lsc,
              backgroundColor: 'transparent',
              tension: 0,
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0
            },
            
            {
              label: 'LC',
              data: Array(labels.length).fill(limites.centralLine),
              borderColor: controlColors.lc,
              backgroundColor: 'transparent',
              tension: 0,
              borderWidth: 2,
              borderDash: [2, 2],
              pointRadius: 0
            },
        
            {
              label: 'LIC',
              data: Array(labels.length).fill(limites.lowerLimit),
              borderColor: controlColors.lic,
              backgroundColor: 'transparent',
              tension: 0,
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0
            }
          ]
        });

        setDatosDesertores({
          labels,
          datasets: [
            {
              label: `Estudiantes desertores ${esPorSemana ? `(${meses[parseInt(filtros.mes || '0', 10)]})` : '- Por Mes'}`,
              data: desertoresPorPeriodo,
              borderColor: isDaltonismoGeneral ? '#005B96' : isColorblind ? '#0072B2' : 'rgb(75, 192, 192)', // Azul profundo para daltonismo general, azul fuerte para colorblind
              backgroundColor: isDaltonismoGeneral ? 'rgba(0, 91, 150, 0.5)' : isColorblind ? 'rgba(0, 114, 178, 0.5)' : 'rgba(75, 192, 192, 0.5)',
              tension: 0.1,
              borderWidth: 2
            },
            {
              label: 'LSC',
              data: Array(labels.length).fill(limitesDesertores.upperLimit),
              borderColor: controlColors.lsc,
              borderDash: [5, 5],
              fill: false,
              tension: 0,
              pointStyle: false
            },
            {
              label: 'LC',
              data: Array(labels.length).fill(Math.round(limitesDesertores.centralLine)),
              borderColor: controlColors.lc,
              borderDash: [2, 2],
              fill: false,
              tension: 0,
              pointStyle: false
            },
            {
              label: 'LIC',
              data: Array(labels.length).fill(limitesDesertores.lowerLimit),
              borderColor: controlColors.lic,
              borderDash: [5, 5],
              fill: false,
              tension: 0,
              pointStyle: false
            }
          ]
        });
      } catch (error) {
        console.error('Error al procesar los datos:', error);
      }
    };

    obtenerDatos();
  }, [filtros, meses, isDaltonismoGeneral, isColorblind]);

  const obtenerPeriodo = (fecha: Date): Periodo => {
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth() + 1;
    return {
      anio,
      semestre: mes <= 6 ? 1 : 2,
      inicio: new Date(anio, mes <= 6 ? 0 : 6, 1),
      fin: new Date(anio, mes <= 6 ? 5 : 11, 31)
    };
  };


  const obtenerPeriodos = async () => {
    const { data: asistencias, error } = await supabase
      .from('asistencias')
      .select('fecha')
      .order('fecha', { ascending: true });

    if (error) {
      console.error('Error al obtener asistencias:', error);
      return [];
    }

    const periodos = new Set<string>();
    asistencias?.forEach(a => {
      const fecha = new Date(a.fecha);
      const periodo = obtenerPeriodo(fecha);
      periodos.add(`${periodo.anio}-${periodo.semestre}`);
    });

    return Array.from(periodos).map(p => {
      const [anio, semestre] = p.split('-').map(Number);
      return {
        anio,
        semestre,
        inicio: new Date(anio, semestre === 1 ? 0 : 6, 1),
        fin: new Date(anio, semestre === 1 ? 5 : 11, 31)
      };
    }).sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  };

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      const periodosDisponibles = await obtenerPeriodos();
      setPeriodos(periodosDisponibles);

      const { data: materiasData } = await supabase
        .from('calificaciones')
        .select('materia');
      const materiasUnicas = new Set(materiasData?.map(m => m.materia));
      setMaterias(Array.from(materiasUnicas));

      const { data: carrerasData } = await supabase
        .from('estudiantes')
        .select('carrera');
      const carrerasUnicas = new Set(carrerasData?.map(c => c.carrera));
      setCarreras(Array.from(carrerasUnicas));

      if (periodosDisponibles.length > 0) {
        const ultimoPeriodo = periodosDisponibles[periodosDisponibles.length - 1];
        setFiltros(prev => ({
          ...prev,
          periodo: `${ultimoPeriodo.anio}-${ultimoPeriodo.semestre}`
        }));
      }
    };

    cargarDatosIniciales();
  }, []);

  // Estados de tema ya definidos arriba

  const opciones: any = useMemo(() => {
    // Obtener colores según el tema
    const getTextColor = () => {
      if (isGrayscale) return 'oklch(0.15 0 0)'; // Casi negro para grayscale
      if (isDaltonismoGeneral) return '#1A1A1A'; // Casi negro - Paleta Daltonismo General
      if (isColorblind) return '#333333'; // Gris oscuro - Paleta Okabe-Ito
      return isDarkMode ? '#ffffff' : '#1e293b';
    };
    
    const getBackgroundColor = () => {
      if (isGrayscale) return 'rgba(250, 250, 250, 0.9)'; // Gris muy claro
      if (isDaltonismoGeneral) return 'rgba(255, 255, 255, 0.9)'; // Blanco - Paleta Daltonismo General
      if (isColorblind) return 'rgba(255, 255, 255, 0.9)'; // Blanco - Paleta Okabe-Ito
      return isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';
    };
    
    const getBorderColor = () => {
      if (isGrayscale) return 'oklch(0.3 0 0)'; // Gris oscuro
      if (isDaltonismoGeneral) return '#666666'; // Gris medio - Paleta Daltonismo General
      if (isColorblind) return '#56B4E9'; // Azul claro - Paleta Okabe-Ito
      return isDarkMode ? '#ffffff' : '#1e293b';
    };
    
    const getGridColor = () => {
      if (isGrayscale) return 'rgba(0, 0, 0, 0.15)'; // Gris medio
      if (isDaltonismoGeneral) return 'rgba(102, 102, 102, 0.3)'; // Gris medio - Paleta Daltonismo General
      if (isColorblind) return 'rgba(0, 0, 0, 0.1)'; // Gris claro - Paleta Okabe-Ito
      return isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    };
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: getTextColor(),
          }
        },
        title: {
          display: true,
          text: filtros.mes 
            ? `Estudiantes por Semana - ${meses[parseInt(filtros.mes)]}`
            : 'Estudiantes por Mes',
          color: getTextColor(),
        },
        tooltip: {
          backgroundColor: getBackgroundColor(),
          titleColor: getTextColor(),
          bodyColor: getTextColor(),
          borderColor: getBorderColor(),
          borderWidth: 1,
          callbacks: {
            label: function(context: any) {
              const label = context.dataset.label || '';
              const value = Math.round(context.parsed.y);
              return `${label}: ${value} estudiantes`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'category',
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            color: getTextColor(),
            font: {
              size: 10
            }
          },
          grid: {
            color: getGridColor(),
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            stepSize: 1,
            color: getTextColor(),
          },
          grid: {
            color: getGridColor(),
          }
        }
      }
    };
  }, [isDarkMode, isGrayscale, isColorblind, isDaltonismoGeneral, filtros.mes, meses]);


  const exportarCSV = async () => {
  
    const filtrosInfo = [
      'Información de Filtros:',
      `Periodo: ${filtros.periodo}`,
      `Mes: ${filtros.mes ? meses[parseInt(filtros.mes)] : 'Todos los meses'}`,
      `Materia: ${filtros.materia || 'Todas las materias'}`,
      `Carrera: ${filtros.carrera || 'Todas las carreras'}`,
      '' 
    ];

    const periodoLabel = filtros.mes ? 'Semana' : 'Mes';
    
    const headersReprobados = [`${periodoLabel}`, 'Reprobados', 'Límite Superior', 'Media', 'Límite Inferior'];
    const rowsReprobados = datosControl.labels.map((label, i) => [
      label,
      Math.round(datosControl.datasets[0].data[i]),
      Math.round(datosControl.datasets[1].data[i]),
      Math.round(datosControl.datasets[2].data[i]),
      Math.round(datosControl.datasets[3].data[i])
    ]);

    const headersDesertores = [`${periodoLabel}`, 'Desertores', 'Límite Superior', 'Media', 'Límite Inferior'];
    const rowsDesertores = datosDesertores.labels.map((label, i) => [
      label,
      Math.round(datosDesertores.datasets[0].data[i]),
      Math.round(datosDesertores.datasets[1].data[i]),
      Math.round(datosDesertores.datasets[2].data[i]),
      Math.round(datosDesertores.datasets[3].data[i])
    ]);

    const csvContent = [
      ...filtrosInfo,
      'DATOS DE REPROBADOS',
      headersReprobados.join(','),
      ...rowsReprobados.map(row => row.join(',')),
      '', 
      'DATOS DE DESERTORES',
      headersDesertores.join(','),
      ...rowsDesertores.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `control-estadistico${filtros.mes ? '-semana' : '-mes'}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  
    await createAuditEntry({
      modulo: 'Gráfico de Control',
      accion: 'exportar',
      entidad: 'CSV',
      detalles: {
        periodo: filtros.periodo,
        mes: filtros.mes ? meses[parseInt(filtros.mes)] : 'Todos',
        materia: filtros.materia || 'Todas',
        carrera: filtros.carrera || 'Todas'
      }
    })
  };

  
  const exportarPDF = async () => {
    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      
      let imgReprobados = '';
      let imgDesertores = '';

      if (chartReprobadosRef.current) {
        imgReprobados = await toPng(chartReprobadosRef.current, {
          quality: 1.0,
          pixelRatio: 3,
          backgroundColor: '#ffffff'
        });
      }

      if (chartDesertoresRef.current) {
        imgDesertores = await toPng(chartDesertoresRef.current, {
          quality: 1.0,
          pixelRatio: 3,
          backgroundColor: '#ffffff'
        });
      }

    
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Gráfico de Control Estadístico', pageWidth / 2, 20, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Periodo: ${filtros.periodo} | Materia: ${filtros.materia || 'Todas'} | Carrera: ${filtros.carrera || 'Todas'}`, pageWidth / 2, 28, { align: 'center' });

    
      if (imgReprobados) {
        pdf.setFontSize(14);
        pdf.setTextColor(37, 99, 235);
        pdf.text('Reprobados', 20, 40);

        const imgWidth = pageWidth - 40;
        const imgHeight = (pageWidth - 40) * 0.35;
        pdf.addImage(imgReprobados, 'PNG', 20, 45, imgWidth, imgHeight);

        
        let tableY = 45 + imgHeight + 10;
        pdf.setFontSize(8);
        pdf.setFillColor(37, 99, 235);
        pdf.rect(20, tableY, pageWidth - 40, 4, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.text('Período', 22, tableY + 3);
        pdf.text('Reprobados', 70, tableY + 3);
        pdf.text('Lím. Superior', 120, tableY + 3);
        pdf.text('Media', 170, tableY + 3);
        pdf.text('Lím. Inferior', 220, tableY + 3);

        pdf.setTextColor(0, 0, 0);
        tableY += 6;

        const periodoLabel = filtros.mes ? 'Semana' : 'Mes';
        datosControl.labels.forEach((label, i) => {
          pdf.text(label, 22, tableY + 2);
          pdf.text(Math.round(datosControl.datasets[0].data[i]).toString(), 70, tableY + 2);
          pdf.text(Math.round(datosControl.datasets[1].data[i]).toString(), 120, tableY + 2);
          pdf.text(Math.round(datosControl.datasets[2].data[i]).toString(), 170, tableY + 2);
          pdf.text(Math.round(datosControl.datasets[3].data[i]).toString(), 220, tableY + 2);
          tableY += 4;
        });
      }

      
      pdf.addPage();

      if (imgDesertores) {
        pdf.setFontSize(14);
        pdf.setTextColor(37, 99, 235);
        pdf.text('Desertores', 20, 20);

        const imgWidth = pageWidth - 40;
        const imgHeight = (pageWidth - 40) * 0.35;
        pdf.addImage(imgDesertores, 'PNG', 20, 25, imgWidth, imgHeight);

        
        let tableY = 25 + imgHeight + 10;
        pdf.setFontSize(8);
        pdf.setFillColor(37, 99, 235);
        pdf.rect(20, tableY, pageWidth - 40, 4, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.text('Período', 22, tableY + 3);
        pdf.text('Desertores', 70, tableY + 3);
        pdf.text('Lím. Superior', 120, tableY + 3);
        pdf.text('Media', 170, tableY + 3);
        pdf.text('Lím. Inferior', 220, tableY + 3);

        pdf.setTextColor(0, 0, 0);
        tableY += 6;

        datosDesertores.labels.forEach((label, i) => {
          pdf.text(label, 22, tableY + 2);
          pdf.text(Math.round(datosDesertores.datasets[0].data[i]).toString(), 70, tableY + 2);
          pdf.text(Math.round(datosDesertores.datasets[1].data[i]).toString(), 120, tableY + 2);
          pdf.text(Math.round(datosDesertores.datasets[2].data[i]).toString(), 170, tableY + 2);
          pdf.text(Math.round(datosDesertores.datasets[3].data[i]).toString(), 220, tableY + 2);
          tableY += 4;
        });
      }

      
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generado el ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

      pdf.save(`control-estadistico${filtros.mes ? '-semana' : '-mes'}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      
      await createAuditEntry({
        modulo: 'Gráfico de Control',
        accion: 'exportar',
        entidad: 'PDF',
        detalles: {
          periodo: filtros.periodo,
          mes: filtros.mes ? meses[parseInt(filtros.mes)] : 'Todos',
          materia: filtros.materia || 'Todas',
          carrera: filtros.carrera || 'Todas',
          formato: 'PDF'
        }
      })
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar el PDF');
    }
  };

  const mainContentRef = useRef<HTMLDivElement>(null)
  useArrowNavigation(mainContentRef)

  // Escuchar eventos de voz para exportar
  useEffect(() => {
    const handleExportExcel = () => {
      console.log("Evento voz: Exportar CSV en Gráfico de Control");
      exportarCSV();
    };
    const handleExportPDF = () => {
      console.log("Evento voz: Exportar PDF en Gráfico de Control");
      exportarPDF();
    };

    window.addEventListener("voice-export-excel", handleExportExcel);
    window.addEventListener("voice-export-pdf", handleExportPDF);

    return () => {
      window.removeEventListener("voice-export-excel", handleExportExcel);
      window.removeEventListener("voice-export-pdf", handleExportPDF);
    };
  }, [datosControl, datosDesertores, filtros]);

  return (
    <div ref={mainContentRef} className="min-h-screen bg-background p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-6 md:mb-8">Gráfico de Control</h1>
        
        {/* Filtros */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            className="border rounded-lg p-2"
            value={filtros.mes || ''}
            onChange={(e) => setFiltros(prev => ({ ...prev, mes: e.target.value }))}
          >
            <option value="">Todos los meses</option>
            {meses.map((mes, index) => (
              <option key={index} value={index}>{mes}</option>
            ))}
          </select>

          <select
            className="border rounded-lg p-2"
            value={filtros.materia}
            onChange={(e) => setFiltros(prev => ({ ...prev, materia: e.target.value }))}
          >
            <option value="">Todas las materias</option>
            {materias.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            className="border rounded-lg p-2"
            value={filtros.carrera}
            onChange={(e) => setFiltros(prev => ({ ...prev, carrera: e.target.value }))}
          >
            <option value="">Todas las carreras</option>
            {carreras.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <Button 
              onClick={exportarCSV}
              variant="outline"
              className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50"
              aria-label="Exportar gráfico de control a CSV"
            >
              <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
              Exportar CSV
            </Button>
            <Button 
              onClick={exportarPDF}
              variant="outline"
              className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
              aria-label="Exportar gráfico de control a PDF"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              Exportar PDF
            </Button>
          </div>
          
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Gráfica de Reprobados */}
          <div ref={chartReprobadosRef} className="bg-card p-6 rounded-lg shadow-lg border border-border">
            <h2 className="text-xl font-bold mb-4 text-foreground">Estudiantes Reprobados</h2>
            <div className="w-full overflow-x-auto">
              <div style={{ minWidth: '400px', height: 400, backgroundColor: (isGrayscale || isColorblind) ? 'var(--card)' : (isDarkMode ? '#000000' : 'var(--card)') }}>
                <Line options={opciones} data={datosControl} />
              </div>
            </div>
          </div>

          {/* Gráfica de Desertores */}
          <div ref={chartDesertoresRef} className="bg-card p-6 rounded-lg shadow-lg border border-border">
            <h2 className="text-xl font-bold mb-4 text-foreground">Estudiantes Desertores</h2>
            <div className="w-full overflow-x-auto">
              <div style={{ minWidth: '400px', height: 400, backgroundColor: (isGrayscale || isColorblind) ? 'var(--card)' : (isDarkMode ? '#000000' : 'var(--card)') }}>
                <Line options={{
                  ...opciones,
                  plugins: {
                    ...opciones.plugins,
                    title: {
                      display: true,
                      text: filtros.mes 
                        ? `Estudiantes Desertores por Semana - ${meses[parseInt(filtros.mes)]}`
                        : 'Estudiantes Desertores por Mes',
                      color: isGrayscale ? 'oklch(0.15 0 0)' : (isDarkMode ? '#ffffff' : '#1e293b'),
                    }
                  }
                }} data={datosDesertores} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}