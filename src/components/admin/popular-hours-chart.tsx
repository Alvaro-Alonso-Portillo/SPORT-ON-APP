
"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { PopularHoursData } from '@/app/admin/dashboard/page';

interface PopularHoursChartProps {
    data: PopularHoursData[];
}

const softColorPalette = [
    '#a1c9f4', // Azul suave
    '#ffb482', // Melocotón
    '#b2e2a4', // Menta
    '#d6bcf0', // Lavanda
    '#f9cb9c', // Naranja suave
    '#f4c7c3', // Rosa suave
    '#fff2a5', // Amarillo suave
    '#c3e6cb', // Verde pálido
    '#f5d6d1', // Coral claro
    '#b4d8e8', // Azul cielo claro
];


export default function PopularHoursChart({ data }: PopularHoursChartProps) {
    return (
        <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="time" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis 
                        allowDecimals={false}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                        }}
                    />
                    <Legend />
                    <Bar 
                        dataKey="Reservas" 
                        radius={[4, 4, 0, 0]}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={softColorPalette[index % softColorPalette.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
