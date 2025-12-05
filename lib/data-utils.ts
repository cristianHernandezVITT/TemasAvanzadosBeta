// src/lib/data-utils.ts (Mantenemos esta lógica)

export interface HistogramaData {
  name: string;
  frecuencia: number;
}

interface Calificacion {
    id: string;
    estudiante_id: string;
    materia: string;
    calificacion: number;
    semestre: number;
    created_at: string;
    updated_at: string;
}

export const calculateHistogramData = (calificaciones: Calificacion[]): HistogramaData[] => {
  const bins: HistogramaData[] = [
    { name: '0-10', frecuencia: 0 }, { name: '11-20', frecuencia: 0 },
    { name: '21-30', frecuencia: 0 }, { name: '31-40', frecuencia: 0 },
    { name: '41-50', frecuencia: 0 }, { name: '51-60', frecuencia: 0 },
    { name: '61-70', frecuencia: 0 }, { name: '71-80', frecuencia: 0 },
    { name: '81-90', frecuencia: 0 }, { name: '91-100', frecuencia: 0 },
  ];

  calificaciones.forEach(item => {
    const calificacion = item.calificacion;
    let binIndex;
    if (calificacion === 0) {
        binIndex = 0;
    } else if (calificacion === 100) {
        binIndex = 9;
    } else {
        binIndex = Math.ceil(calificacion / 10) - 1;
        binIndex = Math.max(0, Math.min(9, binIndex));
    }
    bins[binIndex].frecuencia++;
  });

  return bins;
};