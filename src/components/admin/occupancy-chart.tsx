
"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import type { OccupancyData } from '@/app/admin/dashboard/page';

interface OccupancyChartProps {
    data: OccupancyData;
    occupancyRate: number;
}

export default function OccupancyChart({ data, occupancyRate }: OccupancyChartProps) {
    return (
        <div className="h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-foreground">
                    {occupancyRate}%
                </span>
            </div>
        </div>
    );
}
