"use client"

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { calculateHistogramData, HistogramaData } from '@/lib/data-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface CalificacionesHistogramaProps {
    data: any[]; 
    loading: boolean;
    titulo: string;
    descripcion: string;
    onDataProcessed: React.Dispatch<React.SetStateAction<HistogramaData[]>>; 
}

export default function CalificacionesHistograma({ data, loading, titulo, descripcion, onDataProcessed }: CalificacionesHistogramaProps) {

    const histogramData: HistogramaData[] = React.useMemo(() => {
        if (!data || data.length === 0) return [];
        
        return calculateHistogramData(data as any);
    }, [data]);

    React.useEffect(() => {
        onDataProcessed(histogramData);
    }, [histogramData, onDataProcessed]);

    const totalCalificaciones = data ? data.length : 0;
    const maxFrecuencia = histogramData.length > 0 ? Math.max(...histogramData.map(d => d.frecuencia)) : 0;


    if (loading) {
        return (
            <Card className="shadow-xl">
                <CardHeader><CardTitle>{titulo}</CardTitle></CardHeader>
                <CardContent className="h-[350px] flex items-center justify-center">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-500" /> Cargando datos...
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className="shadow-xl">
                <CardHeader><CardTitle>{titulo}</CardTitle></CardHeader>
                <CardContent className="h-[350px] flex items-center justify-center text-gray-500">
                    No hay calificaciones registradas para este filtro.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle>{titulo}</CardTitle>
                <CardDescription>
                    {descripcion} (Total de muestras: {totalCalificaciones})
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] w-full p-4 md:p-6">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={histogramData}
                        barGap={0}
                        barCategoryGap={0} 
                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />

                        <XAxis 
                            dataKey="name" 
                            label={{ value: 'Rango de Calificación', position: 'bottom', offset: 0, fill: 'var(--color-muted-foreground)' }} 
                            tickLine={false} 
                            axisLine={{ stroke: 'var(--color-border)' }}
                            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                        />
                        <YAxis 
                            label={{ value: 'Frecuencia', angle: -90, position: 'insideLeft', fill: 'var(--color-muted-foreground)' }} 
                            allowDecimals={false} 
                            tickLine={false} 
                            axisLine={false}
                            domain={[0, maxFrecuencia > 0 ? maxFrecuencia + 1 : 1]}
                            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                        />
                        <Tooltip 
                            cursor={{ fill: 'var(--color-muted)' }} 
                            contentStyle={{
                                backgroundColor: 'var(--color-popover)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                color: 'var(--color-popover-foreground)',
                            }}
                            labelStyle={{ color: 'var(--color-popover-foreground)' }}
                            formatter={(value: number) => [value, 'Conteo']} 
                            labelFormatter={(label) => `Rango: ${label}`} 
                        />

                        <Bar
                            dataKey="frecuencia"
                            fill="var(--color-chart-1)"
                            stroke="var(--color-card)"
                            strokeWidth={1}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
